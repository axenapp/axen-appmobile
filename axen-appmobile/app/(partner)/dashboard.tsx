import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import type { Booking } from '../../src/types';

export default function DashboardScreen() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['partner-bookings'],
    queryFn: async () => {
      const { data } = await api.get<Booking[]>('/bookings/partner');
      return data;
    },
  });

  const confirmed = bookings?.filter((b) => b.status === 'confirmed').length ?? 0;
  const pending = bookings?.filter((b) => b.status === 'pending_payment').length ?? 0;
  const completed = bookings?.filter((b) => b.status === 'completed').length ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>
        Hola, {user?.name?.split(' ')[0]} 👋
      </Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <View style={styles.stats}>
          <Card style={[styles.statCard, { backgroundColor: '#E3F2FD' }]} mode="contained">
            <Card.Content style={styles.statContent}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#1565C0' }]}>
                {confirmed}
              </Text>
              <Text variant="bodySmall" style={{ color: '#1565C0' }}>
                Confirmados
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#FFF3E0' }]} mode="contained">
            <Card.Content style={styles.statContent}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#E65100' }]}>
                {pending}
              </Text>
              <Text variant="bodySmall" style={{ color: '#E65100' }}>
                Pendientes
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#E8F5E9' }]} mode="contained">
            <Card.Content style={styles.statContent}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#2E7D32' }]}>
                {completed}
              </Text>
              <Text variant="bodySmall" style={{ color: '#2E7D32' }}>
                Completados
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Próximos turnos
      </Text>

      {bookings
        ?.filter((b) => b.status === 'confirmed')
        .slice(0, 5)
        .map((booking) => (
          <Card key={booking.id} style={styles.bookingCard} mode="outlined">
            <Card.Title
              title={booking.service?.name ?? 'Servicio'}
              subtitle={
                booking.slot?.datetime
                  ? new Date(booking.slot.datetime).toLocaleString('es-AR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : undefined
              }
            />
          </Card>
        ))}

      {bookings?.filter((b) => b.status === 'confirmed').length === 0 && !isLoading && (
        <Text style={styles.empty}>No hay turnos confirmados próximos.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  loader: {
    marginTop: 32,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  bookingCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
  },
});
