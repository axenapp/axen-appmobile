import { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../../src/services/api';
import type { Service, Slot } from '../../../src/types';

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function ReservarScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(getTomorrow());

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data } = await api.get<Service>(`/services/${serviceId}`);
      return data;
    },
  });

  const dateStr = formatDate(selectedDate);

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

  const isPrevDisabled = formatDate(selectedDate) <= formatDate(getTomorrow());

  return (
    <View style={styles.container}>

      <Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>
        Volver
      </Button>

      {loadingService ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>{service?.name}</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {service?.durationMinutes} min — ${service?.price}
          </Text>
        </View>
      )}

      {/* Navegación de fecha */}
      <View style={styles.dateNav}>
        <IconButton
          icon="chevron-left"
          onPress={() => setSelectedDate(d => addDays(d, -1))}
          disabled={isPrevDisabled}
        />
        <Text variant="titleMedium" style={styles.dateLabel}>
          {selectedDate.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        <IconButton
          icon="chevron-right"
          onPress={() => setSelectedDate(d => addDays(d, 1))}
        />
      </View>

      {loadingSlots && <ActivityIndicator style={styles.loader} />}

      {!loadingSlots && (!slots || slots.length === 0) && (
        <Text style={styles.empty}>No hay turnos disponibles para este día.</Text>
      )}

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Title
              title={new Date(item.datetime).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              subtitle={`${service?.durationMinutes ?? ''} min`}
            />
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() =>
                  router.push({
                    pathname: '/(user)/confirmar',
                    params: { slotId: item.id, serviceId },
                  })
                }
              >
                Elegir este horario
              </Button>
            </Card.Actions>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 48 },
  back: { alignSelf: 'flex-start', marginLeft: 8 },
  header: { padding: 16 },
  title: { fontWeight: 'bold' },
  subtitle: { color: '#666', marginTop: 4 },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dateLabel: { flex: 1, textAlign: 'center', fontWeight: '600', textTransform: 'capitalize' },
  loader: { marginTop: 24 },
  empty: { color: '#888', textAlign: 'center', marginTop: 32 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#fff' },
});