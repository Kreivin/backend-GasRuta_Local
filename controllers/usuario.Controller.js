const { db, auth } = require("../config/firebase");

// =========================
// Crear usuario
// =========================
const crearUsuario = async (req, res) => {
  let usuarioAuth = null;

  try {
    const {
      Nombre,
      Correo,
      Contraseña,
      Telefono = "",
      Direccion = "",
      Rol = "Cliente",
      Usuariokey = "",
    } = req.body;

    if (!Nombre || !Correo || !Contraseña) {
      return res.status(400).json({
        mensaje:
          "Nombre, correo y contraseña son obligatorios",
      });
    }

    if (Contraseña.length < 6) {
      return res.status(400).json({
        mensaje:
          "La contraseña debe tener al menos 6 caracteres",
      });
    }

    const rolesPermitidos = [
      "Cliente",
      "Repartidor",
      "Administrador",
    ];

    if (!rolesPermitidos.includes(Rol)) {
      return res.status(400).json({
        mensaje: "El rol indicado no es válido",
        rolesPermitidos,
      });
    }

    const correoNormalizado = Correo
      .trim()
      .toLowerCase();

    // Crear cuenta en Firebase Authentication
    usuarioAuth = await auth.createUser({
      email: correoNormalizado,
      password: Contraseña,
      displayName: Nombre.trim(),
    });

    // Asignar rol dentro del token
    await auth.setCustomUserClaims(usuarioAuth.uid, {
      rol: Rol,
      admin: Rol === "Administrador",
    });

    // Guardar perfil en Firestore sin contraseña
    const perfilUsuario = {
      uid: usuarioAuth.uid,
      Usuariokey:
        Usuariokey || `US-${usuarioAuth.uid.slice(0, 6)}`,
      Nombre: Nombre.trim(),
      Correo: correoNormalizado,
      Telefono: Telefono.trim(),
      Direccion: Direccion.trim(),
      Rol,
      activo: true,
      fechaCreacion: new Date(),
    };

    await db
      .collection("Usuario")
      .doc(usuarioAuth.uid)
      .set(perfilUsuario);

    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      id: usuarioAuth.uid,
      usuario: perfilUsuario,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    // Si Authentication se creó pero Firestore falló,
    // elimina la cuenta para evitar datos incompletos.
    if (usuarioAuth?.uid) {
      try {
        await auth.deleteUser(usuarioAuth.uid);
      } catch (errorEliminando) {
        console.error(
          "No se pudo revertir la cuenta:",
          errorEliminando.message
        );
      }
    }

    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({
        mensaje:
          "Ya existe una cuenta con ese correo electrónico",
      });
    }

    if (error.code === "auth/invalid-email") {
      return res.status(400).json({
        mensaje: "El correo electrónico no es válido",
      });
    }

    if (error.code === "auth/invalid-password") {
      return res.status(400).json({
        mensaje:
          "La contraseña debe tener al menos 6 caracteres",
      });
    }

    return res.status(500).json({
      mensaje: "No se pudo crear el usuario",
      error: error.message,
    });
  }
};
// =========================
// Obtener usuarios
// =========================
const obtenerUsuarios = async (req, res) => {
  try {
    const snapshot = await db.collection("Usuario").get();

    const usuarios = [];

    snapshot.forEach((doc) => {
      usuarios.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json(usuarios);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// =========================
// Obtener usuario por ID
// =========================
const obtenerUsuarioid = async (req, res) => {
  try {
    const documento = await db
      .collection("Usuario")
      .doc(req.params.id)
      .get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const datos = documento.data();
    const { Contraseña, ...datosSeguros } = datos;

    res.status(200).json({
      id: documento.id,
      ...datosSeguros,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);

    res.status(500).json({
      mensaje: "No se pudo obtener el usuario",
      error: error.message,
    });
  }
};

// =========================
// Eliminar usuario por ID
// =========================
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const referenciaUsuario = db.collection("Usuario").doc(id);
    const documentoUsuario = await referenciaUsuario.get();

    if (!documentoUsuario.exists) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    await referenciaUsuario.delete();

    return res.status(200).json({
      mensaje: "Usuario eliminado correctamente",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);

    return res.status(500).json({
      mensaje: "Error al eliminar el usuario",
      error: error.message,
    });
  }
};

// =========================
// Actualizar usuario por ID
// =========================
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    // Evitar solicitudes sin datos
    if (!datosActualizados || Object.keys(datosActualizados).length === 0) {
      return res.status(400).json({
        mensaje: "Debes proporcionar al menos un campo para actualizar",
      });
    }

    const referenciaUsuario = db.collection("Usuario").doc(id);
    const documentoUsuario = await referenciaUsuario.get();

    // Comprobar que el usuario existe
    if (!documentoUsuario.exists) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    // Evitar modificar ciertos campos directamente
    delete datosActualizados.id;
    delete datosActualizados.Contraseña;

    await referenciaUsuario.update(datosActualizados);

    // Leer el documento actualizado
    const usuarioActualizado = await referenciaUsuario.get();
    const datosUsuario = usuarioActualizado.data();

    // Evitar devolver la contraseña almacenada
    const { Contraseña, ...datosSeguros } = datosUsuario;

    return res.status(200).json({
      mensaje: "Usuario actualizado correctamente",
      usuario: {
        id: usuarioActualizado.id,
        ...datosSeguros,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);

    return res.status(500).json({
      mensaje: "No se pudo actualizar el usuario",
      error: error.message,
    });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioid,
  eliminarUsuario,
  actualizarUsuario,
};