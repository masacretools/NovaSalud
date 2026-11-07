const {
  conectarBaseDeDatos,
  desconectarBaseDeDatos,
} = require("./config/database");
const app = require("./app");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    const conexion = await conectarBaseDeDatos();
    console.log(`Base de datos en uso: ${conexion.name}`);

    const servidor = app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });

    async function cerrarServidor() {
      servidor.close(async () => {
        await desconectarBaseDeDatos();
        console.log("Conexión a MongoDB cerrada.");
        process.exit(0);
      });
    }

    process.on("SIGINT", cerrarServidor);
    process.on("SIGTERM", cerrarServidor);
  } catch (error) {
    console.error("No se pudo conectar a MongoDB:", error.message);
    process.exit(1);
  }
}

iniciarServidor();
