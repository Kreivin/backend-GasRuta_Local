const { db } = require("../config/firebase");

// =========================
// Crear pedido
// =========================
const crearPedido = async (req, res) => {
  try {
    const {
      usuarioId,
      productos,
      direcciones,
      referencia,
      subtotal,
      deliveri,
    } = req.body;

    // Referencia al usuario
    const usuarioRef = db.collection("usuarios").doc(usuarioId);

    const pedido = {
      usuarioid: usuarioRef,
      productos,
      direcciones,
      referencia,
      subtotal,
      deliveri,
      estado: "pendiente",
      fecha: new Date(),
    };

    const resultado = await db.collection("pedidos").add(pedido);

    res.status(201).json({
      mensaje: "Pedido creado correctamente",
      id: resultado.id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Obtener todos los pedidos
// =========================
const obtenerPedidos = async (req, res) => {
  try {
    const snapshot = await db.collection("pedidos").get();

    const pedidos = [];

    snapshot.forEach((doc) => {
      pedidos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(pedidos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Obtener pedido por ID
// =========================
const obtenerPedido = async (req, res) => {
  try {
    const pedido = await db
      .collection("pedidos")
      .doc(req.params.id)
      .get();

    if (!pedido.exists) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    res.json({
      id: pedido.id,
      ...pedido.data(),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Obtener pedidos de un usuario
// =========================
const obtenerPedidosUsuario = async (req, res) => {
  try {
    const usuarioRef = db
      .collection("usuarios")
      .doc(req.params.usuarioId);

    const snapshot = await db
      .collection("pedidos")
      .where("usuarioid", "==", usuarioRef)
      .get();

    const pedidos = [];

    snapshot.forEach((doc) => {
      pedidos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(pedidos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Actualizar estado
// =========================
const actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;

    await db
      .collection("pedidos")
      .doc(req.params.id)
      .update({
        estado,
      });

    res.json({
      mensaje: "Estado actualizado correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Eliminar pedido
// =========================
const eliminarPedido = async (req, res) => {
  try {
    await db
      .collection("pedidos")
      .doc(req.params.id)
      .delete();

    res.json({
      mensaje: "Pedido eliminado correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedido,
  obtenerPedidosUsuario,
  actualizarEstado,
  eliminarPedido,
};