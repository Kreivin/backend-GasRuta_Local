const express = require("express");
const router = express.Router();

const {
    exportarUsuariosCSV,
    exportarPedidosCSV,
    exportarHistorialCSV,
    exportarIncidenciasCSV,
    exportarResenasCSV,
    exportarRutasCSV,
} = require("../controllers/exportacion.controller");

router.get("/usuarios", exportarUsuariosCSV);
router.get("/pedidos", exportarPedidosCSV);
router.get("/historial", exportarHistorialCSV);
router.get("/incidencias", exportarIncidenciasCSV);
router.get("/resenas", exportarResenasCSV);
router.get("/rutas", exportarRutasCSV);

module.exports = router;