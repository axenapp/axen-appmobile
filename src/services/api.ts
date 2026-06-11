import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Callback que AuthContext registra para manejar el logout global
let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(cb: () => void) {
  logoutCallback = cb;
}

const api = axios.create({
  // Android emulator usa 10.0.2.2 para acceder al localhost del host
  // iOS simulator y Expo Go en red local: cambiar a localhost o la IP de la máquina
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: agrega el token JWT en cada request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      logoutCallback?.();
    }
    return Promise.reject(error);
  },
);

export default api;
