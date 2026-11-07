const express = require("express");
const cors = require("cors");

require("./config/database");

const { estadoConexion } = require("./config/database");
const rutasAuth = require("./routes/auth.routes");
const rutasProductos = require("./routes/productos.routes");
const rutasClientes = require("./routes/clientes.routes");
const rutasVentas = require("./routes/ventas.routes");
const rutasDashboard = require("./routes/dashboard.routes");
const {
  noEncontrado,
  manejarErrores,
} = require("./middleware/errores.middleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/salud", (req, res) => {
  res.json({
    ok: true,
    app: "Nova Salud API",
    baseDeDatos: estadoConexion(),
  });
});

app.use("/api/auth", rutasAuth);
app.use("/api/productos", rutasProductos);
app.use("/api/clientes", rutasClientes);
app.use("/api/ventas", rutasVentas);
app.use("/api/dashboard", rutasDashboard);

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
