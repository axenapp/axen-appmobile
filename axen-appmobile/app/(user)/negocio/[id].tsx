import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../../src/services/api';
import type { Partner, Service } from '../../../src/types';

export default function NegocioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const { data } = await api.get<Partner>(`/partners/${id}`);
      return data;
    },
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['services', id],
    queryFn: async () => {
      const { data } = await api.get<Service[]>(`/services?partnerId=${id}`);
      return data;
    },
  });

  if (loadingPartner) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Botón volver */}
      <Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>
        Volver
      </Button>

      {/* Info del negocio */}
      <Text variant="headlineMedium" style={styles.name}>{partner?.name}</Text>
      {partner?.description && (
        <Text variant="bodyMedium" style={styles.description}>{partner.description}</Text>
      )}
      {partner?.address && (
        <Text variant="bodySmall" style={styles.address}>📍 {partner.address}</Text>
      )}

      <Divider style={styles.divider} />

      {/* Lista de servicios */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Servicios</Text>

      {loadingServices && <ActivityIndicator style={styles.loader} />}

      {services?.filter(s => s.isActive).map(service => (
        <Card key={service.id} style={styles.card} mode="outlined">
          <Card.Title
            title={service.name}
            subtitle={`${service.durationMinutes} min — $${service.price}`}
          />
          {service.description && (
            <Card.Content>
              <Text variant="bodySmall" style={styles.serviceDesc}>
                {service.description}
              </Text>
            </Card.Content>
          )}
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => router.push(`/(user)/reservar/${service.id}`)}
            >
              Reservar
            </Button>
          </Card.Actions>
        </Card>
      ))}

      {!loadingServices && services?.filter(s => s.isActive).length === 0 && (
        <Text style={styles.empty}>Este negocio no tiene servicios disponibles.</Text>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  name: { fontWeight: 'bold', marginBottom: 8 },
  description: { color: '#555', marginBottom: 8 },
  address: { color: '#888', marginBottom: 4 },
  divider: { marginVertical: 20 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  loader: { marginTop: 16 },
  card: { backgroundColor: '#fff', marginBottom: 12 },
  serviceDesc: { color: '#555' },
  empty: { color: '#888', textAlign: 'center', marginTop: 24 },
});