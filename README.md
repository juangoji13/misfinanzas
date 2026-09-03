# FINANZAS JG 💰

App de control financiero personal construida con **Expo Router** + **React Native** + **Supabase**.

## Características

- 🏦 **Multi-cuenta** — Cuentas de ahorro, corriente, efectivo, tarjetas débito y crédito
- 💸 **Transacciones** — Registro de gastos e ingresos con categorías personalizadas
- 🔄 **Transferencias** — Mover saldo entre cuentas propias
- 🎯 **Metas de ahorro** — Define objetivos y aporta desde cualquier cuenta
- 📊 **Presupuestos** — Límites mensuales por categoría con descuento automático
- 📈 **Analíticas** — Gráficos de gasto por día, mes y año con desglose por categoría
- 💳 **Cuotas de crédito** — Auto-genera pagos diferidos para compras a crédito
- 🌎 **Multi-región** — Soporte para Colombia, México, Argentina, España y EE.UU.
- 🔒 **Autenticación** — Login, registro y recuperación de contraseña vía Supabase Auth

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Routing | Expo Router 6 (file-based) |
| Backend | Supabase (Auth + PostgreSQL) |
| Lenguaje | TypeScript (strict mode) |
| Estado | React Context + hooks |
| Animaciones | React Native Animated API |

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

> ⚠️ **Nunca** commitees el archivo `.env` con credenciales reales.

### 3. Iniciar la app

```bash
npx expo start
```

Opciones de ejecución:
- **Expo Go**: Escanea el QR desde la app Expo Go
- **iOS Simulator**: Presiona `i` en la terminal
- **Android Emulator**: Presiona `a` en la terminal

## Estructura del Proyecto

```
src/
├── app/                # Screens (file-based routing)
│   ├── (tabs)/         # Tab navigation (Inicio, Gestión, Analíticas, Perfil)
│   ├── add.tsx         # Agregar transacción
│   ├── add-account.tsx # Agregar cuenta/tarjeta
│   ├── add-plan.tsx    # Crear meta o presupuesto
│   ├── transfer.tsx    # Transferencia entre cuentas
│   ├── login.tsx       # Inicio de sesión
│   ├── register.tsx    # Registro
│   └── forgot-password.tsx # Recuperación de contraseña
├── components/         # Componentes reutilizables
├── config/             # Configuración de regiones
├── lib/                # Contextos, Supabase client, lógica financiera
├── theme/              # Tokens de diseño (colores, spacing, radii)
└── types/              # Tipos TypeScript
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run ios` | Inicia en iOS Simulator |
| `npm run android` | Inicia en Android Emulator |
| `npm run lint` | Ejecuta ESLint |

## Licencia

MIT
