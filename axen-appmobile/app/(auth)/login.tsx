import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import type { AuthResponse } from '../../src/types';
import { brandColors, darkInputTheme } from '../../src/theme';

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
    <>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>

          <Text style={styles.logo}>axen</Text>
          <Text style={styles.tagline}>Iniciá sesión para continuar</Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            textColor="#ffffff"
            outlineColor="rgba(101, 154, 186, 0.4)"
            activeOutlineColor={brandColors.secondary}
            theme={darkInputTheme}
            style={styles.input}
          />

          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            textColor="#ffffff"
            outlineColor="rgba(101, 154, 186, 0.4)"
            activeOutlineColor={brandColors.secondary}
            theme={darkInputTheme}
            style={styles.input}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Ingresar
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/(auth)/register')}
            style={styles.link}
            textColor={brandColors.cream}
          >
            ¿No tenés cuenta? Registrate
          </Button>

        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.primary,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: brandColors.cream,
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 238, 212, 0.7)',
    marginBottom: 36,
  },
  input: {
    marginBottom: 14,
    backgroundColor: 'rgba(101, 154, 186, 0.1)',
  },
  errorBox: {
    backgroundColor: 'rgba(193, 17, 30, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(193, 17, 30, 0.4)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff6b75',
    fontSize: 13,
  },
  button: {
    marginTop: 4,
    borderRadius: 6,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  link: {
    marginTop: 8,
  },
});
