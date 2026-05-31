# NestQuest — mono-repo-nest-living

Monorepo informal con tres apps que se hablan entre sí.

## Estructura

```
mono-repo-nest-living/
├── fly-api/             # Backend NestJS 11 + MongoDB Atlas + JWT (Passport)
├── nest-mobile/         # App Expo 54 / React Native 0.81 + expo-router + Zustand (residentes)
├── nest-admin-web/      # Sitio Next.js 16 + React 19 + Tailwind v4 + Zustand (administradores)
└── postmans-endpoints/  # Fuente de verdad de los endpoints del backend (Postman v2.1)
```

Cada app tiene su propio `CLAUDE.md` / `AGENTS.md` con reglas específicas:
- `fly-api/CLAUDE.md` — reglas de backend, **incluyendo la regla de sincronización con Postman**.
- `nest-mobile/CLAUDE.md` — reglas de frontend móvil (si existe).
- `nest-admin-web/AGENTS.md` — reglas del sitio admin (Next 16, React 19, cómo portar módulos).

`nest-mobile` y `nest-admin-web` consumen el **mismo backend** y comparten contrato: cliente `apiFetch` (Bearer + auto-logout 401), tipos en `types/api.ts` y adapters `_id→id`. Al tocar la capa de datos, mantén ambos clientes alineados.

## Cómo se conectan

- El frontend resuelve `API_URL` en `nest-mobile/lib/env.ts` y apunta por default al deploy en Render (`https://mono-repo-nest-living.onrender.com`). Override con `EXPO_PUBLIC_API_URL` en `nest-mobile/.env` para apuntar a un backend local. El admin web hace lo equivalente vía `NEXT_PUBLIC_API_URL` en `nest-admin-web/.env.local`.
- Auth: el backend devuelve `{ access_token }` en `POST /auth/login`. El frontend lo guarda con `expo-secure-store` (nativo) / `localStorage` (web) y lo manda en cada request vía `apiFetch` (`nest-mobile/lib/api/client.ts`).
- Multitenancy por **club**: cada user puede pertenecer a varios clubs (Membership join table), pero el JWT trae **un solo** `activeClubId` por sesión. El backend lo lee del JWT y filtra todos los recursos. El frontend nunca lo manda en el body. Para cambiar de club activo, el frontend llama `POST /auth/switch-club` que re-emite el JWT.
- Errores 401 disparan `logout()` automático en el cliente vía un callback registrado en `auth-store`.

## Flujo de cambios end-to-end

Si agregas un feature que toca **ambos** lados (endpoint + UI):

1. Backend: implementa controller / service / DTO en `fly-api/`.
2. **Postman**: agrega el endpoint a `postmans-endpoints/NestQuest-API.postman_collection.json` (regla obligatoria — ver `fly-api/CLAUDE.md`).
3. Frontend: agrega los tipos en `nest-mobile/types/api.ts`, el adaptador en `services/adapters.ts` (si Mongo devuelve `_id`), el método en `services/`, y el store en `stores/`.
4. UI: consume el store desde la pantalla.

## Convenciones compartidas

- **IDs**: Mongo devuelve `_id`. El frontend siempre lo normaliza a `id` con un adapter antes de tocar zustand. No mezcles ambos formatos en el mismo nivel.
- **Fechas**: ISO-8601 strings (no `Date` objects) sobre la red.
- **Errores**: el backend usa `HttpException` / `UnauthorizedException` / `NotFoundException` de `@nestjs/common`. El frontend los recibe como `ApiError` (`lib/api/errors.ts`) con `status` y `message`.
- **Auth**: solo Bearer JWT. No cookies, no sesiones de servidor.

## Comandos

```bash
# Backend
cd fly-api && npm run start:dev

# Frontend
cd nest-mobile && npm run start
```

## Memoria persistente de Claude

Hay memorias relevantes en `~/.claude/projects/.../memory/`:
- `project-architecture.md` — arquitectura de alto nivel
- `project-backend-status.md` — estado del backend
- `project-frontend-status.md` — estado del frontend

Si vas a hacer cambios estructurales, lee esas primero.
