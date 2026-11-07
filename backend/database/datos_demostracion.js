// ============================================================================
// Nova Salud - Datos ficticios de demostración
// ----------------------------------------------------------------------------
// Carga documentos FICTICIOS para comprobar que los modelos funcionan.
// Todos los datos están marcados como demostración y no representan personas,
// productos ni ventas reales.
//
// Uso (desde la carpeta backend/):
//   npm run db:demo
//
// Crea o actualiza dos cuentas ficticias para la demostración: una ADMIN y una
// EMPLEADO. Sus credenciales son públicas y solo deben usarse en entornos de
// prueba; no ejecutes este script contra una base con datos reales.
// ============================================================================

const {
  conectarBaseDeDatos,
  desconectarBaseDeDatos,
} = require("../config/database");

const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Venta = require("../models/Venta");
const Movimiento = require("../models/Movimiento");

const CUENTAS_PRUEBA = [
  {
    correo: "admin.demo@novasalud.test",
    nombre: "Administrador",
    apellido: "de Prueba",
    rol: "ADMIN",
  },
  {
    correo: "empleado.demo@novasalud.test",
    nombre: "Empleado",
    apellido: "de Prueba",
    rol: "EMPLEADO",
  },
];
const PASSWORD_PRUEBA = "Demo12345";
const CODIGO_PRODUCTO_DEMO = "DEMO-001";
const CODIGO_VENTA_DEMO = "DEMO-VENTA-001";
const MOTIVO_MOVIMIENTO_DEMO = "Carga inicial de demostración (datos ficticios)";

function mostrarAviso(mensaje) {
  console.log(`\n${mensaje}\n`);
}

async function crearCuentasPrueba() {
  const cuentas = [];

  for (const datos of CUENTAS_PRUEBA) {
    let usuario = await Usuario.findOne({ correo: datos.correo });

    if (usuario) {
      usuario.set({
        nombre: datos.nombre,
        apellido: datos.apellido,
        correo: datos.correo,
        rol: datos.rol,
        estado: "ACTIVO",
        password: PASSWORD_PRUEBA,
      });
    } else {
      usuario = new Usuario({
        ...datos,
        estado: "ACTIVO",
        password: PASSWORD_PRUEBA,
      });
    }

    await usuario.save();
    cuentas.push(usuario);
  }

  return cuentas;
}

async function crearProductoDemo() {
  const datos = {
    nombre: "Paracetamol 500 mg (demostración)",
    codigo: CODIGO_PRODUCTO_DEMO,
    categoria: "Analgésicos",
    descripcion: "Producto ficticio solo para probar los modelos.",
    precioCompra: 0.5,
    precioVenta: 0.8,
    stock: 120,
    stockMinimo: 20,
    lote: "LOTE-DEMO-001",
    fechaVencimiento: new Date("2027-12-31"),
    presentacion: "Caja con 10 tabletas",
    estado: "ACTIVO",
  };

  let producto = await Producto.findOne({ codigo: CODIGO_PRODUCTO_DEMO });

  if (producto) {
    producto.set(datos);
  } else {
    producto = new Producto(datos);
  }

  await producto.save();
  return producto;
}

function crearProductoAdicional(datos) {
  return Producto.findOne({ codigo: datos.codigo }).then(async (producto) => {
    if (producto) {
      producto.set(datos);
    } else {
      producto = new Producto(datos);
    }

    await producto.save();
    return producto;
  });
}

async function crearProductosAdicionalesDemo() {
  return Promise.all([
    crearProductoAdicional({
      nombre: "Alcohol en gel 500 ml (demostración)",
      codigo: "DEMO-002",
      categoria: "Higiene",
      descripcion: "Producto ficticio agotado para probar las alertas.",
      precioCompra: 4,
      precioVenta: 6.5,
      stock: 0,
      stockMinimo: 5,
      lote: "LOTE-DEMO-002",
      fechaVencimiento: new Date("2027-06-30"),
      presentacion: "Frasco de 500 ml",
      estado: "ACTIVO",
    }),
    crearProductoAdicional({
      nombre: "Ibuprofeno 400 mg (demostración)",
      codigo: "DEMO-003",
      categoria: "Analgésicos",
      descripcion: "Producto ficticio con stock bajo para probar las alertas.",
      precioCompra: 0.4,
      precioVenta: 0.7,
      stock: 5,
      stockMinimo: 15,
      lote: "LOTE-DEMO-003",
      fechaVencimiento: new Date("2027-03-31"),
      presentacion: "Caja con 10 tabletas",
      estado: "ACTIVO",
    }),
    crearProductoAdicional({
      nombre: "Vitamina C 500 mg (demostración)",
      codigo: "DEMO-004",
      categoria: "Vitaminas",
      descripcion: "Producto ficticio próximo a vencer para probar las alertas.",
      precioCompra: 0.6,
      precioVenta: 1,
      stock: 40,
      stockMinimo: 10,
      lote: "LOTE-DEMO-004",
      // Se calcula a 45 días para que siempre aparezca como próximo a vencer.
      fechaVencimiento: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      presentacion: "Frasco con 60 tabletas",
      estado: "ACTIVO",
    }),
  ]);
}

async function crearClienteDemo() {
  const datos = {
    nombre: "Cliente",
    apellido: "Demostración",
    tipoDocumento: "DNI",
    numeroDocumento: "00000000",
    telefono: "999999999",
    correo: "cliente.demo@novasalud.test",
    direccion: "Av. Demostración 123, Lima",
  };

  let cliente = await Cliente.findOne({
    tipoDocumento: datos.tipoDocumento,
    numeroDocumento: datos.numeroDocumento,
  });

  if (cliente) {
    cliente.set(datos);
  } else {
    cliente = new Cliente(datos);
  }

  await cliente.save();
  return cliente;
}

async function crearVentaDemo(cliente, empleado, producto) {
  const datos = {
    codigoVenta: CODIGO_VENTA_DEMO,
    cliente: cliente._id,
    empleado: empleado._id,
    productos: [
      {
        producto: producto._id,
        // Se copia el nombre y el precio para conservar el histórico de la venta.
        nombreProducto: producto.nombre,
        cantidad: 2,
        precioUnitario: producto.precioVenta,
        subtotal: Number((2 * producto.precioVenta).toFixed(2)),
      },
    ],
    subtotal: Number((2 * producto.precioVenta).toFixed(2)),
    total: Number((2 * producto.precioVenta).toFixed(2)),
    metodoPago: "EFECTIVO",
    estado: "REGISTRADA",
    fechaVenta: new Date(),
  };

  let venta = await Venta.findOne({ codigoVenta: CODIGO_VENTA_DEMO });

  if (venta) {
    venta.set(datos);
  } else {
    venta = new Venta(datos);
  }

  await venta.save();
  return venta;
}

async function crearMovimientoDemo(producto, empleado) {
  // Se eliminan solo los movimientos de demostración para no duplicarlos.
  await Movimiento.deleteMany({ motivo: MOTIVO_MOVIMIENTO_DEMO });

  return Movimiento.create({
    producto: producto._id,
    tipoMovimiento: "ENTRADA",
    cantidad: 20,
    stockAnterior: 100,
    stockNuevo: 120,
    motivo: MOTIVO_MOVIMIENTO_DEMO,
    usuario: empleado._id,
    referenciaVenta: null,
  });
}

async function main() {
  await conectarBaseDeDatos();

  console.log("Cargando DATOS DE DEMOSTRACIÓN en nova_salud...");

  const cuentas = await crearCuentasPrueba();
  const empleado = cuentas.find((cuenta) => cuenta.rol === "EMPLEADO");
  const producto = await crearProductoDemo();
  const adicionales = await crearProductosAdicionalesDemo();
  const cliente = await crearClienteDemo();
  const venta = await crearVentaDemo(cliente, empleado, producto);
  const movimiento = await crearMovimientoDemo(producto, empleado);

  console.log("\nResumen de datos de demostración:");
  console.log("  Cuentas de prueba:");
  cuentas.forEach((cuenta) => {
    console.log(`    ${cuenta.correo} (rol ${cuenta.rol})`);
  });
  console.log(`  Producto:   ${producto.codigo} - ${producto.nombre}`);
  console.log(
    `  Otros:      ${adicionales.map((item) => item.codigo).join(", ")}`
  );
  console.log(`  Cliente:    ${cliente.tipoDocumento} ${cliente.numeroDocumento}`);
  console.log(`  Venta:      ${venta.codigoVenta} (total ${venta.total})`);
  console.log(
    `  Movimiento: ${movimiento.tipoMovimiento} de ${movimiento.cantidad} unidades`
  );

  mostrarAviso(
    "Recuerda: son datos y credenciales ficticias. No uses estas cuentas en producción."
  );
}

main()
  .catch((error) => {
    console.error("Error al cargar los datos de demostración:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await desconectarBaseDeDatos();
  });
