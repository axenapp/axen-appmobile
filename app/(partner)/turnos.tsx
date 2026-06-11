import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';
import type { Booking } from '../../src/types';
import { useRouter } from 'expo-router';



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

export default function PartnerTurnosScreen() {

  const router = useRouter();

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['partner-bookings'],
    queryFn: async () => {
      const { data } = await api.get<Booking[]>('/bookings/partner');
      return data;
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Turnos
      </Text>

      {isLoading && <ActivityIndicator style={styles.loader} />}
      {isError && <Text style={styles.error}>No se pudieron cargar los turnos.</Text>}
      {!isLoading && bookings?.length === 0 && (
        <Text style={styles.empty}>No hay turnos registrados.</Text>
      )}

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="outlined" onPress={() => router.push(`/(partner)/turno/${item.id}`)}>
            <Card.Title
              title={item.service?.name ?? 'Servicio'}
              subtitle={
                item.slot?.datetime
                  ? new Date(item.slot.datetime).toLocaleString('es-AR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : undefined
              }
            />
            <Card.Content style={styles.cardContent}>
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
  loader: { marginTop: 32 },
  error: { color: '#d32f2f', textAlign: 'center', marginTop: 32 },
  empty: { color: '#888', textAlign: 'center', marginTop: 48 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  card: { backgroundColor: '#fff' },
  cardContent: { paddingTop: 4 },
  chip: { height: 28, alignSelf: 'flex-start' },
});
