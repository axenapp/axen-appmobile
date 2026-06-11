import { View, StyleSheet } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';

export default function ConfiguracionScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Configuración
      </Text>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.label}>
          Cuenta
        </Text>
        <Text variant="bodyMedium">{user?.name}</Text>
        <Text variant="bodySmall" style={styles.email}>
          {user?.email}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.actions}>
        <Button
          mode="outlined"
          icon="logout"
          onPress={logout}
          style={styles.logoutButton}
          textColor="#d32f2f"
        >
          Cerrar sesión
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  title: { fontWeight: 'bold', margin: 16 },
  divider: { marginHorizontal: 16 },
  section: { padding: 16, gap: 4 },
  label: { color: '#888', marginBottom: 4 },
  email: { color: '#888' },
  actions: { padding: 16, marginTop: 'auto' },
  logoutButton: { borderColor: '#d32f2f' },
});
