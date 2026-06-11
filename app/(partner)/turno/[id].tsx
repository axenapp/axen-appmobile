import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../src/services/api';
import type { Booking } from '../../../src/types';

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

export default function TurnoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data } = await api.get<Booking>(`/bookings/${id}`);
      return data;
    },
  });

  const completarMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/bookings/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['partner-bookings'] });
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>
        Volver
      </Button>

      <Text variant="headlineSmall" style={styles.title}>Detalle del turno</Text>

      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.cardContent}>

          <View style={styles.row}>
            <Text style={styles.label}>Servicio</Text>
            <Text style={styles.value}>{booking?.service?.name}</Text>
          </View>
          <Divider />

          <View style={styles.row}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>
              {booking?.slot?.datetime
                ? new Date(booking.slot.datetime).toLocaleDateString('es-AR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })
                : '-'}
            </Text>
          </View>
          <Divider />

          <View style={styles.row}>
            <Text style={styles.label}>Horario</Text>
            <Text style={styles.value}>
              {booking?.slot?.datetime
                ? new Date(booking.slot.datetime).toLocaleTimeString('es-AR', {
                    hour: '2-digit', minute: '2-digit',
                  })
                : '-'}
            </Text>
          </View>
          <Divider />

          <View style={styles.row}>
            <Text style={styles.label}>Precio</Text>
            <Text style={styles.value}>${booking?.service?.price}</Text>
          </View>
          <Divider />

          <View style={styles.row}>
            <Text style={styles.label}>Estado</Text>
            <Chip
              style={{ backgroundColor: STATUS_COLOR[booking?.status ?? 'confirmed'] + '20' }}
              textStyle={{ color: STATUS_COLOR[booking?.status ?? 'confirmed'] }}
            >
              {STATUS_LABEL[booking?.status ?? 'confirmed']}
            </Chip>
          </View>

        </Card.Content>
      </Card>

      {booking?.status === 'confirmed' && (
        <Button
          mode="contained"
          icon="check-circle"
          onPress={() => completarMutation.mutate()}
          loading={completarMutation.isPending}
          disabled={completarMutation.isPending}
          style={styles.button}
        >
          Marcar como completado
        </Button>
      )}

      {completarMutation.isError && (
        <Text style={styles.error}>No se pudo completar el turno.</Text>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  title: { fontWeight: 'bold', marginBottom: 24 },
  card: { backgroundColor: '#fff', marginBottom: 24 },
  cardContent: { gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  label: { color: '#555' },
  value: { fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  button: { paddingVertical: 4 },
  error: { color: '#d32f2f', textAlign: 'center', marginTop: 12 },
});