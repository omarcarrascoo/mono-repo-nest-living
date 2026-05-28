# fly-api — Backend NestJS

NestJS 11 + MongoDB Atlas (Mongoose) + JWT/Passport. Multitenancy por `residencyId`.

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
├── app.module.ts        # registra MongooseModule, AuthModule, UsersModule, AmenitiesModule
├── app.controller.ts    # GET / (hello)
├── auth/                # AuthController, AuthService, JwtStrategy, JwtAuthGuard, RolesGuard
├── users/               # UsersController (GET /users/me), UsersService, User schema
└── amenities/           # AmenitiesController (CRUD), AmenitiesService, Amenity schema
```

## Variables de entorno

`fly-api/.env`:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
PORT=3000
```

## Convenciones

- **Multitenancy**: el `residencyId` siempre se lee de `req.user` (JWT), nunca del body. En POST de recursos scope-ados, hacemos `{ ...dto, residencyId: req.user.residencyId }` para forzar.
- **DTOs**: usa `class-validator` decorators. El `ValidationPipe` global tiene `whitelist: true` y `transform: true` activados.
- **Excepciones**: `UnauthorizedException`, `NotFoundException`, `ForbiddenException`, `BadRequestException`. No regreses strings de error a mano.
- **Respuestas**: Mongoose devuelve `_id`. El frontend lo normaliza, no es necesario transformar acá salvo que quites campos sensibles (como `password`).
- **Logger**: usa `Logger` de `@nestjs/common` con un namespace por servicio.

## Endpoints actuales (mantén sincronizado con Postman)

| Método | Ruta | Auth | Roles | Notas |
|---|---|---|---|---|
| GET | `/` | público | — | hello |
| POST | `/auth/register` | público | — | crea user (devuelve doc) |
| POST | `/auth/login` | público | — | devuelve `{ access_token }` |
| GET | `/users/me` | JWT | — | user del token (incluye `favorites`, `notificationPreferences`) |
| GET | `/users/me/favorites` | JWT | — | `{ ids: string[] }` |
| PATCH | `/users/me/notification-preferences` | JWT | — | `{ reservationReminders?, reservationUpdates?, adminAlerts? }` |
| GET | `/users/directory` | JWT | admin | scoped, `?q=` (fullName/email/unitNumber), hasta 100 |
| PATCH | `/users/:id` | JWT | admin | scoped, body parcial: `fullName?`, `role?`, `unitNumber?`, `avatar?`, `status?` |
| DELETE | `/users/:id` | JWT | admin | scoped; 403 si es uno mismo |
| GET | `/categories` | JWT | — | scoped, ordenadas por sortOrder |
| POST | `/categories` | JWT | admin | residencyId del token |
| PUT | `/categories/:id` | JWT | admin | scoped (slug immutable) |
| DELETE | `/categories/:id` | JWT | admin | scoped |
| GET | `/amenities` | JWT | — | scoped + query `q?`, `category?`, `favorite?='true'` |
| GET | `/amenities/:id` | JWT | — | scoped por residencyId |
| GET | `/amenities/:id/availability` | JWT | — | `?date=YYYY-MM-DD` → `{ slots: AvailabilitySlot[] }` |
| POST | `/amenities/:id/favorite` | JWT | — | idempotente |
| DELETE | `/amenities/:id/favorite` | JWT | — | idempotente |
| POST | `/amenities` | JWT | admin | residencyId del token |
| PUT | `/amenities/:id` | JWT | admin | scoped |
| DELETE | `/amenities/:id` | JWT | admin | scoped |
| POST | `/reservations` | JWT | — | crea reserva, dispara push |
| GET | `/reservations` | JWT | — | cursor-paginated `?filter=upcoming\|past\|cancelled\|all` |
| GET | `/reservations/:id` | JWT | — | owner-only (admin override por residencia) |
| PATCH | `/reservations/:id` | JWT | — | modifica startTime/notes (race-safe via tx) |
| DELETE | `/reservations/:id` | JWT | — | cancel (status='cancelled', libera slot) |
| GET | `/reservations/admin/all` | JWT | admin | scoped, `?filter=`, `?userId=`, `?amenityId=`, `?cursor=`, `?limit=` (1-100); populated amenity + user |
| GET | `/reservations/admin/stats` | JWT | admin | `{ totals: {today, week, month}, topAmenities (top5), cancellationRate, hourOccupancy[24] }` ventanas relativas |
| POST | `/notifications/register-token` | JWT | — | registra Expo Push Token |
| DELETE | `/notifications/unregister-token` | JWT | — | quita Expo Push Token |
| GET | `/notifications/me` | JWT | — | inbox in-app (`?unreadOnly='true'`) |
| GET | `/notifications/me/unread-count` | JWT | — | `{ count }` para badge |
| PATCH | `/notifications/:id/read` | JWT | — | marca leída (owner-only) |
| POST | `/notifications/mark-all-read` | JWT | — | marca todo el inbox como leído |
| POST | `/notifications/broadcast` | JWT | admin | `{ title, body, audience: 'all'\|'unit'\|'user', unitPrefix?, userId? }` → `{ sent, audience }` |
| GET | `/delivery/categories` | JWT | — | scoped, con `productCount` |
| POST | `/delivery/categories` | JWT | admin | scoped (slug único por residencia) |
| PUT | `/delivery/categories/:id` | JWT | admin | scoped |
| DELETE | `/delivery/categories/:id` | JWT | admin | 409 si tiene productos |
| GET | `/delivery/products` | JWT | — | scoped + `q?`, `category?`, `status?`, `featured?` |
| GET | `/delivery/products/featured` | JWT | — | producto destacado del día |
| GET | `/delivery/products/:id` | JWT | — | detalle con `optionGroups` |
| POST | `/delivery/products` | JWT | admin | crea producto |
| PUT | `/delivery/products/:id` | JWT | admin | update parcial |
| DELETE | `/delivery/products/:id` | JWT | admin | scoped |
| POST | `/delivery/orders` | JWT | — | crea orden (recalcula precio server-side, dispara notificaciones) |
| GET | `/delivery/orders/me` | JWT | — | mis pedidos (`?filter=active\|completed\|all`) |
| GET | `/delivery/orders` | JWT | admin / kitchen_operator | listado de staff (`?status?`, `?filter?`, `?userId?`) |
| GET | `/delivery/orders/:id` | JWT | — | owner-only; staff puede ver cualquiera de su residencia |
| PATCH | `/delivery/orders/:id/status` | JWT | admin / kitchen_operator | avanza estado, valida transición; cancel solo admin |
| GET | `/community/posts` | JWT | — | scoped, pinned primero; `?type=all\|announcement\|post`, `?q=` |
| POST | `/community/posts` | JWT | — | crea post; `type='announcement'` y `pinned` requieren admin |
| GET | `/community/posts/:id` | JWT | — | scoped por residencia |
| PATCH | `/community/posts/:id` | JWT | — | autor o admin; pinned solo admin |
| DELETE | `/community/posts/:id` | JWT | — | autor o admin; cascada a replies |
| POST | `/community/posts/:id/reactions` | JWT | — | toggle 1-emoji-por-usuario |
| GET | `/community/posts/:postId/replies` | JWT | — | replies del post; `?parentReplyId=` filtra hijos directos |
| POST | `/community/posts/:postId/replies` | JWT | — | reply (con `parentReplyId?` para anidar, depth máx 2) |
| DELETE | `/community/posts/:postId/replies/:replyId` | JWT | — | autor o admin; cascada a hijos |
| POST | `/community/posts/:postId/replies/:replyId/reactions` | JWT | — | toggle reacción de reply |

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
