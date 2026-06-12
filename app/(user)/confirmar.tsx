import { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../../src/services/api';
import type { Service, Partner } from '../../src/types';
import { brandColors } from '../../src/theme';

type PaymentType = 'credito' | 'debito' | 'mercadopago';
interface SavedMethod { id: string; type: PaymentType; label: string; preferred: boolean; }

const TYPE_ICON: Record<PaymentType, string> = {
  credito:     'credit-card-outline',
  debito:      'credit-card-chip-outline',
  mercadopago: 'alpha-m-circle-outline',
};

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
  const raw = useLocalSearchParams<{
    slotId: string; serviceId: string; paymentMethod: string;
    paymentMethodId: string; notes: string; slotDatetime: string;
  }>();
  const slotId          = Array.isArray(raw.slotId)          ? raw.slotId[0]          : raw.slotId;
  const serviceId       = Array.isArray(raw.serviceId)       ? raw.serviceId[0]       : raw.serviceId;
  const paymentMethod   = Array.isArray(raw.paymentMethod)   ? raw.paymentMethod[0]   : raw.paymentMethod;
  const paymentMethodId = Array.isArray(raw.paymentMethodId) ? raw.paymentMethodId[0] : raw.paymentMethodId;
  const notes           = Array.isArray(raw.notes)           ? raw.notes[0]           : raw.notes;
  const slotDatetime    = Array.isArray(raw.slotDatetime)    ? raw.slotDatetime[0]    : raw.slotDatetime;
  const router = useRouter();
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');
  const [savedMethods,     setSavedMethods]     = useState<SavedMethod[]>([]);
  const [currentMethodId,  setCurrentMethodId]  = useState(paymentMethodId ?? 'efectivo');
  const [showChangeModal,  setShowChangeModal]  = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('payment_methods').then((raw) => {
      setSavedMethods(raw ? JSON.parse(raw) : []);
    });
  }, []);

  // paymentMethodId es el TIPO ('efectivo'|'credito'|'debito'|'mercadopago')
  // currentMethodId es el ID de la tarjeta específica seleccionada dentro de ese tipo
  const methodType = (paymentMethodId ?? 'efectivo') as 'efectivo' | 'credito' | 'debito' | 'mercadopago';

  const cardsOfType = useMemo(
    () => savedMethods.filter((m) => m.type === (methodType as any)),
    [savedMethods, methodType],
  );

  const currentMethod = useMemo(
    () => savedMethods.find((m) => m.id === currentMethodId)
      ?? cardsOfType.find((m) => m.preferred)
      ?? cardsOfType[0]
      ?? null,
    [savedMethods, currentMethodId, cardsOfType],
  );

  // Hermanos: todas las tarjetas del mismo tipo excepto la seleccionada
  const siblings = useMemo(
    () => cardsOfType.filter((m) => m.id !== currentMethod?.id),
    [cardsOfType, currentMethod],
  );

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

    let bookingId: string | null = null;

    // Paso 1: crear el booking (crítico — si falla, mostramos error)
    try {
      if (!slotId || !serviceId) {
        throw new Error('Datos del turno incompletos. Volvé a seleccionar el horario.');
      }
      const { data: booking } = await api.post('/bookings', { slotId, serviceId });
      bookingId = booking.id;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'No se pudo crear el turno. Verificá tu conexión e intentá de nuevo.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      setLoading(false);
      return;
    }

    // Paso 2: pago con MercadoPago (solo si el método es MercadoPago y está configurado)
    if (paymentMethod === 'MercadoPago') {
      try {
        const { data: payment } = await api.post('/payments/preference', { bookingId });
        await WebBrowser.openBrowserAsync(payment.sandboxInitPoint);
      } catch {
        // En local MP no está configurado — ignoramos y continuamos igual
      }
    }

    setLoading(false);
    router.replace({
      pathname: '/(user)/turno-confirmado',
      params: { bookingId },
    });
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

              {/* Método de pago con opción de cambio */}
              <View style={infoRowStyles.row}>
                <Text style={infoRowStyles.label}>Método de Pago: </Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {currentMethod && (
                      <MaterialCommunityIcons
                        name={TYPE_ICON[currentMethod.type] as any}
                        size={14}
                        color="#555"
                      />
                    )}
                    <Text style={infoRowStyles.value}>
                      {currentMethod?.label ?? paymentMethod ?? 'Efectivo'}
                    </Text>
                  </View>
                  {siblings.length > 0 && (
                    <TouchableOpacity onPress={() => setShowChangeModal(true)}>
                      <Text style={styles.changeLink}>Cambiar tarjeta</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
      {/* ── MODAL CAMBIO DE TARJETA ── */}
      <Modal visible={showChangeModal} transparent animationType="slide" onRequestClose={() => setShowChangeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowChangeModal(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Elegir tarjeta</Text>
            {[currentMethod, ...siblings].filter(Boolean).map((method) => (
              <TouchableOpacity
                key={method!.id}
                style={[styles.modalOption, currentMethodId === method!.id && styles.modalOptionActive]}
                onPress={() => { setCurrentMethodId(method!.id); setShowChangeModal(false); }}
              >
                <MaterialCommunityIcons
                  name={TYPE_ICON[method!.type] as any}
                  size={20}
                  color={currentMethodId === method!.id ? brandColors.primary : '#555'}
                />
                <Text style={[styles.modalOptionText, currentMethodId === method!.id && styles.modalOptionTextActive]}>
                  {method!.label}
                </Text>
                {currentMethodId === method!.id && (
                  <MaterialCommunityIcons name="check" size={18} color={brandColors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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

  changeLink: {
    fontSize: 12,
    color: brandColors.secondary,
    fontWeight: '600',
    marginTop: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionActive: {
    backgroundColor: '#f5f9ff',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: brandColors.primary,
  },
});
