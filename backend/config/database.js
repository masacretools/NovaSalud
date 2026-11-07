const mongoose = require("mongoose");

let promesaConexion = null;

async function conectarBaseDeDatos() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!promesaConexion) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "Falta MONGODB_URI. Copia backend/.env.example a backend/.env"
      );
    }

    promesaConexion = mongoose.connect(uri).catch((error) => {
      promesaConexion = null;
      throw error;
    });
  }

  await promesaConexion;
  return mongoose.connection;
}

async function desconectarBaseDeDatos() {
  await mongoose.disconnect();
  promesaConexion = null;
}

module.exports = { conectarBaseDeDatos, desconectarBaseDeDatos };
