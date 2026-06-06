import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';
import type { Partner } from '../../src/types';
import { brandColors } from '../../src/theme';
import { useRouter } from 'expo-router';

export default function HomeScreen() {

  const router = useRouter();

  const { data: partners, isLoading, isError } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data } = await api.get<Partner[]>('/partners');
      return data;
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        ¿Qué servicio buscás?
      </Text>

      {isLoading && <ActivityIndicator style={styles.loader} />}

      {isError && (
        <Text style={styles.error}>No se pudieron cargar los negocios.</Text>
      )}

      <FlatList
        data={partners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card                                     // ← un solo Card con onPress
            style={styles.card}
            mode="outlined"
            onPress={() => router.push(`/(user)/negocio/${item.id}`)}
          >
            <Card.Title title={item.name} subtitle={item.address ?? 'Sin dirección'} />
            {item.description ? (
              <Card.Content>
                <Text variant="bodySmall" style={styles.description}>
                  {item.description}
                </Text>
              </Card.Content>
            ) : null}
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: brandColors.secondary,
  },
  description: {
    color: '#555',
  },
});
