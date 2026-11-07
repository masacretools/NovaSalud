const mongoose = require("mongoose");

const ESTADOS = ["ACTIVO", "INACTIVO"];

function esEntero(valor) {
  return Number.isInteger(valor);
}

const esquemaProducto = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [1, "El nombre es obligatorio"],
    },
    codigo: {
      type: String,
      required: [true, "El código es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [1, "El código es obligatorio"],
    },
    categoria: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
    },
    precioCompra: {
      type: Number,
      required: [true, "El precio de compra es obligatorio"],
      min: [0, "El precio de compra no puede ser negativo"],
    },
    precioVenta: {
      type: Number,
      required: [true, "El precio de venta es obligatorio"],
      min: [0, "El precio de venta no puede ser negativo"],
      validate: {
        validator(valor) {
          return valor >= this.precioCompra;
        },
        message: "El precio de venta no puede ser menor que el precio de compra",
      },
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock no puede ser negativo"],
      validate: {
        validator: esEntero,
        message: "El stock debe ser un número entero",
      },
    },
    stockMinimo: {
      type: Number,
      required: [true, "El stock mínimo es obligatorio"],
      min: [0, "El stock mínimo no puede ser negativo"],
      validate: {
        validator: esEntero,
        message: "El stock mínimo debe ser un número entero",
      },
    },
    lote: {
      type: String,
      required: [true, "El lote es obligatorio"],
      trim: true,
    },
    fechaVencimiento: {
      type: Date,
      required: [true, "La fecha de vencimiento es obligatoria"],
    },
    presentacion: {
      type: String,
      required: [true, "La presentación es obligatoria"],
      trim: true,
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
    fechaActualizacion: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "productos",
    versionKey: false,
  }
);

esquemaProducto.index({ nombre: 1 });

esquemaProducto.pre("save", function actualizarFecha() {
  this.fechaActualizacion = new Date();
});

module.exports = mongoose.model("Producto", esquemaProducto);
