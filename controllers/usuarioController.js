const { db } = require("../config/firebase");

// =========================
// Crear usuario
// =========================
const crearUsuario = async (req, res) => {
  try {
    const resultado = await db.collection("usuarios").add(req.body);

    res.status(201).json({
      mensaje: "Usuario creado",
      id: resultado.id,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Obtener usuarios
// =========================
const obtenerUsuarios = async (req, res) => {
  try {
    const snapshot = await db.collection("usuarios").get();

    const usuarios = [];

    snapshot.forEach((doc) => {
      usuarios.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Obtener usuario por ID
// =========================
const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await db
      .collection("usuarios")
      .doc(req.params.id)
      .get();

    if (!usuario.exists) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    res.json({
      id: usuario.id,
      ...usuario.data(),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuario,
};