# Nova Salud

Sistema web de gestión de inventario y ventas para una botica. Proyecto académico
con frontend en React + Vite, API en Node.js + Express y base de datos MongoDB
con Mongoose.

## Funcionalidades

- **Dashboard** con productos activos, ventas, ingresos, ticket promedio, stock
  bajo, agotados y últimas ventas.
- **Inventario** con registro, edición, activación/desactivación, eliminación
  segura, búsqueda y filtro por categoría y estado.
- **Ventas** con búsqueda de productos, carrito, cantidades, subtotales, total,
  descuento automático de stock, bloqueo por existencias e historial.
- **Clientes** con registro, consulta, búsqueda y edición.
- **Alertas** de stock bajo, productos agotados y próximos vencimientos.
- **Seguridad** con contraseñas cifradas con bcryptjs, sesiones JWT y rutas
  protegidas.

## Requisitos

- Node.js 20 o superior.
- MongoDB Community Server en ejecución en `127.0.0.1:27017`.
- `mongosh` para los scripts de base de datos.

## Instalación y arranque local

```bash
# 1. Backend
cd backend
npm ci
cp .env.example .env    # completar valores locales
npm run db:crear        # crea base de datos, colecciones, validaciones e índices
npm run db:admin        # crea el administrador inicial
npm run dev             # API en http://localhost:3000

# 2. Frontend (en otra terminal)
cd frontend
npm ci
npm run dev             # panel en http://localhost:5173
```

En Windows también puedes copiar `.env.example` con el Explorador y ejecutar los
mismos comandos.

### Variables de entorno del backend

Archivo `backend/.env` (no se sube a GitHub):

```env
MONGODB_URI=mongodb://127.0.0.1:27017/nova_salud
PORT=3000
JWT_SECRET=
ADMIN_NOMBRE=Administrador
ADMIN_APELLIDO=Nova Salud
ADMIN_CORREO=admin@novasalud.test
ADMIN_PASSWORD=
```

- `JWT_SECRET` es obligatorio para iniciar sesión: usa una cadena larga y privada.
- Si `ADMIN_PASSWORD` queda vacío, `npm run db:admin` genera una contraseña
  aleatoria y la muestra una sola vez.
- En producción cambia `MONGODB_URI` por la cadena de MongoDB Atlas y define
  `JWT_SECRET` en el panel de Vercel.

### Datos de demostración (opcional)

```bash
cd backend
npm run db:demo
```

Crea un empleado, cinco productos, un cliente, una venta y un movimiento
claramente identificados con `DEMO`. Incluye un producto agotado, uno con stock
bajo y uno próximo a vencer para probar las alertas. No crea administradores ni
credenciales públicas.

## Scripts

### Backend

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia la API en el puerto configurado |
| `npm run dev` | Inicia la API con recarga automática |
| `npm run db:crear` | Crea colecciones, validaciones e índices con mongosh |
| `npm run db:admin` | Crea el administrador inicial |
| `npm run db:demo` | Carga datos ficticios de demostración |
| `npm run db:verificar` | Comprueba la base de datos y los modelos (27 pruebas) |

### Frontend

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Panel de desarrollo en el puerto 5173 |
| `npm run build` | Genera la versión de producción en `frontend/dist` |
| `npm run preview` | Sirve la compilación de producción |

## Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/salud` | Estado de la API y la conexión |
| POST | `/api/auth/login` | Inicio de sesión y token JWT |
| GET | `/api/auth/perfil` | Perfil del usuario autenticado |
| POST | `/api/auth/registro` | Registro de usuarios (solo ADMIN) |
| GET | `/api/productos` | Lista con `buscar`, `categoria` y `estado` |
| GET | `/api/productos/categorias` | Categorías activas |
| POST/PUT | `/api/productos` | Registrar y editar productos |
| PATCH | `/api/productos/:id/estado` | Activar o desactivar |
| DELETE | `/api/productos/:id` | Eliminar si no tiene historial |
| GET/POST/PUT | `/api/clientes` | Consultar, registrar y editar clientes |
| GET/POST | `/api/ventas` | Historial y registro de ventas |
| GET | `/api/dashboard` | Métricas del panel |
| GET | `/api/dashboard/alertas` | Stock bajo, agotados y vencimientos |

## Estructura

```
NovaSalud/
├── backend/
│   ├── app.js                Aplicación Express
│   ├── index.js              Arranque local
│   ├── config/database.js    Conexión reutilizable a MongoDB
│   ├── controllers/          Lógica de auth, productos, clientes, ventas, dashboard
│   ├── middleware/           JWT, roles y manejo de errores
│   ├── models/               Esquemas Mongoose
│   ├── routes/               Rutas de la API
│   ├── database/             Scripts de mongosh, admin, demo y verificación
│   └── .env.example
└── frontend/
    ├── src/componentes/      Iconos y modal
    ├── src/paginas/          Login, Dashboard, Inventario, Ventas, Clientes, Alertas
    ├── src/api.js            Cliente de API, URL configurable y formato
    ├── vercel.json           Fallback del SPA en Vercel
    ├── .env.example          Ejemplo de VITE_API_URL
    └── vite.config.js        Proxy /api y host de desarrollo
```

## Pruebas

```bash
cd backend && npm run db:verificar   # 27 comprobaciones de base de datos y modelos
cd frontend && npm run build         # compilación de producción
```

Consulta `INFORME_NOVA_SALUD.md` para el detalle de las pruebas realizadas y las
capturas que deben incluirse en el informe.

## Despliegue en Vercel con MongoDB Atlas

El despliegue recomendado usa **dos proyectos de Vercel sobre el mismo
repositorio**, porque el backend es una aplicación Express y el frontend es un
SPA de Vite:

1. **Backend** (`backend/`): Vercel detecta Express y lo publica como un único
   Vercel Function. No hace falta `api/index.js` ni rewrites manuales.
2. **Frontend** (`frontend/`): Vercel compila Vite y sirve `dist` con
   `frontend/vercel.json` como fallback del SPA.

### 1. Preparar MongoDB Atlas

1. Crear un proyecto y un clúster gratuito M0 en MongoDB Atlas.
2. En **Database Access**, crear un usuario con contraseña y rol `readWrite`
   sobre la base `nova_salud`.
3. En **Network Access**, permitir `0.0.0.0/0` para la entrega académica (o la
   IP correspondiente).
4. En **Connect → Drivers**, copiar la cadena `mongodb+srv://...` y agregar el
   nombre de la base antes de `?`: `...mongodb.net/nova_salud?retryWrites=true...`

### 2. Crear las colecciones en Atlas

Desde la raíz del repositorio, con `mongosh` instalado:

```bash
mongosh "mongodb+srv://USUARIO:CONTRASENA@cluster.mongodb.net/nova_salud" \
  --file backend/database/nova_salud.js
```

Luego, con `MONGODB_URI` apuntando a Atlas en `backend/.env`:

```bash
cd backend
npm ci
npm run db:admin
npm run db:demo      # opcional
```

### 3. Desplegar el backend

1. En Vercel: **Add New → Project** e importar este repositorio.
2. En **Root Directory**, elegir `backend`.
3. Vercel detecta Express automáticamente; no se necesita comando de build.
4. Agregar variables de entorno:
   - `MONGODB_URI` = cadena de Atlas con `/nova_salud`.
   - `JWT_SECRET` = cadena larga y aleatoria.
5. Desplegar y comprobar `https://TU-BACKEND.vercel.app/api/salud`.

### 4. Desplegar el frontend

1. Crear otro proyecto de Vercel con el mismo repositorio.
2. En **Root Directory**, elegir `frontend`.
3. Framework: Vite. Build: `npm run build`. Output: `dist`.
4. Agregar `VITE_API_URL=https://TU-BACKEND.vercel.app/api`.
5. Desplegar y probar el inicio de sesión.

`VITE_API_URL` se incorpora al compilar: si cambia, hay que volver a desplegar el
frontend. El backend permite CORS para que el frontend pueda llamarlo desde otro
dominio.

> El despliegue no fue ejecutado en este entorno: no hay cuenta de Vercel ni un
> clúster de Atlas configurado. El proyecto queda preparado y funciona localmente.
> Si se cambia de dominio, actualizar `VITE_API_URL` y volver a desplegar.

## Seguridad

- Las contraseñas se cifran con bcryptjs antes de guardarse.
- El inicio de sesión devuelve un JWT firmado con `JWT_SECRET` (12 horas).
- Todas las rutas de datos requieren token; el registro de usuarios requiere rol
  ADMIN.
- Los precios y totales de una venta se calculan en el servidor, no en el
  navegador.
- Ningún archivo `.env` se versiona; solo se publica `.env.example`.
