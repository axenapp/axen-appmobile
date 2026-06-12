import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { brandColors } from '../../src/theme';

const STORAGE_KEY = 'payment_methods';

type PaymentType = 'credito' | 'debito' | 'mercadopago';

interface PaymentMethod {
  id: string;
  type: PaymentType;
  label: string;   // "Visa ****1234" / "mi@email.com"
  preferred: boolean;
}

const TYPE_INFO: Record<PaymentType, { label: string; icon: string; color: string }> = {
  credito:     { label: 'Crédito',    icon: 'credit-card-outline',    color: '#1976d2' },
  debito:      { label: 'Débito',     icon: 'credit-card-chip-outline', color: '#2e7d32' },
  mercadopago: { label: 'MercadoPago', icon: 'alpha-m-circle-outline', color: '#009ee3' },
};

// ── modal para agregar ────────────────────────────────────
function AddModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (method: Omit<PaymentMethod, 'id' | 'preferred'>) => void;
}) {
  const [type,    setType]    = useState<PaymentType>('credito');
  const [holder,  setHolder]  = useState('');
  const [number,  setNumber]  = useState('');
  const [expiry,  setExpiry]  = useState('');
  const [cvv,     setCvv]     = useState('');
  const [email,   setEmail]   = useState('');

  const reset = () => {
    setType('credito'); setHolder(''); setNumber('');
    setExpiry(''); setCvv(''); setEmail('');
  };

  const formatNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
    return clean;
  };

  const handleAdd = () => {
    if (type === 'mercadopago') {
      if (!email.trim()) { Alert.alert('', 'Ingresá el email de MercadoPago'); return; }
      onAdd({ type, label: email.trim() });
    } else {
      if (!holder.trim())   { Alert.alert('', 'Ingresá el nombre del titular'); return; }
      const digits = number.replace(/\s/g, '');
      if (digits.length < 16) { Alert.alert('', 'Ingresá el número completo de la tarjeta'); return; }
      if (expiry.length < 5)  { Alert.alert('', 'Ingresá la fecha de vencimiento (MM/AA)'); return; }
      if (cvv.length < 3)     { Alert.alert('', 'Ingresá el CVV'); return; }
      onAdd({ type, label: `${holder.trim()} ****${digits.slice(-4)}` });
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={m.overlay} onPress={onClose} activeOpacity={1}>
        <View style={m.sheet}>
          <Text style={m.title}>Agregar método de pago</Text>

          {/* Tipo */}
          <Text style={m.label}>Tipo</Text>
          <View style={m.typeRow}>
            {(['credito', 'debito', 'mercadopago'] as PaymentType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[m.typeBtn, type === t && m.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <MaterialCommunityIcons
                  name={TYPE_INFO[t].icon as any}
                  size={18}
                  color={type === t ? '#fff' : '#555'}
                />
                <Text style={[m.typeBtnText, type === t && m.typeBtnTextActive]}>
                  {TYPE_INFO[t].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos según tipo */}
          {type === 'mercadopago' ? (
            <>
              <Text style={m.label}>Email de MercadoPago</Text>
              <RNTextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#bbb"
                keyboardType="email-address"
                autoCapitalize="none"
                style={m.input}
              />
            </>
          ) : (
            <>
              <Text style={m.label}>Nombre y apellido</Text>
              <RNTextInput
                value={holder}
                onChangeText={setHolder}
                placeholder="Como figura en la tarjeta"
                placeholderTextColor="#bbb"
                autoCapitalize="words"
                style={m.input}
              />
              <Text style={m.label}>Número de tarjeta</Text>
              <RNTextInput
                value={number}
                onChangeText={(v) => setNumber(formatNumber(v))}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#bbb"
                keyboardType="number-pad"
                maxLength={19}
                style={m.input}
              />
              <View style={m.row}>
                <View style={{ flex: 1 }}>
                  <Text style={m.label}>Vencimiento</Text>
                  <RNTextInput
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    placeholder="MM/AA"
                    placeholderTextColor="#bbb"
                    keyboardType="number-pad"
                    maxLength={5}
                    style={m.input}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={m.label}>CVV</Text>
                  <RNTextInput
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="123"
                    placeholderTextColor="#bbb"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    style={m.input}
                  />
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={m.addBtn} onPress={handleAdd} activeOpacity={0.85}>
            <Text style={m.addBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  typeBtnActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  typeBtnTextActive: { color: '#fff' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addBtn: {
    backgroundColor: brandColors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

// ── pantalla principal ────────────────────────────────────
export default function MediosPagoScreen() {
  const router = useRouter();
  const [methods,    setMethods]    = useState<PaymentMethod[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((raw) => {
      if (raw) setMethods(JSON.parse(raw));
      setLoading(false);
    });
  }, []);

  const save = async (updated: PaymentMethod[]) => {
    setMethods(updated);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = (method: Omit<PaymentMethod, 'id' | 'preferred'>) => {
    const isFirst = methods.length === 0;
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      preferred: isFirst,
    };
    save([...methods, newMethod]);
  };

  const handleSetPreferred = (id: string) => {
    save(methods.map((m) => ({ ...m, preferred: m.id === id })));
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar método', '¿Querés eliminar este método de pago?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const updated = methods.filter((m) => m.id !== id);
          // Si se eliminó el preferido, el primero pasa a serlo
          if (updated.length > 0 && !updated.some((m) => m.preferred)) {
            updated[0].preferred = true;
          }
          save(updated);
        },
      },
    ]);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      <View style={styles.container}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medios de Pago</Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={brandColors.secondary} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── LISTA ── */}
            {methods.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="credit-card-off-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No tenés métodos de pago guardados.</Text>
                <Text style={styles.emptySubText}>Agregá uno para agilizar tus reservas.</Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mis métodos guardados</Text>
                {methods.map((method) => {
                  const info = TYPE_INFO[method.type];
                  return (
                    <View key={method.id} style={styles.card}>
                      <View style={[styles.cardIcon, { backgroundColor: info.color + '18' }]}>
                        <MaterialCommunityIcons name={info.icon as any} size={24} color={info.color} />
                      </View>

                      <View style={styles.cardInfo}>
                        <Text style={styles.cardLabel}>{method.label}</Text>
                        <Text style={styles.cardType}>{info.label}</Text>
                      </View>

                      {/* Radio preferido */}
                      <TouchableOpacity
                        style={styles.radioBtn}
                        onPress={() => handleSetPreferred(method.id)}
                      >
                        <MaterialCommunityIcons
                          name={method.preferred ? 'radiobox-marked' : 'radiobox-blank'}
                          size={22}
                          color={method.preferred ? brandColors.secondary : '#ccc'}
                        />
                      </TouchableOpacity>

                      {/* Eliminar */}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(method.id)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#e57373" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <Text style={styles.hint}>
                  Tocá el círculo para marcar tu método preferido.
                </Text>
              </View>
            )}

            {/* ── AGREGAR ── */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowModal(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Agregar método de pago</Text>
            </TouchableOpacity>

          </ScrollView>
        )}
      </View>

      <AddModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },

  header: {
    backgroundColor: brandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 2 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 40 },

  emptyBox: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
    gap: 8,
  },
  emptyText: { fontSize: 15, color: '#999', fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#bbb', textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  cardType: { fontSize: 12, color: '#888', marginTop: 2 },
  radioBtn: { padding: 4 },
  deleteBtn: { padding: 4 },

  hint: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: brandColors.primary,
    borderRadius: 12,
    paddingVertical: 15,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
