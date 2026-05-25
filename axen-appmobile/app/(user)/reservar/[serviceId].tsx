import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../../src/services/api';
import type { Service, Slot } from '../../../src/types';

export default function ReservarScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data } = await api.get<Service>(`/services/${serviceId}`);
      return data;
    },
  });

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', serviceId],
    queryFn: async () => {
      const { data } = await api.get<Slot[]>(`/slots?serviceId=${serviceId}&status=free`);
      return data;
    },
  });

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

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Elegí un horario
      </Text>

      {loadingSlots && <ActivityIndicator style={styles.loader} />}

      {!loadingSlots && slots?.length === 0 && (
        <Text style={styles.empty}>No hay turnos disponibles por ahora.</Text>
      )}

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Title
              title={new Date(item.datetime).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              subtitle={new Date(item.datetime).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
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
  sectionTitle: { fontWeight: '600', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  loader: { marginTop: 24 },
  empty: { color: '#888', textAlign: 'center', marginTop: 32 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#fff' },
});