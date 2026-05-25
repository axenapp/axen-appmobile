import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import type { AuthResponse } from '../../src/types';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      await login(data.token, data.user);
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text variant="headlineMedium" style={styles.title}>
          Axen
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Iniciá sesión para continuar
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Ingresar
        </Button>

        <Button
          mode="text"
          onPress={() => router.push('/(auth)/register')}
          style={styles.link}
        >
          ¿No tenés cuenta? Registrate
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
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
