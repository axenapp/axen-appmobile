import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import type { Booking } from '../../src/types';
import { brandColors } from '../../src/theme';

export default function TurnoConfirmadoScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get<Booking>(`/bookings/${bookingId}`);
      return data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'pending_payment' ? 3000 : false,
  });

  const isFailed  = booking?.status === 'failed';

  // pending_payment sin MercadoPago configurado = tratar como confirmado en local
  if (!booking) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.container}>
          <ActivityIndicator size="large" color={brandColors.secondary} />
          <Text style={styles.processingText}>Cargando...</Text>
        </View>
      </>
    );
  }

  // ── estado: fallido ──
  if (isFailed) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.container}>
          <View style={[styles.iconCircle, { backgroundColor: brandColors.accent }]}>
            <MaterialCommunityIcons name="close" size={56} color="#fff" />
          </View>
          <Text style={styles.title}>Pago no procesado</Text>
          <Text style={styles.subtitle}>
            No se pudo completar el pago.{'\n'}Podés intentar reservar de nuevo.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace('/(user)/home')}
          >
            <Text style={styles.btnText}>Volver a Inicio</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // ── estado: confirmado ──
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>

        {/* Círculo verde con check */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check" size={64} color="#fff" />
        </View>

        {/* Textos */}
        <Text style={styles.title}>¡Turno Confirmado!</Text>
        <Text style={styles.subtitle}>
          Gracias por usar nuestros servicios 😊
        </Text>

        {/* Botones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => router.replace('/(user)/turnos')}
          >
            <Text style={styles.btnText}>Ver Mis Turnos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => router.replace('/(user)/home')}
          >
            <Text style={styles.btnText}>Volver a Inicio</Text>
          </TouchableOpacity>
        </View>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  /* Círculo con ícono */
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2e7d32',       // verde confirmado
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  /* Textos */
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },

  /* Botones */
  actions: {
    width: '100%',
    gap: 14,
  },
  btn: {
    width: '100%',
    backgroundColor: brandColors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
