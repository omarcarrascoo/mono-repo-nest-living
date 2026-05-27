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
| POST | `/notifications/register-token` | JWT | — | registra Expo Push Token |
| DELETE | `/notifications/unregister-token` | JWT | — | quita Expo Push Token |

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
