const express = require("express");

const { resumen, alertas } = require("../controllers/dashboard.controller");
const { verificarToken } = require("../middleware/auth.middleware");
const envolver = require("../utils/asyncHandler");

const router = express.Router();

router.use(verificarToken);

router.get("/", envolver(resumen));
router.get("/alertas", envolver(alertas));

module.exports = router;
