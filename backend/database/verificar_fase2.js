// ============================================================================
// Nova Salud - Comprobación automática de la FASE 2
// ----------------------------------------------------------------------------
// Ejecuta con: npm run db:verificar
//
// Comprueba:
//   1. Conexión con MongoDB a través de Mongoose.
//   2. Existencia de la base de datos nova_salud.
//   3. Existencia de las 5 colecciones y sus validaciones JSON Schema.
//   4. Registro de un producto de prueba.
//   5. Consulta del producto.
//   6. Actualización del producto.
//   7. Código de producto único (índice único).
//   8. Validaciones de precios y cantidades en los modelos.
//   9. Índices creados y sin duplicados.
//  10. Conexión de Mongoose y modelos registrados.
//
// Los documentos de prueba usan el prefijo PRUEBA- y se eliminan al final.
// ============================================================================

const mongoose = require("mongoose");

const {
  conectarBaseDeDatos,
  desconectarBaseDeDatos,
} = require("../config/database");

const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Venta = require("../models/Venta");
const Movimiento = require("../models/Movimiento");

const COLECCIONES_ESPERADAS = [
  "usuarios",
  "productos",
  "clientes",
  "ventas",
  "movimientos",
];

const INDICES_ESPERADOS = {
  usuarios: ["correo_1"],
  productos: ["codigo_1", "nombre_1"],
  clientes: ["tipoDocumento_1_numeroDocumento_1"],
  ventas: ["codigoVenta_1", "fechaVenta_1"],
  movimientos: ["fechaMovimiento_1"],
};

const resultados = [];

function comprobar(numero, descripcion, ok, detalle = "") {
  resultados.push({ numero, descripcion, ok });
  const marca = ok ? "OK  " : "FALLA";
  console.log(
    `${marca} [${String(numero).padStart(2, "0")}] ${descripcion}${
      detalle ? ` -> ${detalle}` : ""
    }`
  );
}

/** Comprueba que un documento NO pase la validación del modelo. */
async function debeFallar(numero, descripcion, documento) {
  try {
    await documento.validate();
    comprobar(numero, descripcion, false, "el modelo aceptó un documento inválido");
  } catch (error) {
    comprobar(
      numero,
      descripcion,
      error.name === "ValidationError",
      error.message.split(":").slice(-1)[0].trim().slice(0, 90)
    );
  }
}

async function main() {
  console.log("==========================================================");
  console.log(" Nova Salud - comprobación de la FASE 2");
  console.log("==========================================================\n");

  // 1. Conexión ------------------------------------------------------------
  let conexion;
  try {
    conexion = await conectarBaseDeDatos();
    comprobar(
      1,
      "Conexión con MongoDB mediante Mongoose",
      conexion.readyState === 1 && mongoose.connection.readyState === 1,
      `${conexion.host}:${conexion.port}`
    );
  } catch (error) {
    comprobar(1, "Conexión con MongoDB mediante Mongoose", false, error.message);
    throw error;
  }

  // 2. Base de datos -------------------------------------------------------
  const { databases } = await conexion.db.admin().listDatabases();
  const nombresDeBases = databases.map((base) => base.name);
  comprobar(
    2,
    "La base de datos nova_salud existe",
    nombresDeBases.includes("nova_salud"),
    `base en uso: ${conexion.name}`
  );

  // 3. Colecciones ---------------------------------------------------------
  const infosColecciones = (await conexion.db.listCollections().toArray()).filter(
    (info) => COLECCIONES_ESPERADAS.includes(info.name)
  );
  const nombresColecciones = infosColecciones.map((info) => info.name);
  const faltanColecciones = COLECCIONES_ESPERADAS.filter(
    (nombre) => !nombresColecciones.includes(nombre)
  );

  comprobar(
    3,
    "Existen las 5 colecciones de Nova Salud",
    faltanColecciones.length === 0,
    `${nombresColecciones.sort().join(", ")}${
      faltanColecciones.length ? ` (faltan: ${faltanColecciones.join(", ")})` : ""
    }`
  );

  const conValidacion = infosColecciones.filter(
    (info) => info.options && info.options.validator
  );
  comprobar(
    3,
    "Las colecciones tienen validación JSON Schema",
    conValidacion.length === COLECCIONES_ESPERADAS.length,
    `${conValidacion.length} de ${COLECCIONES_ESPERADAS.length}`
  );

  const modelosConColeccionCorrecta = [
    [Usuario, "usuarios"],
    [Producto, "productos"],
    [Cliente, "clientes"],
    [Venta, "ventas"],
    [Movimiento, "movimientos"],
  ].every(([modelo, coleccion]) => modelo.collection.collectionName === coleccion);
  comprobar(
    3,
    "Cada modelo apunta a su colección",
    modelosConColeccionCorrecta,
    "usuarios, productos, clientes, ventas, movimientos"
  );

  // 4. Registrar un producto de prueba ------------------------------------
  const codigoPrueba = `PRUEBA-${Date.now()}`;
  const productoDePrueba = new Producto({
    nombre: "Producto de prueba FASE 2",
    codigo: codigoPrueba,
    categoria: "Pruebas",
    descripcion: "Documento temporal para comprobar los modelos.",
    precioCompra: 1.25,
    precioVenta: 2.5,
    stock: 10,
    stockMinimo: 2,
    lote: "LOTE-PRUEBA",
    fechaVencimiento: new Date("2027-06-30"),
    presentacion: "Caja de prueba",
    estado: "ACTIVO",
  });

  await productoDePrueba.save();
  comprobar(
    4,
    "Producto de prueba registrado",
    Boolean(productoDePrueba._id) && productoDePrueba.codigo === codigoPrueba,
    `código ${productoDePrueba.codigo}`
  );

  // 5. Consultar el producto ----------------------------------------------
  const productoConsultado = await Producto.findOne({ codigo: codigoPrueba });
  comprobar(
    5,
    "Producto consultado por código",
    productoConsultado !== null &&
      productoConsultado.nombre === "Producto de prueba FASE 2" &&
      productoConsultado.precioVenta === 2.5,
    `stock ${productoConsultado ? productoConsultado.stock : "n/d"}`
  );

  // 6. Actualizar el producto ---------------------------------------------
  productoConsultado.stock = 42;
  await productoConsultado.save();

  const fechaAntesDeActualizar = productoConsultado.fechaActualizacion;

  await new Promise((resolver) => setTimeout(resolver, 15));

  // Actualización parcial mediante consulta.
  const productoActualizado = await Producto.findOneAndUpdate(
    { codigo: codigoPrueba },
    { $set: { stock: 55 } },
    { returnDocument: "after", runValidators: true }
  );

  // Actualización completa del documento (valida también las reglas entre campos).
  productoActualizado.precioVenta = 3.1;
  await productoActualizado.save();

  const productoFinal = await Producto.findOne({ codigo: codigoPrueba });

  comprobar(
    6,
    "Producto actualizado con save y findOneAndUpdate",
    productoFinal.stock === 55 &&
      productoFinal.precioVenta === 3.1 &&
      productoFinal.fechaActualizacion > fechaAntesDeActualizar,
    `stock ${productoFinal.stock}, precio ${productoFinal.precioVenta}`
  );

  // 7. Código único -------------------------------------------------------
  let codigoDuplicadoBloqueado = false;
  let codigoError = "";
  try {
    await Producto.create({
      nombre: "Producto duplicado de prueba",
      codigo: codigoPrueba,
      categoria: "Pruebas",
      descripcion: "",
      precioCompra: 1,
      precioVenta: 1.5,
      stock: 1,
      stockMinimo: 1,
      lote: "LOTE-PRUEBA-2",
      fechaVencimiento: new Date("2027-06-30"),
      presentacion: "Caja de prueba",
      estado: "ACTIVO",
    });
  } catch (error) {
    codigoDuplicadoBloqueado = error.code === 11000;
    codigoError = error.code ? `código ${error.code}` : error.message;
  }
  comprobar(
    7,
    "El código de producto no se puede duplicar",
    codigoDuplicadoBloqueado,
    codigoError
  );

  // Documento de cliente único (índice compuesto) -------------------------
  const numeroDocumentoPrueba = "99999999";
  await Cliente.deleteMany({ numeroDocumento: numeroDocumentoPrueba });

  const clientePrueba = await Cliente.create({
    nombre: "Cliente",
    apellido: "De prueba",
    tipoDocumento: "DNI",
    numeroDocumento: numeroDocumentoPrueba,
    telefono: "900000000",
    correo: "cliente.prueba@novasalud.test",
    direccion: "Dirección de prueba",
  });

  let documentoDuplicadoBloqueado = false;
  let documentoError = "";
  try {
    await Cliente.create({
      nombre: "Cliente",
      apellido: "Duplicado",
      tipoDocumento: "DNI",
      numeroDocumento: numeroDocumentoPrueba,
      telefono: "",
      correo: "",
      direccion: "",
    });
  } catch (error) {
    documentoDuplicadoBloqueado = error.code === 11000;
    documentoError = error.code ? `código ${error.code}` : error.message;
  }
  comprobar(
    7,
    "El documento del cliente no se puede duplicar",
    documentoDuplicadoBloqueado,
    documentoError
  );

  // 8. Validaciones de precios y cantidades -------------------------------
  const datosProductoBase = {
    nombre: "Producto de validación",
    codigo: "PRUEBA-VALIDACION",
    categoria: "Pruebas",
    descripcion: "",
    precioCompra: 1,
    precioVenta: 2,
    stock: 5,
    stockMinimo: 1,
    lote: "LOTE-VALIDACION",
    fechaVencimiento: new Date("2027-06-30"),
    presentacion: "Caja",
    estado: "ACTIVO",
  };

  await debeFallar(
    8,
    "Rechaza precio de compra negativo",
    new Producto({ ...datosProductoBase, precioCompra: -1 })
  );
  await debeFallar(
    8,
    "Rechaza precio de venta menor al precio de compra",
    new Producto({ ...datosProductoBase, precioVenta: 0.5 })
  );
  await debeFallar(
    8,
    "Rechaza stock negativo",
    new Producto({ ...datosProductoBase, stock: -5 })
  );
  await debeFallar(
    8,
    "Rechaza stock con decimales",
    new Producto({ ...datosProductoBase, stock: 1.5 })
  );
  await debeFallar(
    8,
    "Rechaza producto sin código",
    new Producto({ ...datosProductoBase, codigo: undefined })
  );
  await debeFallar(
    8,
    "Rechaza producto sin nombre",
    new Producto({ ...datosProductoBase, nombre: "" })
  );
  await debeFallar(
    8,
    "Rechaza usuario con rol distinto de ADMIN o EMPLEADO",
    new Usuario({
      nombre: "Usuario",
      apellido: "De prueba",
      correo: "usuario.prueba@novasalud.test",
      password: "contrasenaSegura123",
      rol: "GERENTE",
    })
  );
  await debeFallar(
    8,
    "Rechaza contraseña de menos de 8 caracteres",
    new Usuario({
      nombre: "Usuario",
      apellido: "De prueba",
      correo: "usuario.prueba@novasalud.test",
      password: "corta",
      rol: "EMPLEADO",
    })
  );

  const identificadorFicticio = new mongoose.Types.ObjectId();
  const ventaBase = {
    codigoVenta: "PRUEBA-VENTA-001",
    cliente: identificadorFicticio,
    empleado: identificadorFicticio,
    productos: [
      {
        producto: identificadorFicticio,
        nombreProducto: "Producto de validación",
        cantidad: 2,
        precioUnitario: 1.5,
        subtotal: 3,
      },
    ],
    subtotal: 3,
    total: 3,
    metodoPago: "EFECTIVO",
  };

  await debeFallar(
    8,
    "Rechaza venta con subtotal de detalle incorrecto",
    new Venta({
      ...ventaBase,
      productos: [{ ...ventaBase.productos[0], subtotal: 5 }],
    })
  );
  await debeFallar(
    8,
    "Rechaza venta sin productos",
    new Venta({ ...ventaBase, productos: [] })
  );
  await debeFallar(
    8,
    "Rechaza venta con total menor al subtotal",
    new Venta({ ...ventaBase, total: 1 })
  );

  const movimientoBase = {
    producto: identificadorFicticio,
    tipoMovimiento: "ENTRADA",
    cantidad: 5,
    stockAnterior: 10,
    stockNuevo: 15,
    motivo: "Validación de prueba",
    usuario: identificadorFicticio,
  };

  await debeFallar(
    8,
    "Rechaza movimiento con stock nuevo incoherente",
    new Movimiento({ ...movimientoBase, stockNuevo: 99 })
  );
  await debeFallar(
    8,
    "Rechaza movimiento con tipo inválido",
    new Movimiento({ ...movimientoBase, tipoMovimiento: "PRESTAMO" })
  );
  await debeFallar(
    8,
    "Rechaza movimiento sin usuario responsable",
    new Movimiento({ ...movimientoBase, usuario: undefined })
  );

  // 9. Índices -------------------------------------------------------------
  const problemasDeIndices = [];
  let totalIndices = 0;

  for (const coleccion of COLECCIONES_ESPERADAS) {
    const indices = await conexion.db.collection(coleccion).indexes();
    const nombres = indices.map((indice) => indice.name);
    totalIndices += indices.length;

    const esperados = INDICES_ESPERADOS[coleccion];

    for (const esperado of esperados) {
      if (!nombres.includes(esperado)) {
        problemasDeIndices.push(`${coleccion}: falta ${esperado}`);
      }
    }

    for (const nombre of nombres) {
      if (nombre !== "_id_" && !esperados.includes(nombre)) {
        problemasDeIndices.push(`${coleccion}: índice inesperado ${nombre}`);
      }
    }
  }

  comprobar(
    9,
    "Los índices existen y no están duplicados",
    problemasDeIndices.length === 0,
    `${totalIndices} índices contando _id${
      problemasDeIndices.length ? ` | ${problemasDeIndices.join("; ")}` : ""
    }`
  );

  const indiceCodigo = (await conexion.db.collection("productos").indexes()).find(
    (indice) => indice.name === "codigo_1"
  );
  comprobar(
    9,
    "El índice de código de producto es único",
    Boolean(indiceCodigo && indiceCodigo.unique === true),
    indiceCodigo ? JSON.stringify(indiceCodigo.key) : "no encontrado"
  );

  // 10. Mongoose -----------------------------------------------------------
  const nombresDeModelos = mongoose.modelNames().sort();
  comprobar(
    10,
    "Mongoose conectado y con los 5 modelos registrados",
    mongoose.connection.readyState === 1 &&
      nombresDeModelos.length === 5 &&
      ["Usuario", "Producto", "Cliente", "Venta", "Movimiento"].every((nombre) =>
        nombresDeModelos.includes(nombre)
      ),
    `Mongoose ${mongoose.version} | ${nombresDeModelos.join(", ")}`
  );

  // Limpieza ---------------------------------------------------------------
  await Producto.deleteMany({ codigo: { $regex: "^PRUEBA-" } });
  await Cliente.deleteMany({ numeroDocumento: numeroDocumentoPrueba });

  console.log("\n----------------------------------------------------------");
  const correctas = resultados.filter((resultado) => resultado.ok).length;
  console.log(`Resultado: ${correctas} de ${resultados.length} comprobaciones correctas.`);
  console.log("Los documentos con prefijo PRUEBA- fueron eliminados.");

  if (correctas !== resultados.length) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("\nLa comprobación se detuvo por un error:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await desconectarBaseDeDatos();
    console.log("Conexión cerrada.");
  });
