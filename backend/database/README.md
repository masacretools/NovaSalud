# Base de datos de Nova Salud (MongoDB)

Documentación de la FASE 2: conexión a MongoDB, creación de las colecciones con
`mongosh`, validaciones JSON Schema, índices y modelos de Mongoose.

## 1. Requisitos

- MongoDB Community Server instalado y en ejecución en `127.0.0.1:27017`.
- `mongosh` (MongoDB Shell) disponible en la terminal.
- Node.js y las dependencias del backend instaladas.

Comprobar que el servidor de MongoDB está activo:

```bash
mongosh --eval 'db.runCommand({ ping: 1 })'
```

Si la respuesta es `{ ok: 1 }`, el servidor está disponible.

Instalar las dependencias del backend (desde la carpeta `backend/`):

```bash
npm ci
```

## 2. Variables de entorno

El archivo `backend/.env.example` es la plantilla. Copiarlo a `backend/.env` y
completar los valores en la máquina local:

```bash
cd backend
cp .env.example .env
```

Contenido esperado para el entorno local:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/nova_salud
PORT=3000
JWT_SECRET=
```

`backend/.env` no se sube a GitHub porque está incluido en `.gitignore`.
El archivo `.env.example` solo contiene valores de ejemplo, nunca credenciales
reales.

### MongoDB Atlas (producción)

La misma variable `MONGODB_URI` acepta la cadena de conexión de Atlas:

```env
MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@cluster.ejemplo.mongodb.net/nova_salud
```

La conexión se escribe una sola vez en `config/database.js`, así que no hay que
cambiar el código al pasar de local a Atlas. En Atlas recuerda habilitar la IP
del servidor en **Network Access**.

## 3. Estructura de archivos de la FASE 2

```
backend/
├── config/
│   └── database.js          Conexión reutilizable a MongoDB con Mongoose
├── database/
│   ├── nova_salud.js        Script de mongosh: colecciones, validaciones e índices
│   ├── datos_demostracion.js Datos ficticios opcionales
│   ├── verificar_fase2.js   Comprobaciones automáticas (1 a 10)
│   └── README.md            Este documento
├── models/
│   ├── Usuario.js
│   ├── Producto.js
│   ├── Cliente.js
│   ├── Venta.js
│   └── Movimiento.js
├── .env.example
└── index.js
```

## 4. Cómo ingresar a mongosh

Abrir una terminal y ejecutar:

```bash
mongosh
```

Para entrar directamente a la base de datos del proyecto:

```bash
mongosh "mongodb://127.0.0.1:27017/nova_salud"
```

Para salir:

```javascript
exit
```

## 5. Cómo seleccionar la base de datos

Dentro de mongosh:

```javascript
use nova_salud
```

La respuesta es `switched to db nova_salud`. Comprobar cuál está seleccionada:

```javascript
db.getName()
```

Dentro de un archivo `.js` de mongosh también se puede seleccionar sin cambiar
la sesión:

```javascript
const baseDeDatos = db.getSiblingDB("nova_salud");
```

## 6. Cómo crear las colecciones

La forma recomendada es ejecutar el script incluido, que crea la base de datos,
las cinco colecciones, las validaciones JSON Schema y los índices. Es
idempotente: se puede ejecutar varias veces sin duplicar nada.

Desde la carpeta `backend/`:

```bash
npm run db:crear
```

Ese comando ejecuta:

```bash
mongosh --file database/nova_salud.js
```

También se puede ejecutar desde la raíz del repositorio:

```bash
mongosh "mongodb://127.0.0.1:27017/nova_salud" --file backend/database/nova_salud.js
```

El script muestra al final las colecciones creadas, sus índices y la cantidad de
documentos.

### Creación manual (opcional, para el informe)

También es válido crear la base de datos y una colección a mano en mongosh:

```javascript
use nova_salud

db.createCollection("productos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "codigo", "precioVenta", "stock"],
      properties: {
        nombre: { bsonType: "string" },
        codigo: { bsonType: "string" },
        precioVenta: { bsonType: "number", minimum: 0 },
        stock: { bsonType: "number", minimum: 0, multipleOf: 1 }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})
```

En el proyecto se usa el script completo porque define las cinco colecciones con
todas sus reglas.

## 7. Colecciones, validaciones e índices

### Colecciones

| Colección    | Modelo       | Contenido principal                                       |
| ------------ | ------------ | --------------------------------------------------------- |
| `usuarios`   | `Usuario`    | Usuarios con rol `ADMIN` o `EMPLEADO` y contraseña cifrada |
| `productos`  | `Producto`   | Inventario, precios, stock, lote y vencimiento             |
| `clientes`   | `Cliente`    | Datos y documento de identidad del cliente                 |
| `ventas`     | `Venta`      | Venta con detalle de productos y precio histórico          |
| `movimientos`| `Movimiento` | Entradas, salidas y ajustes de inventario con responsable   |

### Validaciones JSON Schema (MongoDB)

El script `nova_salud.js` define un `$jsonSchema` por colección con:

- Campos obligatorios (`required`).
- Tipos de datos (`bsonType`).
- Valores permitidos (`enum`): roles, estados, tipos de movimiento, métodos de pago.
- Rangos numéricos (`minimum`): precios y cantidades no negativos.
- Números enteros (`multipleOf: 1`): stock y cantidades.
- Longitudes mínimas y formato de correo (`pattern`).
- Proyección cerrada (`additionalProperties: false`): no se guardan campos que no
  estén definidos en el esquema.

Estas validaciones se ejecutan en el servidor: si un documento no las cumple,
MongoDB rechaza la operación con el error `121 Document failed validation`.

### Diferencia entre las validaciones de MongoDB y las de Mongoose

| Regla                                                        | MongoDB (`$jsonSchema`) | Mongoose |
| ------------------------------------------------------------ | ----------------------- | -------- |
| Campo obligatorio, tipo, enum, mínimo, entero                 | Sí                      | Sí       |
| Correo con formato                                            | Sí (`pattern`)          | Sí (`match`) |
| `precioVenta >= precioCompra`                                 | No (no compara campos)  | Sí (`pre` de validación) |
| `subtotal = cantidad * precioUnitario` y `subtotal = suma`    | No                      | Sí (`pre` de validación) |
| `stockNuevo = stockAnterior ± cantidad`                       | No                      | Sí (`pre` de validación) |
| Unicidad de código, correo y documento                        | No (se logra con índice único) | Sí (`unique`, crea el índice) |
| Contraseña cifrada                                            | No                      | Sí (bcrypt en `pre("save")`) |

En resumen: MongoDB valida la forma del documento y Mongoose valida la lógica
del negocio. Los dos niveles se complementan; no se debe confundir el esquema de
Mongoose con el validador de la colección.

> Las reglas que comparan dos campos se ejecutan al guardar el documento con
> `save()` o `create()`. Si se actualiza un producto con `findOneAndUpdate`, hay
> que usar `runValidators: true` para las reglas de campo (por ejemplo, precios
> negativos) y luego guardar el documento para validar las reglas entre campos.

### Índices

| Colección     | Índice                                        | Tipo     | Motivo                                  |
| ------------- | --------------------------------------------- | -------- | --------------------------------------- |
| `usuarios`    | `{ correo: 1 }`                               | Único    | Un correo por usuario                   |
| `productos`   | `{ codigo: 1 }`                               | Único    | El código de producto no se repite      |
| `productos`   | `{ nombre: 1 }`                               | Normal   | Búsquedas y orden por nombre            |
| `clientes`    | `{ tipoDocumento: 1, numeroDocumento: 1 }`    | Único    | Un documento por tipo de documento      |
| `ventas`      | `{ codigoVenta: 1 }`                          | Único    | El código de venta no se repite         |
| `ventas`      | `{ fechaVenta: 1 }`                           | Normal   | Reportes por fecha de venta             |
| `movimientos` | `{ fechaMovimiento: 1 }`                      | Normal   | Reportes por fecha de movimiento        |

Se usan los nombres de índice que Mongoose genera por defecto (`codigo_1`,
`correo_1`, `tipoDocumento_1_numeroDocumento_1`, etc.) para que el script de
mongosh y los modelos no creen índices duplicados. El script de verificación
comprueba que no existan índices inesperados.

## 8. Cómo ejecutar consultas

Dentro de mongosh, con `use nova_salud`:

```javascript
// Todos los productos activos
db.productos.find({ estado: "ACTIVO" })

// Productos con stock igual o menor al mínimo
db.productos.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } })

// Productos que vencen antes de fin de año
db.productos.find({ fechaVencimiento: { $lt: new Date("2028-01-01") } })

// Ventas de los últimos 30 días
db.ventas.find({
  fechaVenta: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

Consultas con proyección y orden (evita mostrar la contraseña cifrada):

```javascript
db.usuarios.find({ rol: "EMPLEADO" }, { password: 0 }).sort({ apellido: 1 })
```

Documentos relacionados con `$lookup`:

```javascript
db.ventas.aggregate([
  { $match: { estado: "REGISTRADA" } },
  {
    $lookup: {
      from: "clientes",
      localField: "cliente",
      foreignField: "_id",
      as: "datosCliente"
    }
  },
  { $unwind: "$datosCliente" },
  { $project: { codigoVenta: 1, total: 1, "datosCliente.nombre": 1 } }
])
```

## 9. Cómo comprobar los registros

Listar las colecciones de la base de datos:

```javascript
db.getCollectionNames()
```

Comprobar que existen las cinco colecciones esperadas:

```javascript
["usuarios", "productos", "clientes", "ventas", "movimientos"].filter(
  (nombre) => db.getCollectionNames().includes(nombre)
)
```

Ver la cantidad de documentos por colección:

```javascript
db.getCollectionNames().sort().map((nombre) => ({
  coleccion: nombre,
  documentos: db.getCollection(nombre).countDocuments()
}))
```

Revisar los índices de una colección y si son únicos:

```javascript
db.productos.getIndexes()
```

Revisar la validación JSON Schema aplicada a una colección:

```javascript
db.getCollectionInfos({ name: "productos" })[0].options.validator
```

Comprobar que una regla funciona intentando insertar un documento inválido:

```javascript
db.productos.insertOne({
  nombre: "Producto inválido",
  codigo: "INVALIDO-1",
  categoria: "Prueba",
  descripcion: "",
  precioCompra: 1,
  precioVenta: -5, // precio negativo: debe ser rechazado
  stock: 1,
  stockMinimo: 1,
  lote: "L-1",
  fechaVencimiento: new Date("2027-01-01"),
  presentacion: "Caja",
  estado: "ACTIVO",
  fechaCreacion: new Date(),
  fechaActualizacion: new Date()
})
```

La respuesta esperada es `MongoServerError: Document failed validation` (código
121).

## 10. Datos de demostración

El script opcional `datos_demostracion.js` carga documentos ficticios con el
prefijo `DEMO` para probar los modelos: dos cuentas de prueba (ADMIN y EMPLEADO),
un producto, un cliente, una venta y un movimiento.

Desde `backend/`:

```bash
npm run db:demo
```

- Los datos están marcados como demostración (`DEMO-001`, `DEMO-VENTA-001`,
  `(demostración)` en el nombre, correos `@novasalud.test`).
- Las cuentas demo son `admin.demo@novasalud.test` (ADMIN) y
  `empleado.demo@novasalud.test` (EMPLEADO).
- La contraseña de prueba es fija, se cifra con bcrypt y se completa
  automáticamente al seleccionar la cuenta desde el login.
- Son credenciales públicas solo para la demostración académica. No ejecutes
  este script contra una base con datos reales.
- Se puede ejecutar varias veces: actualiza los documentos demo en lugar de
  duplicarlos.

## 11. Comprobación automática de la FASE 2

El script `verificar_fase2.js` comprueba los diez puntos solicitados: conexión,
base de datos, colecciones y validaciones, alta y consulta de un producto,
actualización, unicidad del código y del documento, validaciones de precios,
cantidades y totales, índices sin duplicados y modelos registrados en Mongoose.

Desde `backend/`:

```bash
npm run db:verificar
```

Los documentos de prueba usan el prefijo `PRUEBA-` y se eliminan al terminar. Si
alguna comprobación falla, el script termina con código de salida 1 y muestra
cuál fue el problema.

## 12. Cómo conectar Mongoose

Toda la conexión está en `backend/config/database.js`. Carga `backend/.env`,
reutiliza una única conexión y evita abrir conexiones duplicadas:

```javascript
const mongoose = require("mongoose");

let promesaConexion = null;

async function conectarBaseDeDatos() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!promesaConexion) {
    promesaConexion = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => mongoose.connection)
      .catch((error) => {
        promesaConexion = null;
        throw error;
      });
  }

  return promesaConexion;
}

module.exports = { conectarBaseDeDatos };
```

Uso en un script o en el servidor:

```javascript
const {
  conectarBaseDeDatos,
  desconectarBaseDeDatos,
} = require("./config/database");

const Producto = require("./models/Producto");

async function ejemplo() {
  await conectarBaseDeDatos();

  const productos = await Producto.find({ estado: "ACTIVO" }).limit(5);
  console.log(productos);

  await desconectarBaseDeDatos();
}
```

`backend/index.js` ya usa esta conexión antes de levantar Express:

```bash
cd backend
npm start
```

Salida esperada:

```
MongoDB conectado: nova_salud
Base de datos en uso: nova_salud
Servidor en http://localhost:3000
```

Al conectarse, Mongoose crea los índices declarados en los modelos. Como el
script de mongosh usa los mismos nombres de índice, no se generan duplicados.

## 13. Solución de problemas

| Problema                                             | Causa probable                                            | Solución                                                        |
| ---------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| `ECONNREFUSED 127.0.0.1:27017`                        | MongoDB no está en ejecución                              | Iniciar el servicio de MongoDB Community Server                 |
| `Falta MONGODB_URI`                                   | No existe `backend/.env`                                  | Copiar `.env.example` a `.env`                                  |
| `mongosh: command not found`                          | `mongosh` no está en el `PATH`                            | Instalarlo o agregar su carpeta `bin` al `PATH`                 |
| `Document failed validation` (código 121)             | El documento no cumple el JSON Schema                     | Revisar campos obligatorios, tipos y valores permitidos         |
| `E11000 duplicate key error`                          | Se repitió un valor único (código, correo o documento)    | Usar un valor distinto o actualizar el documento existente      |
| `MongooseServerSelectionError` al usar Atlas          | IP no habilitada o cadena de conexión incorrecta          | Habilitar la IP en Network Access y revisar `MONGODB_URI`       |
| Las validaciones entre campos no se aplican al actualizar | `findOneAndUpdate` valida solo reglas de campo         | Usar `runValidators: true` y guardar el documento con `save()`  |
