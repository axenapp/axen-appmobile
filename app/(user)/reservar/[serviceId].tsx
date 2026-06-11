import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import type { Service, Slot } from '../../../src/types';
import { brandColors } from '../../../src/theme';

// ── helpers de fecha ──────────────────────────────────────
const DAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(datetime: string): string {
  return new Date(datetime).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + 'h';
}

// Genera los próximos N días desde mañana
function getNextDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => addDays(getTomorrow(), i));
}

const PAYMENT_METHODS = ['Efectivo', 'Débito', 'MercadoPago'];

const IMPORTANT_ITEMS = [
  'Se solicita llegar 10 minutos antes para garantizar la atención.',
  'En caso de retraso mayor a 15 minutos, el turno podrá cancelarse automáticamente.',
  'Si abonaste una seña, esta se descontará del total y no es reembolsable en caso de inasistencia.',
  'Podés reprogramar hasta 12 horas antes del horario reservado.',
];

// ── pantalla ──────────────────────────────────────────────
export default function ReservarScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();

  const days = getNextDays(6);
  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('Efectivo');
  const [accepted, setAccepted] = useState(false);
  const [notes, setNotes] = useState('');

  const dateStr = formatDate(selectedDate);

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data } = await api.get<Service>(`/services/${serviceId}`);
      return data;
    },
  });

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots-available', serviceId, dateStr],
    queryFn: async () => {
      const { data } = await api.get<Slot[]>(
        `/slots/available?serviceId=${serviceId}&date=${dateStr}`,
      );
      return data;
    },
    enabled: !!serviceId,
  });

  const canReserve = !!selectedSlot && accepted;

  const handleReservar = () => {
    if (!canReserve) return;
    router.push({
      pathname: '/(user)/confirmar',
      params: {
        slotId: selectedSlot!.id,
        serviceId,
        paymentMethod: selectedPayment,
        notes,
        slotDatetime: selectedSlot!.datetime,
      },
    });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fdf0ec" />
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={brandColors.primary} />
          </TouchableOpacity>

          {loadingService ? (
            <ActivityIndicator color={brandColors.secondary} />
          ) : (
            <View style={styles.heroRow}>
              <View style={styles.heroText}>
                <View style={styles.nameRow}>
                  <Text style={styles.serviceName}>{service?.name}</Text>
                  <MaterialCommunityIcons name="star" size={16} color={brandColors.accent} style={{ marginLeft: 6 }} />
                </View>
                {service?.description ? (
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                ) : null}
                <Text style={styles.servicePrice}>
                  ${service?.price?.toLocaleString('es-AR')}
                </Text>
              </View>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── ELEGÍ TU TURNO ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elegí tu turno</Text>

            {/* Días */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}>
              {days.map((day) => {
                const active = formatDate(day) === dateStr;
                return (
                  <TouchableOpacity
                    key={formatDate(day)}
                    style={[styles.dayPill, active && styles.dayPillActive]}
                    onPress={() => { setSelectedDate(day); setSelectedSlot(null); }}
                  >
                    <Text style={[styles.dayPillAbbr, active && styles.dayPillTextActive]}>
                      {DAY_SHORT[day.getDay()]}
                    </Text>
                    <Text style={[styles.dayPillNum, active && styles.dayPillTextActive]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Horarios */}
            {loadingSlots ? (
              <ActivityIndicator style={{ marginTop: 12 }} color={brandColors.secondary} />
            ) : slots && slots.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillsRow}>
                {slots.map((slot) => {
                  const active = selectedSlot?.id === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.timePill, active && styles.timePillActive]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[styles.timePillText, active && styles.timePillTextActive]}>
                        {formatTime(slot.datetime)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.emptySlots}>No hay horarios disponibles para este día.</Text>
            )}
          </View>

          {/* ── MÉTODO DE PAGO ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <View style={styles.paymentRow}>
              {PAYMENT_METHODS.map((method) => {
                const active = selectedPayment === method;
                return (
                  <TouchableOpacity
                    key={method}
                    style={[styles.paymentPill, active && styles.paymentPillActive]}
                    onPress={() => setSelectedPayment(method)}
                  >
                    <Text style={[styles.paymentPillText, active && styles.paymentPillTextActive]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── IMPORTANTE ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Importante para este servicio</Text>
            {IMPORTANT_ITEMS.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ── CHECKBOX ── */}
          <TouchableOpacity
            style={styles.checkRow}
            activeOpacity={0.7}
            onPress={() => setAccepted(v => !v)}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
              {accepted && (
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
              )}
            </View>
            <Text style={styles.checkLabel}>Acepto y me comprometo a asistir a mi turno</Text>
          </TouchableOpacity>

          {/* ── NOTAS ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas para este servicio:</Text>
            <Text style={styles.notesSubtitle}>El prestador lo tendrá en cuenta para tu turno.</Text>
            <RNTextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Escribí las instrucciones que necesites"
              placeholderTextColor="#bbb"
              style={styles.notesInput}
              textAlignVertical="top"
            />
          </View>

          {/* ── BOTÓN RESERVAR ── */}
          <TouchableOpacity
            style={[styles.reserveBtn, !canReserve && styles.reserveBtnDisabled]}
            onPress={handleReservar}
            disabled={!canReserve}
            activeOpacity={0.85}
          >
            <Text style={styles.reserveBtnText}>Reservar Turno</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </>
  );
}

// ── estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  /* Header */
  header: {
    backgroundColor: '#fdf0ec',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: brandColors.primary,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
    lineHeight: 18,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: brandColors.primary,
  },

  /* Scroll */
  scroll: {
    paddingBottom: 40,
  },

  /* Secciones genéricas */
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
    marginBottom: 14,
  },

  /* Filas de pills */
  pillsRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },

  /* Días */
  dayPill: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    minWidth: 52,
  },
  dayPillActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  dayPillAbbr: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  dayPillNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
  },
  dayPillTextActive: {
    color: '#fff',
  },

  /* Horarios */
  timePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  timePillActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  timePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  timePillTextActive: {
    color: '#fff',
  },
  emptySlots: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },

  /* Método de pago */
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  paymentPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  paymentPillActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  paymentPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  paymentPillTextActive: {
    color: '#fff',
  },

  /* Bullets */
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  bulletDot: {
    color: brandColors.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },

  /* Checkbox */
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: brandColors.secondary,
    borderColor: brandColors.secondary,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },

  /* Notas */
  notesSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: -8,
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#333',
    minHeight: 100,
    backgroundColor: '#fff',
  },

  /* Botón reservar */
  reserveBtn: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: brandColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  reserveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  reserveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
