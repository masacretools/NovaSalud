const express = require("express");

const {
  listar,
  categorias,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
} = require("../controllers/productos.controller");
const { verificarToken } = require("../middleware/auth.middleware");
const envolver = require("../utils/asyncHandler");

const router = express.Router();

router.use(verificarToken);

router.get("/", envolver(listar));
router.get("/categorias", envolver(categorias));
router.get("/:id", envolver(obtener));
router.post("/", envolver(crear));
router.put("/:id", envolver(actualizar));
router.patch("/:id/estado", envolver(cambiarEstado));
router.delete("/:id", envolver(eliminar));

module.exports = router;
