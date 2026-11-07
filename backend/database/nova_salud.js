// ============================================================================
// Nova Salud - Creación y verificación de la base de datos con mongosh
// ----------------------------------------------------------------------------
// Este archivo NO usa Mongoose: se ejecuta directamente en mongosh para crear
// la base de datos, las colecciones, las validaciones JSON Schema y los índices.
//
// Uso recomendado (desde la raíz del repositorio):
//   mongosh "mongodb://127.0.0.1:27017/nova_salud" --file backend/database/nova_salud.js
//
// También puedes abrir mongosh y pegar el contenido, o ejecutarlo desde la
// carpeta backend/:
//   mongosh "mongodb://127.0.0.1:27017/nova_salud" --file database/nova_salud.js
//
// El script es idempotente: se puede ejecutar varias veces sin duplicar
// colecciones ni índices. Solo actualiza las validaciones existentes.
// ============================================================================

const baseDeDatos = db.getSiblingDB("nova_salud");

// Muestra la cadena de conexión sin usuario ni contraseña.
function uriSinCredenciales() {
  try {
    return baseDeDatos
      .getMongo()
      .getURI()
      .replace(/\/\/([^@/]+)@/, "//***:***@");
  } catch (error) {
    return "no disponible";
  }
}

print("");
print("==========================================================");
print(" Nova Salud - configuración de la base de datos");
print(` Conexión: ${uriSinCredenciales()}`);
print(` Base de datos: ${baseDeDatos.getName()}`);
print("==========================================================");
print("");

// ----------------------------------------------------------------------------
// 1. COLECCIONES Y VALIDACIONES JSON SCHEMA
// ----------------------------------------------------------------------------
// Las validaciones de MongoDB son independientes de Mongoose:
//   - Aquí se validan los tipos y campos obligatorios que llegan al servidor.
//   - Las reglas que comparan dos campos (por ejemplo precioVenta >= precioCompra,
//     subtotal = cantidad * precioUnitario o stockNuevo = stockAnterior + cantidad)
//     se validan en los modelos de Mongoose, porque JSON Schema no compara campos.
//   - La unicidad NO se define en JSON Schema: se garantiza con índices únicos.
//
// Las validaciones usan los mismos nombres de campos y valores permitidos que
// los modelos de backend/models, de modo que un documento creado con Mongoose
// siempre pasa la validación de MongoDB.
// ----------------------------------------------------------------------------

const colecciones = [
  {
    nombre: "usuarios",
    validacion: {
      $jsonSchema: {
        bsonType: "object",
        title: "Validación de usuarios",
        description:
          "Usuario del sistema. La contraseña se guarda cifrada con bcrypt.",
        required: [
          "nombre",
          "apellido",
          "correo",
          "password",
          "rol",
          "estado",
          "fechaCreacion",
        ],
        additionalProperties: false,
        properties: {
          _id: { bsonType: "objectId" },
          nombre: {
            bsonType: "string",
            minLength: 1,
            description: "Nombre del usuario (obligatorio)",
          },
          apellido: {
            bsonType: "string",
            minLength: 1,
            description: "Apellido del usuario (obligatorio)",
          },
          correo: {
            bsonType: "string",
            pattern: "^\\S+@\\S+\\.\\S+$",
            description: "Correo único del usuario",
          },
          password: {
            bsonType: "string",
            minLength: 8,
            description: "Contraseña cifrada con bcrypt (nunca en texto plano)",
          },
          rol: {
            enum: ["ADMIN", "EMPLEADO"],
            description: "Rol del usuario",
          },
          estado: {
            enum: ["ACTIVO", "INACTIVO"],
            description: "Estado del usuario",
          },
          fechaCreacion: {
            bsonType: "date",
            description: "Fecha de creación del registro",
          },
        },
      },
    },
  },
  {
    nombre: "productos",
    validacion: {
      $jsonSchema: {
        bsonType: "object",
        title: "Validación de productos",
        description: "Producto del inventario de la botica.",
        required: [
          "nombre",
          "codigo",
          "categoria",
          "descripcion",
          "precioCompra",
          "precioVenta",
          "stock",
          "stockMinimo",
          "lote",
          "fechaVencimiento",
          "presentacion",
          "estado",
          "fechaCreacion",
          "fechaActualizacion",
        ],
        additionalProperties: false,
        properties: {
          _id: { bsonType: "objectId" },
          nombre: {
            bsonType: "string",
            minLength: 1,
            description: "Nombre del producto (obligatorio)",
          },
          codigo: {
            bsonType: "string",
            minLength: 1,
            description: "Código único del producto",
          },
          categoria: {
            bsonType: "string",
            minLength: 1,
            description: "Categoría del producto (obligatoria)",
          },
          descripcion: {
            bsonType: "string",
            description: "Descripción del producto (puede estar vacía)",
          },
          precioCompra: {
            bsonType: "number",
            minimum: 0,
            description: "Precio de compra, no puede ser negativo",
          },
          precioVenta: {
            bsonType: "number",
            minimum: 0,
            description: "Precio de venta, no puede ser negativo",
          },
          stock: {
            bsonType: "number",
            minimum: 0,
            multipleOf: 1,
            description: "Stock actual, entero mayor o igual a 0",
          },
          stockMinimo: {
            bsonType: "number",
            minimum: 0,
            multipleOf: 1,
            description: "Stock mínimo, entero mayor o igual a 0",
          },
          lote: {
            bsonType: "string",
            minLength: 1,
            description: "Lote del producto (obligatorio)",
          },
          fechaVencimiento: {
            bsonType: "date",
            description: "Fecha de vencimiento del producto",
          },
          presentacion: {
            bsonType: "string",
            minLength: 1,
            description: "Presentación del producto (obligatoria)",
          },
          estado: {
            enum: ["ACTIVO", "INACTIVO"],
            description: "Estado del producto",
          },
          fechaCreacion: {
            bsonType: "date",
            description: "Fecha de creación del registro",
          },
          fechaActualizacion: {
            bsonType: "date",
            description: "Fecha de la última actualización",
          },
        },
      },
    },
  },
  {
    nombre: "clientes",
    validacion: {
      $jsonSchema: {
        bsonType: "object",
        title: "Validación de clientes",
        description: "Cliente de la botica.",
        required: [
          "nombre",
          "apellido",
          "tipoDocumento",
          "numeroDocumento",
          "telefono",
          "correo",
          "direccion",
          "fechaCreacion",
        ],
        additionalProperties: false,
        properties: {
          _id: { bsonType: "objectId" },
          nombre: {
            bsonType: "string",
            minLength: 1,
            description: "Nombre del cliente (obligatorio)",
          },
          apellido: {
            bsonType: "string",
            minLength: 1,
            description: "Apellido del cliente (obligatorio)",
          },
          tipoDocumento: {
            enum: ["DNI", "CE", "RUC", "PASAPORTE"],
            description: "Tipo de documento de identidad",
          },
          numeroDocumento: {
            bsonType: "string",
            minLength: 8,
            description: "Número de documento (mínimo 8 caracteres)",
          },
          telefono: {
            bsonType: "string",
            description: "Teléfono del cliente (puede estar vacío)",
          },
          correo: {
            bsonType: "string",
            description: "Correo del cliente (opcional)",
          },
          direccion: {
            bsonType: "string",
            description: "Dirección del cliente (opcional)",
          },
          fechaCreacion: {
            bsonType: "date",
            description: "Fecha de creación del registro",
          },
        },
      },
    },
  },
  {
    nombre: "ventas",
    validacion: {
      $jsonSchema: {
        bsonType: "object",
        title: "Validación de ventas",
        description:
          "Venta con el detalle de productos y el precio histórico de cada uno.",
        required: [
          "codigoVenta",
          "cliente",
          "empleado",
          "productos",
          "subtotal",
          "total",
          "metodoPago",
          "estado",
          "fechaVenta",
        ],
        additionalProperties: false,
        properties: {
          _id: { bsonType: "objectId" },
          codigoVenta: {
            bsonType: "string",
            minLength: 1,
            description: "Código único de la venta",
          },
          cliente: {
            bsonType: "objectId",
            description: "Referencia al cliente",
          },
          empleado: {
            bsonType: "objectId",
            description: "Referencia al usuario que registró la venta",
          },
          productos: {
            bsonType: "array",
            minItems: 1,
            description: "Detalle de productos vendidos",
            items: {
              bsonType: "object",
              required: [
                "producto",
                "nombreProducto",
                "cantidad",
                "precioUnitario",
                "subtotal",
              ],
              additionalProperties: false,
              properties: {
                producto: {
                  bsonType: "objectId",
                  description: "Referencia al producto",
                },
                nombreProducto: {
                  bsonType: "string",
                  minLength: 1,
                  description: "Nombre del producto al momento de la venta",
                },
                cantidad: {
                  bsonType: "number",
                  minimum: 1,
                  multipleOf: 1,
                  description: "Cantidad vendida, entero mayor o igual a 1",
                },
                precioUnitario: {
                  bsonType: "number",
                  minimum: 0,
                  description: "Precio histórico del producto en la venta",
                },
                subtotal: {
                  bsonType: "number",
                  minimum: 0,
                  description: "Cantidad por precio unitario",
                },
              },
            },
          },
          subtotal: {
            bsonType: "number",
            minimum: 0,
            description: "Suma de los subtotales del detalle",
          },
          total: {
            bsonType: "number",
            minimum: 0,
            description: "Total de la venta",
          },
          metodoPago: {
            enum: ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE", "PLIN"],
            description: "Método de pago utilizado",
          },
          estado: {
            enum: ["REGISTRADA", "ANULADA"],
            description: "Estado de la venta",
          },
          fechaVenta: {
            bsonType: "date",
            description: "Fecha de la venta",
          },
        },
      },
    },
  },
  {
    nombre: "movimientos",
    validacion: {
      $jsonSchema: {
        bsonType: "object",
        title: "Validación de movimientos",
        description:
          "Movimiento de inventario con el usuario responsable y el stock antes y después.",
        required: [
          "producto",
          "tipoMovimiento",
          "cantidad",
          "stockAnterior",
          "stockNuevo",
          "motivo",
          "usuario",
          "fechaMovimiento",
        ],
        additionalProperties: false,
        properties: {
          _id: { bsonType: "objectId" },
          producto: {
            bsonType: "objectId",
            description: "Referencia al producto",
          },
          tipoMovimiento: {
            enum: ["ENTRADA", "SALIDA", "AJUSTE"],
            description: "Tipo de movimiento de inventario",
          },
          cantidad: {
            bsonType: "number",
            minimum: 1,
            multipleOf: 1,
            description: "Cantidad movida, entero mayor o igual a 1",
          },
          stockAnterior: {
            bsonType: "number",
            minimum: 0,
            multipleOf: 1,
            description: "Stock antes del movimiento",
          },
          stockNuevo: {
            bsonType: "number",
            minimum: 0,
            multipleOf: 1,
            description: "Stock después del movimiento",
          },
          motivo: {
            bsonType: "string",
            minLength: 1,
            description: "Motivo del movimiento (obligatorio)",
          },
          usuario: {
            bsonType: "objectId",
            description: "Referencia al usuario responsable",
          },
          referenciaVenta: {
            bsonType: ["objectId", "null"],
            description: "Venta relacionada, si el movimiento nace de una venta",
          },
          fechaMovimiento: {
            bsonType: "date",
            description: "Fecha del movimiento",
          },
        },
      },
    },
  },
];

print("1) Colecciones y validaciones");
print("----------------------------------------------------------");

for (const definicion of colecciones) {
  const yaExiste = baseDeDatos
    .getCollectionNames()
    .includes(definicion.nombre);

  if (yaExiste) {
    baseDeDatos.runCommand({
      collMod: definicion.nombre,
      validator: definicion.validacion,
      validationLevel: "strict",
      validationAction: "error",
    });
    print(`   Actualizada la validación de: ${definicion.nombre}`);
  } else {
    baseDeDatos.createCollection(definicion.nombre, {
      validator: definicion.validacion,
      validationLevel: "strict",
      validationAction: "error",
    });
    print(`   Colección creada: ${definicion.nombre}`);
  }
}

print("");

// ----------------------------------------------------------------------------
// 2. ÍNDICES
// ----------------------------------------------------------------------------
// Se usan los nombres de índice que genera Mongoose por defecto (por ejemplo
// "codigo_1" o "tipoDocumento_1_numeroDocumento_1") para que ambos creen el
// mismo índice y no queden índices duplicados.
// ----------------------------------------------------------------------------

const indices = [
  {
    coleccion: "usuarios",
    claves: { correo: 1 },
    opciones: { unique: true },
    motivo: "Un correo por usuario",
  },
  {
    coleccion: "productos",
    claves: { codigo: 1 },
    opciones: { unique: true },
    motivo: "Código de producto único",
  },
  {
    coleccion: "productos",
    claves: { nombre: 1 },
    opciones: {},
    motivo: "Búsqueda por nombre",
  },
  {
    coleccion: "clientes",
    claves: { tipoDocumento: 1, numeroDocumento: 1 },
    opciones: { unique: true },
    motivo: "Documento único por tipo de documento",
  },
  {
    coleccion: "ventas",
    claves: { codigoVenta: 1 },
    opciones: { unique: true },
    motivo: "Código de venta único",
  },
  {
    coleccion: "ventas",
    claves: { fechaVenta: 1 },
    opciones: {},
    motivo: "Consultas y reportes por fecha de venta",
  },
  {
    coleccion: "movimientos",
    claves: { fechaMovimiento: 1 },
    opciones: {},
    motivo: "Consultas por fecha de movimiento",
  },
];

print("2) Índices");
print("----------------------------------------------------------");

for (const indice of indices) {
  baseDeDatos
    .getCollection(indice.coleccion)
    .createIndex(indice.claves, indice.opciones);

  const nombreIndice = baseDeDatos
    .getCollection(indice.coleccion)
    .getIndexes()
    .find((actual) => JSON.stringify(actual.key) === JSON.stringify(indice.claves)).name;

  print(
    `   ${indice.coleccion}.${nombreIndice} -> ${indice.motivo}`
  );
}

print("");

// ----------------------------------------------------------------------------
// 3. COMPROBACIÓN DE COLECCIONES E ÍNDICES
// ----------------------------------------------------------------------------

print("3) Comprobación de la estructura");
print("----------------------------------------------------------");

const nombresEsperados = colecciones.map((definicion) => definicion.nombre);
const nombresCreados = baseDeDatos.getCollectionNames().sort();

print(`   Base de datos: ${baseDeDatos.getName()}`);
print(`   Colecciones encontradas: ${nombresCreados.join(", ")}`);

const faltantes = nombresEsperados.filter(
  (nombre) => !nombresCreados.includes(nombre)
);

if (faltantes.length === 0) {
  print("   Las 5 colecciones existen.");
} else {
  print(`   ATENCIÓN: faltan colecciones: ${faltantes.join(", ")}`);
}

const resumen = baseDeDatos.getCollectionInfos().map((info) => ({
  coleccion: info.name,
  documentos: baseDeDatos.getCollection(info.name).countDocuments(),
  indices: baseDeDatos
    .getCollection(info.name)
    .getIndexes()
    .map((indice) => indice.name),
  validacion: info.options && info.options.validator ? "sí" : "no",
}));

printjson(resumen);

print("");

// ----------------------------------------------------------------------------
// 4. CONSULTAS DE EJEMPLO
// ----------------------------------------------------------------------------
// Funcionan con o sin datos: si aún no hay documentos, no muestran nada.
// La proyección { password: 0 } evita mostrar la contraseña cifrada.
// ----------------------------------------------------------------------------

print("4) Consultas de comprobación");
print("----------------------------------------------------------");

print("   Último usuario registrado (sin contraseña):");
printjson(baseDeDatos.usuarios.findOne({}, { password: 0 }));

print("   Productos ordenados por nombre (máximo 5):");
printjson(
  baseDeDatos.productos.find({}).sort({ nombre: 1 }).limit(5).toArray()
);

print("   Productos con stock igual o menor al stock mínimo:");
printjson(
  baseDeDatos.productos
    .find({ $expr: { $lte: ["$stock", "$stockMinimo"] } })
    .toArray()
);

print("   Cantidad de clientes:");
printjson(baseDeDatos.clientes.countDocuments());

print("   Últimas 3 ventas:");
printjson(
  baseDeDatos.ventas.find({}).sort({ fechaVenta: -1 }).limit(3).toArray()
);

print("   Últimos 3 movimientos:");
printjson(
  baseDeDatos.movimientos
    .find({})
    .sort({ fechaMovimiento: -1 })
    .limit(3)
    .toArray()
);

print("");
print("Listo. La base de datos nova_salud está configurada.");
print("Puedes cargar datos ficticios con: npm run db:demo");
print("");
