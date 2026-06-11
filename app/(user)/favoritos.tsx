import { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import type { Partner } from '../../src/types';
import { brandColors } from '../../src/theme';

// ── helpers de storage (exportados para usar en otras pantallas) ──
const FAV_KEY = 'fav_partners';

export async function toggleFavPartner(id: string) {
  const ids = await getFavPartnerIds();
  const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
  await SecureStore.setItemAsync(FAV_KEY, JSON.stringify(next));
}

export async function getFavPartnerIds(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function isFavPartner(id: string): Promise<boolean> {
  const ids = await getFavPartnerIds();
  return ids.includes(id);
}

// ── helper color avatar ───────────────────────────────────
function getAvatarColor(id: string): string {
  const colors = ['#c8956c', '#4caf50', '#c2185b', '#1976d2', '#ff9800', '#00bcd4', '#5d4037'];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

// ── pantalla ──────────────────────────────────────────────
export default function FavoritosScreen() {
  const router = useRouter();
  const [tab, setTab]           = useState<'locales' | 'servicios'>('locales');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading]   = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const ids = await getFavPartnerIds();
        if (!active) return;
        if (ids.length === 0) { setPartners([]); setLoading(false); return; }
        try {
          const { data } = await api.get<Partner[]>('/partners');
          if (active) setPartners(data.filter(p => ids.includes(p.id)));
        } catch { /* silencioso */ }
        finally { if (active) setLoading(false); }
      };
      load();
      return () => { active = false; };
    }, []),
  );

  const renderPartner = ({ item }: { item: Partner }) => {
    const color   = getAvatarColor(item.id);
    const initial = item.name.charAt(0).toUpperCase();
    return (
      <TouchableOpacity
        style={card.container}
        activeOpacity={0.8}
        onPress={() => router.push(`/(user)/negocio/${item.id}`)}
      >
        <View style={[card.avatar, { backgroundColor: color }]}>
          <Text style={card.avatarText}>{initial}</Text>
        </View>
        <Text style={card.name}>{item.name}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(user)/home')}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favoritos</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* ── TABS ── */}
        <View style={styles.tabs}>
          {(['locales', 'servicios'] as const).map((t) => (
            <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'locales' ? 'Locales' : 'Servicios'}
              </Text>
              {tab === t && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTENIDO ── */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={brandColors.secondary} />
        ) : tab === 'locales' ? (
          <FlatList
            data={partners}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="heart-outline" size={52} color="#ddd" />
                <Text style={styles.emptyTitle}>Todavía no tenés favoritos</Text>
                <Text style={styles.emptyText}>
                  Desde el perfil de un negocio podés guardar tus locales favoritos.
                </Text>
              </View>
            }
            renderItem={renderPartner}
          />
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bookmark-outline" size={52} color="#ddd" />
            <Text style={styles.emptyTitle}>Sin servicios guardados</Text>
            <Text style={styles.emptyText}>
              Próximamente podrás guardar servicios individuales.
            </Text>
          </View>
        )}

      </View>
    </>
  );
}

// ── estilos ───────────────────────────────────────────────
const card = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },

  header: {
    backgroundColor: brandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 15, color: '#aaa', fontWeight: '500' },
  tabTextActive: { color: brandColors.primary, fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    backgroundColor: brandColors.primary,
    borderRadius: 2,
  },

  list: { padding: 16, paddingBottom: 32 },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#aaa',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 19,
  },
});
