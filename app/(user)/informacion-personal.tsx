import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { brandColors } from '../../src/theme';

// ── campo de formulario reutilizable ──────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secure,
  showToggle,
  onToggle,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secure?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
}) {
  return (
    <View style={field.wrapper}>
      {label ? <Text style={field.label}>{label}</Text> : null}
      <View style={field.inputRow}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          keyboardType={keyboardType ?? 'default'}
          secureTextEntry={secure}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          style={field.input}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={field.eyeBtn}>
            <MaterialCommunityIcons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#aaa"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const field = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, color: '#333', fontWeight: '500', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#222',
  },
  eyeBtn: { paddingLeft: 8 },
});

// ── pantalla ──────────────────────────────────────────────
export default function InformacionPersonalScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  // Separa nombre y apellido del campo `name`
  const parts    = (user?.name ?? '').split(' ');
  const firstDef = parts[0] ?? '';
  const lastDef  = parts.slice(1).join(' ') ?? '';

  const [firstName, setFirstName] = useState(firstDef);
  const [lastName,  setLastName]  = useState(lastDef);
  const [nickname,  setNickname]  = useState('');
  const [email,     setEmail]     = useState(user?.email ?? '');
  const [phone,     setPhone]     = useState(user?.phone ?? '');
  const [birthdate, setBirthdate] = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleGuardar = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, string> = {
        name:  `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      if (password) body.password = password;

      const { data } = await api.patch('/users/me', body);
      await updateUser(data);
      Alert.alert('¡Listo!', 'Tus datos fueron actualizados.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Información personal</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* ── FORMULARIO ── */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field
            label="Nombre(s)"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Field
            label="Apellido(s)"
            value={lastName}
            onChangeText={setLastName}
          />
          <Field
            value={nickname}
            onChangeText={setNickname}
            placeholder="Apodo (opcional)"
          />
          <Field
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Field
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field
            label="Fecha de Nacimiento"
            value={birthdate}
            onChangeText={setBirthdate}
            placeholder="DD/MM/AAAA"
            keyboardType="numbers-and-punctuation"
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Nueva contraseña (opcional)"
            secure={!showPwd}
            showToggle
            onToggle={() => setShowPwd(v => !v)}
          />

          {/* ── BOTÓN ── */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleGuardar}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Guardar datos</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

// ── estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: brandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  saveBtn: {
    backgroundColor: brandColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
