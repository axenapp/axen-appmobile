import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import type { AuthResponse } from '../../src/types';

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Completá los campos obligatorios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        phone: phone || undefined,
        password,
      });
      await login(data.token, data.user);
    } catch {
      setError('No se pudo crear la cuenta. Revisá los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={styles.title}>
          Crear cuenta
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Creá tu cuenta de usuario
        </Text>

        <TextInput
          label="Nombre completo *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Email *"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Contraseña *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Registrarme
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.link}
        >
          Ya tengo cuenta
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 32,
  },
  input: {
    marginBottom: 12,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  link: {
    marginTop: 8,
  },
});
