const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["ADMIN", "EMPLEADO"];
const ESTADOS = ["ACTIVO", "INACTIVO"];

const esquemaUsuario = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [1, "El nombre es obligatorio"],
    },
    apellido: {
      type: String,
      required: [true, "El apellido es obligatorio"],
      trim: true,
      minlength: [1, "El apellido es obligatorio"],
    },
    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "El correo no tiene un formato válido"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
      select: false,
    },
    rol: {
      type: String,
      required: [true, "El rol es obligatorio"],
      enum: {
        values: ROLES,
        message: "El rol debe ser ADMIN o EMPLEADO",
      },
    },
    estado: {
      type: String,
      required: true,
      enum: {
        values: ESTADOS,
        message: "El estado debe ser ACTIVO o INACTIVO",
      },
      default: "ACTIVO",
    },
    fechaCreacion: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "usuarios",
    versionKey: false,
  }
);

esquemaUsuario.pre("save", async function cifrarContrasena() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("Usuario", esquemaUsuario);
