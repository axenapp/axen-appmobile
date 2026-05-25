import { useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';
import type { Service, Slot } from '../../src/types';

function formatDate(date: Date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export default function SlotsScreen() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const dateStr = formatDate(selectedDate);

  // Perfil del partner
  const { data: partner } = useQuery({
    queryKey: ['partner-me'],
    queryFn: async () => {
      const { data } = await api.get('/partners/me');
      return data;
    },
  });

  // Agenda del día seleccionado
  const { data: slots, isLoading } = useQuery({
    queryKey: ['partner-slots', partner?.id, dateStr],
    queryFn: async () => {
      const { data } = await api.get<Slot[]>(
        `/slots/partner/${partner!.id}?date=${dateStr}`
      );
      return data;
    },
    enabled: !!partner?.id,
  });

  // Servicios del partner
  const { data: services } = useQuery({
    queryKey: ['partner-services', partner?.id],
    queryFn: async () => {
      const { data } = await api.get<Service[]>(`/services/partner/${partner!.id}`);
      return data;
    },
    enabled: !!partner?.id,
  });

  const crearMutation = useMutation({
    mutationFn: async () => {
      const datetimes = selectedTimes.map(
        (time) => new Date(`${dateStr}T${time}:00`).toISOString()
      );
      await api.post('/slots', { serviceId: selectedService, datetimes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-slots'] });
      setSelectedTimes([]);
      setSelectedService(null);
      setError('');
    },
    onError: () => setError('No se pudieron crear los horarios.'),
  });

  const bloquearMutation = useMutation({
    mutationFn: async () => {
      await api.post('/slots/block-day', { date: dateStr });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-slots'] });
    },
  });

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleCrear = () => {
    if (!selectedService) { setError('Seleccioná un servicio'); return; }
    if (selectedTimes.length === 0) { setError('Seleccioná al menos un horario'); return; }
    setError('');
    crearMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Gestión de horarios</Text>

      {/* Navegación de fecha */}
      <View style={styles.dateNav}>
        <Button icon="chevron-left" onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
          Ant.
        </Button>
        <Text variant="titleMedium" style={styles.dateLabel}>
          {selectedDate.toLocaleDateString('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </Text>
        <Button
          icon="chevron-right"
          contentStyle={{ flexDirection: 'row-reverse' }}
          onPress={() => setSelectedDate(addDays(selectedDate, 1))}
        >
          Sig.
        </Button>
      </View>

      <Divider style={styles.divider} />

      {/* Agenda del día */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Agenda del día</Text>
      {isLoading && <ActivityIndicator />}
      {!isLoading && (!slots || slots.length === 0) && (
        <Text style={styles.empty}>No hay horarios para este día.</Text>
      )}
      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.slotRow}>
            <Text>{new Date(item.datetime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: item.status === 'free' ? '#E8F5E9' : '#FFF3E0' },
              ]}
              textStyle={{ color: item.status === 'free' ? '#2E7D32' : '#E65100' }}
            >
              {item.status === 'free' ? 'Libre' : item.status === 'reserved' ? 'Reservado' : 'Bloqueado'}
            </Chip>
          </View>
        )}
      />

      <Divider style={styles.divider} />

      {/* Crear nuevos slots */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Agregar horarios</Text>

      <Text variant="bodySmall" style={styles.label}>Servicio:</Text>
      <View style={styles.chipGroup}>
        {services?.filter(s => s.isActive).map((s) => (
          <Chip
            key={s.id}
            selected={selectedService === s.id}
            onPress={() => setSelectedService(s.id)}
            style={styles.serviceChip}
          >
            {s.name}
          </Chip>
        ))}
      </View>

      <Text variant="bodySmall" style={[styles.label, { marginTop: 12 }]}>Horarios:</Text>
      <View style={styles.chipGroup}>
        {HORARIOS.map((time) => (
          <Chip
            key={time}
            selected={selectedTimes.includes(time)}
            onPress={() => toggleTime(time)}
            style={styles.timeChip}
          >
            {time}
          </Chip>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        icon="plus"
        onPress={handleCrear}
        loading={crearMutation.isPending}
        disabled={crearMutation.isPending}
        style={styles.button}
      >
        Crear horarios seleccionados
      </Button>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        icon="cancel"
        onPress={() => bloquearMutation.mutate()}
        loading={bloquearMutation.isPending}
        textColor="#d32f2f"
        style={styles.blockButton}
      >
        Bloquear este día completo
      </Button>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  title: { fontWeight: 'bold', marginBottom: 16 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLabel: { flex: 1, textAlign: 'center', fontWeight: '600' },
  divider: { marginVertical: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  empty: { color: '#888', marginBottom: 8 },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  statusChip: { height: 28 },
  label: { color: '#666', marginBottom: 8 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { marginBottom: 4 },
  timeChip: { marginBottom: 4 },
  error: { color: '#d32f2f', marginTop: 12 },
  button: { marginTop: 16, paddingVertical: 4 },
  blockButton: { borderColor: '#d32f2f' },
});