import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';
import type { Booking } from '../../src/types';

const STATUS_INFO: Partial<Record<Booking['status'], { emoji: string; mensaje: string; color: string }>> = {
  confirmed: {
    emoji: '✅',
    mensaje: 'Tu turno fue confirmado y el pago fue procesado.',
    color: '#2E7D32',
  },
  pending_payment: {
    emoji: '⏳',
    mensaje: 'El pago está siendo procesado. Te avisaremos cuando se confirme.',
    color: '#E65100',
  },
  failed: {
    emoji: '❌',
    mensaje: 'El pago no pudo procesarse. Podés intentar reservar de nuevo.',
    color: '#C62828',
  },
};

export default function TurnoConfirmadoScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get<Booking>(`/bookings/${bookingId}`);
      return data;
    },
    // Reintenta cada 3 segundos hasta que el estado cambie de pending_payment
    refetchInterval: (query) =>
      query.state.data?.status === 'pending_payment' ? 3000 : false,
  });

  const info = STATUS_INFO[booking?.status ?? 'pending_payment'];

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.emoji}>{info?.emoji ?? '⏳'}</Text>

        <Text variant="headlineSmall" style={[styles.title, { color: info?.color }]}>
          {booking?.status === 'confirmed'
            ? '¡Turno confirmado!'
            : booking?.status === 'failed'
            ? 'Pago rechazado'
            : 'Procesando pago...'}
        </Text>

        <Text variant="bodyMedium" style={styles.mensaje}>
          {info?.mensaje}
        </Text>

        {booking?.service && (
          <Card style={styles.card} mode="outlined">
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyMedium" style={styles.label}>Servicio</Text>
              <Text variant="bodyLarge" style={styles.value}>{booking.service.name}</Text>

              {booking.slot?.datetime && (
                <>
                  <Text variant="bodyMedium" style={[styles.label, { marginTop: 12 }]}>Fecha y hora</Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {new Date(booking.slot.datetime).toLocaleDateString('es-AR', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {new Date(booking.slot.datetime).toLocaleTimeString('es-AR', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </>
              )}
            </Card.Content>
          </Card>
        )}

      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => router.replace('/(user)/turnos')}
          style={styles.button}
          icon="calendar"
        >
          Ver mis turnos
        </Button>
        <Button
          mode="text"
          onPress={() => router.replace('/(user)/home')}
          style={styles.buttonSecondary}
        >
          Volver al inicio
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  mensaje: { color: '#555', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  card: { width: '100%', backgroundColor: '#fff' },
  cardContent: { gap: 4 },
  label: { color: '#888' },
  value: { fontWeight: '500' },
  actions: { padding: 24, gap: 8 },
  button: { paddingVertical: 4 },
  buttonSecondary: {},
});
