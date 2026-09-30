const express = require("express");
const router = express.Router();

const {
  obtenerProductos,
  obtenerProducto,
} = require("../controllers/productoController");

router.get("/", obtenerProductos);
router.get("/:id", obtenerProducto);

module.exports = router;