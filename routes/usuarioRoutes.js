const express = require("express");
const router = express.Router();

const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuario,
} = require("../controllers/usuarioController");

router.post("/", crearUsuario);
router.get("/", obtenerUsuarios);
router.get("/:id", obtenerUsuario);

module.exports = router;