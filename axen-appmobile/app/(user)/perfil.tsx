import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={72}
          label={user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
          style={styles.avatar}
        />
        <Text variant="titleLarge" style={styles.name}>
          {user?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.info}>
        {user?.phone && (
          <Text variant="bodyMedium" style={styles.infoText}>
            📞 {user.phone}
          </Text>
        )}
        <Text variant="bodySmall" style={styles.infoText}>
          Cuenta creada el{' '}
          {new Date(user?.createdAt ?? '').toLocaleDateString('es-AR', { dateStyle: 'long' })}
        </Text>
      </View>

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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 56,
  },
  header: {
    alignItems: 'center',
    padding: 32,
  },
  avatar: {
    backgroundColor: '#1976D2',
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
  },
  email: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginHorizontal: 16,
  },
  info: {
    padding: 24,
    gap: 8,
  },
  infoText: {
    color: '#555',
  },
  actions: {
    padding: 24,
    marginTop: 'auto',
  },
  logoutButton: {
    borderColor: '#d32f2f',
  },
});
