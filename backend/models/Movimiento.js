const mongoose = require("mongoose");

const TIPOS = ["ENTRADA", "SALIDA", "AJUSTE"];

function esEntero(valor) {
  return Number.isInteger(valor);
}

const esquemaMovimiento = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: [true, "El producto es obligatorio"],
    },
    tipoMovimiento: {
      type: String,
      required: [true, "El tipo de movimiento es obligatorio"],
      enum: {
        values: TIPOS,
        message: "El tipo debe ser ENTRADA, SALIDA o AJUSTE",
      },
    },
    cantidad: {
      type: Number,
      required: [true, "La cantidad es obligatoria"],
      min: [1, "La cantidad debe ser al menos 1"],
      validate: {
        validator: esEntero,
        message: "La cantidad debe ser un número entero",
      },
    },
    stockAnterior: {
      type: Number,
      required: [true, "El stock anterior es obligatorio"],
      min: [0, "El stock anterior no puede ser negativo"],
      validate: {
        validator: esEntero,
        message: "El stock anterior debe ser un número entero",
      },
    },
    stockNuevo: {
      type: Number,
      required: [true, "El stock nuevo es obligatorio"],
      min: [0, "El stock nuevo no puede ser negativo"],
      validate: {
        validator: esEntero,
        message: "El stock nuevo debe ser un número entero",
      },
    },
    motivo: {
      type: String,
      required: [true, "El motivo es obligatorio"],
      trim: true,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El usuario responsable es obligatorio"],
    },
    referenciaVenta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venta",
      default: null,
    },
    fechaMovimiento: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "movimientos",
    versionKey: false,
  }
);

esquemaMovimiento.index({ fechaMovimiento: 1 });

esquemaMovimiento.pre("validate", function validarStock() {
  const cantidad = Number(this.cantidad);
  const stockAnterior = Number(this.stockAnterior);
  const stockNuevo = Number(this.stockNuevo);

  if (
    !Number.isFinite(cantidad) ||
    !Number.isFinite(stockAnterior) ||
    !Number.isFinite(stockNuevo)
  ) {
    return;
  }

  if (
    this.tipoMovimiento === "ENTRADA" &&
    stockNuevo !== stockAnterior + cantidad
  ) {
    this.invalidate(
      "stockNuevo",
      "En una entrada, el stock nuevo debe ser el stock anterior más la cantidad"
    );
  }

  if (
    this.tipoMovimiento === "SALIDA" &&
    stockNuevo !== stockAnterior - cantidad
  ) {
    this.invalidate(
      "stockNuevo",
      "En una salida, el stock nuevo debe ser el stock anterior menos la cantidad"
    );
  }
});

module.exports = mongoose.model("Movimiento", esquemaMovimiento);
