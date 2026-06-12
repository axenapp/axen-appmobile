import { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Modal,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import type { Partner } from '../../src/types';
import { brandColors } from '../../src/theme';

// ── helpers ──────────────────────────────────────────────
function getCategoryInfo(partner: Partner) {
  const txt = (partner.name + ' ' + (partner.description ?? '')).toLowerCase();
  if (txt.match(/peluquer|barber|salon ivy|haircut|cabello/))
    return { label: 'Peluquería', priceRange: '$$',   avatarColor: '#c8956c' };
  if (txt.match(/vet|animal|mascota|pet|perro|gato/))
    return { label: 'Mascotas',   priceRange: '$$$',  avatarColor: '#4caf50' };
  if (txt.match(/estetic|skin|glow|nails|lashes|bella|spa|depil|facial|bruma/))
    return { label: 'Estética',   priceRange: '$$',   avatarColor: '#c2185b' };
  if (txt.match(/salud|health|clinic|medic|doctor/))
    return { label: 'Salud',      priceRange: '$$$$', avatarColor: '#1976d2' };
  if (txt.match(/plomer|cañer|fontaner/))
    return { label: 'Servicios',  priceRange: '$$$',  avatarColor: '#ff9800' };
  if (txt.match(/limpiez|brillo|clean/))
    return { label: 'Limpieza',   priceRange: '$$',   avatarColor: '#00bcd4' };
  if (txt.match(/barba|brea|afeit/))
    return { label: 'Barbería',   priceRange: '$$',   avatarColor: '#5d4037' };
  return       { label: 'Servicios', priceRange: '$$', avatarColor: brandColors.secondary };
}

function getPseudoRating(id: string): number {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return parseFloat((3.5 + (n % 16) / 10).toFixed(1));
}

const CATEGORY_PILLS = [
  { id: 'all',        label: 'Todos',      emoji: '🔍' },
  { id: 'Peluquería', label: 'Peluquería', emoji: '✂️'  },
  { id: 'Salud',      label: 'Salud',      emoji: '🩺'  },
  { id: 'Estética',   label: 'Estética',   emoji: '💆'  },
  { id: 'Mascotas',   label: 'Mascotas',   emoji: '🐾'  },
  { id: 'Limpieza',   label: 'Limpieza',   emoji: '🧹'  },
  { id: 'Barbería',   label: 'Barbería',   emoji: '🪒'  },
];

const SORT_OPTIONS = [
  { value: 'az',     label: 'A → Z' },
  { value: 'za',     label: 'Z → A' },
  { value: 'rating', label: 'Mejor valorados' },
];

const PRICE_OPTIONS = [
  { value: '',    label: 'Todos los precios' },
  { value: '$',   label: '$ · Económico' },
  { value: '$$',  label: '$$ · Moderado' },
  { value: '$$$', label: '$$$ · Caro' },
  { value: '$$$$',label: '$$$$ · Premium' },
];

// ── modal genérico de filtro ──────────────────────────────
function FilterModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modal.overlay} onPress={onClose} activeOpacity={1}>
        <View style={modal.sheet}>
          <Text style={modal.title}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={modal.option}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Text style={[modal.optionText, selected === opt.value && modal.optionActive]}>
                {opt.label}
              </Text>
              {selected === opt.value && (
                <MaterialCommunityIcons name="check" size={18} color={brandColors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: { fontSize: 15, color: '#333' },
  optionActive: { color: brandColors.accent, fontWeight: '700' },
});

// ── pantalla ─────────────────────────────────────────────
export default function CatalogoScreen() {
  const router = useRouter();
  const { category, search } = useLocalSearchParams<{ category?: string; search?: string }>();

  const [searchText,       setSearchText]       = useState(search ?? '');
  const [selectedCategory, setSelectedCategory] = useState(category ?? 'all');

  useEffect(() => {
    if (category) setSelectedCategory(category);
  }, [category]);

  useEffect(() => {
    if (search) setSearchText(search);
  }, [search]);
  const [sortOrder,        setSortOrder]        = useState('az');
  const [priceRange,       setPriceRange]       = useState('');
  const [showSort,         setShowSort]         = useState(false);
  const [showPrice,        setShowPrice]        = useState(false);

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data } = await api.get<Partner[]>('/partners');
      return data;
    },
  });

  const activePartners = partners?.filter(p => p.status === 'active') ?? [];

  // ── lógica de filtros ─────────────────────────────────
  const filtered = useMemo(() => {
    let result = activePartners;

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => getCategoryInfo(p).label === selectedCategory);
    }

    if (priceRange) {
      result = result.filter(p => getCategoryInfo(p).priceRange === priceRange);
    }

    if (sortOrder === 'az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'za') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'rating') {
      result = [...result].sort((a, b) => getPseudoRating(b.id) - getPseudoRating(a.id));
    }

    return result;
  }, [activePartners, searchText, selectedCategory, sortOrder, priceRange]);

  const favorites = activePartners.slice(0, 5);

  const sortLabel  = SORT_OPTIONS.find(o => o.value === sortOrder)?.label  ?? 'Ordenar';
  const priceLabel = priceRange ? `Precio: ${priceRange}` : 'Rango de Precio';

  const filtersActive = selectedCategory !== 'all' || sortOrder !== 'az' || priceRange !== '';

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>

        {/* ── BARRA SUPERIOR ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={brandColors.primary} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <RNTextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar negocio o servicio..."
              placeholderTextColor="#aaa"
              style={styles.searchInput}
            />
            {searchText.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#aaa" />
              </TouchableOpacity>
            ) : (
              <MaterialCommunityIcons name="magnify" size={20} color="#aaa" />
            )}
          </View>
        </View>

        {/* ── FILTROS ── */}
        <View style={styles.filtersRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {/* Limpiar filtros */}
          {filtersActive && (
            <TouchableOpacity
              style={[styles.filterChip, styles.filterChipClear]}
              onPress={() => {
                setSelectedCategory('all');
                setSortOrder('az');
                setPriceRange('');
              }}
            >
              <MaterialCommunityIcons name="close" size={13} color="#fff" />
              <Text style={[styles.filterChipText, { color: '#fff' }]}> Limpiar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.filterChip, sortOrder !== 'az' && styles.filterChipActive]}
            onPress={() => setShowSort(true)}
          >
            <MaterialCommunityIcons
              name="sort"
              size={13}
              color={sortOrder !== 'az' ? '#fff' : brandColors.primary}
            />
            <Text style={[styles.filterChipText, sortOrder !== 'az' && styles.filterChipTextActive]}>
              {' '}{sortLabel}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={13}
              color={sortOrder !== 'az' ? '#fff' : brandColors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, priceRange !== '' && styles.filterChipActive]}
            onPress={() => setShowPrice(true)}
          >
            <Text style={[styles.filterChipText, priceRange !== '' && styles.filterChipTextActive]}>
              {priceLabel}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={13}
              color={priceRange !== '' ? '#fff' : brandColors.primary}
            />
          </TouchableOpacity>
        </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── PILLS DE CATEGORÍAS ── */}
          <FlatList
            horizontal
            data={CATEGORY_PILLS}
            keyExtractor={(it) => it.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsList}
            renderItem={({ item }) => {
              const active = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedCategory(item.id)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {item.emoji} {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {isLoading && <ActivityIndicator style={{ marginTop: 24 }} color={brandColors.secondary} />}

          {/* ── NUESTROS FAVORITOS (solo si no hay filtros activos) ── */}
          {!filtersActive && !searchText && favorites.length > 0 && (
            <View style={styles.favSection}>
              <View style={styles.favHeader}>
                <MaterialCommunityIcons name="star" size={18} color="#fff" />
                <Text style={styles.favTitle}> Nuestros Favoritos</Text>
              </View>
              <FlatList
                horizontal
                data={favorites}
                keyExtractor={(it) => it.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favList}
                renderItem={({ item }) => {
                  const cat = getCategoryInfo(item);
                  return (
                    <TouchableOpacity
                      style={styles.favItem}
                      onPress={() => router.push(`/(user)/negocio/${item.id}`)}
                    >
                      <View style={[styles.favAvatar, { backgroundColor: cat.avatarColor }]}>
                        <Text style={styles.favAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.favName} numberOfLines={2}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* ── RESULTADOS ── */}
          <View style={styles.nearSection}>
            <Text style={styles.nearTitle}>
              {searchText || filtersActive
                ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
                : 'Cerca de vos'}
            </Text>

            {filtered.length === 0 && !isLoading && (
              <Text style={styles.empty}>No hay negocios que coincidan con tu búsqueda.</Text>
            )}

            {filtered.map((partner) => {
              const cat    = getCategoryInfo(partner);
              const rating = getPseudoRating(partner.id);
              return (
                <TouchableOpacity
                  key={partner.id}
                  style={styles.bizCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/(user)/negocio/${partner.id}`)}
                >
                  <View style={[styles.bizCardAvatar, { backgroundColor: cat.avatarColor }]}>
                    <Text style={styles.bizCardAvatarText}>
                      {partner.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bizCardInfo}>
                    <View style={styles.bizCardTopRow}>
                      <Text style={styles.bizCardName} numberOfLines={1}>{partner.name}</Text>
                      <View style={styles.ratingBadge}>
                        <MaterialCommunityIcons name="star" size={12} color={brandColors.accent} />
                        <Text style={styles.ratingText}>{rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.bizCardSub}>{cat.priceRange} · {cat.label}</Text>
                    <View style={styles.availRow}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color="#888" />
                      <Text style={styles.availText}> Turnos Disponibles</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>
      </View>

      {/* ── MODALES ── */}
      <FilterModal
        visible={showSort}
        title="Ordenar por"
        options={SORT_OPTIONS}
        selected={sortOrder}
        onSelect={setSortOrder}
        onClose={() => setShowSort(false)}
      />
      <FilterModal
        visible={showPrice}
        title="Rango de Precio"
        options={PRICE_OPTIONS}
        selected={priceRange}
        onSelect={setPriceRange}
        onClose={() => setShowPrice(false)}
      />
    </>
  );
}

// ── estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 52,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333', padding: 0 },

  filtersRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 48,
    justifyContent: 'center',
  },
  filtersContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center', flexGrow: 1 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  filterChipClear: {
    backgroundColor: brandColors.accent,
    borderColor: brandColors.accent,
  },
  filterChipText: { fontSize: 12, color: brandColors.primary, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },

  pillsList: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd',
  },
  pillActive: { backgroundColor: brandColors.primary, borderColor: brandColors.primary },
  pillText: { fontSize: 13, color: '#555' },
  pillTextActive: { color: '#fff', fontWeight: '600' },

  favSection: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: brandColors.accent,
    borderRadius: 14, overflow: 'hidden',
  },
  favHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  favTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  favList: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  favItem: { width: 72, alignItems: 'center' },
  favAvatar: {
    width: 56, height: 56, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  favAvatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  favName: { fontSize: 10, color: '#fff', textAlign: 'center', lineHeight: 13 },

  nearSection: { paddingHorizontal: 16, paddingBottom: 32 },
  nearTitle: {
    fontSize: 17, fontWeight: '700',
    color: brandColors.primary, marginBottom: 14,
  },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 32, fontSize: 14 },

  bizCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  bizCardAvatar: {
    width: 56, height: 56, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  bizCardAvatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  bizCardInfo: { flex: 1, justifyContent: 'center' },
  bizCardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 3,
  },
  bizCardName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#555', marginLeft: 2 },
  bizCardSub: { fontSize: 12, color: '#777', marginBottom: 4 },
  availRow: { flexDirection: 'row', alignItems: 'center' },
  availText: { fontSize: 11, color: '#888' },
});
