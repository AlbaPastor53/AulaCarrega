# AulaCarrega

Aplicación web para gestionar el acceso al punto de recarga del instituto.

## Estructura

- `frontend/`: páginas HTML, estilos CSS y JavaScript del navegador.
- `backend/`: API Express, conexión MongoDB, modelos, rutas y controladores.

## Requisitos

- Node.js y npm.
- MongoDB en funcionamiento.

## Configurar el backend

1. Entra en `backend/`.
2. Copia `.env.example` a `.env`.
3. Configura `MONGO_URI` con la conexión a tu base de datos y `PORT` (por defecto 3000).
4. Ejecuta `npm install`.
5. Ejecuta `npm run dev` o `npm start`.

La API responde en `http://localhost:3000`. Todas las rutas nuevas están bajo `/api`.

Las rutas protegidas necesitan la cabecera `Authorization: Bearer <token>`. El token se obtiene al hacer login o registro.

### Autenticación

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/password`

Las páginas antiguas de login y registro siguen funcionando gracias al alias `/auth`.

### Recursos

| Recurso | Ruta base |
|---|---|
| Usuarios | `/api/users` |
| Horarios de clase | `/api/class-schedules` |
| Cargadores | `/api/chargers` |
| Tramos de carga | `/api/charging-schedules` |
| Historial | `/api/charging-history` |
| Festivos | `/api/holidays` |

### Datos iniciales

Dentro de `backend/`, ejecuta:

```bash
npm run seed
```

El script es idempotente: crea el administrador, 4 cargadores y 3 festivos de ejemplo sin duplicarlos.

Credenciales del administrador:

- NIA: `ADMIN001`
- Matrícula: `0000AAA`
- Contraseña: `Admin1234`
- Email: `admin@aulacarrega.cat`


## Abrir el frontend

Abre `frontend/index.html` con Live Server (o un servidor estático). Los scripts llaman a la API en `http://localhost:3000`.

## Usuarios y roles

- Los registros nuevos reciben siempre el rol `User` desde el backend. No se acepta un rol enviado por el navegador.
- El modelo contempla `Admin` y `User`, además del campo `isActive`.
- Para convertir el usuario que ya existe en administrador, identifica su NIA y ejecuta en `mongosh` sobre la base de datos correcta:

```js
db.users.updateOne(
  { nia: "NIA_DEL_ADMIN_EXISTENTE" },
  { $set: { role: "Admin" } }
)
```

Sustituye el texto por el NIA real. No se ha cambiado ningún usuario automáticamente porque el ZIP no identifica cuál de los registros existentes debe ser administrador.

## Nota sobre el estado del proyecto

El panel de usuarios permite consultar y filtrar los usuarios de MongoDB; requiere iniciar sesión con un administrador. La creación y edición desde la interfaz, además de las secciones de reservas e informes, todavía no están implementadas.
