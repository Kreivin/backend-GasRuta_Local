const { db } = require("../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");

// =========================
// Colecciones
// =========================
const COLECCION_HISTORIAL = "Historial";
const COLECCION_PEDIDOS = "Pedido";
const COLECCION_USUARIOS = "Usuario";

// =========================
// Convertir fecha de Firestore
// =========================
const convertirFecha = (fecha) => {
  if (fecha && typeof fecha.toDate === "function") {
    return fecha.toDate().toISOString();
  }
  return fecha;
};

// =========================
// Formatear documento de historial
// =========================
const formatearHistorial = (documento) => {
  const datos = documento.data();
  const textoDescripcion = datos.descripcio || datos.descripcion || "";

  return {
    id: documento.id,
    accion: datos.accion || "",
    descripcio: textoDescripcion,
    descripcion: textoDescripcion,
    estado: datos.estado || "",
    fecha_entrega: convertirFecha(datos.fecha_entrega),
    id_pedido:
      datos.id_pedido?.id ||
      (typeof datos.id_pedido === "string" ? datos.id_pedido : null),
    id_usuario:
      datos.id_usuario?.id ||
      (typeof datos.id_usuario === "string" ? datos.id_usuario : null),
    fechaActualizacion: convertirFecha(datos.fechaActualizacion),
  };
};

// =========================
// Crear registro en historial
// =========================
const crearHistorial = async (req, res) => {
  try {
    const {
      accion,
      descripcio,
      descripcion,
      estado,
      fecha_entrega,
      id_pedido,
      pedidoId,
      id_usuario,
      usuarioId,
    } = req.body;

    const pedidoIdFinal = id_pedido || pedidoId;
    const usuarioIdFinal = id_usuario || usuarioId;
    const descripcionFinal = descripcio || descripcion;

    // Validar campos obligatorios
    if (!accion || typeof accion !== "string" || accion.trim() === "") {
      return res.status(400).json({
        mensaje: "El campo 'accion' es obligatorio",
      });
    }

    if (
      !descripcionFinal ||
      typeof descripcionFinal !== "string" ||
      descripcionFinal.trim() === ""
    ) {
      return res.status(400).json({
        mensaje: "El campo 'descripcio' (o 'descripcion') es obligatorio",
      });
    }

    if (!estado || typeof estado !== "string" || estado.trim() === "") {
      return res.status(400).json({
        mensaje: "El campo 'estado' es obligatorio",
      });
    }

    if (!pedidoIdFinal) {
      return res.status(400).json({
        mensaje: "El campo 'id_pedido' es obligatorio",
      });
    }

    if (!usuarioIdFinal) {
      return res.status(400).json({
        mensaje: "El campo 'id_usuario' es obligatorio",
      });
    }

    // Referencias a colecciones relacionadas
    const pedidoRef = db.collection(COLECCION_PEDIDOS).doc(pedidoIdFinal);
    const usuarioRef = db.collection(COLECCION_USUARIOS).doc(usuarioIdFinal);

    // Verificar existencia de documentos referenciados
    const [pedidoDocumento, usuarioDocumento] = await Promise.all([
      pedidoRef.get(),
      usuarioRef.get(),
    ]);

    if (!pedidoDocumento.exists) {
      return res.status(404).json({
        mensaje: "El pedido indicado no existe",
      });
    }

    if (!usuarioDocumento.exists) {
      return res.status(404).json({
        mensaje: "El usuario indicado no existe",
      });
    }

    // Manejo de fecha de entrega
    let fechaEntregaTimestamp = Timestamp.now();
    if (fecha_entrega) {
      const fechaParseada = new Date(fecha_entrega);
      if (!isNaN(fechaParseada.getTime())) {
        fechaEntregaTimestamp = Timestamp.fromDate(fechaParseada);
      }
    }

    const nuevoHistorial = {
      accion: accion.trim(),
      descripcio: descripcionFinal.trim(),
      estado: estado.trim(),
      fecha_entrega: fechaEntregaTimestamp,
      id_pedido: pedidoRef,
      id_usuario: usuarioRef,
      fechaActualizacion: Timestamp.now(),
    };

    const resultado = await db
      .collection(COLECCION_HISTORIAL)
      .add(nuevoHistorial);

    return res.status(201).json({
      mensaje: "Historial registrado correctamente",
      id: resultado.id,
      historial: {
        id: resultado.id,
        accion: nuevoHistorial.accion,
        descripcio: nuevoHistorial.descripcio,
        descripcion: nuevoHistorial.descripcio,
        estado: nuevoHistorial.estado,
        fecha_entrega: convertirFecha(fechaEntregaTimestamp),
        id_pedido: pedidoIdFinal,
        id_usuario: usuarioIdFinal,
      },
    });
  } catch (error) {
    console.error("Error al crear historial:", error);
    return res.status(500).json({
      mensaje: "No se pudo registrar el historial",
      error: error.message,
    });
  }
};

// =========================
// Obtener todos los historiales
// =========================
const obtenerHistoriales = async (req, res) => {
  try {
    const { estado, accion } = req.query;
    let consulta = db.collection(COLECCION_HISTORIAL);

    if (estado) {
      consulta = consulta.where("estado", "==", estado);
    }

    if (accion) {
      consulta = consulta.where("accion", "==", accion);
    }

    const snapshot = await consulta.get();
    const historiales = snapshot.docs.map(formatearHistorial);

    return res.status(200).json(historiales);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return res.status(500).json({
      mensaje: "No se pudo obtener el historial",
      error: error.message,
    });
  }
};

// =========================
// Obtener historial por ID
// =========================
const obtenerHistorial = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await db
      .collection(COLECCION_HISTORIAL)
      .doc(id)
      .get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Registro de historial no encontrado",
      });
    }

    return res.status(200).json(formatearHistorial(documento));
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return res.status(500).json({
      mensaje: "No se pudo obtener el historial",
      error: error.message,
    });
  }
};

// =========================
// Obtener historial por pedido
// =========================
const obtenerHistorialPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;

    const pedidoRef = db.collection(COLECCION_PEDIDOS).doc(pedidoId);
    const pedidoDocumento = await pedidoRef.get();

    if (!pedidoDocumento.exists) {
      return res.status(404).json({
        mensaje: "El pedido indicado no existe",
      });
    }

    const snapshot = await db
      .collection(COLECCION_HISTORIAL)
      .where("id_pedido", "==", pedidoRef)
      .get();

    const historial = snapshot.docs.map(formatearHistorial);

    return res.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener historial por pedido:", error);
    return res.status(500).json({
      mensaje: "No se pudo obtener el historial del pedido",
      error: error.message,
    });
  }
};

// =========================
// Obtener historial por usuario
// =========================
const obtenerHistorialUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const usuarioRef = db.collection(COLECCION_USUARIOS).doc(usuarioId);
    const usuarioDocumento = await usuarioRef.get();

    if (!usuarioDocumento.exists) {
      return res.status(404).json({
        mensaje: "El usuario indicado no existe",
      });
    }

    const snapshot = await db
      .collection(COLECCION_HISTORIAL)
      .where("id_usuario", "==", usuarioRef)
      .get();

    const historial = snapshot.docs.map(formatearHistorial);

    return res.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener historial por usuario:", error);
    return res.status(500).json({
      mensaje: "No se pudo obtener el historial del usuario",
      error: error.message,
    });
  }
};

// =========================
// Actualizar registro de historial
// =========================
const actualizarHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      accion,
      descripcio,
      descripcion,
      estado,
      fecha_entrega,
      id_pedido,
      pedidoId,
      id_usuario,
      usuarioId,
    } = req.body;

    const historialRef = db.collection(COLECCION_HISTORIAL).doc(id);
    const documento = await historialRef.get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Registro de historial no encontrado",
      });
    }

    const camposActualizar = {};

    if (accion !== undefined) {
      if (typeof accion !== "string" || accion.trim() === "") {
        return res.status(400).json({
          mensaje: "La acción no puede ser un texto vacío",
        });
      }
      camposActualizar.accion = accion.trim();
    }

    const descripcionFinal = descripcio || descripcion;
    if (descripcionFinal !== undefined) {
      if (typeof descripcionFinal !== "string" || descripcionFinal.trim() === "") {
        return res.status(400).json({
          mensaje: "La descripción no puede ser un texto vacío",
        });
      }
      camposActualizar.descripcio = descripcionFinal.trim();
    }

    if (estado !== undefined) {
      if (typeof estado !== "string" || estado.trim() === "") {
        return res.status(400).json({
          mensaje: "El estado no puede ser un texto vacío",
        });
      }
      camposActualizar.estado = estado.trim();
    }

    if (fecha_entrega !== undefined) {
      const fechaParseada = new Date(fecha_entrega);
      if (!isNaN(fechaParseada.getTime())) {
        camposActualizar.fecha_entrega = Timestamp.fromDate(fechaParseada);
      }
    }

    const pedidoIdFinal = id_pedido || pedidoId;
    if (pedidoIdFinal) {
      const pedidoRef = db.collection(COLECCION_PEDIDOS).doc(pedidoIdFinal);
      const pedidoDoc = await pedidoRef.get();
      if (!pedidoDoc.exists) {
        return res.status(404).json({
          mensaje: "El pedido indicado no existe",
        });
      }
      camposActualizar.id_pedido = pedidoRef;
    }

    const usuarioIdFinal = id_usuario || usuarioId;
    if (usuarioIdFinal) {
      const usuarioRef = db.collection(COLECCION_USUARIOS).doc(usuarioIdFinal);
      const usuarioDoc = await usuarioRef.get();
      if (!usuarioDoc.exists) {
        return res.status(404).json({
          mensaje: "El usuario indicado no existe",
        });
      }
      camposActualizar.id_usuario = usuarioRef;
    }

    if (Object.keys(camposActualizar).length === 0) {
      return res.status(400).json({
        mensaje: "Debes enviar al menos un campo para actualizar",
      });
    }

    camposActualizar.fechaActualizacion = Timestamp.now();

    await historialRef.update(camposActualizar);

    const documentoActualizado = await historialRef.get();

    return res.status(200).json({
      mensaje: "Historial actualizado correctamente",
      historial: formatearHistorial(documentoActualizado),
    });
  } catch (error) {
    console.error("Error al actualizar historial:", error);
    return res.status(500).json({
      mensaje: "No se pudo actualizar el historial",
      error: error.message,
    });
  }
};

// =========================
// Actualizar únicamente el estado
// =========================
const actualizarEstadoHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || typeof estado !== "string" || estado.trim() === "") {
      return res.status(400).json({
        mensaje: "El estado es obligatorio",
      });
    }

    const historialRef = db.collection(COLECCION_HISTORIAL).doc(id);
    const documento = await historialRef.get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Registro de historial no encontrado",
      });
    }

    const ahora = Timestamp.now();

    await historialRef.update({
      estado: estado.trim(),
      fechaActualizacion: ahora,
    });

    const documentoActualizado = await historialRef.get();

    return res.status(200).json({
      mensaje: "Estado del historial actualizado correctamente",
      historial: formatearHistorial(documentoActualizado),
    });
  } catch (error) {
    console.error("Error al actualizar estado del historial:", error);
    return res.status(500).json({
      mensaje: "No se pudo actualizar el estado del historial",
      error: error.message,
    });
  }
};

// =========================
// Eliminar registro de historial
// =========================
const eliminarHistorial = async (req, res) => {
  try {
    const { id } = req.params;

    const historialRef = db.collection(COLECCION_HISTORIAL).doc(id);
    const documento = await historialRef.get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Registro de historial no encontrado",
      });
    }

    await historialRef.delete();

    return res.status(200).json({
      mensaje: "Historial eliminado correctamente",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar historial:", error);
    return res.status(500).json({
      mensaje: "No se pudo eliminar el historial",
      error: error.message,
    });
  }
};

module.exports = {
  crearHistorial,
  obtenerHistoriales,
  obtenerHistorial,
  obtenerHistorialPorId: obtenerHistorial,
  obtenerHistorialPedido,
  obtenerHistorialUsuario,
  actualizarHistorial,
  actualizarEstadoHistorial,
  eliminarHistorial,
};
