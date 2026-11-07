const express = require("express");

const {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
} = require("../controllers/clientes.controller");
const { verificarToken } = require("../middleware/auth.middleware");
const envolver = require("../utils/asyncHandler");

const router = express.Router();

router.use(verificarToken);

router.get("/", envolver(listar));
router.get("/:id", envolver(obtener));
router.post("/", envolver(crear));
router.put("/:id", envolver(actualizar));
router.delete("/:id", envolver(eliminar));

module.exports = router;
