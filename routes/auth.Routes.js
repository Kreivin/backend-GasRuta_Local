const express = require("express");
const router = express.Router();

const verificarToken = require(
  "../middleware/verificarToken.js"
);

const {
  obtenerPerfil,
} = require("../controllers/auth.Controller.js");

// El usuario ya inició sesión en Firebase Authentication.
// Esta ruta solo comprueba el token y devuelve el perfil.
router.get(
  "/perfil",
  verificarToken,
  obtenerPerfil
);

module.exports = router;