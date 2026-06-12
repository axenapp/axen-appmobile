import { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import type { Booking } from '../../src/types';
import { brandColors } from '../../src/theme';

// ── helpers ───────────────────────────────────────────────
function getAvatarColor(id: string): string {
  const colors = ['#c8956c', '#4caf50', '#c2185b', '#1976d2', '#ff9800', '#00bcd4', '#5d4037'];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

function formatDatetime(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day:     '2-digit',
    month:   '2-digit',
    year:    'numeric',
  }) + ' - ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + 'h';
}

const STATUS_CHIP: Record<Booking['status'], { label: string; bg: string; color: string }> = {
  confirmed:       { label: 'Confirmado',     bg: '#4caf50', color: '#fff' },
  pending_payment: { label: 'Pago pendiente', bg: '#ff9800', color: '#fff' },
  completed:       { label: 'Completado',     bg: '#555',    color: '#fff' },
  cancelled:       { label: 'Cancelado',      bg: brandColors.accent, color: '#fff' },
  failed:          { label: 'Fallido',        bg: '#c62828', color: '#fff' },
};

const PAYMENT_LABEL: Record<Booking['status'], string | null> = {
  pending_payment: 'Pendiente de pago',
  confirmed:       'Pago confirmado',
  completed:       'Pago confirmado',
  cancelled:       null,
  failed:          'Pago fallido',
};

function isUpcoming(b: Booking): boolean {
  if (b.status === 'cancelled' || b.status === 'failed' || b.status === 'completed') return false;
  if (!b.slot?.datetime) return false;
  return new Date(b.slot.datetime) >= new Date();
}

function isHistory(b: Booking): boolean {
  if (b.status === 'cancelled' || b.status === 'failed' || b.status === 'completed') return true;
  if (!b.slot?.datetime) return false;
  return new Date(b.slot.datetime) < new Date();
}

// ── componente de tarjeta ─────────────────────────────────
function BookingCard({
  item,
  isHistory,
  onCancel,
}: {
  item: Booking;
  isHistory: boolean;
  onCancel: (id: string) => void;
}) {
  const router      = useRouter();
  const partner     = item.service?.partner;
  const avatarColor = getAvatarColor(partner?.id ?? item.id);
  const initial     = (partner?.name ?? '?').charAt(0).toUpperCase();
  const chip        = STATUS_CHIP[item.status];
  const paymentLabel = PAYMENT_LABEL[item.status];

  return (
    <View style={card.container}>
      {/* Fila principal */}
      <View style={card.row}>
        {/* Avatar */}
        <View style={[card.avatar, { backgroundColor: avatarColor }]}>
          <Text style={card.avatarText}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={card.info}>
          <Text style={card.partnerName}>{partner?.name ?? 'Negocio'}</Text>
          <Text style={card.serviceName}>{item.service?.name ?? 'Servicio'}</Text>
          {item.slot?.datetime ? (
            <View style={card.dateRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#aaa" />
              <Text style={card.dateText}>{formatDatetime(item.slot.datetime)}</Text>
            </View>
          ) : null}
          {paymentLabel ? (
            <View style={card.dateRow}>
              <MaterialCommunityIcons
                name={item.status === 'pending_payment' ? 'credit-card-clock-outline' : 'check-circle-outline'}
                size={12}
                color={item.status === 'pending_payment' ? '#ff9800' : '#4caf50'}
              />
              <Text style={[card.paymentText, item.status === 'pending_payment' && card.paymentPending]}>
                {paymentLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Chip estado */}
        <View style={[card.chip, { backgroundColor: chip.bg }]}>
          <Text style={[card.chipText, { color: chip.color }]}>{chip.label}</Text>
        </View>
      </View>

      {/* Acciones */}
      {/* Acciones para Próximos */}
      {!isHistory && (
        <View style={card.actions}>
          <TouchableOpacity
            style={card.actionBtn}
            onPress={() => router.push(`/(user)/reservar/${item.serviceId}`)}
          >
            <Text style={card.actionBtnText}>Reprogramar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={card.actionBtn}
            onPress={() => onCancel(item.id)}
          >
            <Text style={card.actionBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dejar reseña: completado o confirmado ya pasado */}
      {isHistory && (item.status === 'completed' || item.status === 'confirmed') && (
        <View style={card.actions}>
          <TouchableOpacity
            style={[card.actionBtn, card.reviewBtn]}
            onPress={() => router.push(`/(user)/resena/${item.id}`)}
          >
            <MaterialCommunityIcons name="star-outline" size={14} color="#fff" />
            <Text style={[card.actionBtnText, card.reviewBtnText]}>
              Dejar reseña
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const card = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  info: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  serviceName: { fontSize: 13, color: '#555', marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateText: { fontSize: 12, color: '#aaa' },
  paymentText: { fontSize: 12, color: '#4caf50' },
  paymentPending: { color: '#ff9800' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 11, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: brandColors.accent,
  },
  reviewBtn: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: brandColors.accent,
  },
  reviewBtnText: {
    color: '#fff',
  },
});

// ── pantalla principal ────────────────────────────────────
export default function TurnosScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'proximos' | 'historial'>('proximos');

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await api.get<Booking[]>('/bookings/my');
      return data;
    },
  });

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Cancelar turno',
      '¿Seguro que querés cancelar este turno?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/bookings/${bookingId}/cancel`);
              queryClient.invalidateQueries({ queryKey: ['bookings'] });
            } catch {
              Alert.alert('Error', 'No se pudo cancelar el turno.');
            }
          },
        },
      ],
    );
  };

  const filtered = bookings?.filter(b =>
    tab === 'proximos' ? isUpcoming(b) : isHistory(b),
  ) ?? [];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(user)/home')} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Turnos</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* ── TABS ── */}
        <View style={styles.tabs}>
          {(['proximos', 'historial'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.tab}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'proximos' ? 'Próximos' : 'Historial'}
              </Text>
              {tab === t && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTENIDO ── */}
        {isLoading && <ActivityIndicator style={{ marginTop: 40 }} color={brandColors.secondary} />}

        {isError && (
          <Text style={styles.errorText}>No se pudieron cargar los turnos.</Text>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>
                {tab === 'proximos'
                  ? 'No tenés turnos próximos.'
                  : 'No hay turnos en tu historial.'}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <BookingCard
              item={item}
              isHistory={tab === 'historial'}
              onCancel={handleCancel}
            />
          )}
        />
      </View>
    </>
  );
}

// ── estilos pantalla ──────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: brandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {},
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 15,
    color: '#aaa',
    fontWeight: '500',
  },
  tabTextActive: {
    color: brandColors.primary,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    backgroundColor: brandColors.primary,
    borderRadius: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 14,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 32,
  },
});
