# Axen App Móvil

Aplicación móvil de la plataforma Axen. Permite a los usuarios buscar negocios, reservar turnos, gestionar sus citas y medios de pago.

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

---

## Requisitos previos

- Node.js v18 o superior
- npm v9 o superior
- **El backend Axen debe estar corriendo** antes de iniciar la app (ver instrucciones abajo)
- Para probar en web: cualquier navegador moderno
- Para probar en dispositivo físico: instalar **Expo Go** desde la App Store / Google Play

---

## 1. Levantar el backend (obligatorio)

La app no funciona sin el backend. Seguir las instrucciones del repositorio:
[https://github.com/axenapp/axen-backend](https://github.com/axenapp/axen-backend)

Resumen rápido:
```bash
git clone https://github.com/axenapp/axen-backend.git
cd axen-backend
npm install
# Crear archivo .env (ver README del backend)
docker compose up -d   # levanta PostgreSQL
npm run seed           # carga datos de prueba
npm run start:dev      # API en http://localhost:3000
```

Una vez que el backend esté corriendo, continuar con los pasos de la app.

---

## 2. Instalar y ejecutar la app

```bash
# 1. Clonar el repositorio
git clone https://github.com/axenapp/axen-appmobile.git
cd axen-appmobile

# 2. Instalar dependencias
npm install

# 3. Crear el archivo .env según dónde se va a probar (ver sección Variables de entorno)

# 4. Iniciar la app
npx expo start
```

Una vez iniciado, en la terminal aparece un QR y opciones de teclado:

| Tecla | Acción |
|-------|--------|
| `w` | Abre en el navegador — **opción recomendada para evaluación** |
| `a` | Abre en emulador Android (requiere Android Studio) |
| `i` | Abre en simulador iOS (requiere macOS + Xcode) |
| Escanear QR | Abre en dispositivo físico con Expo Go |

> **Recomendado para el profesor:** usar la tecla `w` (modo web). No requiere ninguna instalación adicional.

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con el valor que corresponda a cómo se va a probar la app:

```env
# Si probás en el navegador (modo web con npx expo start + w):
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1

# Si probás en emulador Android:
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1

# Si probás en dispositivo físico (Expo Go):
EXPO_PUBLIC_API_URL=http://<IP_DE_TU_PC>:3000/api/v1
```

> Si no se crea el `.env`, la app usa `http://10.0.2.2:3000/api/v1` como valor por defecto (emulador Android). Para web local es obligatorio crear el `.env`.

---

## Credenciales de prueba

El seed del backend carga los siguientes datos de prueba:

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| Usuario | `juan@example.com` | `Test1234` | Usuario con turnos y reseñas de prueba |
| Partner | `partner@axen.demo` | `Demo1234` | Partner con servicios y slots cargados |

> Los partners (negocios) se ven en el catálogo y se puede reservar turnos con ellos desde la cuenta de usuario.

---

## Flujo principal para evaluar

1. Ingresar con `juan@example.com` / `Test1234`
2. Desde el **Home**: buscar negocios, filtrar por categoría, explorar catálogo
3. Entrar a un negocio → seleccionar servicio → elegir fecha y horario
4. Completar la reserva (efectivo o tarjeta guardada)
5. Ver los turnos en **Mis Turnos** (próximos e historial)
6. Desde **Perfil**: gestionar medios de pago, ver información personal

---

## Paleta de colores

| Variable | Color | Uso |
|----------|-------|-----|
| `primary` | `#023048` | Fondos oscuros, headers auth |
| `secondary` | `#659aba` | Bordes, acentos, inputs activos |
| `accent` | `#c1111e` | Botones principales (CTA) |
| `cream` | `#ffeed4` | Texto sobre fondos oscuros |

El tema se configura en `src/theme.ts` y se aplica globalmente en `app/_layout.tsx` via `PaperProvider`.

---

## Arquitectura técnica

La app usa **Expo Router** con grupos de rutas por rol:

- `(auth)/` — pantallas de login y registro (públicas)
- `(user)/` — flujo del usuario final (protegido, requiere JWT)

La gestión del panel del partner es exclusiva del **panel web** (`axen-appweb`).

La navegación post-login es automática según el rol del JWT. El token se persiste en `expo-secure-store`. Un interceptor de Axios inyecta el token en cada request y redirige al login si recibe un `401`.

---

## Estructura del proyecto

```
app/
├── _layout.tsx                     # Providers globales, redirección por rol
├── index.tsx                       # Redirección inicial
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
└── (user)/
    ├── _layout.tsx                 # Tab bar usuario
    ├── home.tsx                    # Inicio: buscador y categorías
    ├── catalogo.tsx                # Catálogo con filtros
    ├── negocio/[id].tsx            # Detalle del negocio + servicios
    ├── perfil-negocio/[id].tsx     # Perfil público del negocio
    ├── reservar/[serviceId].tsx    # Selección de fecha, horario y pago
    ├── confirmar.tsx               # Confirmación de reserva
    ├── turno-confirmado.tsx        # Polling de estado del pago
    ├── turnos.tsx                  # Mis turnos (próximos e historial)
    ├── resena/[bookingId].tsx      # Dejar reseña
    ├── favoritos.tsx               # Negocios favoritos
    ├── medios-pago.tsx             # Gestión de medios de pago guardados
    ├── informacion-personal.tsx    # Datos del usuario
    └── perfil.tsx                  # Menú de perfil

src/
├── context/
│   └── AuthContext.tsx             # Sesión, login/logout, SecureStore
├── services/
│   └── api.ts                      # Axios con interceptores JWT
├── types/
│   └── index.ts                    # Interfaces TypeScript
└── theme.ts                        # Paleta de colores y tema react-native-paper
```

---

## Progreso del desarrollo

### Completado

**Configuración base**
- Expo Router con grupos de rutas por rol
- AuthContext con persistencia en `expo-secure-store`
- Axios con interceptor de JWT y `logoutCallback` para manejo de 401
- Tema visual personalizado (paleta del brand Axen)
- Pantallas auth con fondo navy oscuro, inputs con borde azul, botones rojos

**Flujo usuario**
- Home con buscador funcional y acceso directo por categoría
- Catálogo con filtros por categoría, precio y búsqueda por texto
- Detalle de negocio con servicios disponibles y reseñas
- Selección de turno con navegación por fecha (prev/next día)
- Confirmación y reserva con selección de medio de pago
- Pantalla de turno confirmado con polling de estado
- Mis turnos con clasificación por fecha (próximos / historial) y estado del pago
- Dejar reseña (1-5 estrellas) para turnos completados
- Favoritos
- Gestión de medios de pago (crédito, débito, MercadoPago)
- Perfil con información personal

### Notas del entorno de pruebas

**Modo de prueba recomendado:** correr con `npx expo start` y presionar `w` (modo web). No requiere Expo Go ni emulador.

**Pago completo:** el webhook de MercadoPago no llega a `localhost`, por lo que el turno queda en `pending_payment` tras el pago en sandbox. Esto se resuelve configurando [ngrok](https://ngrok.com) en el backend, o automáticamente al hacer deploy con URL pública.

### Pendiente

- EAS Build (generación de APK/AAB para Play Store)
- Variables de entorno de producción

---

## Equipo

**Franco Chiquilito** — Backend · App móvil  
**Flor Gomez Pacheco** — Backend · Panel web
