const express = require("express");
const router = express.Router();

const {
  crearResena,
  obtenerResenas,
  obtenerResena,
  obtenerResenasRepartidor,
  obtenerResenasCliente,
  actualizarResena,
  eliminarResena,
} = require("../controllers/resenaController");

// Crear reseña
router.post("/", crearResena);

// Obtener todas las reseñas
router.get("/", obtenerResenas);

// Obtener reseñas de un repartidor
router.get(
  "/repartidor/:repartidorId",
  obtenerResenasRepartidor
);

// Obtener reseñas de un cliente
router.get(
  "/cliente/:clienteId",
  obtenerResenasCliente
);

// Obtener una reseña por ID
router.get("/:id", obtenerResena);

// Actualizar una reseña
router.patch("/:id", actualizarResena);

// Eliminar una reseña
router.delete("/:id", eliminarResena);

module.exports = router;