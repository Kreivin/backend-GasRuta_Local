const { db } = require("../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");

const COLECCION_RESENAS = "Resena";
const COLECCION_USUARIOS = "Usuario";
const COLECCION_PEDIDOS = "Pedido";

// =========================
// Formatear reseña
// =========================
const formatearResena = (documento) => {
  const datos = documento.data();

  return {
    id: documento.id,

    Id_Cliente: datos.Id_Cliente?.id || null,
    Id_Pedido: datos.Id_Pedido?.id || null,
    id_repartidor: datos.id_repartidor?.id || null,

    calificacion: datos.calificacion,
    comentario: datos.comentario,

    fechaResena:
      datos.fechaResena &&
      typeof datos.fechaResena.toDate === "function"
        ? datos.fechaResena.toDate().toISOString()
        : datos.fechaResena,

    fechaActualizacion:
      datos.fechaActualizacion &&
      typeof datos.fechaActualizacion.toDate === "function"
        ? datos.fechaActualizacion.toDate().toISOString()
        : datos.fechaActualizacion,
  };
};

// =========================
// Crear reseña
// =========================
const crearResena = async (req, res) => {
  try {
    const {
      clienteId,
      pedidoId,
      repartidorId,
      calificacion,
      comentario,
    } = req.body;

    // Validar campos obligatorios
    if (!clienteId || !pedidoId || !repartidorId) {
      return res.status(400).json({
        mensaje:
          "clienteId, pedidoId y repartidorId son obligatorios",
      });
    }

    if (calificacion === undefined) {
      return res.status(400).json({
        mensaje: "La calificación es obligatoria",
      });
    }

    if (
      !comentario ||
      typeof comentario !== "string" ||
      comentario.trim() === ""
    ) {
      return res.status(400).json({
        mensaje: "El comentario es obligatorio",
      });
    }

    const calificacionNumerica = Number(calificacion);

    if (
      !Number.isInteger(calificacionNumerica) ||
      calificacionNumerica < 1 ||
      calificacionNumerica > 5
    ) {
      return res.status(400).json({
        mensaje: "La calificación debe ser un número entero entre 1 y 5",
      });
    }

    if (comentario.trim().length > 500) {
      return res.status(400).json({
        mensaje: "El comentario no puede superar los 500 caracteres",
      });
    }

    // Crear referencias a documentos
    const clienteRef = db
      .collection(COLECCION_USUARIOS)
      .doc(clienteId);

    const repartidorRef = db
      .collection(COLECCION_USUARIOS)
      .doc(repartidorId);

    const pedidoRef = db
      .collection(COLECCION_PEDIDOS)
      .doc(pedidoId);

    // Consultar los tres documentos simultáneamente
    const [
      clienteDocumento,
      repartidorDocumento,
      pedidoDocumento,
    ] = await Promise.all([
      clienteRef.get(),
      repartidorRef.get(),
      pedidoRef.get(),
    ]);

    if (!clienteDocumento.exists) {
      return res.status(404).json({
        mensaje: "El cliente indicado no existe",
      });
    }

    if (!repartidorDocumento.exists) {
      return res.status(404).json({
        mensaje: "El repartidor indicado no existe",
      });
    }

    if (!pedidoDocumento.exists) {
      return res.status(404).json({
        mensaje: "El pedido indicado no existe",
      });
    }

    // Validar roles
    const cliente = clienteDocumento.data();
    const repartidor = repartidorDocumento.data();

    if (
      cliente.Rol &&
      cliente.Rol.trim().toLowerCase() !== "cliente"
    ) {
      return res.status(400).json({
        mensaje: "El usuario indicado como cliente no tiene el rol Cliente",
      });
    }

    if (
      repartidor.Rol &&
      repartidor.Rol.trim().toLowerCase() !== "repartidor"
    ) {
      return res.status(400).json({
        mensaje:
          "El usuario indicado como repartidor no tiene el rol Repartidor",
      });
    }

    // Verificar que el pedido pertenezca al cliente
    const pedido = pedidoDocumento.data();
    const clientePedidoId = pedido.Id_Usuario?.id;

    if (clientePedidoId && clientePedidoId !== clienteId) {
      return res.status(400).json({
        mensaje: "El pedido no pertenece al cliente indicado",
      });
    }

    // Evitar más de una reseña para el mismo pedido
    const resenaExistente = await db
      .collection(COLECCION_RESENAS)
      .where("Id_Pedido", "==", pedidoRef)
      .limit(1)
      .get();

    if (!resenaExistente.empty) {
      return res.status(409).json({
        mensaje: "Este pedido ya tiene una reseña registrada",
      });
    }

    const nuevaResena = {
      Id_Cliente: clienteRef,
      Id_Pedido: pedidoRef,
      id_repartidor: repartidorRef,
      calificacion: calificacionNumerica,
      comentario: comentario.trim(),
      fechaResena: Timestamp.now(),
    };

    const resultado = await db
      .collection(COLECCION_RESENAS)
      .add(nuevaResena);

    return res.status(201).json({
      mensaje: "Reseña creada correctamente",
      id: resultado.id,

      resena: {
        clienteId,
        pedidoId,
        repartidorId,
        calificacion: calificacionNumerica,
        comentario: comentario.trim(),
      },
    });
  } catch (error) {
    console.error("Error al crear reseña:", error);

    return res.status(500).json({
      mensaje: "No se pudo crear la reseña",
      error: error.message,
    });
  }
};

// =========================
// Obtener todas las reseñas
// =========================
const obtenerResenas = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLECCION_RESENAS)
      .get();

    const resenas = snapshot.docs.map(formatearResena);

    return res.status(200).json(resenas);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);

    return res.status(500).json({
      mensaje: "No se pudieron obtener las reseñas",
      error: error.message,
    });
  }
};

// =========================
// Obtener reseña por ID
// =========================
const obtenerResena = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await db
      .collection(COLECCION_RESENAS)
      .doc(id)
      .get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Reseña no encontrada",
      });
    }

    return res.status(200).json(formatearResena(documento));
  } catch (error) {
    console.error("Error al obtener reseña:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener la reseña",
      error: error.message,
    });
  }
};

// =========================
// Obtener reseñas de repartidor
// =========================
const obtenerResenasRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;

    const repartidorRef = db
      .collection(COLECCION_USUARIOS)
      .doc(repartidorId);

    const repartidorDocumento = await repartidorRef.get();

    if (!repartidorDocumento.exists) {
      return res.status(404).json({
        mensaje: "Repartidor no encontrado",
      });
    }

    const snapshot = await db
      .collection(COLECCION_RESENAS)
      .where("id_repartidor", "==", repartidorRef)
      .get();

    const resenas = snapshot.docs.map(formatearResena);

    return res.status(200).json(resenas);
  } catch (error) {
    console.error(
      "Error al obtener reseñas del repartidor:",
      error
    );

    return res.status(500).json({
      mensaje: "No se pudieron obtener las reseñas del repartidor",
      error: error.message,
    });
  }
};

// =========================
// Obtener reseñas de cliente
// =========================
const obtenerResenasCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    const clienteRef = db
      .collection(COLECCION_USUARIOS)
      .doc(clienteId);

    const clienteDocumento = await clienteRef.get();

    if (!clienteDocumento.exists) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    const snapshot = await db
      .collection(COLECCION_RESENAS)
      .where("Id_Cliente", "==", clienteRef)
      .get();

    const resenas = snapshot.docs.map(formatearResena);

    return res.status(200).json(resenas);
  } catch (error) {
    console.error(
      "Error al obtener reseñas del cliente:",
      error
    );

    return res.status(500).json({
      mensaje: "No se pudieron obtener las reseñas del cliente",
      error: error.message,
    });
  }
};

// =========================
// Actualizar reseña
// =========================
const actualizarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const { calificacion, comentario } = req.body;

    if (
      calificacion === undefined &&
      comentario === undefined
    ) {
      return res.status(400).json({
        mensaje:
          "Debes enviar la calificación o el comentario para actualizar",
      });
    }

    const resenaRef = db
      .collection(COLECCION_RESENAS)
      .doc(id);

    const resenaDocumento = await resenaRef.get();

    if (!resenaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Reseña no encontrada",
      });
    }

    const datosActualizados = {
      fechaActualizacion: Timestamp.now(),
    };

    if (calificacion !== undefined) {
      const calificacionNumerica = Number(calificacion);

      if (
        !Number.isInteger(calificacionNumerica) ||
        calificacionNumerica < 1 ||
        calificacionNumerica > 5
      ) {
        return res.status(400).json({
          mensaje:
            "La calificación debe ser un número entero entre 1 y 5",
        });
      }

      datosActualizados.calificacion =
        calificacionNumerica;
    }

    if (comentario !== undefined) {
      if (
        typeof comentario !== "string" ||
        comentario.trim() === ""
      ) {
        return res.status(400).json({
          mensaje: "El comentario no puede estar vacío",
        });
      }

      if (comentario.trim().length > 500) {
        return res.status(400).json({
          mensaje:
            "El comentario no puede superar los 500 caracteres",
        });
      }

      datosActualizados.comentario = comentario.trim();
    }

    await resenaRef.update(datosActualizados);

    const resenaActualizada = await resenaRef.get();

    return res.status(200).json({
      mensaje: "Reseña actualizada correctamente",
      resena: formatearResena(resenaActualizada),
    });
  } catch (error) {
    console.error("Error al actualizar reseña:", error);

    return res.status(500).json({
      mensaje: "No se pudo actualizar la reseña",
      error: error.message,
    });
  }
};

// =========================
// Eliminar reseña
// =========================
const eliminarResena = async (req, res) => {
  try {
    const { id } = req.params;

    const resenaRef = db
      .collection(COLECCION_RESENAS)
      .doc(id);

    const resenaDocumento = await resenaRef.get();

    if (!resenaDocumento.exists) {
      return res.status(404).json({
        mensaje: "Reseña no encontrada",
      });
    }

    await resenaRef.delete();

    return res.status(200).json({
      mensaje: "Reseña eliminada correctamente",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar reseña:", error);

    return res.status(500).json({
      mensaje: "No se pudo eliminar la reseña",
      error: error.message,
    });
  }
};

module.exports = {
  crearResena,
  obtenerResenas,
  obtenerResena,
  obtenerResenasRepartidor,
  obtenerResenasCliente,
  actualizarResena,
  eliminarResena,
};