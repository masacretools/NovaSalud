# Informe del proyecto Nova Salud

**Sistema web de gestión de inventario y ventas para botica**

Proyecto académico · Fecha: noviembre de 2026

> Las capturas de pantalla deben insertarse en los lugares indicados. Las
> imágenes disponibles se encuentran en la carpeta `capturas/` del repositorio.

---

## 1. Introducción

Las boticas y farmacias pequeñas suelen controlar su inventario en cuadernos o
hojas de cálculo, lo que dificulta conocer las existencias reales, detectar
productos por agotarse y conservar un historial confiable de ventas. Nova Salud
es un sistema web que centraliza esas tareas en un panel administrativo con
inventario, ventas, clientes y alertas automáticas, respaldado por una base de
datos MongoDB.

El proyecto se desarrolló con tecnologías de uso profesional y gratuito:
React, Vite, Node.js, Express, MongoDB, Mongoose y `mongosh`, con estilos CSS
propios y seguridad basada en bcryptjs y JWT.

## 2. Descripción del problema

La botica Nova Salud necesita:

- Saber cuántas unidades de cada producto existen y cuáles están por agotarse.
- Registrar ventas sin equivocarse en el stock ni en los precios.
- Mantener los precios históricos de cada venta aunque el producto cambie de
  precio después.
- Identificar productos vencidos o próximos a vencer.
- Consultar y actualizar los datos de sus clientes.
- Restringir el acceso al sistema a personal autorizado.

Un registro manual no garantiza ninguna de estas condiciones y provoca pérdidas
por desabastecimiento, vencimientos y errores de cobro.

## 3. Objetivo general

Desarrollar un sistema web funcional para la gestión de inventario y ventas de
la botica Nova Salud, con panel administrativo, base de datos MongoDB y control
de acceso, que permita reducir errores operativos y mejorar la toma de
decisiones.

## 4. Objetivos específicos

1. Diseñar la base de datos `nova_salud` con las colecciones `usuarios`,
   `productos`, `clientes`, `ventas` y `movimientos`.
2. Implementar modelos Mongoose con validaciones de campos, precios, cantidades
   y reglas de negocio.
3. Desarrollar una API REST protegida con JWT para inventario, clientes, ventas,
   alertas y métricas.
4. Construir un panel administrativo responsive con dashboard, sidebar, tablas,
   formularios y modales.
5. Automatizar el descuento de stock al registrar una venta e impedir ventas
   superiores a las existencias.
6. Generar alertas de stock bajo, productos agotados y próximos vencimientos.
7. Verificar el funcionamiento mediante pruebas de base de datos, API e
   interfaz.
8. Dejar el proyecto preparado para su despliegue en Vercel con MongoDB Atlas.

## 5. Propuesta de solución

La solución es una aplicación web de tres capas:

1. **Presentación:** panel React + Vite con inicio de sesión, dashboard y módulos
   de inventario, ventas, clientes y alertas.
2. **Lógica de negocio:** API REST en Node.js + Express, validaciones Mongoose y
   reglas como el descuento de stock y el cálculo de totales en el servidor.
3. **Datos:** MongoDB Community Server con validaciones JSON Schema, índices
   únicos y Mongoose como ODM.

El administrador inicia sesión, gestiona el catálogo y registra ventas. Cada
venta descuenta stock de forma atómica, genera un movimiento de inventario y
conserva el precio unitario del momento de la venta.

## 6. Tecnologías utilizadas

| Tecnología | Versión usada | Uso en el proyecto |
| --- | --- | --- |
| React | 19.3 | Interfaz del panel administrativo |
| Vite | 8.3 | Servidor de desarrollo y compilación |
| CSS | Nativo | Diseño responsive azul, blanco y verde |
| Node.js | 26.13 (compatible con 20+) | Entorno de ejecución del backend |
| Express | 5.3 | API REST y middlewares |
| MongoDB Community Server | 8.0.12 | Base de datos documental |
| Mongoose | 9.12 | Modelos, validaciones y consultas |
| mongosh | 2.5.1 | Creación de colecciones, validaciones e índices |
| bcryptjs | 3.0 | Cifrado de contraseñas |
| jsonwebtoken | 9.0 | Autenticación mediante JWT |
| dotenv | 18.0 | Variables de entorno |
| Vercel | Configuración preparada | Despliegue del frontend y función serverless |

## 7. Arquitectura del sistema

```
Navegador (React + Vite)
        │  fetch /api/*  (JWT en cabecera Authorization)
        ▼
Express (Node.js)
  ├── Rutas y middlewares (JWT, roles, errores)
  ├── Controladores (auth, productos, clientes, ventas, dashboard)
  └── Modelos Mongoose (validaciones de negocio)
        │
        ▼
MongoDB (nova_salud)
  ├── usuarios
  ├── productos
  ├── clientes
  ├── ventas
  └── movimientos
```

En desarrollo, Vite redirige `/api` al backend en `http://127.0.0.1:3000`. En
producción se usan dos proyectos de Vercel: el backend Express se publica como
un Vercel Function (detección automática de Express) y el frontend Vite se sirve
como sitio estático. El frontend apunta al backend mediante `VITE_API_URL`, por
lo que no depende de rewrites frágiles entre ambos.

La conexión a MongoDB está centralizada en `backend/config/database.js`:
reutiliza una única conexión, carga `backend/.env` y permite cambiar de MongoDB
local a Atlas modificando solo `MONGODB_URI`.

## 8. Diseño de la base de datos

Base de datos: **`nova_salud`**.

| Colección | Campos principales | Índices |
| --- | --- | --- |
| `usuarios` | nombre, apellido, correo, password, rol (ADMIN/EMPLEADO), estado, fechaCreacion | `correo` único |
| `productos` | nombre, codigo, categoria, descripcion, precioCompra, precioVenta, stock, stockMinimo, lote, fechaVencimiento, presentacion, estado, fechas | `codigo` único, `nombre` |
| `clientes` | nombre, apellido, tipoDocumento, numeroDocumento, telefono, correo, direccion, fechaCreacion | `tipoDocumento + numeroDocumento` único |
| `ventas` | codigoVenta, cliente, empleado, productos[], subtotal, total, metodoPago, estado, fechaVenta | `codigoVenta` único, `fechaVenta` |
| `movimientos` | producto, tipoMovimiento, cantidad, stockAnterior, stockNuevo, motivo, usuario, referenciaVenta, fechaMovimiento | `fechaMovimiento` |

Cada detalle de venta almacena `producto`, `nombreProducto`, `cantidad`,
`precioUnitario` y `subtotal`, conservando el precio histórico aunque el producto
cambie después.

### Validaciones

- **MongoDB (JSON Schema):** campos obligatorios, tipos, enums, mínimos,
  cantidades enteras, formato de correo y proyección cerrada. Se aplican en el
  servidor y rechazan documentos inválidos con el código 121.
- **Mongoose:** unicidad de correo, código de producto y documento de cliente;
  precios no negativos; precio de venta mayor o igual al de compra; subtotales y
  totales coherentes; stock nuevo coherente en los movimientos; contraseña
  cifrada con bcrypt en un hook `pre("save")`.

Las reglas que comparan dos campos no pueden expresarse en JSON Schema y se
validan en Mongoose. La unicidad se garantiza con índices únicos, no con el
validador de colección.

## 9. Descripción de módulos

### Dashboard

Muestra productos activos, ventas registradas, ventas e ingresos del día,
ingresos totales, ticket promedio, stock bajo, agotados, últimas ventas y
productos por reponer.

### Inventario

Permite registrar y editar productos, buscarlos por nombre, código o
descripción, filtrar por categoría y estado, ver precios de compra y venta,
stock y stock mínimo, y activar, desactivar o eliminar productos. La eliminación
se bloquea si el producto tiene ventas o movimientos, para no romper el historial.

### Ventas

Incluye búsqueda de productos activos, carrito con cantidades, cálculo de
subtotales y total en el servidor, selección de cliente y método de pago,
registro de la venta, descuento automático de stock, rechazo de ventas sin
existencias y consulta del historial con detalle.

### Clientes

Registro, búsqueda y edición de clientes con validación del documento único por
tipo de documento.

### Alertas

Detecta productos con stock igual o inferior al mínimo, productos agotados y
productos que vencen en los próximos 90 días, señalando los ya vencidos.

### Seguridad

Inicio de sesión con correo y contraseña, contraseñas cifradas con bcryptjs,
token JWT de 12 horas, rutas protegidas y registro de usuarios restringido al rol
ADMIN. Los precios y totales se calculan en el backend; el navegador no puede
alterarlos.

## 10. Implementación

### Backend

- `app.js` ensambla Express, CORS, JSON y las rutas de la API.
- `config/database.js` centraliza la conexión reutilizable y la carga de `.env`.
- `models/` contiene los cinco esquemas Mongoose.
- `controllers/` implementa autenticación, inventario, clientes, ventas y
  dashboard.
- `middleware/auth.middleware.js` valida el JWT y el rol.
- `middleware/errores.middleware.js` traduce errores de validación, duplicados y
  errores HTTP a respuestas JSON claras.
- `database/nova_salud.js` crea colecciones, validaciones e índices con mongosh.
- `database/crear_admin.js` crea el administrador inicial sin publicar
  credenciales.
- `database/datos_demostracion.js` carga datos ficticios identificados como DEMO.

El registro de una venta:

1. Valida cliente, método de pago y cantidades enteras.
2. Comprueba que cada producto esté activo y tenga stock suficiente.
3. Descuenta stock con una actualización atómica condicionada al stock.
4. Calcula subtotales y total con los precios del servidor.
5. Guarda la venta y un movimiento de SALIDA por producto.
6. Si algo falla, devuelve el stock descontado y elimina la venta parcial.

### Frontend

- `App.jsx` controla la sesión, el sidebar, la navegación y las notificaciones.
- `paginas/Login.jsx` inicia sesión y guarda el token.
- `paginas/Dashboard.jsx` muestra métricas y resúmenes.
- `paginas/Inventario.jsx` implementa el CRUD con modal y filtros.
- `paginas/Ventas.jsx` implementa el carrito, el historial y el detalle.
- `paginas/Clientes.jsx` registra y edita clientes.
- `paginas/Alertas.jsx` muestra los tres grupos de alertas.
- `api.js` usa el proxy `/api` en local y `VITE_API_URL` en producción.
- `index.css` define el panel responsive con colores azul, blanco y verde.

## 11. Pruebas realizadas

Entorno de prueba: Ubuntu 24.04, Node.js 26.13, MongoDB Community 8.0.12,
mongosh 2.5.1, Mongoose 9.12 y React 19.3.

### 11.1 Base de datos y modelos

Comando: `cd backend && npm run db:verificar`.

Resultado real: **27 de 27 comprobaciones correctas**. Se verificó:

- Conexión de Mongoose y existencia de la base `nova_salud`.
- Existencia de las cinco colecciones y sus validaciones JSON Schema.
- Alta, consulta y actualización de un producto (stock 55, precio 3.1, fecha de
  actualización renovada).
- Código de producto duplicado rechazado con E11000.
- Documento de cliente duplicado rechazado con E11000.
- Trece validaciones de precios, cantidades, roles, subtotales, totales, stock y
  referencias rechazadas correctamente.
- Doce índices contando `_id_`, sin duplicados ni índices inesperados.
- Cinco modelos registrados en Mongoose.

También se comprobó directamente en mongosh que un precio negativo, un stock
decimal o un campo obligatorio faltante son rechazados con el código 121, y que
un código repetido produce el código 11000.

**Captura sugerida:** salida completa de `npm run db:verificar`.

### 11.2 API REST

Se ejecutaron 25 comprobaciones automáticas contra el servidor real:

- Login con contraseña incorrecta rechazado (401).
- Ruta protegida sin token rechazada (401).
- Login de administrador correcto con JWT y rol ADMIN.
- Producto creado (201), validación de precio de venta menor al de compra (400),
  código duplicado rechazado (409).
- Búsqueda y edición de producto.
- Cliente creado (201) y documento duplicado rechazado (409).
- Venta registrada con código `V-20261107-0002`, total S/ 12.00.
- Stock descontado de 8 a 5 y movimiento de SALIDA con stockAnterior 8 y
  stockNuevo 5.
- Venta de 99 unidades rechazada por stock insuficiente (409), dejando el stock
  intacto en 5.
- Dashboard con totales, alertas con stock bajo y historial con la venta nueva.
- Producto temporal desactivado, reactivado y eliminado correctamente.
- Eliminación de un producto con historial bloqueada con error 409.
- Edición de un cliente mediante `PUT` (teléfono y dirección actualizados).
- Registro de un usuario EMPLEADO por parte del ADMIN (201).

Resultado: **25 de 25 comprobaciones correctas**.

**Captura sugerida:** consola con las pruebas de la API.

### 11.3 Frontend

- `npm run build` compiló correctamente con Vite 8.3 (25 módulos, sin errores).
- En el navegador se verificó: carga de la pantalla de inicio de sesión, login
  con el administrador, dashboard con tarjetas y tablas, navegación por
  Inventario, Clientes, Alertas y Ventas.
- Se agregó un producto al carrito desde la interfaz y se registró una venta real
  por S/ 0.70 (código `V-20261107-0003`); el stock del Ibuprofeno pasó de 5 a 4 y
  la venta apareció en el historial.

**Capturas:** `capturas/02-dashboard.png`, `capturas/03-inventario.png`,
`capturas/04-clientes.png`, `capturas/05-alertas.png`,
`capturas/07-venta-registrada.png`.

### 11.4 Pruebas no realizadas

- No se desplegó en Vercel: no hay cuenta ni clúster de Atlas configurado en el
  entorno de desarrollo.
- No se probó con múltiples usuarios concurrentes ni con réplica de MongoDB, por
  lo que la venta usa rollback manual en lugar de transacciones distribuidas.
- No se probó en dispositivos móviles físicos; el diseño responsive se verificó
  solo mediante CSS y una ventana de navegador estrecha.
- Los formularios de alta y edición de productos y clientes no se enviaron desde
  el navegador: esas operaciones se verificaron mediante la API. La interfaz de
  los formularios y los modales sí se revisó visualmente al abrir el listado.

## 12. Resultados

| Funcionalidad | Estado | Evidencia |
| --- | --- | --- |
| Inicio de sesión con JWT | Funciona | Prueba de API y navegador |
| Rutas protegidas | Funciona | 401 sin token |
| Dashboard y métricas | Funciona | Prueba de API y navegador |
| Registro y edición de productos | API probada; listado verificado en navegador | API y navegador |
| Búsqueda y filtros de inventario | Implementados y visibles; búsqueda probada por API | API y navegador |
| Activar, desactivar y eliminar productos | API probada, incluido el bloqueo con historial | API |
| Registro de clientes y edición | API probada; listado verificado en navegador | API y navegador |
| Venta con carrito y totales | Funciona | Navegador y API |
| Descuento automático de stock | Funciona | Stock 5 → 4 y 8 → 5 |
| Bloqueo por stock insuficiente | Funciona | 409 y stock intacto |
| Historial y detalle de ventas | Funciona | Navegador |
| Alertas de stock bajo, agotados y vencimientos | Funciona | Prueba de API y navegador |
| Diseño responsive | Implementado, no probado en móvil físico | CSS |
| Despliegue en Vercel | Configuración preparada (dos proyectos), no ejecutado | Express sin configuración manual y `frontend/vercel.json` |

### Limitaciones conocidas

- La anulación de ventas y la devolución de stock no están implementadas.
- No hay módulo de reportes exportables ni gráficos históricos.
- El registro de usuarios existe en la API, pero no tiene pantalla propia.
- MongoDB local funciona como servidor independiente: no se usan transacciones
  nativas, sino descuento atómico con compensación manual.
- La contraseña inicial del administrador se define en `backend/.env` o se genera
  aleatoriamente; no se publica en el repositorio.

## 13. Conclusiones

1. El sistema cumple el objetivo general: permite gestionar productos, clientes y
   ventas desde un panel web con datos persistidos en MongoDB.
2. La separación entre validaciones de MongoDB y validaciones de Mongoose resultó
   adecuada: la base rechaza documentos mal formados y el modelo protege reglas
   de negocio como precios, subtotales y stock.
3. El descuento atómico de stock y la compensación ante errores evitan vender más
   unidades de las disponibles, una de las fallas más frecuentes del control
   manual.
4. Las alertas de stock y vencimientos aportan valor inmediato a la botica, pues
   permiten reponer productos antes de agotarlos o de que venzan.
5. El proyecto quedó documentado, con scripts reproducibles y preparado para un
   despliegue en la nube, aunque ese despliegue aún debe ejecutarse y verificarse.

## 14. Recomendaciones

1. Configurar MongoDB Atlas y desplegar en Vercel como dos proyectos: backend
   Express y frontend Vite, usando `MONGODB_URI`, `JWT_SECRET` y `VITE_API_URL`.
2. Implementar anulación de ventas con reposición de stock y registro de
   movimientos de ajuste.
3. Añadir reportes de ventas por período, producto y categoría, con exportación a
   PDF o Excel.
4. Incorporar una pantalla de gestión de usuarios para que el administrador cree
   empleados sin usar la API directamente.
5. Usar transacciones de MongoDB en un clúster con réplica para reforzar la
   consistencia de las ventas.
6. Agregar pruebas automatizadas permanentes (por ejemplo con Node Test Runner o
   Jest) y ejecutarlas en integración continua.
7. Realizar copias de seguridad periódicas y auditorías de movimientos de
   inventario.

---

## Anexo A. Comandos de ejecución

```bash
# Base de datos y administrador
cd backend
npm ci
npm run db:crear
npm run db:admin
npm run db:demo        # opcional
npm run dev

# Frontend
cd frontend
npm ci
npm run dev

# Verificación
cd backend && npm run db:verificar
cd frontend && npm run build
```

Credenciales de acceso: las define el usuario en `backend/.env` mediante
`ADMIN_CORREO` y `ADMIN_PASSWORD`. No se incluyen contraseñas reales en este
informe ni en el repositorio.

## Anexo B. Capturas para el informe

| Archivo | Contenido |
| --- | --- |
| `capturas/01-login.png` | Pantalla de inicio de sesión (sugerida, no generada) |
| `capturas/02-dashboard.png` | Dashboard con métricas |
| `capturas/03-inventario.png` | Tabla de inventario y filtros |
| `capturas/04-clientes.png` | Directorio de clientes |
| `capturas/05-alertas.png` | Alertas de stock y vencimientos |
| `capturas/06-venta-carrito.png` | Carrito con producto y total (sugerida, no generada) |
| `capturas/07-venta-registrada.png` | Venta registrada e historial |
| `capturas/08-mongosh.png` | Colecciones e índices en mongosh (pendiente) |
| `capturas/09-pruebas.png` | Salida de `npm run db:verificar` (pendiente) |

Las capturas 08 y 09 deben tomarse ejecutando los comandos en la terminal y
guardando la imagen; no se generaron desde el navegador.
