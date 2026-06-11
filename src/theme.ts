import { MD3LightTheme } from 'react-native-paper';

// Paleta del brand (misma que axen-appweb global.css)
export const brandColors = {
  primary: '#023048',    // azul marino — fondos oscuros, headers
  secondary: '#659aba',  // azul medio — bordes, acentos
  accent: '#c1111e',     // rojo — botones principales, CTAs
  cream: '#ffeed4',      // texto sobre fondos oscuros
  cardBg: 'rgba(2, 48, 72, 0.88)',
  background: '#f5f7fa', // fondo claro para contenido
};

// Tema global para react-native-paper
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.accent,      // botones contained → rojo
    onPrimary: '#ffffff',
    secondary: brandColors.secondary, // acentos → azul medio
    onSecondary: '#ffffff',
    surface: '#ffffff',
  },
};

// Override de colores para TextInput sobre fondo oscuro (pantallas auth)
export const darkInputTheme = {
  colors: {
    primary: brandColors.secondary,        // outline + label cuando está activo → azul
    onSurfaceVariant: brandColors.cream,   // label cuando está inactivo → crema
  },
};
