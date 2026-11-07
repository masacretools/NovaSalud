const path = require("path");
const mongoose = require("mongoose");

// Carga backend/.env sin importar desde qué carpeta se ejecute el script.
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const ESTADOS_CONEXION = {
  0: "desconectado",
  1: "conectado",
  2: "conectando",
  3: "desconectando",
};

// Se guarda la promesa para reutilizar una sola conexión y no abrir varias.
let promesaConexion = null;

function obtenerUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Falta MONGODB_URI. Copia backend/.env.example a backend/.env y define la cadena de conexión."
    );
  }

  return uri;
}

/**
 * Conecta a MongoDB (local o Atlas) reutilizando la conexión existente.
 * @returns {Promise<import("mongoose").Connection>}
 */
async function conectarBaseDeDatos() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!promesaConexion) {
    promesaConexion = mongoose
      // serverSelectionTimeoutMS evita esperar indefinidamente si el servidor no responde.
      .connect(obtenerUri(), { serverSelectionTimeoutMS: 10000 })
      .then(() => {
        console.log(`MongoDB conectado: ${mongoose.connection.name}`);
        return mongoose.connection;
      })
      .catch((error) => {
        // Si falla, se limpia la promesa para permitir un nuevo intento.
        promesaConexion = null;
        throw error;
      });
  }

  return promesaConexion;
}

async function desconectarBaseDeDatos() {
  if (mongoose.connection.readyState === 0) {
    promesaConexion = null;
    return;
  }

  await mongoose.disconnect();
  promesaConexion = null;
}

function estaConectado() {
  return mongoose.connection.readyState === 1;
}

function estadoConexion() {
  return ESTADOS_CONEXION[mongoose.connection.readyState] || "desconocido";
}

module.exports = {
  conectarBaseDeDatos,
  desconectarBaseDeDatos,
  estaConectado,
  estadoConexion,
};
