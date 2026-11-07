const express = require("express");

const { login, perfil, registrar } = require("../controllers/auth.controller");
const { verificarToken, soloAdmin } = require("../middleware/auth.middleware");
const envolver = require("../utils/asyncHandler");

const router = express.Router();

router.post("/login", envolver(login));
router.get("/perfil", verificarToken, envolver(perfil));
router.post("/registro", verificarToken, soloAdmin, envolver(registrar));

module.exports = router;
