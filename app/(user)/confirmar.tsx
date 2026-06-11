import { useState } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import type { Service, Partner } from '../../src/types';
import { brandColors } from '../../src/theme';

// ── helpers ───────────────────────────────────────────────
function getAvatarColor(id: string): string {
  const colors = ['#c8956c', '#4caf50', '#c2185b', '#1976d2', '#ff9800', '#00bcd4', '#5d4037', '#7b1fa2'];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

function formatDateTime(datetime: string) {
  const d = new Date(datetime);
  const fecha = d.toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  // "viernes, 14/11/2025" → capitalize first letter
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) + 'h';
  return { fecha: fechaCap, hora };
}

// ── pantalla ──────────────────────────────────────────────
export default function ConfirmarScreen() {
  const { slotId, serviceId, paymentMethod, notes, slotDatetime } =
    useLocalSearchParams<{ slotId: string; serviceId: string; paymentMethod: string; notes: string; slotDatetime: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data } = await api.get<Service>(`/services/${serviceId}`);
      return data;
    },
  });

  // El datetime viene directo como param — no necesitamos fetch adicional
  const slot = slotDatetime ? { datetime: slotDatetime } : null;

  const { data: partner } = useQuery({
    queryKey: ['partner', service?.partnerId],
    queryFn: async () => {
      const { data } = await api.get<Partner>(`/partners/${service!.partnerId}`);
      return data;
    },
    enabled: !!service?.partnerId,
  });

  const handleConfirmar = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: booking } = await api.post('/bookings', { slotId, serviceId });
      const { data: payment } = await api.post('/payments/preference', { bookingId: booking.id });
      await WebBrowser.openBrowserAsync(payment.sandboxInitPoint);
      router.replace({
        pathname: '/(user)/turno-confirmado',
        params: { bookingId: booking.id },
      });
    } catch {
      setError('No se pudo procesar el pago. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loadingService;

  const avatarColor = getAvatarColor(partner?.id ?? 'x');
  const initial     = (partner?.name ?? '?').charAt(0).toUpperCase();
  const { fecha, hora } = slot?.datetime ? formatDateTime(slot.datetime) : { fecha: '-', hora: '-' };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>

        {/* ── TÍTULO ── */}
        <View style={styles.titleBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={brandColors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Confirmación de turno</Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={brandColors.secondary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── AVATAR DEL NEGOCIO ── */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <Text style={styles.partnerName}>{(partner?.name ?? '').toUpperCase()}</Text>
            </View>

            {/* ── CAJA DE DETALLE ── */}
            <View style={styles.infoBox}>
              <InfoRow label="Servicio"          value={service?.name ?? '-'} />
              <InfoRow label="Fecha"             value={fecha} />
              <InfoRow label="Horario"           value={hora} />
              <InfoRow label="Duración estimada" value={`${service?.durationMinutes ?? '-'} minutos`} />
              <InfoRow label="Dirección"         value={partner?.address ?? 'A confirmar con el negocio'} />
              <InfoRow
                label="Monto Total"
                value={`$${service?.price?.toLocaleString('es-AR') ?? '-'}`}
              />
              <InfoRow label="Método de Pago"   value={paymentMethod ?? 'Efectivo'} />
              {notes ? (
                <>
                  <InfoRow label="Notas para el negocio" value="" />
                  <Text style={styles.notesValue}>{notes}</Text>
                </>
              ) : null}
            </View>

            {/* ── RECORDATORIO ── */}
            <View style={styles.reminderBox}>
              <Text style={styles.reminderText}>
                Recordá llegar 10 minutos antes de tu turno.{'\n'}
                Si necesitás modificar o cancelar,{'\n'}
                podés hacerlo desde <Text style={styles.reminderBold}>Mis Turnos</Text>
              </Text>
            </View>

            {/* ── ERROR ── */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* ── BOTÓN ── */}
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleConfirmar}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmBtnText}>Confirmar Turno</Text>
              }
            </TouchableOpacity>

          </ScrollView>
        )}
      </View>
    </>
  );
}

// ── sub-componente fila ───────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={infoRowStyles.label}>{label}: </Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#444',
    flexShrink: 1,
  },
});

// ── estilos ───────────────────────────────────────────────
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

  /* Título */
  titleBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  backBtn: {
    padding: 2,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: brandColors.primary,
  },

  /* Scroll */
  scroll: {
    paddingBottom: 40,
  },

  /* Avatar */
  avatarSection: {
    backgroundColor: '#fdf0ec',
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  partnerName: {
    fontSize: 13,
    fontWeight: '700',
    color: brandColors.primary,
    letterSpacing: 1,
  },

  /* Caja de detalle */
  infoBox: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    padding: 18,
  },
  notesValue: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 6,
    marginLeft: 4,
  },

  /* Recordatorio */
  reminderBox: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  reminderBold: {
    fontWeight: '700',
    color: '#666',
  },

  /* Error */
  error: {
    color: brandColors.accent,
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    fontSize: 13,
  },

  /* Botón */
  confirmBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: brandColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
