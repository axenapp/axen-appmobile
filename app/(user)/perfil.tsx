import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { brandColors } from '../../src/theme';

// ── fila de menú ──────────────────────────────────────────
function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={item.row} onPress={onPress} activeOpacity={0.6}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={danger ? brandColors.accent : '#555'}
        style={item.icon}
      />
      <Text style={[item.label, danger && item.labelDanger]}>{label}</Text>
      {!danger && (
        <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );
}

const item = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  icon: { width: 28 },
  label: { flex: 1, fontSize: 15, color: '#222' },
  labelDanger: { color: brandColors.accent, fontWeight: '500' },
});

// ── pantalla ──────────────────────────────────────────────
export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const initial = (user?.name ?? 'U').charAt(0).toUpperCase();
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── AVATAR ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.cameraBtn}>
              <MaterialCommunityIcons name="camera" size={14} color="#fff" />
            </View>
          </View>
          <Text style={styles.greeting}>¡Hola, {firstName}!</Text>
        </View>

        {/* ── PERFIL ── */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Perfil</Text>
          <View style={styles.groupCard}>
            <MenuItem
              icon="account-outline"
              label="Información personal"
              onPress={() => router.push('/(user)/informacion-personal')}
            />
            <View style={styles.sep} />
            <MenuItem icon="map-marker-outline" label="Direcciones" />
            <View style={styles.sep} />
            <MenuItem
              icon="heart-outline"
              label="Favoritos"
              onPress={() => router.push('/(user)/favoritos')}
            />
          </View>
        </View>

        {/* ── ACTIVIDAD ── */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Actividad</Text>
          <View style={styles.groupCard}>
            <MenuItem
              icon="credit-card-outline"
              label="Medios de Pago"
              onPress={() => router.push('/(user)/medios-pago')}
            />
          </View>
        </View>

        {/* ── CONFIGURACIÓN ── */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Configuración</Text>
          <View style={styles.groupCard}>
            <MenuItem icon="bell-outline"        label="Notificaciones" />
            <View style={styles.sep} />
            <MenuItem icon="information-outline" label="Información Legal" />
            <View style={styles.sep} />
            <MenuItem
              icon="store-outline"
              label="Quiero registrar un negocio"
              onPress={() => Linking.openURL('http://localhost:5173/register-business')}
            />
          </View>
        </View>

        {/* ── AYUDA ── */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Ayuda</Text>
          <View style={styles.groupCard}>
            <MenuItem icon="headset" label="Soporte técnico" />
          </View>
        </View>

        {/* ── CERRAR SESIÓN ── */}
        <View style={styles.logoutGroup}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={20} color={brandColors.accent} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </>
  );
}

// ── estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  /* Avatar */
  avatarSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: brandColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  /* Grupos */
  group: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  sep: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 48,
  },

  /* Cerrar sesión */
  logoutGroup: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 15,
    color: brandColors.accent,
    fontWeight: '500',
  },
});
