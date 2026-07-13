# KLE Engament

Aplicación React + Vite con un backend Node para autenticación y datos operativos.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Arranca frontend y backend con `npm run dev`.
3. El frontend queda en `http://localhost:5173` y el backend en `http://127.0.0.1:3001`.

En local, Vite redirige automáticamente las llamadas `/api` al backend.

## Despliegue en Azure

La arquitectura actual está pensada así:

- `Frontend`: Azure Static Web Apps
- `Backend`: Azure App Service con Node.js

## Variable necesaria en producción

Durante la build del frontend, define esta variable:

```bash
VITE_API_BASE_URL=https://TU-BACKEND.azurewebsites.net
```

Ejemplo:

```bash
VITE_API_BASE_URL=https://kle-api.azurewebsites.net
```

El pipeline ya está preparado para leer `VITE_API_BASE_URL` desde tus variables de Azure DevOps.

## Qué debes desplegar

### Frontend

Se publica desde `dist` en Azure Static Web Apps.

### Backend

Debes desplegar `backend/server.mjs` en un servicio Node aparte, por ejemplo Azure App Service.

Ese backend expone:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/authority-data`
- `PUT /api/authority-data/:section`

## Variables del backend

En App Service configura, como mínimo:

```bash
KLE_API_PORT=3001
```

Si App Service te inyecta `PORT`, puedes adaptar después el backend para usarlo también.

## Importante

- Azure Static Web Apps ya no debe bloquear toda la web con `allowedRoles`, porque esta aplicación usa su propio login.
- Si el frontend falla al autenticar en producción, revisa primero que `VITE_API_BASE_URL` apunte al backend correcto.
