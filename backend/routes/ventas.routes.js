const express = require("express");

const {
  crear,
  listar,
  obtener,
} = require("../controllers/ventas.controller");
const { verificarToken } = require("../middleware/auth.middleware");
const envolver = require("../utils/asyncHandler");

const router = express.Router();

router.use(verificarToken);

router.get("/", envolver(listar));
router.get("/:id", envolver(obtener));
router.post("/", envolver(crear));

module.exports = router;
