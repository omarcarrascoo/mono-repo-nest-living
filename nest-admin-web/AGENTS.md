<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# nest-admin-web — reglas para agentes

Consola web de administración de NestQuest (Next.js 16, App Router, React 19, Tailwind v4, Zustand). Hermana de `fly-api` y `nest-mobile`.

## Next.js 16 — diferencias que ya mordieron

- `params` y `searchParams` en páginas son **Promises** (`await params`).
- Componentes que usan `useSearchParams()` deben ir envueltos en `<Suspense>`.
- ESLint trae la regla **`react-hooks/set-state-in-effect`** (React 19): NO llames `setState` de forma síncrona dentro de un `useEffect`.
  - Para fetch de datos usa `src/hooks/use-async-data.ts` (hace los `setState` dentro de los callbacks de la promesa).
  - Para inicializar el estado de un form desde props, monta un subcomponente con `key` (ver `EditResidentModal`, `ClubFormModal`).

## Conexión con el backend

- Toda llamada pasa por `src/lib/api/client.ts` (`apiFetch`): Bearer token + auto-logout en 401. Es el espejo del cliente del móvil — manténlos alineados.
- La URL sale de `src/lib/env.ts` (`NEXT_PUBLIC_API_URL`).
- El backend resuelve el club activo desde el JWT (`activeClubId`); **nunca** lo mandes en el body. Para cambiar de club: `auth-store.switchClub()`.
- Mongo devuelve `_id`; normalízalo a `id` en `src/services/adapters.ts` antes de tocar el store. No mezcles `_id` e `id`.

## Al agregar un módulo nuevo (amenities, reservations, delivery, community)

El backend ya expone los endpoints. Para portar un módulo:

1. Copia el tipo desde `nest-mobile/types/api.ts` a `src/types/api.ts`.
2. Copia el adapter desde `nest-mobile/services/adapters.ts`.
3. Crea `src/services/<modulo>.service.ts` (mira `residents.service.ts` como plantilla).
4. Crea la pantalla en `src/app/dashboard/<modulo>/page.tsx` envuelta en `<DashboardShell>`.
5. Quita el `soon: true` del item en `src/components/dashboard/Sidebar.tsx`.

No inventes contratos: la fuente de verdad es `postmans-endpoints/` y los controllers de `fly-api`.

## Diseño

Tokens en `src/app/globals.css` (`@theme`), portados de `nest-mobile/constants/theme.ts`. Paleta verde bosque/teal. Landing/login oscuros e inmersivos; dashboard claro. Usa las utilidades `.btn-primary`, `.glass`, `.input`, `.text-gradient-teal` y los primitivos de `src/components/ui/`.

## Verificar antes de dar por hecho un cambio

```bash
npm run lint && npm run build
```
