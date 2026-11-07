// Punto de entrada serverless para Vercel.
// Reutiliza la misma aplicación Express del backend local.
// En Vercel se configuran MONGODB_URI y JWT_SECRET como variables de entorno.

module.exports = require("../backend/app");
