import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import type { AuthResponse } from '../../src/types';
import { brandColors, darkInputTheme } from '../../src/theme';
import { AxenLogo } from '../../src/components/AxenLogo';

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
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <AxenLogo size={88} />
          </View>

          {/* Título */}
          <Text style={styles.title}>Bienvenid@</Text>

          {/* Email */}
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            textColor="#ffffff"
            outlineColor="rgba(101, 154, 186, 0.5)"
            activeOutlineColor={brandColors.secondary}
            theme={darkInputTheme}
            style={styles.input}
          />

          {/* Contraseña */}
          <View style={styles.passwordRow}>
            <Text style={styles.label}>Contraseña</Text>
            <TouchableOpacity>
              <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            textColor="#ffffff"
            outlineColor="rgba(101, 154, 186, 0.5)"
            activeOutlineColor={brandColors.secondary}
            theme={darkInputTheme}
            style={styles.input}
          />

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Botón ingresar */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.btnPrimary}
            contentStyle={styles.btnContent}
            labelStyle={styles.btnLabel}
          >
            Ingresar
          </Button>

          {/* Social */}
          <Text style={styles.orText}>o ingresá con:</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, styles.facebookBtn]}>
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, styles.googleBtn]}>
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Crear cuenta */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            style={styles.createAccountBtn}
          >
            <Text style={styles.createAccountText}>Crear Cuenta</Text>
          </TouchableOpacity>

          {/* Registrar negocio */}
          <TouchableOpacity style={styles.registerBizBtn}>
            <Text style={styles.registerBizText}>Quiero registrar un negocio</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.primary,
  },
  logoWrapper: {
    marginBottom: 24,
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 28,
  },
  label: {
    alignSelf: 'flex-start',
    color: brandColors.cream,
    fontSize: 13,
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  forgotLink: {
    color: 'rgba(255, 238, 212, 0.6)',
    fontSize: 12,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'rgba(101, 154, 186, 0.1)',
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(193, 17, 30, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(193, 17, 30, 0.4)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff6b75',
    fontSize: 13,
  },
  btnPrimary: {
    width: '100%',
    borderRadius: 8,
    marginTop: 4,
  },
  btnContent: {
    paddingVertical: 4,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  orText: {
    color: 'rgba(255, 238, 212, 0.6)',
    fontSize: 13,
    marginVertical: 20,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  socialBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  facebookBtn: {
    backgroundColor: '#3b5998',
  },
  googleBtn: {
    backgroundColor: brandColors.accent,
  },
  socialBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  createAccountBtn: {
    marginBottom: 16,
  },
  createAccountText: {
    color: brandColors.cream,
    fontSize: 14,
    fontWeight: '500',
  },
  registerBizBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brandColors.secondary,
    alignItems: 'center',
  },
  registerBizText: {
    color: brandColors.cream,
    fontSize: 14,
  },
});
