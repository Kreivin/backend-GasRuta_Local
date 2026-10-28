const express = require("express");
const router = express.Router();

const {
  crearIncidencia,
  obtenerIncidencias,
  obtenerIncidencia,
  obtenerIncidenciasUsuario,
  obtenerIncidenciasPedido,
  obtenerIncidenciasRuta,
  actualizarIncidencia,
  actualizarEstadoIncidencia,
  eliminarIncidencia,
} = require("../controllers/incidencia.Controller");

// Crear incidencia
router.post("/", crearIncidencia);

// Obtener todas las incidencias
router.get("/", obtenerIncidencias);

// =========================
// Consultas específicas
// Deben estar antes de /:id
// =========================

// Obtener incidencias por usuario
router.get(
  "/usuario/:usuarioId",
  obtenerIncidenciasUsuario
);

// Obtener incidencias por pedido
router.get(
  "/pedido/:pedidoId",
  obtenerIncidenciasPedido
);

// Obtener incidencias por ruta
router.get(
  "/ruta/:rutaId",
  obtenerIncidenciasRuta
);

// Actualizar únicamente el estado
router.patch(
  "/:id/estado",
  actualizarEstadoIncidencia
);

// =========================
// Operaciones por ID
// =========================

router.get("/:id", obtenerIncidencia);
router.patch("/:id", actualizarIncidencia);
router.delete("/:id", eliminarIncidencia);

module.exports = router;