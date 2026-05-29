# fly-api — Backend NestJS

NestJS 11 + MongoDB Atlas (Mongoose) + JWT/Passport. Multitenancy por `Membership(userId × clubId × role × status)` — un usuario puede pertenecer a múltiples clubs, pero el JWT solo trae **un** `activeClubId` por sesión.

## ⚠️ REGLA CRÍTICA: Sincronización con Postman

> **Cada vez que agregas, modificas o eliminas un endpoint en este backend, DEBES actualizar `../postmans-endpoints/NestQuest-API.postman_collection.json` en el mismo cambio.**

La colección de Postman es el contrato visible y la herramienta principal de QA manual del proyecto. Si se desfasa, perdemos la capacidad de probar la API a mano y de onboardear gente nueva.

### Qué cuenta como "modificar un endpoint"

- Agregar un controller method nuevo (`@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`).
- Cambiar la ruta o el método HTTP.
- Cambiar el shape del body, query params o response.
- Cambiar los guards (auth/roles) que aplican.
- Eliminar un endpoint.

### Cómo actualizar la colección

Para cada cambio, edita `../postmans-endpoints/NestQuest-API.postman_collection.json`:

1. **Endpoint nuevo** → agrega un item dentro de la carpeta correspondiente (`Auth`, `Users`, `Amenities`, etc.). Si es un recurso nuevo, crea una carpeta nueva con su propio bloque `auth.bearer` si requiere JWT.
2. **Cambio de ruta/método** → actualiza `request.method` y `request.url.path`.
3. **Cambio de shape** → actualiza `request.body.raw` (JSON de ejemplo) y la `description` del item.
4. **Eliminación** → borra el item.

Cada item debe tener:
- `name` claro (ej. `POST /amenities/:id/reserve (admin)`).
- `request.method`, `request.header`, `request.body` (si aplica), `request.url`.
- `description` con shape de campos y códigos de error relevantes.
- `event.test` script si el endpoint devuelve un ID/token que valga la pena cachear en variables de la colección.
- Auth a nivel de carpeta o de item para endpoints protegidos.

### Verificación

Antes de declarar el cambio listo, valida que el JSON sea sintácticamente correcto:
```bash
node -e "JSON.parse(require('fs').readFileSync('../postmans-endpoints/NestQuest-API.postman_collection.json','utf8'))"
```

## Stack

- NestJS 11 (TypeScript 5.7).
- MongoDB Atlas via `@nestjs/mongoose`.
- Auth: `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` + `bcrypt`.
- Validación: `class-validator` + `class-transformer` (vía `ValidationPipe` global).
- CORS abierto en dev (ver `src/main.ts`).

## Estructura

```
src/
├── main.ts              # bootstrap, CORS, ValidationPipe global
├── app.module.ts        # registra todos los módulos
├── app.controller.ts    # GET / (hello)
├── auth/                # AuthController, AuthService, JwtStrategy, JwtAuthGuard, RolesGuard, ActiveClubGuard
├── users/               # UsersController, UsersService, User schema (sin role/clubId; eso vive en Memberships)
├── clubs/               # ClubsController, ClubsService, Club + Membership schemas — multi-tenancy
├── amenities/           # CRUD scope-ado por activeClubId
├── categories/          # CRUD scope-ado por activeClubId
├── reservations/        # CRUD + admin stats scope-ado por activeClubId
├── delivery/            # products + categories + orders, scope-ado por activeClubId
├── community/           # posts + replies + reactions, scope-ado por activeClubId
└── notifications/       # push tokens + inbox + broadcast (este último scope-ado por activeClubId)
```

## Variables de entorno

`fly-api/.env`:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
PORT=3000

# Image uploads — provider swap via STORAGE_PROVIDER (default: supabase)
STORAGE_PROVIDER=supabase   # o "r2" para producción

# --- Supabase Storage (default, free tier) ---
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>     # del dashboard, NO el anon
SUPABASE_BUCKET=nestquest-media

# --- Cloudflare R2 (futuro, sin egress) ---
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=nestquest-media
R2_PUBLIC_BASE_URL=https://<bucket>.<account>.r2.dev
```

`main.ts` carga `dotenv/config` al arrancar — no hace falta `@nestjs/config`.

### Storage providers

El módulo `uploads/` exporta un `StorageClient` interface con dos implementaciones detrás de la env var `STORAGE_PROVIDER`:

- **`supabase` (default)** — Free tier 1GB storage + 2GB egress/mes. Setup más rápido, ideal para arrancar.
- **`r2`** — Cloudflare R2 S3-compatible. Egress GRATIS para siempre (clave a escala). Más config inicial.

Para cambiar de proveedor: `STORAGE_PROVIDER=r2` + envs R2_* + reiniciar. El FE no se entera — `/uploads/sign` siempre devuelve `{ uploadUrl, publicUrl, headers }` y el `ImageUploader` aplica esos headers tal cual.

### Supabase setup

1. Dashboard → Storage → "New bucket" → nombre `nestquest-media` → marca **Public**.
2. Copia `Project URL` + `service_role` key (Settings → API). El service role salta RLS, lo necesitamos porque el firmado se hace server-side.
3. Mete `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` en `.env` y reinicia.

### Cloudflare R2 setup (cuando migres)

1. Crea un bucket público en R2 (Settings → Public access → R2.dev domain o custom).
2. CORS del bucket: permite `PUT/GET/HEAD` desde el origen del FE.
3. API token con permisos `Object Read & Write` con scope al bucket.
4. Mete `R2_*` en `.env`, set `STORAGE_PROVIDER=r2`, reinicia.

## Convenciones

- **Multitenancy**: el `clubId` siempre se lee de `req.user.activeClubId` (JWT), nunca del body. En POST de recursos scope-ados, hacemos `{ ...dto, clubId: user.activeClubId! }` para forzar.
- **JWT payload** (`CurrentUserPayload`): `{ userId, email, globalRole: 'super_admin'|null, activeClubId: string|null, activeMembershipRole: 'admin'|'user'|'kitchen_operator'|null }`. `activeClubId` es null para usuarios recién registrados que no se han unido a un club.
- **Guards**: orden estándar para rutas scope-adas a club: `@UseGuards(JwtAuthGuard, ActiveClubGuard, RolesGuard)`. `ActiveClubGuard` lanza 403 si el JWT no trae `activeClubId`. Después puedes usar `user.activeClubId!` con la non-null assertion.
- **Roles**: `@Roles('admin')` lee `user.activeMembershipRole`. `@Roles('super_admin')` lee `user.globalRole`. Un super_admin **siempre** pasa cualquier roles guard (override global).
- **Crear/destruir clubs**: solo super_admin via `POST/PATCH/DELETE /clubs`. Promover admins via `POST /clubs/:clubId/admins` (super_admin). Un usuario regular se une via `POST /clubs/join` con `joinCode` — public → active, private → pending hasta que un admin apruebe.
- **DTOs**: usa `class-validator` decorators. El `ValidationPipe` global tiene `whitelist: true` y `transform: true` activados.
- **Excepciones**: `UnauthorizedException`, `NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`. No regreses strings de error a mano.
- **`CurrentUserPayload`**: importa siempre con `import type { CurrentUserPayload } from '...'` cuando se usa en signatures con `@Body`/`@CurrentUser` decorators (TS isolatedModules).
- **Respuestas**: Mongoose devuelve `_id`. El frontend lo normaliza, no es necesario transformar acá salvo que quites campos sensibles (como `password`).
- **Logger**: usa `Logger` de `@nestjs/common` con un namespace por servicio.

## Endpoints actuales (mantén sincronizado con Postman)

| Método | Ruta | Auth | Roles | Notas |
|---|---|---|---|---|
| GET | `/` | público | — | hello |
| POST | `/uploads/sign` | JWT | — | `{ kind, contentType, contentLength }` → `{ uploadUrl, publicUrl, key, headers, expiresIn }`. El FE hace `PUT uploadUrl` directo a R2 con el binario. Max 5 MB, mime ∈ jpeg/png/webp |
| POST | `/auth/register` | público | — | `{ fullName, email, password, dateOfBirth? }` — crea user sin club ni rol |
| POST | `/auth/login` | público | — | `{ access_token, activeClubId, activeMembershipRole }`. Si el user no tiene memberships activas, `activeClubId=null` |
| POST | `/auth/switch-club` | JWT | — | `{ clubId }` — re-emite el JWT apuntando a ese club. 403 si no es miembro activo |
| GET | `/users/me` | JWT | — | user del token (incluye `favoriteAmenityIds`, `notificationPreferences`, `globalRole`) |
| PATCH | `/users/me` | JWT | — | propio perfil: `fullName?`, `avatar?`, `dateOfBirth?` |
| GET | `/users/me/favorites` | JWT | — | `{ ids: string[] }` |
| PATCH | `/users/me/notification-preferences` | JWT | — | `{ reservationReminders?, reservationUpdates?, adminAlerts? }` |
| GET | `/users/directory` | JWT + ActiveClub | admin | directorio del club activo (memberships pobladas con user). `?q=` busca en fullName/email/unitNumber |
| POST | `/clubs` | JWT | super_admin | `{ name, description?, privacy }` — genera `joinCode` |
| GET | `/clubs` | JWT | super_admin | lista todos los clubs |
| PATCH | `/clubs/:clubId` | JWT | super_admin | `{ name?, description?, privacy? }` |
| DELETE | `/clubs/:clubId` | JWT | super_admin | borra el club (huérfana memberships+recursos) |
| POST | `/clubs/:clubId/admins` | JWT | super_admin | `{ userId, unitNumber? }` — crea/promueve membership active+admin |
| POST | `/clubs/join` | JWT | — | `{ joinCode, unitNumber? }` — public → active; private → pending |
| GET | `/clubs/me/memberships` | JWT | — | mis memberships con `club` poblado |
| DELETE | `/clubs/me/memberships/:clubId` | JWT | — | leave club; bloquea último admin |
| GET | `/clubs/:clubId/memberships` | JWT | admin | lista memberships del club; `?status=`, `?q=` |
| POST | `/clubs/memberships/:id/approve` | JWT | admin | aprueba pending |
| POST | `/clubs/memberships/:id/reject` | JWT | admin | rechaza pending |
| PATCH | `/clubs/memberships/:id` | JWT | admin | `{ role?, unitNumber? }`; bloquea demote del último admin |
| DELETE | `/clubs/memberships/:id` | JWT | admin | expulsa miembro; bloquea último admin |
| GET | `/categories` | JWT + ActiveClub | — | scoped, ordenadas por sortOrder |
| POST | `/categories` | JWT + ActiveClub | admin | clubId del token |
| PUT | `/categories/:id` | JWT + ActiveClub | admin | scoped (slug immutable) |
| DELETE | `/categories/:id` | JWT + ActiveClub | admin | scoped |
| GET | `/amenities` | JWT + ActiveClub | — | scoped + query `q?`, `category?`, `favorite?='true'` |
| GET | `/amenities/:id` | JWT + ActiveClub | — | scoped por clubId |
| GET | `/amenities/:id/availability` | JWT + ActiveClub | — | `?date=YYYY-MM-DD` → `{ slots: AvailabilitySlot[] }` |
| POST | `/amenities/:id/favorite` | JWT + ActiveClub | — | idempotente |
| DELETE | `/amenities/:id/favorite` | JWT + ActiveClub | — | idempotente |
| POST | `/amenities` | JWT + ActiveClub | admin | clubId del token |
| PUT | `/amenities/:id` | JWT + ActiveClub | admin | scoped |
| DELETE | `/amenities/:id` | JWT + ActiveClub | admin | scoped |
| POST | `/reservations` | JWT + ActiveClub | — | crea reserva, dispara push |
| GET | `/reservations` | JWT + ActiveClub | — | cursor-paginated `?filter=upcoming\|past\|cancelled\|all` |
| GET | `/reservations/:id` | JWT + ActiveClub | — | owner-only (admin override por club) |
| PATCH | `/reservations/:id` | JWT + ActiveClub | — | modifica startTime/notes (race-safe via tx) |
| DELETE | `/reservations/:id` | JWT + ActiveClub | — | cancel (status='cancelled', libera slot) |
| GET | `/reservations/admin/all` | JWT + ActiveClub | admin | scoped, `?filter=`, `?userId=`, `?amenityId=`, `?cursor=`, `?limit=` (1-100); populated amenity + user |
| GET | `/reservations/admin/stats` | JWT + ActiveClub | admin | `{ totals: {today, week, month}, topAmenities (top5), cancellationRate, hourOccupancy[24] }` ventanas relativas |
| POST | `/notifications/register-token` | JWT | — | registra Expo Push Token |
| DELETE | `/notifications/unregister-token` | JWT | — | quita Expo Push Token |
| GET | `/notifications/me` | JWT | — | inbox in-app (`?unreadOnly='true'`) |
| GET | `/notifications/me/unread-count` | JWT | — | `{ count }` para badge |
| PATCH | `/notifications/:id/read` | JWT | — | marca leída (owner-only) |
| POST | `/notifications/mark-all-read` | JWT | — | marca todo el inbox como leído |
| POST | `/notifications/broadcast` | JWT + ActiveClub | admin | `{ title, body, audience: 'all'\|'unit'\|'user', unitPrefix?, userId? }` → `{ sent, audience }` |
| GET | `/delivery/categories` | JWT + ActiveClub | — | scoped, con `productCount` |
| POST | `/delivery/categories` | JWT + ActiveClub | admin | scoped (slug único por club) |
| PUT | `/delivery/categories/:id` | JWT + ActiveClub | admin | scoped |
| DELETE | `/delivery/categories/:id` | JWT + ActiveClub | admin | 409 si tiene productos |
| GET | `/delivery/products` | JWT + ActiveClub | — | scoped + `q?`, `category?`, `status?`, `featured?` |
| GET | `/delivery/products/featured` | JWT + ActiveClub | — | producto destacado del día |
| GET | `/delivery/products/:id` | JWT + ActiveClub | — | detalle con `optionGroups` |
| POST | `/delivery/products` | JWT + ActiveClub | admin | crea producto |
| PUT | `/delivery/products/:id` | JWT + ActiveClub | admin | update parcial |
| DELETE | `/delivery/products/:id` | JWT + ActiveClub | admin | scoped |
| POST | `/delivery/orders` | JWT + ActiveClub | — | crea orden (recalcula precio server-side, dispara notificaciones) |
| GET | `/delivery/orders/me` | JWT + ActiveClub | — | mis pedidos (`?filter=active\|completed\|all`) |
| GET | `/delivery/orders` | JWT + ActiveClub | admin / kitchen_operator | listado de staff (`?status?`, `?filter?`, `?userId?`) |
| GET | `/delivery/orders/:id` | JWT + ActiveClub | — | owner-only; staff puede ver cualquiera de su club |
| PATCH | `/delivery/orders/:id/status` | JWT + ActiveClub | admin / kitchen_operator | avanza estado, valida transición; cancel solo admin |
| GET | `/community/posts` | JWT + ActiveClub | — | scoped, pinned primero; `?type=all\|announcement\|post`, `?q=` |
| POST | `/community/posts` | JWT + ActiveClub | — | crea post; `type='announcement'` y `pinned` requieren admin |
| GET | `/community/posts/:id` | JWT + ActiveClub | — | scoped por club |
| PATCH | `/community/posts/:id` | JWT + ActiveClub | — | autor o admin; pinned solo admin |
| DELETE | `/community/posts/:id` | JWT + ActiveClub | — | autor o admin; cascada a replies |
| POST | `/community/posts/:id/reactions` | JWT + ActiveClub | — | toggle 1-emoji-por-usuario |
| GET | `/community/posts/:postId/replies` | JWT + ActiveClub | — | replies del post; `?parentReplyId=` filtra hijos directos |
| POST | `/community/posts/:postId/replies` | JWT + ActiveClub | — | reply (con `parentReplyId?` para anidar, depth máx 2) |
| DELETE | `/community/posts/:postId/replies/:replyId` | JWT + ActiveClub | — | autor o admin; cascada a hijos |
| POST | `/community/posts/:postId/replies/:replyId/reactions` | JWT + ActiveClub | — | toggle reacción de reply |

## Comandos

```bash
npm run start:dev    # hot reload
npm run start        # plain
npm run build        # → dist/
npm run start:prod   # node dist/main
npm test             # jest
```

## Smoke test

```bash
# 1. Health
curl http://localhost:3000/

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).access_token))")

# 3. /users/me
curl http://localhost:3000/users/me -H "Authorization: Bearer $TOKEN"
```
