const { db } = require("../config/firebase");

const {
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");

// =========================
// Colecciones
// =========================

const COLECCION_INCIDENCIAS = "Incidencia";
const COLECCION_USUARIOS = "Usuario";
const COLECCION_PEDIDOS = "Pedido";
const COLECCION_RUTAS = "Ruta";

// =========================
// Tipos de incidencia
// =========================

const TIPOS_INCIDENCIA = [
  "direccion_incorrecta",
  "cliente_ausente",
  "vehiculo_averiado",
  "retraso_entrega",
  "producto_danado",
  "pedido_incorrecto",
  "otro",
];

// =========================
// Estados permitidos
// =========================

const ESTADOS_INCIDENCIA = [
  "pendiente",
  "en_revision",
  "resuelta",
  "cancelada",
];

// =========================
// Convertir fecha
// =========================

const convertirFecha = (fecha) => {
  if (fecha && typeof fecha.toDate === "function") {
    return fecha.toDate().toISOString();
  }

  return fecha;
};

// =========================
// Formatear incidencia
// =========================

const formatearIncidencia = (documento) => {
  const datos = documento.data();

  let historial = [];

  if (Array.isArray(datos.historial_cambio)) {
    historial = datos.historial_cambio.map((cambio) => ({
      ...cambio,
      fechaModificacion: convertirFecha(
        cambio.fechaModificacion
      ),
    }));
  } else if (datos.historial_cambio) {
    // Compatibilidad con documentos antiguos
    // donde historial_cambio era un objeto
    historial = [
      {
        ...datos.historial_cambio,
        fechaModificacion: convertirFecha(
          datos.historial_cambio.fechaModificacion
        ),
      },
    ];
  }

  return {
    id: documento.id,

    usuarioId: datos.id_usuario?.id || null,
    pedidoId: datos.id_pedido?.id || null,
    rutaId: datos.id_ruta?.id || null,

    tipoIncidente: datos.tipo_incidente,
    descripcion: datos.descripcion,
    observaciones: datos.observaciones || "",
    estado: datos.estado || "pendiente",

    fechaRegistro: convertirFecha(datos.fechaRegistro),
    fechaResolucion: convertirFecha(
      datos.fechaResolucion
    ),
    fechaActualizacion: convertirFecha(
      datos.fechaActualizacion
    ),

    historialCambio: historial,
  };
};

// =========================
// Normalizar texto
// =========================

const normalizarValor = (valor) => {
  return valor
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
};

// =========================
// Crear incidencia
// =========================

const crearIncidencia = async (req, res) => {
  try {
    const {
      usuarioId,
      pedidoId,
      rutaId,
      tipoIncidente,
      descripcion,
      observaciones = "",
    } = req.body;

    // Validar referencias obligatorias
    if (!usuarioId) {
      return res.status(400).json({
        mensaje: "El usuarioId es obligatorio",
      });
    }

    if (!pedidoId) {
      return res.status(400).json({
        mensaje: "El pedidoId es obligatorio",
      });
    }

    if (!rutaId) {
      return res.status(400).json({
        mensaje: "El rutaId es obligatorio",
      });
    }

    // Validar tipo de incidencia
    if (
      !tipoIncidente ||
      typeof tipoIncidente !== "string"
    ) {
      return res.status(400).json({
        mensaje: "El tipo de incidente es obligatorio",
      });
    }

    const tipoNormalizado =
      normalizarValor(tipoIncidente);

    if (!TIPOS_INCIDENCIA.includes(tipoNormalizado)) {
      return res.status(400).json({
        mensaje: "El tipo de incidente no es válido",
        tiposPermitidos: TIPOS_INCIDENCIA,
      });
    }

    // Validar descripción
    if (
      !descripcion ||
      typeof descripcion !== "string" ||
      descripcion.trim() === ""
    ) {
      return res.status(400).json({
        mensaje: "La descripción es obligatoria",
      });
    }

    if (descripcion.trim().length > 500) {
      return res.status(400).json({
        mensaje:
          "La descripción no puede superar los 500 caracteres",
      });
    }

    if (
      observaciones !== undefined &&
      typeof observaciones !== "string"
    ) {
      return res.status(400).json({
        mensaje: "Las observaciones deben ser texto",
      });
    }

    // Crear referencias
    const usuarioRef = db
      .collection(COLECCION_USUARIOS)
      .doc(usuarioId);

    const pedidoRef = db
      .collection(COLECCION_PEDIDOS)
      .doc(pedidoId);

    const rutaRef = db
      .collection(COLECCION_RUTAS)
      .doc(rutaId);

    // Obtener documentos simultáneamente
    const [
      usuarioDocumento,
      pedidoDocumento,
      rutaDocumento,
    ] = await Promise.all([
      usuarioRef.get(),
      pedidoRef.get(),
      rutaRef.get(),
    ]);

    // Verificar documentos
    if (!usuarioDocumento.exists) {
      return res.status(404).json({
        mensaje: "El usuario indicado no existe",
      });
    }

    if (!pedidoDocumento.exists) {
      return res.status(404).json({
        mensaje: "El pedido indicado no existe",
      });
    }

    if (!rutaDocumento.exists) {
      return res.status(404).json({
        mensaje: "La ruta indicada no existe",
      });
    }

    // Verificar que el pedido pertenezca al usuario
    const pedido = pedidoDocumento.data();
    const usuarioPedidoId = pedido.Id_Usuario?.id;

    if (
      usuarioPedidoId &&
      usuarioPedidoId !== usuarioId
    ) {
      return res.status(400).json({
        mensaje:
          "El pedido no pertenece al usuario indicado",
      });
    }

    // Verificar que la ruta pertenezca al pedido
    const ruta = rutaDocumento.data();
    const pedidoRutaId = ruta.Pedido?.id;

    if (pedidoRutaId && pedidoRutaId !== pedidoId) {
      return res.status(400).json({
        mensaje:
          "La ruta indicada no pertenece al pedido",
      });
    }

    const fechaActual = Timestamp.now();

    const nuevaIncidencia = {
      id_usuario: usuarioRef,
      id_pedido: pedidoRef,
      id_ruta: rutaRef,

      tipo_incidente: tipoNormalizado,
      descripcion: descripcion.trim(),
      observaciones: observaciones.trim(),

      estado: "pendiente",
      fechaRegistro: fechaActual,
      fechaResolucion: null,

      historial_cambio: [
        {
          estadoAnterior: null,
          estadoNuevo: "pendiente",
          fechaModificacion: fechaActual,
        },
      ],
    };

    const resultado = await db
      .collection(COLECCION_INCIDENCIAS)
      .add(nuevaIncidencia);

    return res.status(201).json({
      mensaje: "Incidencia creada correctamente",
      id: resultado.id,

      incidencia: {
        usuarioId,
        pedidoId,
        rutaId,
        tipoIncidente: tipoNormalizado,
        descripcion: descripcion.trim(),
        observaciones: observaciones.trim(),
        estado: "pendiente",
      },
    });
  } catch (error) {
    console.error("Error al crear incidencia:", error);

    return res.status(500).json({
      mensaje: "No se pudo crear la incidencia",
      error: error.message,
    });
  }
};

// =========================
// Obtener todas
// =========================

const obtenerIncidencias = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLECCION_INCIDENCIAS)
      .get();

    const incidencias = snapshot.docs.map(
      formatearIncidencia
    );

    return res.status(200).json(incidencias);
  } catch (error) {
    console.error("Error al obtener incidencias:", error);

    return res.status(500).json({
      mensaje: "No se pudieron obtener las incidencias",
      error: error.message,
    });
  }
};

// =========================
// Obtener incidencia por ID
// =========================

const obtenerIncidencia = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await db
      .collection(COLECCION_INCIDENCIAS)
      .doc(id)
      .get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Incidencia no encontrada",
      });
    }

    return res.status(200).json(
      formatearIncidencia(documento)
    );
  } catch (error) {
    console.error("Error al obtener incidencia:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener la incidencia",
      error: error.message,
    });
  }
};

// =========================
// Obtener incidencias de usuario
// =========================

const obtenerIncidenciasUsuario = async (
  req,
  res
) => {
  try {
    const { usuarioId } = req.params;

    const usuarioRef = db
      .collection(COLECCION_USUARIOS)
      .doc(usuarioId);

    const usuarioDocumento = await usuarioRef.get();

    if (!usuarioDocumento.exists) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const snapshot = await db
      .collection(COLECCION_INCIDENCIAS)
      .where("id_usuario", "==", usuarioRef)
      .get();

    const incidencias = snapshot.docs.map(
      formatearIncidencia
    );

    return res.status(200).json(incidencias);
  } catch (error) {
    console.error(
      "Error al obtener incidencias del usuario:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No se pudieron obtener las incidencias del usuario",
      error: error.message,
    });
  }
};

// =========================
// Obtener incidencias de pedido
// =========================

const obtenerIncidenciasPedido = async (
  req,
  res
) => {
  try {
    const { pedidoId } = req.params;

    const pedidoRef = db
      .collection(COLECCION_PEDIDOS)
      .doc(pedidoId);

    const pedidoDocumento = await pedidoRef.get();

    if (!pedidoDocumento.exists) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    const snapshot = await db
      .collection(COLECCION_INCIDENCIAS)
      .where("id_pedido", "==", pedidoRef)
      .get();

    const incidencias = snapshot.docs.map(
      formatearIncidencia
    );

    return res.status(200).json(incidencias);
  } catch (error) {
    console.error(
      "Error al obtener incidencias del pedido:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No se pudieron obtener las incidencias del pedido",
      error: error.message,
    });
  }
};

// =========================
// Obtener incidencias de ruta
// =========================

const obtenerIncidenciasRuta = async (req, res) => {
  try {
    const { rutaId } = req.params;

    const rutaRef = db
      .collection(COLECCION_RUTAS)
      .doc(rutaId);

    const rutaDocumento = await rutaRef.get();

    if (!rutaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada",
      });
    }

    const snapshot = await db
      .collection(COLECCION_INCIDENCIAS)
      .where("id_ruta", "==", rutaRef)
      .get();

    const incidencias = snapshot.docs.map(
      formatearIncidencia
    );

    return res.status(200).json(incidencias);
  } catch (error) {
    console.error(
      "Error al obtener incidencias de la ruta:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No se pudieron obtener las incidencias de la ruta",
      error: error.message,
    });
  }
};

// =========================
// Actualizar incidencia
// =========================

const actualizarIncidencia = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      tipoIncidente,
      descripcion,
      observaciones,
    } = req.body;

    if (
      tipoIncidente === undefined &&
      descripcion === undefined &&
      observaciones === undefined
    ) {
      return res.status(400).json({
        mensaje:
          "Debes enviar tipoIncidente, descripcion u observaciones",
      });
    }

    const incidenciaRef = db
      .collection(COLECCION_INCIDENCIAS)
      .doc(id);

    const incidenciaDocumento =
      await incidenciaRef.get();

    if (!incidenciaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Incidencia no encontrada",
      });
    }

    const incidenciaActual =
      incidenciaDocumento.data();

    if (
      incidenciaActual.estado === "resuelta" ||
      incidenciaActual.estado === "cancelada"
    ) {
      return res.status(400).json({
        mensaje:
          "No se puede modificar una incidencia resuelta o cancelada",
      });
    }

    const datosActualizados = {
      fechaActualizacion: Timestamp.now(),
    };

    if (tipoIncidente !== undefined) {
      if (
        typeof tipoIncidente !== "string" ||
        tipoIncidente.trim() === ""
      ) {
        return res.status(400).json({
          mensaje:
            "El tipo de incidente no puede estar vacío",
        });
      }

      const tipoNormalizado =
        normalizarValor(tipoIncidente);

      if (!TIPOS_INCIDENCIA.includes(tipoNormalizado)) {
        return res.status(400).json({
          mensaje: "El tipo de incidente no es válido",
          tiposPermitidos: TIPOS_INCIDENCIA,
        });
      }

      datosActualizados.tipo_incidente =
        tipoNormalizado;
    }

    if (descripcion !== undefined) {
      if (
        typeof descripcion !== "string" ||
        descripcion.trim() === ""
      ) {
        return res.status(400).json({
          mensaje: "La descripción no puede estar vacía",
        });
      }

      if (descripcion.trim().length > 500) {
        return res.status(400).json({
          mensaje:
            "La descripción no puede superar los 500 caracteres",
        });
      }

      datosActualizados.descripcion =
        descripcion.trim();
    }

    if (observaciones !== undefined) {
      if (typeof observaciones !== "string") {
        return res.status(400).json({
          mensaje: "Las observaciones deben ser texto",
        });
      }

      datosActualizados.observaciones =
        observaciones.trim();
    }

    await incidenciaRef.update(datosActualizados);

    const incidenciaActualizada =
      await incidenciaRef.get();

    return res.status(200).json({
      mensaje: "Incidencia actualizada correctamente",
      incidencia: formatearIncidencia(
        incidenciaActualizada
      ),
    });
  } catch (error) {
    console.error(
      "Error al actualizar incidencia:",
      error
    );

    return res.status(500).json({
      mensaje: "No se pudo actualizar la incidencia",
      error: error.message,
    });
  }
};

// =========================
// Actualizar estado
// =========================

const actualizarEstadoIncidencia = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    if (
      !estado ||
      typeof estado !== "string" ||
      estado.trim() === ""
    ) {
      return res.status(400).json({
        mensaje: "El estado es obligatorio",
      });
    }

    const estadoNormalizado = normalizarValor(estado);

    if (
      !ESTADOS_INCIDENCIA.includes(
        estadoNormalizado
      )
    ) {
      return res.status(400).json({
        mensaje: "El estado indicado no es válido",
        estadosPermitidos: ESTADOS_INCIDENCIA,
      });
    }

    const incidenciaRef = db
      .collection(COLECCION_INCIDENCIAS)
      .doc(id);

    const incidenciaDocumento =
      await incidenciaRef.get();

    if (!incidenciaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Incidencia no encontrada",
      });
    }

    const incidenciaActual =
      incidenciaDocumento.data();

    const estadoAnterior =
      incidenciaActual.estado || "pendiente";

    if (estadoAnterior === estadoNormalizado) {
      return res.status(400).json({
        mensaje:
          "La incidencia ya tiene el estado indicado",
      });
    }

    const fechaActual = Timestamp.now();

    const datosActualizados = {
      estado: estadoNormalizado,
      fechaActualizacion: fechaActual,

      historial_cambio: FieldValue.arrayUnion({
        estadoAnterior,
        estadoNuevo: estadoNormalizado,
        fechaModificacion: fechaActual,
      }),
    };

    // Fecha de resolución
    if (estadoNormalizado === "resuelta") {
      datosActualizados.fechaResolucion =
        fechaActual;
    } else {
      datosActualizados.fechaResolucion = null;
    }

    if (observaciones !== undefined) {
      if (typeof observaciones !== "string") {
        return res.status(400).json({
          mensaje: "Las observaciones deben ser texto",
        });
      }

      datosActualizados.observaciones =
        observaciones.trim();
    }

    await incidenciaRef.update(datosActualizados);

    const incidenciaActualizada =
      await incidenciaRef.get();

    return res.status(200).json({
      mensaje:
        "Estado de incidencia actualizado correctamente",

      incidencia: formatearIncidencia(
        incidenciaActualizada
      ),
    });
  } catch (error) {
    console.error(
      "Error al actualizar estado de incidencia:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No se pudo actualizar el estado de la incidencia",
      error: error.message,
    });
  }
};

// =========================
// Eliminar incidencia
// =========================

const eliminarIncidencia = async (req, res) => {
  try {
    const { id } = req.params;

    const incidenciaRef = db
      .collection(COLECCION_INCIDENCIAS)
      .doc(id);

    const incidenciaDocumento =
      await incidenciaRef.get();

    if (!incidenciaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Incidencia no encontrada",
      });
    }

    await incidenciaRef.delete();

    return res.status(200).json({
      mensaje: "Incidencia eliminada correctamente",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar incidencia:", error);

    return res.status(500).json({
      mensaje: "No se pudo eliminar la incidencia",
      error: error.message,
    });
  }
};

module.exports = {
  crearIncidencia,
  obtenerIncidencias,
  obtenerIncidencia,
  obtenerIncidenciasUsuario,
  obtenerIncidenciasPedido,
  obtenerIncidenciasRuta,
  actualizarIncidencia,
  actualizarEstadoIncidencia,
  eliminarIncidencia,
};