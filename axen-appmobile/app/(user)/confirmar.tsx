import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import api from '../../src/services/api';
import type { Service, Slot } from '../../src/types';

export default function ConfirmarScreen() {
  const { slotId, serviceId } = useLocalSearchParams<{ slotId: string; serviceId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data } = await api.get<Service>(`/services/${serviceId}`);
      return data;
    },
  });

  const { data: slot, isLoading: loadingSlot } = useQuery({
    queryKey: ['slot', slotId],
    queryFn: async () => {
      const { data } = await api.get<Slot>(`/slots/${slotId}`);
      return data;
    },
  });

  const handleConfirmar = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Crear el booking
      const { data: booking } = await api.post('/bookings', { slotId, serviceId });

      // 2. Crear la preferencia de pago
      const { data: payment } = await api.post('/payments/preference', {
        bookingId: booking.id,
      });

      // 3. Abrir MercadoPago en el browser (sandbox para testing)
      await WebBrowser.openBrowserAsync(payment.sandboxInitPoint);

      // 4. Al volver del browser, ir a la pantalla de confirmación
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

  if (loadingService || loadingSlot) {
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

      <Text variant="headlineSmall" style={styles.title}>Confirmá tu turno</Text>

      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.cardContent}>

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Servicio</Text>
            <Text variant="bodyMedium" style={styles.value}>{service?.name}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Duración</Text>
            <Text variant="bodyMedium" style={styles.value}>{service?.durationMinutes} min</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Fecha</Text>
            <Text variant="bodyMedium" style={styles.value}>
              {slot?.datetime
                ? new Date(slot.datetime).toLocaleDateString('es-AR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })
                : '-'}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Horario</Text>
            <Text variant="bodyMedium" style={styles.value}>
              {slot?.datetime
                ? new Date(slot.datetime).toLocaleTimeString('es-AR', {
                    hour: '2-digit', minute: '2-digit',
                  })
                : '-'}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text variant="titleMedium" style={styles.label}>Total</Text>
            <Text variant="titleMedium" style={styles.price}>${service?.price}</Text>
          </View>

        </Card.Content>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleConfirmar}
        loading={loading}
        disabled={loading}
        style={styles.button}
        icon="credit-card"
      >
        Confirmar y pagar
      </Button>

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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { color: '#555' },
  value: { fontWeight: '500' },
  price: { fontWeight: 'bold', color: '#1976D2' },
  divider: {},
  error: { color: '#d32f2f', textAlign: 'center', marginBottom: 16 },
  button: { paddingVertical: 4 },
});