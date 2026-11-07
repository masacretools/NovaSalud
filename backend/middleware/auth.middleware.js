const jwt = require("jsonwebtoken");

const Usuario = require("../models/Usuario");
const ErrorHttp = require("../utils/ErrorHttp");
const envolver = require("../utils/asyncHandler");

const verificarToken = envolver(async (req, res, next) => {
  const encabezado = req.headers.authorization || "";
  const [tipo, token] = encabezado.split(" ");

  if (tipo !== "Bearer" || !token) {
    throw new ErrorHttp(401, "Debes iniciar sesión para continuar");
  }

  if (!process.env.JWT_SECRET) {
    throw new ErrorHttp(
      500,
      "Falta JWT_SECRET en el archivo .env del backend"
    );
  }

  let datos;
  try {
    datos = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ErrorHttp(401, "La sesión expiró o no es válida");
  }

  const usuario = await Usuario.findById(datos.id);

  if (!usuario) {
    throw new ErrorHttp(401, "El usuario de la sesión no existe");
  }

  if (usuario.estado !== "ACTIVO") {
    throw new ErrorHttp(403, "El usuario está inactivo");
  }

  req.usuario = usuario;
  next();
});

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== "ADMIN") {
    return next(
      new ErrorHttp(403, "Solo un administrador puede realizar esta acción")
    );
  }

  return next();
}

module.exports = { verificarToken, soloAdmin };
