const express = require("express");
const router = express.Router();

const {
  crearHistorial,
  obtenerHistoriales,
  obtenerHistorial,
  obtenerHistorialPedido,
  obtenerHistorialUsuario,
  actualizarHistorial,
  actualizarEstadoHistorial,
  eliminarHistorial,
} = require("../controllers/historial.Controller");

// Crear registro de historial
router.post("/", crearHistorial);

// Obtener todos los registros de historial (soporta query params ?estado=...&accion=...)
router.get("/", obtenerHistoriales);

// =========================
// Consultas específicas
// Deben estar antes de /:id
// =========================

// Obtener historial por pedido
router.get("/pedido/:pedidoId", obtenerHistorialPedido);

// Obtener historial por usuario
router.get("/usuario/:usuarioId", obtenerHistorialUsuario);

// Actualizar únicamente el estado del registro
router.patch("/:id/estado", actualizarEstadoHistorial);

// =========================
// Operaciones por ID
// =========================

// Obtener un registro por ID
router.get("/:id", obtenerHistorial);

// Actualizar un registro por ID
router.patch("/:id", actualizarHistorial);

// Eliminar un registro por ID
router.delete("/:id", eliminarHistorial);

module.exports = router;
