const { db } = require("../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");

const COLECCION_RUTAS = "Ruta";
const COLECCION_PEDIDOS = "Pedido";

// =========================
// Convertir fechas
// =========================
const convertirFecha = (fecha) => {
  if (fecha && typeof fecha.toDate === "function") {
    return fecha.toDate().toISOString();
  }

  return fecha;
};

// =========================
// Formatear ruta
// =========================
const formatearRuta = (documento) => {
  const datos = documento.data();

  return {
    id: documento.id,
    Pedido: datos.Pedido?.id || null,
    ruta_asignada: datos.ruta_asignada,
    distancia_estimada: datos.distancia_estimada,
    tiempo_estimado: datos.tiempo_estimado,
    fecha_inicio: convertirFecha(datos.fecha_inicio),
    fecha_final: convertirFecha(datos.fecha_final),
    estado: datos.estado || "asignada",
    fechaActualizacion: convertirFecha(
      datos.fechaActualizacion
    ),
  };
};

// =========================
// Crear ruta
// =========================
const crearRuta = async (req, res) => {
  try {
    const {
      pedidoId,
      rutaAsignada,
      distanciaEstimada,
      tiempoEstimado,
    } = req.body;

    // Validaciones
    if (!pedidoId) {
      return res.status(400).json({
        mensaje: "El pedidoId es obligatorio",
      });
    }

    if (
      !rutaAsignada ||
      typeof rutaAsignada !== "string" ||
      rutaAsignada.trim() === ""
    ) {
      return res.status(400).json({
        mensaje: "La ruta asignada es obligatoria",
      });
    }

    if (
      distanciaEstimada === undefined ||
      distanciaEstimada === null
    ) {
      return res.status(400).json({
        mensaje: "La distancia estimada es obligatoria",
      });
    }

    const distanciaNumerica = Number(distanciaEstimada);
    const tiempoNumerico = Number(tiempoEstimado);

    if (
      Number.isNaN(distanciaNumerica) ||
      distanciaNumerica <= 0
    ) {
      return res.status(400).json({
        mensaje:
          "La distancia estimada debe ser un número mayor que cero",
      });
    }

    if (
      !Number.isInteger(tiempoNumerico) ||
      tiempoNumerico <= 0
    ) {
      return res.status(400).json({
        mensaje:
          "El tiempo estimado debe ser un entero mayor que cero",
      });
    }

    // Comprobar pedido
    const pedidoRef = db
      .collection(COLECCION_PEDIDOS)
      .doc(pedidoId);

    const pedidoDocumento = await pedidoRef.get();

    if (!pedidoDocumento.exists) {
      return res.status(404).json({
        mensaje: "El pedido indicado no existe",
      });
    }

    // Evitar dos rutas para el mismo pedido
    const rutaExistente = await db
      .collection(COLECCION_RUTAS)
      .where("Pedido", "==", pedidoRef)
      .limit(1)
      .get();

    if (!rutaExistente.empty) {
      return res.status(409).json({
        mensaje: "El pedido ya tiene una ruta asignada",
      });
    }

    const fechaActual = Timestamp.now();

    const nuevaRuta = {
      Pedido: pedidoRef,
      ruta_asignada: rutaAsignada.trim(),

      // Guardamos la distancia como número.
      // La unidad será kilómetros.
      distancia_estimada: distanciaNumerica,

      // Guardamos el tiempo en minutos.
      tiempo_estimado: tiempoNumerico,

      fecha_inicio: fechaActual,
      fecha_final: null,
      estado: "asignada",
    };

    const resultado = await db
      .collection(COLECCION_RUTAS)
      .add(nuevaRuta);

    return res.status(201).json({
      mensaje: "Ruta creada correctamente",
      id: resultado.id,
      ruta: {
        pedidoId,
        rutaAsignada: nuevaRuta.ruta_asignada,
        distanciaEstimada: distanciaNumerica,
        unidadDistancia: "km",
        tiempoEstimado: tiempoNumerico,
        unidadTiempo: "minutos",
        estado: "asignada",
      },
    });
  } catch (error) {
    console.error("Error al crear ruta:", error);

    return res.status(500).json({
      mensaje: "No se pudo crear la ruta",
      error: error.message,
    });
  }
};

// =========================
// Obtener todas las rutas
// =========================
const obtenerRutas = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLECCION_RUTAS)
      .get();

    const rutas = snapshot.docs.map(formatearRuta);

    return res.status(200).json(rutas);
  } catch (error) {
    console.error("Error al obtener rutas:", error);

    return res.status(500).json({
      mensaje: "No se pudieron obtener las rutas",
      error: error.message,
    });
  }
};

// =========================
// Obtener ruta por ID
// =========================
const obtenerRuta = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await db
      .collection(COLECCION_RUTAS)
      .doc(id)
      .get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada",
      });
    }

    return res.status(200).json(
      formatearRuta(documento)
    );
  } catch (error) {
    console.error("Error al obtener ruta:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener la ruta",
      error: error.message,
    });
  }
};

// =========================
// Obtener ruta de un pedido
// =========================
const obtenerRutaPedido = async (req, res) => {
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
      .collection(COLECCION_RUTAS)
      .where("Pedido", "==", pedidoRef)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        mensaje: "El pedido no tiene una ruta asignada",
      });
    }

    return res.status(200).json(
      formatearRuta(snapshot.docs[0])
    );
  } catch (error) {
    console.error(
      "Error al obtener la ruta del pedido:",
      error
    );

    return res.status(500).json({
      mensaje: "No se pudo obtener la ruta del pedido",
      error: error.message,
    });
  }
};

// =========================
// Actualizar ruta
// =========================
const actualizarRuta = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      rutaAsignada,
      distanciaEstimada,
      tiempoEstimado,
    } = req.body;

    if (
      rutaAsignada === undefined &&
      distanciaEstimada === undefined &&
      tiempoEstimado === undefined
    ) {
      return res.status(400).json({
        mensaje:
          "Debes proporcionar al menos un campo para actualizar",
      });
    }

    const rutaRef = db
      .collection(COLECCION_RUTAS)
      .doc(id);

    const rutaDocumento = await rutaRef.get();

    if (!rutaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada",
      });
    }

    const rutaActual = rutaDocumento.data();

    if (rutaActual.estado === "finalizada") {
      return res.status(400).json({
        mensaje: "No se puede modificar una ruta finalizada",
      });
    }

    const datosActualizados = {
      fechaActualizacion: Timestamp.now(),
    };

    if (rutaAsignada !== undefined) {
      if (
        typeof rutaAsignada !== "string" ||
        rutaAsignada.trim() === ""
      ) {
        return res.status(400).json({
          mensaje: "La ruta asignada no puede estar vacía",
        });
      }

      datosActualizados.ruta_asignada =
        rutaAsignada.trim();
    }

    if (distanciaEstimada !== undefined) {
      const distanciaNumerica = Number(
        distanciaEstimada
      );

      if (
        Number.isNaN(distanciaNumerica) ||
        distanciaNumerica <= 0
      ) {
        return res.status(400).json({
          mensaje:
            "La distancia debe ser un número mayor que cero",
        });
      }

      datosActualizados.distancia_estimada =
        distanciaNumerica;
    }

    if (tiempoEstimado !== undefined) {
      const tiempoNumerico = Number(tiempoEstimado);

      if (
        !Number.isInteger(tiempoNumerico) ||
        tiempoNumerico <= 0
      ) {
        return res.status(400).json({
          mensaje:
            "El tiempo debe ser un entero mayor que cero",
        });
      }

      datosActualizados.tiempo_estimado =
        tiempoNumerico;
    }

    await rutaRef.update(datosActualizados);

    const rutaActualizada = await rutaRef.get();

    return res.status(200).json({
      mensaje: "Ruta actualizada correctamente",
      ruta: formatearRuta(rutaActualizada),
    });
  } catch (error) {
    console.error("Error al actualizar ruta:", error);

    return res.status(500).json({
      mensaje: "No se pudo actualizar la ruta",
      error: error.message,
    });
  }
};

// =========================
// Iniciar ruta
// =========================
const iniciarRuta = async (req, res) => {
  try {
    const { id } = req.params;

    const rutaRef = db
      .collection(COLECCION_RUTAS)
      .doc(id);

    const rutaDocumento = await rutaRef.get();

    if (!rutaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada",
      });
    }

    const rutaActual = rutaDocumento.data();

    if (rutaActual.estado === "en_curso") {
      return res.status(400).json({
        mensaje: "La ruta ya está en curso",
      });
    }

    if (rutaActual.estado === "finalizada") {
      return res.status(400).json({
        mensaje: "La ruta ya fue finalizada",
      });
    }

    await rutaRef.update({
      estado: "en_curso",
      fecha_inicio: Timestamp.now(),
      fechaActualizacion: Timestamp.now(),
    });

    const rutaActualizada = await rutaRef.get();

    return res.status(200).json({
      mensaje: "Ruta iniciada correctamente",
      ruta: formatearRuta(rutaActualizada),
    });
  } catch (error) {
    console.error("Error al iniciar ruta:", error);

    return res.status(500).json({
      mensaje: "No se pudo iniciar la ruta",
      error: error.message,
    });
  }
};

// =========================
// Finalizar ruta
// =========================
const finalizarRuta = async (req, res) => {
  try {
    const { id } = req.params;

    const rutaRef = db
      .collection(COLECCION_RUTAS)
      .doc(id);

    const rutaDocumento = await rutaRef.get();

    if (!rutaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada",
      });
    }

    const rutaActual = rutaDocumento.data();

    if (rutaActual.estado === "finalizada") {
      return res.status(400).json({
        mensaje: "La ruta ya fue finalizada",
      });
    }

    const fechaFinal = Timestamp.now();

    await rutaRef.update({
      estado: "finalizada",
      fecha_final: fechaFinal,
      fechaActualizacion: fechaFinal,
    });

    const rutaActualizada = await rutaRef.get();

    return res.status(200).json({
      mensaje: "Ruta finalizada correctamente",
      ruta: formatearRuta(rutaActualizada),
    });
  } catch (error) {
    console.error("Error al finalizar ruta:", error);

    return res.status(500).json({
      mensaje: "No se pudo finalizar la ruta",
      error: error.message,
    });
  }
};

// =========================
// Eliminar ruta
// =========================
const eliminarRuta = async (req, res) => {
  try {
    const { id } = req.params;

    const rutaRef = db
      .collection(COLECCION_RUTAS)
      .doc(id);

    const rutaDocumento = await rutaRef.get();

    if (!rutaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada",
      });
    }

    await rutaRef.delete();

    return res.status(200).json({
      mensaje: "Ruta eliminada correctamente",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar ruta:", error);

    return res.status(500).json({
      mensaje: "No se pudo eliminar la ruta",
      error: error.message,
    });
  }
};

module.exports = {
  crearRuta,
  obtenerRutas,
  obtenerRuta,
  obtenerRutaPedido,
  actualizarRuta,
  iniciarRuta,
  finalizarRuta,
  eliminarRuta,
};