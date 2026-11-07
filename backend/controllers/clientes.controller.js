const mongoose = require("mongoose");

const Cliente = require("../models/Cliente");
const Venta = require("../models/Venta");
const ErrorHttp = require("../utils/ErrorHttp");

function escaparRegex(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function datosPermitidos(cuerpo) {
  const campos = [
    "nombre",
    "apellido",
    "tipoDocumento",
    "numeroDocumento",
    "telefono",
    "correo",
    "direccion",
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
  const { buscar } = req.query;
  const filtro = {};

  if (buscar) {
    const regex = new RegExp(escaparRegex(buscar), "i");
    filtro.$or = [
      { nombre: regex },
      { apellido: regex },
      { numeroDocumento: regex },
    ];
  }

  const clientes = await Cliente.find(filtro).sort({ apellido: 1 });

  res.json({ total: clientes.length, clientes });
}

async function obtener(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ErrorHttp(400, "Identificador de cliente inválido");
  }

  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    throw new ErrorHttp(404, "Cliente no encontrado");
  }

  res.json({ cliente });
}

async function crear(req, res) {
  const cliente = await Cliente.create(datosPermitidos(req.body));
  res.status(201).json({ mensaje: "Cliente registrado", cliente });
}

async function actualizar(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ErrorHttp(400, "Identificador de cliente inválido");
  }

  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    throw new ErrorHttp(404, "Cliente no encontrado");
  }

  cliente.set(datosPermitidos(req.body));
  await cliente.save();

  res.json({ mensaje: "Cliente actualizado", cliente });
}

async function eliminar(req, res) {
  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    throw new ErrorHttp(404, "Cliente no encontrado");
  }

  const ventas = await Venta.countDocuments({ cliente: cliente._id });

  if (ventas > 0) {
    throw new ErrorHttp(
      409,
      "El cliente tiene ventas registradas y no se puede eliminar"
    );
  }

  await cliente.deleteOne();

  res.json({ mensaje: "Cliente eliminado" });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
