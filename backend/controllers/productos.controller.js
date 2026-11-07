const mongoose = require("mongoose");

const Venta = require("../models/Venta");
const Movimiento = require("../models/Movimiento");
const Producto = require("../models/Producto");
const ErrorHttp = require("../utils/ErrorHttp");

function escaparRegex(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function datosPermitidos(cuerpo) {
  const campos = [
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
  ];

  const datos = {};
  for (const campo of campos) {
    if (cuerpo[campo] !== undefined) {
      datos[campo] = cuerpo[campo];
    }
  }

  return datos;
}

async function listar(req, res) {
  const { buscar, categoria, estado } = req.query;
  const filtro = {};

  if (buscar) {
    const regex = new RegExp(escaparRegex(buscar), "i");
    filtro.$or = [{ nombre: regex }, { codigo: regex }, { descripcion: regex }];
  }

  if (categoria) {
    filtro.categoria = categoria;
  }

  if (estado) {
    filtro.estado = estado;
  }

  const productos = await Producto.find(filtro).sort({ nombre: 1 }).limit(500);

  res.json({ total: productos.length, productos });
}

async function categorias(req, res) {
  const lista = await Producto.distinct("categoria", { estado: "ACTIVO" });
  res.json({ categorias: lista.sort() });
}

async function obtener(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ErrorHttp(400, "Identificador de producto inválido");
  }

  const producto = await Producto.findById(req.params.id);

  if (!producto) {
    throw new ErrorHttp(404, "Producto no encontrado");
  }

  res.json({ producto });
}

async function crear(req, res) {
  const producto = await Producto.create(datosPermitidos(req.body));
  res.status(201).json({ mensaje: "Producto registrado", producto });
}

async function actualizar(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ErrorHttp(400, "Identificador de producto inválido");
  }

  const producto = await Producto.findById(req.params.id);

  if (!producto) {
    throw new ErrorHttp(404, "Producto no encontrado");
  }

  producto.set(datosPermitidos(req.body));
  await producto.save();

  res.json({ mensaje: "Producto actualizado", producto });
}

async function cambiarEstado(req, res) {
  const { estado } = req.body;

  if (!["ACTIVO", "INACTIVO"].includes(estado)) {
    throw new ErrorHttp(400, "El estado debe ser ACTIVO o INACTIVO");
  }

  const producto = await Producto.findById(req.params.id);

  if (!producto) {
    throw new ErrorHttp(404, "Producto no encontrado");
  }

  producto.estado = estado;
  await producto.save();

  res.json({
    mensaje:
      estado === "ACTIVO" ? "Producto activado" : "Producto desactivado",
    producto,
  });
}

async function eliminar(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ErrorHttp(400, "Identificador de producto inválido");
  }

  const producto = await Producto.findById(req.params.id);

  if (!producto) {
    throw new ErrorHttp(404, "Producto no encontrado");
  }

  const ventas = await Venta.countDocuments({
    "productos.producto": producto._id,
  });
  const movimientos = await Movimiento.countDocuments({
    producto: producto._id,
  });

  if (ventas > 0 || movimientos > 0) {
    throw new ErrorHttp(
      409,
      "El producto tiene ventas o movimientos asociados. Desactívalo para conservar el historial."
    );
  }

  await producto.deleteOne();

  res.json({ mensaje: "Producto eliminado" });
}

module.exports = {
  listar,
  categorias,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
};
