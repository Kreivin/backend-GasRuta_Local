const { db } = require("../config/firebase");

// =========================
// Obtener todos los productos
// =========================
const obtenerProductos = async (req, res) => {
  try {
    const snapshot = await db.collection("productos").get();

    const productos = [];

    snapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json(productos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Obtener producto por ID
// =========================
const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await db
      .collection("productos")
      .doc(id)
      .get();

    if (!producto.exists) {
      return res.status(404).json({
        mensaje: "Producto no encontrado",
      });
    }

    res.status(200).json({
      id: producto.id,
      ...producto.data(),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProducto,
};