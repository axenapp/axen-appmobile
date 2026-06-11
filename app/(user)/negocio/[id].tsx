import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import type { Partner, Service } from '../../../src/types';
import { brandColors } from '../../../src/theme';
import { toggleFavPartner, isFavPartner } from '../favoritos';
import { useEffect, useState } from 'react';

// ── helpers ──────────────────────────────────────────────
function getAvatarColor(id: string): string {
  const colors = ['#c8956c', '#4caf50', '#c2185b', '#1976d2', '#ff9800', '#00bcd4', '#5d4037', '#7b1fa2'];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

function getPseudoRating(id: string): string {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (3.5 + (n % 16) / 10).toFixed(1);
}

function getPseudoReviews(id: string): number {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 3 + (n % 20);
}

// ── pantalla ─────────────────────────────────────────────
export default function NegocioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const { data } = await api.get<Partner>(`/partners/${id}`);
      return data;
    },
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['services', id],
    queryFn: async () => {
      const { data } = await api.get<Service[]>(`/services/partner/${id}`);
      return data;
    },
  });

  // ── todos los hooks ANTES del return condicional ──
  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    if (id) isFavPartner(id).then(setIsFav);
  }, [id]);

  const handleToggleFav = async () => {
    if (!id) return;
    await toggleFavPartner(id);
    setIsFav(v => !v);
  };

  if (loadingPartner) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={brandColors.secondary} />
      </View>
    );
  }

  const avatarColor    = getAvatarColor(id ?? '');
  const rating         = getPseudoRating(id ?? '');
  const reviewCount    = getPseudoReviews(id ?? '');
  const initial        = (partner?.name ?? '?').charAt(0).toUpperCase();
  const activeServices = services?.filter(s => s.isActive) ?? [];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fdf0ec" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── HEADER (salmon) ── */}
        <View style={styles.header}>
          {/* Botón volver */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={brandColors.primary} />
          </TouchableOpacity>

          {/* Avatar + nombre + rating */}
          <View style={styles.heroRow}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.partnerName}>{partner?.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={14} color={brandColors.accent} />
                <Text style={styles.ratingText}>
                  {rating}{' '}
                  <Text style={styles.reviewCount}>({reviewCount} opiniones)</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Fila: perfil + corazón */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.profileBtn, { flex: 1 }]}
              activeOpacity={0.75}
              onPress={() => router.push(`/(user)/perfil-negocio/${id}`)}
            >
              <Text style={styles.profileBtnText}>Ver perfil profesional</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.favBtn} onPress={handleToggleFav}>
              <MaterialCommunityIcons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? brandColors.accent : brandColors.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── INFO ── */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#888" />
            <Text style={styles.infoText}>Turnos disponibles en las próximas 2 horas.</Text>
          </View>
          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#888" />
            <Text style={styles.infoText}>
              {partner?.address ?? 'A 400m de tu ubicación.'}
            </Text>
          </View>
          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="credit-card-outline" size={16} color="#888" />
            <Text style={styles.infoText}>Efectivo · Débito · MercadoPago</Text>
          </View>
        </View>

        {/* ── SERVICIOS ── */}
        <View style={styles.servicesSection}>
          <Text style={styles.servicesTitle}>Servicios Disponibles</Text>

          {loadingServices && (
            <ActivityIndicator color={brandColors.secondary} style={{ marginTop: 16 }} />
          )}

          {activeServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              activeOpacity={0.75}
              onPress={() => router.push(`/(user)/reservar/${service.id}`)}
            >
              <View style={styles.serviceCardInner}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceSub}>{service.durationMinutes} min</Text>
                <Text style={styles.servicePrice}>${service.price.toLocaleString('es-AR')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}

          {!loadingServices && activeServices.length === 0 && (
            <Text style={styles.empty}>Este negocio no tiene servicios activos.</Text>
          )}
        </View>

      </ScrollView>
    </>
  );
}

// ── estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header salmon */
  header: {
    backgroundColor: '#fdf0ec',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 22,
    fontWeight: '800',
    color: brandColors.primary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    fontWeight: '400',
    color: '#888',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileBtn: {
    borderWidth: 1.5,
    borderColor: brandColors.secondary,
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  favBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: brandColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: {
    color: brandColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  /* Info */
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  /* Servicios */
  servicesSection: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 14,
    marginTop: 6,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceCardInner: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  serviceSub: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  servicePrice: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
  },
});
