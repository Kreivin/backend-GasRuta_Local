const express = require("express");
const router = express.Router();

const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioid,
  eliminarUsuario,
  actualizarUsuario,
} = require("../controllers/usuarioController");

router.post("/", crearUsuario);
router.get("/", obtenerUsuarios);
router.get("/:id", obtenerUsuarioid);
router.delete("/:id", eliminarUsuario);
router.put("/:id", actualizarUsuario);

module.exports = router;