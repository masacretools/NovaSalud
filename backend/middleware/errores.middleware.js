const ErrorHttp = require("../utils/ErrorHttp");

function noEncontrado(req, res) {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
}

function manejarErrores(error, req, res, next) {
  if (error.name === "ValidationError") {
    const detalles = Object.values(error.errors).map(
      (detalle) => detalle.message
    );
    return res.status(400).json({
      mensaje: detalles[0] || "Los datos enviados no son válidos",
      errores: detalles,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ mensaje: "Identificador inválido" });
  }

  if (error.code === 11000) {
    const campos = Object.keys(error.keyPattern || {}).join(", ");
    return res.status(409).json({
      mensaje: `Ya existe un registro con el mismo valor en: ${
        campos || "campo único"
      }`,
    });
  }

  if (error instanceof ErrorHttp) {
    return res.status(error.estado).json({ mensaje: error.message });
  }

  console.error("Error no controlado:", error);
  return res.status(500).json({ mensaje: "Error interno del servidor" });
}

module.exports = { noEncontrado, manejarErrores };
