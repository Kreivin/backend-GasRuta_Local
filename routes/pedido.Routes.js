const express = require("express");
const router = express.Router();

const pedidoController = require("../controllers/pedido.Controller");


// Crear pedido
router.post("/", pedidoController.crearPedido);

// Obtener todos los pedidos
router.get("/", pedidoController.obtenerPedidos);

// Obtener pedidos de un usuario
router.get(
  "/usuario/:usuarioId",
  pedidoController.obtenerPedidosUsuario
);

// Actualizar solamente el estado
router.patch(
  "/:id/estado",
  pedidoController.actualizarEstado
);

// Obtener un pedido por ID
router.get("/:id", pedidoController.obtenerPedido);

// Actualizar datos del pedido
router.patch("/:id", pedidoController.actualizarPedido);

// Eliminar pedido
router.delete("/:id", pedidoController.eliminarPedido);

module.exports = router;