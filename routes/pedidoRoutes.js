const express = require("express");
const router = express.Router();

const {
  crearPedido,
  obtenerPedidos,
  obtenerPedido,
  obtenerPedidosUsuario,
  actualizarEstado,
  eliminarPedido
} = require("../controllers/pedidoController");

// Obtener todos los pedidos
router.get("/", obtenerPedidos);

// Obtener pedidos de un usuario
router.get("/usuario/:usuarioId", obtenerPedidosUsuario);

// Obtener pedido por ID
router.get("/:id", obtenerPedido);

// Crear pedido
router.post("/", crearPedido);

// Actualizar estado
router.put("/:id/estado", actualizarEstado);

// Eliminar pedido
router.delete("/:id", eliminarPedido);

module.exports = router;