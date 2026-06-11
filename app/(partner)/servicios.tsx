import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';
import type { Service } from '../../src/types';

import { useRouter } from 'expo-router';

export default function ServiciosScreen() {

  const router = useRouter();

    // Primero traemos el perfil del partner para obtener su id
  const { data: partner } = useQuery({
    queryKey: ['partner-me'],
    queryFn: async () => {
      const { data } = await api.get('/partners/me');
      return data;
    },
  });
  

  // Después traemos los servicios usando ese id
  const { data: services, isLoading, isError } = useQuery({
    queryKey: ['partner-services', partner?.id],
    queryFn: async () => {
      const { data } = await api.get<Service[]>(`/services/partner/${partner!.id}`);
      return data;
    },
    enabled: !!partner?.id,
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Mis servicios
      </Text>

      {isLoading && <ActivityIndicator style={styles.loader} />}
      {isError && <Text style={styles.error}>No se pudieron cargar los servicios.</Text>}
      {!isLoading && services?.length === 0 && (
        <Text style={styles.empty}>No tenés servicios creados todavía.</Text>
      )}

<Button
  mode="contained"
  icon="plus"
  onPress={() => router.push('/(partner)/servicios/nuevo')}
  style={{ margin: 16 }}
>
  Agregar servicio
</Button>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Title
              title={item.name}
              subtitle={`${item.durationMinutes} min — $${item.price}`}
            />
            {item.description && (
              <Card.Content>
                <Text variant="bodySmall" style={styles.description}>
                  {item.description}
                </Text>
              </Card.Content>
            )}
            <Card.Content style={styles.chipRow}>
              <Chip
                style={item.isActive ? styles.activeChip : styles.inactiveChip}
                textStyle={{ color: item.isActive ? '#2E7D32' : '#666' }}
              >
                {item.isActive ? 'Activo' : 'Inactivo'}
              </Chip>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  title: { fontWeight: 'bold', marginHorizontal: 16, marginBottom: 16 },
  loader: { marginTop: 32 },
  error: { color: '#d32f2f', textAlign: 'center', marginTop: 32 },
  empty: { color: '#888', textAlign: 'center', marginTop: 48 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  card: { backgroundColor: '#fff' },
  description: { color: '#555', marginBottom: 8 },
  chipRow: { paddingTop: 4 },
  activeChip: { backgroundColor: '#E8F5E9', alignSelf: 'flex-start', height: 28 },
  inactiveChip: { backgroundColor: '#F5F5F5', alignSelf: 'flex-start', height: 28 },
});
