const Producto = require("../models/Producto");
const Venta = require("../models/Venta");

async function resumen(req, res) {
  const ahora = new Date();
  const inicioDelDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );
  const limiteVencimiento = new Date(ahora);
  limiteVencimiento.setDate(limiteVencimiento.getDate() + 90);

  const [
    totalProductos,
    totalVentas,
    ventasDelDia,
    ingresos,
    ingresosDelDia,
    stockBajo,
    agotados,
    porVencer,
    ultimasVentas,
    productosBajoStock,
  ] = await Promise.all([
    Producto.countDocuments({ estado: "ACTIVO" }),
    Venta.countDocuments({ estado: "REGISTRADA" }),
    Venta.countDocuments({
      estado: "REGISTRADA",
      fechaVenta: { $gte: inicioDelDia },
    }),
    Venta.aggregate([
      { $match: { estado: "REGISTRADA" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Venta.aggregate([
      { $match: { estado: "REGISTRADA", fechaVenta: { $gte: inicioDelDia } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Producto.countDocuments({
      estado: "ACTIVO",
      stock: { $gt: 0 },
      $expr: { $lte: ["$stock", "$stockMinimo"] },
    }),
    Producto.countDocuments({ estado: "ACTIVO", stock: 0 }),
    Producto.countDocuments({
      estado: "ACTIVO",
      fechaVencimiento: { $gte: ahora, $lte: limiteVencimiento },
    }),
    Venta.find({ estado: "REGISTRADA" })
      .populate("cliente", "nombre apellido")
      .sort({ fechaVenta: -1 })
      .limit(6),
    Producto.find({
      estado: "ACTIVO",
      $expr: { $lte: ["$stock", "$stockMinimo"] },
    })
      .sort({ stock: 1 })
      .limit(6),
  ]);

  const totalIngresos = ingresos[0] ? ingresos[0].total : 0;
  const totalDelDia = ingresosDelDia[0] ? ingresosDelDia[0].total : 0;

  res.json({
    totales: {
      productos: totalProductos,
      ventas: totalVentas,
      ventasDelDia,
      ingresos: Number(totalIngresos.toFixed(2)),
      ingresosDelDia: Number(totalDelDia.toFixed(2)),
      ticketPromedio: totalVentas
        ? Number((totalIngresos / totalVentas).toFixed(2))
        : 0,
      stockBajo,
      agotados,
      porVencer,
    },
    ultimasVentas,
    productosBajoStock,
  });
}

async function alertas(req, res) {
  const ahora = new Date();
  const limiteVencimiento = new Date(ahora);
  limiteVencimiento.setDate(limiteVencimiento.getDate() + 90);

  const [stockBajo, agotados, porVencer] = await Promise.all([
    Producto.find({
      estado: "ACTIVO",
      stock: { $gt: 0 },
      $expr: { $lte: ["$stock", "$stockMinimo"] },
    }).sort({ stock: 1 }),
    Producto.find({ estado: "ACTIVO", stock: 0 }).sort({ nombre: 1 }),
    Producto.find({
      estado: "ACTIVO",
      fechaVencimiento: { $lte: limiteVencimiento },
    }).sort({ fechaVencimiento: 1 }),
  ]);

  res.json({
    resumen: {
      stockBajo: stockBajo.length,
      agotados: agotados.length,
      porVencer: porVencer.length,
    },
    stockBajo,
    agotados,
    porVencer,
  });
}

module.exports = { resumen, alertas };
