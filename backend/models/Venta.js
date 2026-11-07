const mongoose = require("mongoose");

const METODOS_PAGO = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE", "PLIN"];
const ESTADOS = ["REGISTRADA", "ANULADA"];

function esEntero(valor) {
  return Number.isInteger(valor);
}

const esquemaDetalle = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: [true, "El producto del detalle es obligatorio"],
    },
    nombreProducto: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
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
    precioUnitario: {
      type: Number,
      required: [true, "El precio unitario es obligatorio"],
      min: [0, "El precio unitario no puede ser negativo"],
    },
    subtotal: {
      type: Number,
      required: [true, "El subtotal del detalle es obligatorio"],
      min: [0, "El subtotal del detalle no puede ser negativo"],
    },
  },
  { _id: false }
);

const esquemaVenta = new mongoose.Schema(
  {
    codigoVenta: {
      type: String,
      required: [true, "El código de venta es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: [true, "El cliente es obligatorio"],
    },
    empleado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El empleado es obligatorio"],
    },
    productos: {
      type: [esquemaDetalle],
      required: [true, "La venta debe incluir productos"],
      validate: {
        validator(detalles) {
          return Array.isArray(detalles) && detalles.length > 0;
        },
        message: "La venta debe incluir al menos un producto",
      },
    },
    subtotal: {
      type: Number,
      required: [true, "El subtotal es obligatorio"],
      min: [0, "El subtotal no puede ser negativo"],
    },
    total: {
      type: Number,
      required: [true, "El total es obligatorio"],
      min: [0, "El total no puede ser negativo"],
    },
    metodoPago: {
      type: String,
      required: [true, "El método de pago es obligatorio"],
      enum: {
        values: METODOS_PAGO,
        message: "El método de pago no es válido",
      },
    },
    estado: {
      type: String,
      required: true,
      enum: {
        values: ESTADOS,
        message: "El estado debe ser REGISTRADA o ANULADA",
      },
      default: "REGISTRADA",
    },
    fechaVenta: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "ventas",
    versionKey: false,
  }
);

esquemaVenta.index({ fechaVenta: 1 });

esquemaVenta.pre("validate", function validarImportes() {
  if (!Array.isArray(this.productos) || this.productos.length === 0) {
    return;
  }

  this.productos.forEach((detalle, indice) => {
    const cantidad = Number(detalle.cantidad);
    const precioUnitario = Number(detalle.precioUnitario);
    const subtotal = Number(detalle.subtotal);

    if (
      !Number.isFinite(cantidad) ||
      !Number.isFinite(precioUnitario) ||
      !Number.isFinite(subtotal)
    ) {
      this.invalidate(
        `productos.${indice}.subtotal`,
        "El detalle debe tener cantidad, precio unitario y subtotal numéricos"
      );
      return;
    }

    const subtotalCalculado = Number((cantidad * precioUnitario).toFixed(2));

    if (Number(subtotal.toFixed(2)) !== subtotalCalculado) {
      this.invalidate(
        `productos.${indice}.subtotal`,
        "El subtotal del detalle debe ser cantidad por precio unitario"
      );
    }
  });

  const subtotalVenta = Number(
    this.productos
      .reduce((acumulado, detalle) => acumulado + Number(detalle.subtotal || 0), 0)
      .toFixed(2)
  );
  const subtotal = Number(this.subtotal);

  if (!Number.isFinite(subtotal)) {
    return;
  }

  if (Number(subtotal.toFixed(2)) !== subtotalVenta) {
    this.invalidate("subtotal", "El subtotal debe ser la suma de los detalles");
  }

  const total = Number(this.total);

  if (Number.isFinite(total) && Number(total.toFixed(2)) < Number(subtotal.toFixed(2))) {
    this.invalidate("total", "El total no puede ser menor que el subtotal");
  }
});

module.exports = mongoose.model("Venta", esquemaVenta);
