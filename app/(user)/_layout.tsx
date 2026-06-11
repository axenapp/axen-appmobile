import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { brandColors } from '../../src/theme';

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brandColors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          backgroundColor: brandColors.primary,
          borderTopColor: 'rgba(101,154,186,0.2)',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {/* ── Tabs visibles ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="turnos"
        options={{
          title: 'Mis Turnos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={size} />
          ),
        }}
      />

      {/* ── Pantallas y rutas ocultas del tab bar ── */}
      <Tabs.Screen name="catalogo"             options={{ href: null }} />
      <Tabs.Screen name="confirmar"            options={{ href: null }} />
      <Tabs.Screen name="turno-confirmado"     options={{ href: null }} />
      <Tabs.Screen name="informacion-personal" options={{ href: null }} />
      <Tabs.Screen name="negocio/[id]"              options={{ href: null }} />
      <Tabs.Screen name="perfil-negocio/[id]"       options={{ href: null }} />
      <Tabs.Screen name="resena/[bookingId]"         options={{ href: null }} />
      <Tabs.Screen name="reservar/[serviceId]"       options={{ href: null }} />
    </Tabs>
  );
}
