import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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

function getPseudoRating(id: string): string {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (3.5 + (n % 16) / 10).toFixed(1);
}

const CATEGORY_PILLS = [
  { id: 'all',        label: 'Todos',      emoji: '🔍' },
  { id: 'peluqueria', label: 'Peluquería', emoji: '✂️'  },
  { id: 'salud',      label: 'Salud',      emoji: '🩺'  },
  { id: 'estetica',   label: 'Estética',   emoji: '💆'  },
  { id: 'mascotas',   label: 'Mascotas',   emoji: '🐾'  },
  { id: 'limpieza',   label: 'Limpieza',   emoji: '🧹'  },
];

// ── componente ───────────────────────────────────────────
export default function CatalogoScreen() {
  const router = useRouter();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data } = await api.get<Partner[]>('/partners');
      return data;
    },
  });

  const activePartners = partners?.filter(p => p.status === 'active') ?? [];
  const favorites = activePartners.slice(0, 5);

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
              placeholder="Buscar negocio o servicio..."
              placeholderTextColor="#aaa"
              style={styles.searchInput}
            />
            <MaterialCommunityIcons name="magnify" size={20} color="#aaa" />
          </View>
        </View>

        {/* ── FILTROS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity style={styles.filterChip}>
            <MaterialCommunityIcons name="tune-variant" size={14} color={brandColors.primary} />
            <Text style={styles.filterChipText}> Filtrar</Text>
          </TouchableOpacity>
          {['Ordenar', 'Rango de Precio', 'Medios de Pago'].map((f) => (
            <TouchableOpacity key={f} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{f}</Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={brandColors.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── PILLS DE CATEGORÍAS ── */}
          <FlatList
            horizontal
            data={CATEGORY_PILLS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsList}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.pill, index === 0 && styles.pillActive]}
              >
                <Text style={[styles.pillText, index === 0 && styles.pillTextActive]}>
                  {item.emoji} {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          {isLoading && <ActivityIndicator style={{ marginTop: 24 }} color={brandColors.secondary} />}

          {/* ── NUESTROS FAVORITOS ── */}
          {favorites.length > 0 && (
            <View style={styles.favSection}>
              <View style={styles.favHeader}>
                <MaterialCommunityIcons name="star" size={18} color="#fff" />
                <Text style={styles.favTitle}> Nuestros Favoritos</Text>
              </View>
              <FlatList
                horizontal
                data={favorites}
                keyExtractor={(item) => item.id}
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
                        <Text style={styles.favAvatarText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.favName} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* ── CERCA DE VOS ── */}
          <View style={styles.nearSection}>
            <Text style={styles.nearTitle}>Cerca de vos</Text>

            {activePartners.map((partner) => {
              const cat = getCategoryInfo(partner);
              const rating = getPseudoRating(partner.id);
              return (
                <TouchableOpacity
                  key={partner.id}
                  style={styles.bizCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/(user)/negocio/${partner.id}`)}
                >
                  {/* Avatar */}
                  <View style={[styles.bizCardAvatar, { backgroundColor: cat.avatarColor }]}>
                    <Text style={styles.bizCardAvatarText}>
                      {partner.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.bizCardInfo}>
                    <View style={styles.bizCardTopRow}>
                      <Text style={styles.bizCardName} numberOfLines={1}>
                        {partner.name}
                      </Text>
                      <View style={styles.ratingBadge}>
                        <MaterialCommunityIcons name="star" size={12} color={brandColors.accent} />
                        <Text style={styles.ratingText}>{rating}</Text>
                      </View>
                    </View>

                    <Text style={styles.bizCardSub}>
                      {cat.priceRange} · {cat.label}
                    </Text>

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
    </>
  );
}

// ── estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  /* Top bar */
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
  backBtn: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },

  /* Filtros */
  filtersRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
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
  filterChipText: {
    fontSize: 12,
    color: brandColors.primary,
    fontWeight: '500',
  },

  /* Pills */
  pillsList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pillActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  pillText: {
    fontSize: 13,
    color: '#555',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  /* Favoritos */
  favSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: brandColors.accent,
    borderRadius: 14,
    overflow: 'hidden',
  },
  favHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  favTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  favList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  favItem: {
    width: 72,
    alignItems: 'center',
  },
  favAvatar: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  favAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  favName: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 13,
  },

  /* Cerca de vos */
  nearSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  nearTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 14,
  },
  bizCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  bizCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bizCardAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  bizCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bizCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  bizCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginLeft: 2,
  },
  bizCardSub: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availText: {
    fontSize: 11,
    color: '#888',
  },
});
