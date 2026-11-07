// Crea el usuario administrador inicial a partir de backend/.env.
// Uso: npm run db:admin
//
// Variables usadas:
//   ADMIN_NOMBRE, ADMIN_APELLIDO, ADMIN_CORREO, ADMIN_PASSWORD
// Si ADMIN_PASSWORD no está definido se genera una contraseña aleatoria y se
// muestra una sola vez en la terminal (no se guarda en el repositorio).

const crypto = require("crypto");

const {
  conectarBaseDeDatos,
  desconectarBaseDeDatos,
} = require("../config/database");
const Usuario = require("../models/Usuario");

async function main() {
  await conectarBaseDeDatos();

  const correo = (process.env.ADMIN_CORREO || "admin@novasalud.test")
    .trim()
    .toLowerCase();

  const existente = await Usuario.findOne({ correo });

  if (existente) {
    console.log(`El usuario administrador ya existe: ${correo}`);
    console.log("No se modificó la contraseña.");
    return;
  }

  const contrasena =
    process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");

  await Usuario.create({
    nombre: process.env.ADMIN_NOMBRE || "Administrador",
    apellido: process.env.ADMIN_APELLIDO || "Nova Salud",
    correo,
    password: contrasena,
    rol: "ADMIN",
    estado: "ACTIVO",
  });

  console.log("Usuario administrador creado:");
  console.log(`  correo: ${correo}`);

  if (process.env.ADMIN_PASSWORD) {
    console.log("  contraseña: la definida en ADMIN_PASSWORD (.env)");
  } else {
    console.log(`  contraseña temporal: ${contrasena}`);
    console.log(
      "  Guárdala ahora: no se vuelve a mostrar y no está en el repositorio."
    );
  }
}

main()
  .catch((error) => {
    console.error("Error al crear el administrador:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await desconectarBaseDeDatos();
  });
