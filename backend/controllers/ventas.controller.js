const mongoose = require("mongoose");

const Cliente = require("../models/Cliente");
const Movimiento = require("../models/Movimiento");
const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const Venta = require("../models/Venta");
const ErrorHttp = require("../utils/ErrorHttp");

const METODOS_PAGO = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE", "PLIN"];

function escaparRegex(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function generarCodigoVenta() {
  const ahora = new Date();
  const fecha = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(ahora.getDate()).padStart(2, "0")}`;
  const inicioDelDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );
  const ventasDelDia = await Venta.countDocuments({
    fechaVenta: { $gte: inicioDelDia },
  });

  return `V-${fecha}-${String(ventasDelDia + 1).padStart(4, "0")}`;
}

async function crear(req, res) {
  const { cliente, productos, metodoPago } = req.body;

  if (!mongoose.isValidObjectId(cliente)) {
    throw new ErrorHttp(400, "Selecciona un cliente válido");
  }

  if (!Array.isArray(productos) || productos.length === 0) {
    throw new ErrorHttp(400, "La venta debe incluir al menos un producto");
  }

  if (!METODOS_PAGO.includes(metodoPago)) {
    throw new ErrorHttp(400, "Selecciona un método de pago válido");
  }

  const clienteExiste = await Cliente.findById(cliente);

  if (!clienteExiste) {
    throw new ErrorHttp(404, "El cliente seleccionado no existe");
  }

  const usuario = await Usuario.findById(req.usuario._id);

  if (!usuario) {
    throw new ErrorHttp(401, "El usuario de la sesión no existe");
  }

  // Agrupa cantidades si el mismo producto se envía más de una vez.
  const cantidades = new Map();

  for (const item of productos) {
    const productoId = item.producto;
    const cantidad = Number(item.cantidad);

    if (!mongoose.isValidObjectId(productoId)) {
      throw new ErrorHttp(400, "Uno de los productos no es válido");
    }

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ErrorHttp(
        400,
        "Las cantidades deben ser números enteros mayores o iguales a 1"
      );
    }

    cantidades.set(
      String(productoId),
      (cantidades.get(String(productoId)) || 0) + cantidad
    );
  }

  const detalles = [];
  const descontados = [];
  let ventaCreada = null;
  const codigoVenta = await generarCodigoVenta();

  try {
    for (const [productoId, cantidad] of cantidades) {
      const producto = await Producto.findById(productoId);

      if (!producto || producto.estado !== "ACTIVO") {
        throw new ErrorHttp(
          400,
          "Uno de los productos no existe o está inactivo"
        );
      }

      if (producto.stock < cantidad) {
        throw new ErrorHttp(
          409,
          `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`
        );
      }

      // Descuento atómico: solo resta si todavía hay stock suficiente.
      const actualizado = await Producto.findOneAndUpdate(
        {
          _id: producto._id,
          estado: "ACTIVO",
          stock: { $gte: cantidad },
        },
        { $inc: { stock: -cantidad } },
        { returnDocument: "after", runValidators: true }
      );

      if (!actualizado) {
        throw new ErrorHttp(
          409,
          `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`
        );
      }

      descontados.push({ producto: actualizado, cantidad });

      detalles.push({
        producto: actualizado._id,
        nombreProducto: actualizado.nombre,
        cantidad,
        precioUnitario: actualizado.precioVenta,
        subtotal: Number((cantidad * actualizado.precioVenta).toFixed(2)),
      });
    }

    const total = Number(
      detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0).toFixed(2)
    );

    ventaCreada = await Venta.create({
      codigoVenta,
      cliente: clienteExiste._id,
      empleado: usuario._id,
      productos: detalles,
      subtotal: total,
      total,
      metodoPago,
      estado: "REGISTRADA",
      fechaVenta: new Date(),
    });

    await Movimiento.insertMany(
      descontados.map(({ producto, cantidad }) => ({
        producto: producto._id,
        tipoMovimiento: "SALIDA",
        cantidad,
        stockAnterior: producto.stock + cantidad,
        stockNuevo: producto.stock,
        motivo: `Venta ${codigoVenta}`,
        usuario: usuario._id,
        referenciaVenta: ventaCreada._id,
        fechaMovimiento: new Date(),
      }))
    );

    const ventaCompleta = await Venta.findById(ventaCreada._id)
      .populate("cliente", "nombre apellido numeroDocumento tipoDocumento")
      .populate("empleado", "nombre apellido");

    res.status(201).json({
      mensaje: "Venta registrada y stock descontado",
      venta: ventaCompleta,
    });
  } catch (error) {
    // Si algo falla, se devuelve el stock y se elimina la venta parcial.
    for (const { producto, cantidad } of descontados) {
      await Producto.updateOne(
        { _id: producto._id },
        { $inc: { stock: cantidad } }
      );
    }

    if (ventaCreada) {
      await Movimiento.deleteMany({ referenciaVenta: ventaCreada._id });
      await Venta.deleteOne({ _id: ventaCreada._id });
    }

    throw error;
  }
}

async function listar(req, res) {
  const { buscar, desde, hasta } = req.query;
  const filtro = {};

  if (buscar) {
    filtro.codigoVenta = new RegExp(escaparRegex(buscar), "i");
  }

  if (desde || hasta) {
    filtro.fechaVenta = {};
    if (desde) {
      filtro.fechaVenta.$gte = new Date(desde);
    }
    if (hasta) {
      const fin = new Date(hasta);
      fin.setHours(23, 59, 59, 999);
      filtro.fechaVenta.$lte = fin;
    }
  }

  const ventas = await Venta.find(filtro)
    .populate("cliente", "nombre apellido numeroDocumento tipoDocumento")
    .populate("empleado", "nombre apellido")
    .sort({ fechaVenta: -1 })
    .limit(100);

  res.json({ total: ventas.length, ventas });
}

async function obtener(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ErrorHttp(400, "Identificador de venta inválido");
  }

  const venta = await Venta.findById(req.params.id)
    .populate("cliente", "nombre apellido numeroDocumento tipoDocumento telefono")
    .populate("empleado", "nombre apellido");

  if (!venta) {
    throw new ErrorHttp(404, "Venta no encontrada");
  }

  res.json({ venta });
}

module.exports = { crear, listar, obtener };
