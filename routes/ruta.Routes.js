const express = require("express");
const router = express.Router();

const {
  crearRuta,
  obtenerRutas,
  obtenerRuta,
  obtenerRutaPedido,
  actualizarRuta,
  iniciarRuta,
  finalizarRuta,
  eliminarRuta,
  actualizarUbicacionRuta,
  obtenerUbicacionRuta,
} = require("../controllers/ruta.Controller");

// Crear ruta
router.post("/", crearRuta);

// Obtener todas
router.get("/", obtenerRutas);

// Ruta específica antes de /:id
router.get("/pedido/:pedidoId", obtenerRutaPedido);

// Acciones específicas antes de /:id
router.patch("/:id/iniciar", iniciarRuta);
router.patch("/:id/finalizar", finalizarRuta);
router.patch("/:id/ubicacion", actualizarUbicacionRuta);
router.get("/:id/ubicacion", obtenerUbicacionRuta);

// Operaciones por ID
router.get("/:id", obtenerRuta);
router.patch("/:id", actualizarRuta);
router.delete("/:id", eliminarRuta);

module.exports = router;