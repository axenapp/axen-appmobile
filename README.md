# Axen App Móvil

Aplicación móvil de la plataforma Axen. Permite a los usuarios buscar negocios, reservar turnos y gestionar sus citas. Los partners pueden administrar su agenda, servicios y turnos desde el celular.

## Stack

| | |
|---|---|
| **Framework** | React Native + Expo SDK 56 + TypeScript |
| **Routing** | Expo Router v4 (file-based) |
| **UI** | React Native Paper (tema personalizado con paleta Axen) |
| **HTTP** | Axios con interceptores JWT |
| **Estado servidor** | TanStack React Query |
| **Almacenamiento seguro** | expo-secure-store (reemplaza sessionStorage) |
| **Pagos** | expo-web-browser + MercadoPago sandbox |
| **Iconos** | @expo/vector-icons (MaterialCommunityIcons) |

## Requisitos

- Node.js v18 o superior
- npm v9 o superior
- Backend Axen corriendo en `http://localhost:3000`
- Expo Go (para dispositivo físico) **o** navegador web (modo web)

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/axenapp/axen-appmobile.git
cd axen-appmobile

# 2. Instalar dependencias
npm install

# 3. Configurar la URL del backend (opcional — ver Variables de entorno)

# 4. Levantar la app
npx expo start
```

Una vez iniciado, presioná:
- **`w`** para abrir en el navegador (recomendado para pruebas rápidas)
- **`a`** para Android (requiere emulador o dispositivo)
- **`i`** para iOS (requiere macOS + Xcode)

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# URL base del backend
# Navegador web:         http://localhost:3000/api/v1
# Emulador Android:      http://10.0.2.2:3000/api/v1
# Dispositivo físico:    http://<IP_DE_TU_PC>:3000/api/v1
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1
```

> Si no existe el archivo `.env`, la app usa `http://10.0.2.2:3000/api/v1` como fallback. Para correr en web local, crear el `.env` con `http://localhost:3000/api/v1`.

## Paleta de colores

La app comparte la misma identidad visual que el panel web.

| Variable | Color | Uso |
|----------|-------|-----|
| `primary` | `#023048` | Fondos oscuros, headers auth |
| `secondary` | `#659aba` | Bordes, acentos, inputs activos |
| `accent` | `#c1111e` | Botones principales (CTA) |
| `cream` | `#ffeed4` | Texto sobre fondos oscuros |

El tema se configura en `src/theme.ts` y se aplica globalmente en `app/_layout.tsx` via `PaperProvider`.

## Arquitectura técnica

La app usa **Expo Router** con grupos de rutas por rol:

- `(auth)/` — pantallas de login y registro (públicas)
- `(user)/` — flujo del usuario final (protegido)
- `(partner)/` — panel del partner (protegido, rol partner)

La navegación post-login es automática según el rol del JWT. El token se persiste en `expo-secure-store`. Un interceptor de Axios inyecta el token en cada request y redirige al login si recibe un `401`.

## Estructura del proyecto

```
app/
├── _layout.tsx                   # Providers globales, redirección por rol
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (user)/
│   ├── _layout.tsx               # Tab bar usuario
│   ├── home.tsx                  # Lista de negocios
│   ├── negocio/[id].tsx          # Detalle + servicios
│   ├── reservar/[serviceId].tsx  # Selección de fecha y horario
│   ├── confirmar.tsx             # Confirmación + pago
│   ├── turno-confirmado.tsx      # Polling de estado del pago
│   ├── turnos.tsx                # Mis turnos
│   ├── resena/[bookingId].tsx    # Dejar reseña
│   └── perfil.tsx
└── (partner)/
    ├── _layout.tsx               # Tab bar partner
    ├── dashboard.tsx
    ├── turnos.tsx                # Turnos del día
    ├── turno/[id].tsx            # Detalle y completar turno
    ├── servicios.tsx
    ├── servicios/nuevo.tsx
    ├── slots.tsx                 # Gestión de agenda
    └── configuracion.tsx

src/
├── context/
│   └── AuthContext.tsx           # Sesión, login/logout, SecureStore
├── services/
│   └── api.ts                    # Axios con interceptores JWT
├── types/
│   └── index.ts                  # Interfaces TypeScript
└── theme.ts                      # Paleta de colores y tema react-native-paper
```

## Progreso del desarrollo

### ✅ Completado

**Configuración base**
- Expo Router con grupos de rutas por rol
- AuthContext con persistencia en `expo-secure-store`
- Axios con interceptor de JWT y `logoutCallback` para manejo de 401
- Tema visual personalizado (paleta del brand Axen)
- Pantallas auth con fondo navy oscuro, inputs con borde azul, botones rojos

**Flujo usuario**
- Home con lista de negocios activos
- Detalle de negocio con servicios disponibles
- Selección de turno con navegación por fecha (prev/next día)
- Confirmación y pago vía MercadoPago sandbox
- Pantalla de turno confirmado con polling de estado
- Mis turnos con estado por reserva
- Dejar reseña (1-5 estrellas) para turnos completados

**Flujo partner**
- Dashboard con métricas del negocio
- Agenda del día con turnos confirmados
- Marcar turno como completado
- Gestión de servicios (listar y crear)
- Gestión de slots: creación masiva, bloqueo de día, navegación por fecha
- Configuración del negocio

### ⚠️ Notas del entorno de pruebas

**Modo de prueba recomendado:** correr con `npx expo start` y presionar `w` (modo web). No requiere Expo Go ni emulador.

**Pago completo:** el webhook de MercadoPago no llega a `localhost`, por lo que el turno queda en `pending_payment` tras el pago en sandbox. Esto se resuelve configurando [ngrok](https://ngrok.com) en el backend, o automáticamente al hacer deploy con URL pública.

### 📋 Pendiente

- Módulo de favoritos
- EAS Build (generación de APK/AAB para Play Store)
- Scheme en `app.json` para deep links
- Variables de entorno de producción

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Partner (seed) | `partner@axen.demo` | `Demo1234` |
| Usuario | Registrarse desde la app | mín. 8 caracteres, 1 mayúscula, 1 número |

> El seed de datos se corre desde el backend con `npm run seed`

## Equipo

**Franco Chiquilito** — Backend · App móvil  
**Flor Gomez Pacheco** — Backend · Panel web
