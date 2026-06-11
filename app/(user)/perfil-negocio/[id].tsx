import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import type { Partner, Service, Review } from '../../../src/types';
import { brandColors } from '../../../src/theme';

// ── helpers ──────────────────────────────────────────────
function getAvatarColor(id: string): string {
  const colors = ['#c8956c', '#4caf50', '#c2185b', '#1976d2', '#ff9800', '#00bcd4', '#5d4037'];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginTop: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <MaterialCommunityIcons
          key={n}
          name="star"
          size={18}
          color={n <= rating ? '#FFD700' : '#ddd'}
        />
      ))}
    </View>
  );
}

// ── pantalla ─────────────────────────────────────────────
export default function PerfilNegocioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { width } = useWindowDimensions();
  const cardW = (width - 48 - 12) / 2; // 2 cols con gap

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

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data } = await api.get<Review[]>(`/reviews?partnerId=${id}`);
      return data;
    },
  });

  if (loadingPartner) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={brandColors.secondary} />
      </View>
    );
  }

  const avatarColor    = getAvatarColor(id ?? '');
  const initial        = (partner?.name ?? '?').charAt(0).toUpperCase();
  const activeServices = services?.filter(s => s.isActive) ?? [];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fdf0ec" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={brandColors.primary} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.partnerName}>{partner?.name}</Text>
        </View>

        {/* ── INFO RÁPIDA ── */}
        <View style={styles.quickInfo}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={15} color="#888" />
            <Text style={styles.infoText}>Turnos disponibles en las próximas 2 horas.</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={15} color="#888" />
            <Text style={styles.infoText}>{partner?.address ?? 'A 400m de tu ubicación.'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="credit-card-outline" size={15} color="#888" />
            <Text style={styles.infoText}>Efectivo · Débito · MercadoPago</Text>
          </View>

          {partner?.description ? (
            <>
              <View style={styles.infoDivider} />
              <Text style={styles.description}>{partner.description}</Text>
            </>
          ) : null}
        </View>

        {/* ── INFORMACIÓN ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          {partner?.address ? (
            <Text style={styles.infoLine}>Dirección: {partner.address}</Text>
          ) : null}
          <Text style={styles.infoLine}>Horarios: De Lunes a Sábado de 9h a 18h</Text>
        </View>

        {/* ── SERVICIOS 2 COLUMNAS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios Disponibles</Text>

          {loadingServices && <ActivityIndicator color={brandColors.secondary} />}

          <View style={styles.servicesGrid}>
            {activeServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { width: cardW }]}
                activeOpacity={0.75}
                onPress={() => router.push(`/(user)/reservar/${service.id}`)}
              >
                <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
                <Text style={styles.serviceSub}>{service.durationMinutes} min</Text>
                <Text style={styles.servicePrice}>${service.price.toLocaleString('es-AR')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!loadingServices && activeServices.length === 0 && (
            <Text style={styles.empty}>Sin servicios activos.</Text>
          )}
        </View>

        {/* ── OPINIONES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opiniones</Text>

          {!reviews || reviews.length === 0 ? (
            <Text style={styles.empty}>Todavía no hay opiniones.</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <MaterialCommunityIcons name="account-circle" size={36} color="#bbb" />
                  </View>
                  <View>
                    <Text style={styles.reviewUser}>
                      {(review as any).user?.name ?? 'Usuario'}
                    </Text>
                    <Text style={styles.reviewService}>
                      {(review as any).booking?.service?.name ?? ''}
                    </Text>
                  </View>
                </View>
                <Stars rating={review.rating} />
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </>
  );
}

// ── estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header: {
    backgroundColor: '#fdf0ec',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  partnerName: {
    fontSize: 20,
    fontWeight: '800',
    color: brandColors.primary,
  },

  /* Info rápida */
  quickInfo: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
  infoDivider: { height: 1, backgroundColor: '#f0f0f0' },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    paddingVertical: 12,
    fontStyle: 'italic',
  },

  /* Secciones */
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 12,
  },
  infoLine: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    lineHeight: 20,
  },

  /* Grid servicios */
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceSub: { fontSize: 12, color: '#888', marginBottom: 2 },
  servicePrice: { fontSize: 13, color: '#333', fontWeight: '600' },
  empty: { color: '#aaa', fontSize: 13, textAlign: 'center', paddingVertical: 8 },

  /* Reseñas */
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {},
  reviewUser: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  reviewService: { fontSize: 12, color: '#888', marginTop: 1 },
  reviewComment: { fontSize: 13, color: '#555', marginTop: 8, lineHeight: 18 },
});
