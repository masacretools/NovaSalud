const mongoose = require("mongoose");

const TIPOS_DOCUMENTO = ["DNI", "CE", "RUC", "PASAPORTE"];

const esquemaCliente = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    apellido: {
      type: String,
      required: [true, "El apellido es obligatorio"],
      trim: true,
    },
    tipoDocumento: {
      type: String,
      required: [true, "El tipo de documento es obligatorio"],
      enum: {
        values: TIPOS_DOCUMENTO,
        message: "El tipo de documento debe ser DNI, CE, RUC o PASAPORTE",
      },
    },
    numeroDocumento: {
      type: String,
      required: [true, "El número de documento es obligatorio"],
      trim: true,
      minlength: [8, "El número de documento debe tener al menos 8 caracteres"],
    },
    telefono: {
      type: String,
      trim: true,
      default: "",
    },
    correo: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      validate: {
        validator(valor) {
          if (!valor) {
            return true;
          }
          return /^\S+@\S+\.\S+$/.test(valor);
        },
        message: "El correo no tiene un formato válido",
      },
    },
    direccion: {
      type: String,
      trim: true,
      default: "",
    },
    fechaCreacion: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "clientes",
    versionKey: false,
  }
);

esquemaCliente.index(
  { tipoDocumento: 1, numeroDocumento: 1 },
  { unique: true }
);

module.exports = mongoose.model("Cliente", esquemaCliente);
