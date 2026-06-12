import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput as RNTextInput,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import type { Partner } from '../../src/types';
import { brandColors } from '../../src/theme';

const CATEGORIES = [
  { id: 'Peluquería', label: 'Peluquería', emoji: '✂️',  bg: '#f5ece0' },
  { id: 'Salud',      label: 'Salud',      emoji: '🩺',  bg: '#e8f5e9' },
  { id: 'Estética',   label: 'Estética',   emoji: '💆',  bg: '#fce4ec' },
  { id: 'Mascotas',   label: 'Mascotas',   emoji: '🐾',  bg: '#fff8e1' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const catItemWidth = (width - 16 * 2 - 12) / 2;
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    const q = search.trim();
    if (!q) {
      router.push('/(user)/catalogo');
    } else {
      router.push({ pathname: '/(user)/catalogo', params: { search: q } });
    }
  };

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data } = await api.get<Partner[]>('/partners');
      return data;
    },
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color="#fff" />
            <Text style={styles.locationText}>Av. Siempreviva 742</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255,255,255,0.65)" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >

          {/* ── BUSCADOR ── */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <RNTextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                placeholder="Buscar servicio o negocio..."
                placeholderTextColor="#aaa"
                style={styles.searchInput}
              />
              <TouchableOpacity onPress={handleSearch} activeOpacity={0.7}>
                <MaterialCommunityIcons name="magnify" size={22} color={brandColors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── CATEGORÍAS 2×2 ── */}
          <View style={styles.grid}>
            {[CATEGORIES.slice(0, 2), CATEGORIES.slice(2, 4)].map((row, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catItem, { width: catItemWidth }]}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/(user)/catalogo', params: { category: cat.id } })}
                  >
                    <View style={[styles.catImage, { backgroundColor: cat.bg }]}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    </View>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* ── BANNER PROMO ── */}
          <View style={styles.banner}>
            <Text style={styles.bannerSub}>Todo lo que necesitas,</Text>
            <Text style={styles.bannerMid}>
              en <Text style={styles.bannerAccent}>un solo lugar</Text>
            </Text>
            <Text style={styles.bannerBold}>RESERVÁ, PAGÁ Y CALIFICÁ</Text>
            <Text style={styles.bannerEnd}>y listo 😉</Text>
          </View>

          {/* ── NEGOCIOS DESTACADOS ── */}
          <View style={styles.bizSection}>
            {isLoading && (
              <ActivityIndicator color={brandColors.secondary} style={{ marginBottom: 12 }} />
            )}

            <FlatList
              horizontal
              data={partners}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bizList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bizItem}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/(user)/negocio/${item.id}`)}
                >
                  <View style={styles.bizAvatar}>
                    <Text style={styles.bizAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.bizName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/(user)/catalogo')}
            >
              <Text style={styles.exploreBtnText}>Explorar más negocios</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  /* Header */
  header: {
    backgroundColor: brandColors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 4,
  },

  /* Scroll */
  scroll: {
    paddingBottom: 32,
  },

  /* Buscador */
  searchWrapper: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },

  /* Categorías */
  grid: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catItem: {
    alignItems: 'center',
  },
  catImage: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catEmoji: {
    fontSize: 40,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  /* Banner */
  banner: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: brandColors.primary,
    borderRadius: 16,
    padding: 22,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginBottom: 2,
  },
  bannerMid: {
    color: '#fff',
    fontSize: 17,
    marginBottom: 4,
  },
  bannerAccent: {
    color: brandColors.accent,
    fontWeight: '700',
  },
  bannerBold: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  bannerEnd: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },

  /* Negocios */
  bizSection: {
    marginTop: 24,
    paddingLeft: 16,
  },
  bizList: {
    paddingRight: 16,
    gap: 16,
  },
  bizItem: {
    width: 72,
    alignItems: 'center',
  },
  bizAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: brandColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bizAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  bizName: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    lineHeight: 14,
  },
  exploreBtn: {
    marginTop: 16,
    marginRight: 16,
    marginLeft: 0,
    backgroundColor: brandColors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
