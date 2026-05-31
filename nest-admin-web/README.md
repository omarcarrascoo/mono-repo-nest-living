# nest-admin-web

Sitio web (Next.js 16 / App Router) para los **administradores de club** de NestQuest.

Es la tercera app del monorepo, hermana de `fly-api` (backend) y `nest-mobile` (app de residentes). Comparte el mismo backend y el mismo contrato de API.

## Qué incluye

- **Landing pública** (`/`) — página de marketing creativa con la estética verde bosque/teal de la marca.
- **Login** (`/login`) — conectado al backend real (`POST /auth/login`). **No hay registro**: las cuentas de admin las crea el super admin.
- **Dashboard** (`/dashboard`) — protegido, con sidebar, switcher de club activo y gating de rol:
  - **Resumen** — KPIs en vivo del club (solicitudes pendientes, residentes activos).
  - **Residentes** (`/dashboard/residents`) — aprobar/rechazar solicitudes, editar rol y unidad, quitar miembros.
  - **Clubs** (`/dashboard/clubs`) — **solo super admin**: CRUD de clubs, ver/copiar joinCode, promover admins.
  - Amenidades, Reservas, Delivery y Comunidad aparecen como "Próximamente" (los endpoints ya existen en el backend; faltan las pantallas).

## Cómo se conecta al backend

- La URL del backend se resuelve en `src/lib/env.ts` desde `NEXT_PUBLIC_API_URL` (default `https://mono-repo-nest-living.onrender.com`).
- `src/lib/api/client.ts` es un `apiFetch` con Bearer token + auto-logout en 401 — **espejo de `nest-mobile/lib/api/client.ts`**.
- Auth con JWT (`src/stores/auth-store.ts`, Zustand): token en `localStorage`, multi-club vía `switch-club`. Mismo flujo que el móvil.
- Adapters Mongo→cliente (`_id`→`id`) en `src/services/adapters.ts`, igual convención que el móvil.

El backend ya tiene `app.enableCors({ origin: true })`, así que no requiere cambios para servir a este sitio.

## Desarrollo

```bash
# 1. Backend (en otra terminal)
cd ../fly-api && npm run start:dev      # escucha en :3000

# 2. Este sitio
npm install
npm run dev                              # si el backend ocupa el 3000, Next usa otro puerto
```

> El default ya apunta al deploy en Render. Para apuntar a un backend local, ajusta `NEXT_PUBLIC_API_URL=http://localhost:3000` en `.env.local`.

```bash
npm run build      # build de producción
npm run lint       # ESLint (Next 16 + reglas estrictas de React 19)
```

## Convenciones

- Sigue el contrato de `postmans-endpoints/` y los tipos de `nest-mobile/types/api.ts`. Si agregas un módulo, **porta** el tipo + adapter + service desde el móvil en vez de reinventarlos.
- Gating de rol: `selectIsAdmin` / `selectIsSuperAdmin` en `auth-store`. El gating de cliente es solo UX — el backend valida el rol en cada endpoint.
- React 19: nada de `setState` síncrono dentro de un `useEffect` (regla `react-hooks/set-state-in-effect`). Usa `useAsyncData` para fetches y monta forms con `key` para inicializar estado desde props.

## Estructura

```
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── login/                   # Login (form en client component)
│   └── dashboard/               # Rutas protegidas
│       ├── page.tsx             # Resumen
│       ├── residents/page.tsx
│       └── clubs/page.tsx       # Solo super admin
├── components/
│   ├── marketing/               # Landing
│   ├── dashboard/               # Shell, sidebar, topbar, módulos
│   └── ui/                      # Primitivos (Button, Card, Modal, Avatar…)
├── hooks/                       # useRequireAdmin, useAsyncData
├── lib/                         # env, api/client, storage, cn
├── services/                    # auth, clubs, residents, adapters
├── stores/                      # auth-store (Zustand) + AuthProvider
└── types/api.ts                 # Contrato (subconjunto del compartido)
```
