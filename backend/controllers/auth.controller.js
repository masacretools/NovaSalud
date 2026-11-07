const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/Usuario");
const ErrorHttp = require("../utils/ErrorHttp");

async function login(req, res) {
  if (!process.env.JWT_SECRET) {
    throw new ErrorHttp(500, "Falta JWT_SECRET en el archivo .env del backend");
  }

  const { correo, password } = req.body;

  if (!correo || !password) {
    throw new ErrorHttp(400, "El correo y la contraseña son obligatorios");
  }

  const usuario = await Usuario.findOne({
    correo: String(correo).trim().toLowerCase(),
  }).select("+password");

  if (!usuario) {
    throw new ErrorHttp(401, "Correo o contraseña incorrectos");
  }

  const coincide = await bcrypt.compare(String(password), usuario.password);

  if (!coincide) {
    throw new ErrorHttp(401, "Correo o contraseña incorrectos");
  }

  if (usuario.estado !== "ACTIVO") {
    throw new ErrorHttp(403, "El usuario está inactivo");
  }

  const token = jwt.sign(
    { id: usuario._id.toString(), rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  const datosUsuario = usuario.toObject();
  delete datosUsuario.password;

  res.json({ token, usuario: datosUsuario });
}

async function perfil(req, res) {
  res.json({ usuario: req.usuario });
}

async function registrar(req, res) {
  const { nombre, apellido, correo, password, rol } = req.body;

  if (!nombre || !apellido || !correo || !password) {
    throw new ErrorHttp(400, "Todos los datos del usuario son obligatorios");
  }

  const usuario = await Usuario.create({
    nombre,
    apellido,
    correo,
    password,
    rol: rol || "EMPLEADO",
  });

  const datosUsuario = usuario.toObject();
  delete datosUsuario.password;

  res.status(201).json({
    mensaje: "Usuario registrado correctamente",
    usuario: datosUsuario,
  });
}

module.exports = { login, perfil, registrar };
