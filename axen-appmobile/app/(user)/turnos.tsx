import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';
import type { Booking } from '../../src/types';

const STATUS_LABEL: Record<Booking['status'], string> = {
  pending_payment: 'Pago pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  failed: 'Fallido',
};

const STATUS_COLOR: Record<Booking['status'], string> = {
  pending_payment: '#FF9800',
  confirmed: '#4CAF50',
  completed: '#2196F3',
  cancelled: '#9E9E9E',
  failed: '#F44336',
};

export default function TurnosScreen() {
  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await api.get<Booking[]>('/bookings');
      return data;
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Mis turnos
      </Text>

      {isLoading && <ActivityIndicator style={styles.loader} />}

      {isError && (
        <Text style={styles.error}>No se pudieron cargar los turnos.</Text>
      )}

      {bookings?.length === 0 && !isLoading && (
        <Text style={styles.empty}>No tenés turnos todavía.</Text>
      )}

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Title
              title={item.service?.name ?? 'Servicio'}
              subtitle={item.service?.partner?.name ?? ''}
            />
            <Card.Content style={styles.cardContent}>
              {item.slot?.datetime && (
                <Text variant="bodySmall" style={styles.date}>
                  {new Date(item.slot.datetime).toLocaleString('es-AR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              )}
              <Chip
                style={[styles.chip, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}
                textStyle={{ color: STATUS_COLOR[item.status] }}
              >
                {STATUS_LABEL[item.status]}
              </Chip>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 56,
  },
  title: {
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loader: {
    marginTop: 32,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 32,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 48,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  date: {
    color: '#555',
  },
  chip: {
    height: 28,
  },
});
