import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import type { AuthResponse } from '../../src/types';
import { brandColors, darkInputTheme } from '../../src/theme';
import { AxenLogo } from '../../src/components/AxenLogo';

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Completá los campos obligatorios');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        name: `${firstName.trim()} ${lastName.trim()}`,
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

          {/* Nombre(s) */}
          <Text style={styles.label}>Nombre(s)</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            mode="outlined"
            textColor="#ffffff"
            outlineColor="rgba(101, 154, 186, 0.5)"
            activeOutlineColor={brandColors.secondary}
            theme={darkInputTheme}
            style={styles.input}
          />

          {/* Apellido(s) */}
          <Text style={styles.label}>Apellido(s)</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            mode="outlined"
            textColor="#ffffff"
            outlineColor="rgba(101, 154, 186, 0.5)"
            activeOutlineColor={brandColors.secondary}
            theme={darkInputTheme}
            style={styles.input}
          />

          {/* Correo */}
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

          {/* Teléfono */}
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            textColor="#ffffff"
            outlineColor="rgba(101, 154, 186, 0.5)"
            activeOutlineColor={brandColors.secondary}
            theme={darkInputTheme}
            style={styles.input}
          />

          {/* Contraseña */}
          <Text style={styles.label}>Contraseña</Text>
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

          {/* Repetir contraseña */}
          <Text style={styles.label}>Repetir contraseña</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
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

          {/* Botón crear cuenta */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.btnPrimary}
            contentStyle={styles.btnContent}
            labelStyle={styles.btnLabel}
          >
            Crear cuenta
          </Button>

          {/* Link volver al login */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>Ya tengo una cuenta</Text>
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
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 36,
  },
  logoWrapper: {
    marginBottom: 28,
  },
  label: {
    alignSelf: 'flex-start',
    color: brandColors.cream,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    marginBottom: 14,
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
  loginLink: {
    marginTop: 20,
  },
  loginLinkText: {
    color: brandColors.cream,
    fontSize: 14,
    fontWeight: '500',
  },
});
