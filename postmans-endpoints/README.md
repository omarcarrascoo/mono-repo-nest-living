# postmans-endpoints

Mapa fuente de verdad de **todos** los endpoints expuestos por el backend `fly-api`. Si vas a probar la API a mano, importa esta carpeta en Postman y listo.

## Archivos

- `NestQuest-API.postman_collection.json` — Colección con todos los endpoints organizados por carpeta (Root / Auth / Users / Amenities). Incluye scripts de test que capturan automáticamente `accessToken`, `userId`, `residencyId` y `amenityId` en variables de la colección.
- `NestQuest-Local.postman_environment.json` — Environment con variables para correr todo contra `http://localhost:3000`.

## Setup rápido

1. Abre Postman.
2. **File → Import** y arrastra los dos JSON de esta carpeta.
3. En la esquina superior derecha selecciona el environment **NestQuest Local**.
4. Asegúrate de que el backend esté corriendo:
   ```bash
   cd fly-api
   npm run start:dev
   ```
5. Confirma que `MONGO_URI`, `JWT_SECRET` y `JWT_EXPIRES_IN` estén configurados en `fly-api/.env`.

## Flujo de prueba sugerido

Ejecuta en este orden:

1. **Root → GET /** — confirma que la API responde.
2. **Auth → POST /auth/register** — crea el usuario admin (solo la primera vez; si ya existe te dará error de duplicado, ignora).
3. **Auth → POST /auth/login** — login. El test script guarda `access_token` en `{{accessToken}}` automáticamente.
4. **Users → GET /users/me** — verifica que el token funciona; también guarda `userId` y `residencyId`.
5. **Amenities → POST /amenities (admin)** — crea una amenidad de prueba; guarda `{{amenityId}}`.
6. **Amenities → GET /amenities** — lista amenidades de tu residencia.
7. **Amenities → GET /amenities/:id** — lee la amenidad creada.
8. **Amenities → PUT /amenities/:id (admin)** — modifica el status.
9. **Amenities → DELETE /amenities/:id (admin)** — borra la amenidad.

## Variables de la colección

| Variable | Origen | Uso |
|---|---|---|
| `baseUrl` | manual (env) | URL del backend |
| `accessToken` | auto (login) | Bearer token a nivel de carpeta para Users / Amenities |
| `userId` | auto (register / me) | ID del usuario actual |
| `residencyId` | auto (register / me) | Residencia del usuario actual |
| `amenityId` | auto (POST / GET /amenities) | ID de amenidad para PUT/DELETE/GET /:id |
| `adminEmail`, `adminPassword` | manual (env) | Credenciales por default para login |

## Regla de sincronización

> **Si tocas un controller en `fly-api/`, debes actualizar `NestQuest-API.postman_collection.json` en el mismo cambio.**

Esto está documentado en `fly-api/CLAUDE.md`. La colección es el contrato visible — si se desfasa del backend, el QA manual deja de funcionar.

Cuando agregues un endpoint nuevo:
1. Localiza la carpeta correspondiente (`Auth`, `Users`, `Amenities`, etc.) o crea una nueva.
2. Agrega el item con:
   - `name` claro (`POST /resource/:id (admin)`).
   - `request.method`, `request.url` con `{{baseUrl}}`.
   - Headers (`Content-Type: application/json` para escrituras).
   - Body de ejemplo realista.
   - `description` con el shape de los campos y los códigos de error relevantes.
   - Test script si el endpoint devuelve algo que valga la pena cachear (IDs, tokens).
3. Si el endpoint requiere auth, asegúrate de que esté dentro de una carpeta con `auth.bearer` configurado, o agrégalo al item.

## Compatibilidad

- Postman v10+ (formato Collection v2.1.0).
- Funciona también en Insomnia y Hoppscotch importando como Postman v2.1.

## Histórico

Existe una versión anterior en `fly-api/postman/NestQuest-Fly.postman_collection.json` que se queda como referencia pero **ya no se mantiene**. Esta carpeta es la nueva fuente de verdad.
