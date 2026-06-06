# Axen App Móvil

Aplicación móvil de la plataforma Axen. Permite a los usuarios buscar negocios y reservar turnos, y a los partners gestionar su agenda y servicios desde el celular.

## Stack

| | |
|---|---|
| **Framework** | React Native + Expo SDK 56 + TypeScript |
| **Routing** | Expo Router v4 (file-based) |
| **UI** | React Native Paper (MD3) |
| **HTTP** | Axios con interceptores JWT |
| **Estado servidor** | TanStack React Query |
| **Almacenamiento seguro** | expo-secure-store (reemplaza sessionStorage) |
| **Pagos** | expo-web-browser + MercadoPago |
| **Iconos** | @expo/vector-icons (MaterialCommunityIcons) |

## Requisitos

- Node.js v18 o superior
- npm v9 o superior
- Backend Axen corriendo en `http://localhost:3000`

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/axenapp/axen-appmobile.git
cd axen-appmobile

# 2. Instalar dependencias
npm install

# 3. Levantar la app
npx expo start
```

Al iniciar, presionar **W** para abrir en el navegador (modo web).

> El archivo `.npmrc` ya tiene `legacy-peer-deps=true` configurado — no hace falta ningún flag extra al instalar.

## Variables de entorno

La URL del backend se configura con una variable de entorno. Crear un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1
```

| URL | Cuándo usarla |
|-----|--------------|
| `http://10.0.2.2:3000/api/v1` | Emulador Android |
| `http://localhost:3000/api/v1` | Modo web (navegador) |
| `https://tu-backend.onrender.com/api/v1` | Producción |

Si no existe el `.env`, la app usa `http://10.0.2.2:3000/api/v1` como fallback.

## Paleta de colores

Misma paleta que el panel web para coherencia visual entre plataformas.

| Variable | Color | Uso |
|----------|-------|-----|
| `primary` | `#023048` | Fondo auth, headers |
| `secondary` | `#659aba` | Bordes, acentos, inputs activos |
| `accent` | `#c1111e` | Botones principales, tabs activos |
| `cream` | `#ffeed4` | Texto sobre fondos oscuros |

El tema se aplica globalmente en `src/theme.ts` y se pasa al `PaperProvider` en `app/_layout.tsx`.

## Estructura del proyecto

```
app/
├── _layout.tsx              # Root layout: QueryClient + Auth + PaperProvider
├── index.tsx                # Redirect según autenticación
├── (auth)/
│   ├── login.tsx            # Pantalla de login (fondo oscuro brand)
│   └── register.tsx         # Pantalla de registro
├── (user)/
│   ├── _layout.tsx          # Tabs: Inicio / Mis turnos / Perfil
│   ├── home.tsx             # Lista de negocios activos
│   ├── negocio/[id].tsx     # Detalle del negocio + servicios
│   ├── reservar/[serviceId].tsx  # Selector de fecha y horario
│   ├── confirmar.tsx        # Confirmación + inicio de pago
│   ├── turno-confirmado.tsx # Polling de estado del turno
│   ├── turnos.tsx           # Historial de turnos del usuario
│   ├── resena/[bookingId].tsx    # Dejar reseña (1-5 estrellas)
│   └── perfil.tsx           # Perfil del usuario
└── (partner)/
    ├── _layout.tsx          # Tabs: Dashboard / Turnos / Servicios / Horarios / Config
    ├── dashboard.tsx        # Métricas del negocio
    ├── turnos.tsx           # Lista de reservas del día
    ├── turno/[id].tsx       # Detalle + marcar como completado
    ├── servicios.tsx        # Gestión de servicios
    ├── servicios/nuevo.tsx  # Crear nuevo servicio
    ├── slots.tsx            # Agenda: crear y bloquear horarios
    └── configuracion.tsx    # Configuración del negocio

src/
├── context/
│   └── AuthContext.tsx      # Sesión con SecureStore + logoutCallback
├── services/
│   └── api.ts               # Axios + interceptores JWT + 401 handler
├── types/
│   └── index.ts             # Interfaces TypeScript (User, Partner, Slot, Booking…)
└── theme.ts                 # Colores del brand + tema react-native-paper
```

## Progreso del desarrollo

### ✅ Completado

**Configuración base**
- Expo Router con grupos de rutas `(auth)`, `(user)`, `(partner)`
- AuthContext con SecureStore (token + usuario persistidos entre sesiones)
- Axios con interceptor JWT y logoutCallback automático en 401
- Tema global de react-native-paper con paleta del brand
- Pantallas de auth con fondo oscuro navy, inputs con borde azul, botones rojos

**Flujo de usuario**
- Home con lista de negocios activos
- Detalle del negocio con servicios disponibles
- Selector de turnos con navegación por fecha (día anterior / siguiente)
- Confirmación de turno e inicio de pago vía MercadoPago
- Pantalla de turno confirmado con polling automático de estado
- Historial de mis turnos con estado en tiempo real
- Dejar reseña con selector de estrellas (1-5)

**Flujo de partner**
- Dashboard con métricas del negocio
- Lista de reservas del día con detalle
- Marcar turno como completado
- Gestión de servicios (listar y crear)
- Agenda de horarios: crear slots en bulk y bloquear días

### ⚠️ Notas del entorno de pruebas

**Pago completo**
El flujo de pago abre MercadoPago sandbox correctamente, pero la confirmación automática depende del webhook. En local, MercadoPago no puede llamar a `localhost:3000`, por lo que el turno queda en estado `pending_payment` tras el pago. Para probarlo completamente se necesita ngrok en el backend (ver README del backend). En producción con URL pública esto funciona automáticamente.

**Modo de ejecución recomendado**
Usar modo web (`npx expo start` → presionar **W**) para desarrollo y pruebas. La app está adaptada para funcionar tanto en web como en dispositivo nativo.

### 📋 Pendiente

- Módulo de favoritos
- EAS Build para generar APK / AAB (Play Store)
- `scheme` en `app.json` para deep links de MercadoPago en builds nativos
- Variables de entorno para producción (`EXPO_PUBLIC_API_URL`)

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Partner (seed) | `partner@axen.demo` | `Demo1234` |
| Usuario | Registrarse desde la app | mín. 8 caracteres, 1 mayúscula, 1 número |

> El seed debe correrse desde el backend antes de usar la app (`npm run seed`).

## Equipo

**Flor Gomez Pacheco** — Backend · Panel web  
**Franco Chiquilito** — Backend · App móvil
