import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../src/services/api';

export default function NuevoServicioScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/services', {
        name,
        description: description.trim() || undefined,
        durationMinutes: Number(duration),
        price: Number(price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-services'] });
      router.back();
    },
    onError: () => {
      setError('No se pudo crear el servicio. Revisá los datos.');
    },
  });

  const handleGuardar = () => {
    if (!name || !duration || !price) {
      setError('Completá los campos obligatorios');
      return;
    }
    if (isNaN(Number(duration)) || Number(duration) <= 0) {
      setError('La duración debe ser un número mayor a 0');
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      setError('El precio debe ser un número mayor a 0');
      return;
    }
    setError('');
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Button icon="arrow-left" onPress={() => router.back()} style={styles.back}>
          Volver
        </Button>

        <Text variant="headlineSmall" style={styles.title}>Nuevo servicio</Text>

        <TextInput
          label="Nombre *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          maxLength={150}
        />

        <TextInput
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
        />

        <TextInput
          label="Duración (minutos) *"
          value={duration}
          onChangeText={setDuration}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
        />

        <TextInput
          label="Precio ($) *"
          value={price}
          onChangeText={setPrice}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleGuardar}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          style={styles.button}
          icon="content-save"
        >
          Guardar servicio
        </Button>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 32 },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  title: { fontWeight: 'bold', marginBottom: 24 },
  input: { marginBottom: 14, backgroundColor: '#fff' },
  error: { color: '#d32f2f', marginBottom: 12 },
  button: { paddingVertical: 4, marginTop: 8 },
});