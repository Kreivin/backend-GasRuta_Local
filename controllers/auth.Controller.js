const { db } = require("../config/firebase");

// =========================
// Obtener perfil autenticado
// =========================
const obtenerPerfil = async (req, res) => {
  try {
    const { uid, correo } = req.usuario;

    // Primero intenta encontrar un documento cuyo ID sea el UID
    let documentoUsuario = await db
      .collection("Usuario")
      .doc(uid)
      .get();

    // Compatibilidad con usuarios antiguos:
    // busca por correo si el documento no usa el UID
    if (!documentoUsuario.exists && correo) {
      const snapshot = await db
        .collection("Usuario")
        .where("Correo", "==", correo)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        documentoUsuario = snapshot.docs[0];
      }
    }

    if (!documentoUsuario.exists) {
      return res.status(404).json({
        mensaje:
          "La cuenta existe en Authentication, pero no tiene perfil en Firestore",
      });
    }

    const datos = documentoUsuario.data();

    // Nunca devolver la contraseña
    const {
      Contraseña,
      ...datosSeguros
    } = datos;

    return res.status(200).json({
      mensaje: "Usuario autenticado correctamente",
      usuario: {
        id: documentoUsuario.id,
        uid,
        ...datosSeguros,
      },
    });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener el perfil",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerPerfil,
};