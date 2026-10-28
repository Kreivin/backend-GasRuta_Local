
const { db } = require("../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");

// =========================
// Nombres de colecciones
// =========================

const COLECCION_PEDIDOS = "Pedido";
const COLECCION_USUARIOS = "Usuario";

// =========================
// Cilindros disponibles
// =========================
// Modifica los precios cuando el equipo confirme
// los valores definitivos del frontend.

const CILINDROS = {
  5: {
    nombre: "Cilindro de gas",
    presentacion: "Pequeño",
    pesoKg: 5,
    precio: 18500,
  },

  10: {
    nombre: "Cilindro de gas",
    presentacion: "Mediano",
    pesoKg: 10,
    precio: 480,
  },

  15: {
    nombre: "Cilindro de gas",
    presentacion: "Grande",
    pesoKg: 15,
    precio: 46500,
  },

  45: {
    nombre: "Cilindro de gas",
    presentacion: "Industrial",
    pesoKg: 45,
    precio: 128000,
  },
};

// =========================
// Estados permitidos
// =========================

const ESTADOS_PERMITIDOS = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "en_camino",
  "entregado",
  "cancelado",
];

// =========================
// Formatear pedido
// =========================

const formatearPedido = (documento) => {
  const datos = documento.data();

  return {
    id: documento.id,
    ...datos,

    // Convierte la referencia del usuario en su ID
    Id_Usuario: datos.Id_Usuario?.id || null,

    // Convierte Timestamp de Firestore en una fecha legible
    fecha:
      datos.fecha && typeof datos.fecha.toDate === "function"
        ? datos.fecha.toDate().toISOString()
        : datos.fecha,

    fechaActualizacion:
      datos.fechaActualizacion &&
      typeof datos.fechaActualizacion.toDate === "function"
        ? datos.fechaActualizacion.toDate().toISOString()
        : datos.fechaActualizacion,
  };
};

// =========================
// Crear pedido
// =========================

const crearPedido = async (req, res) => {
  try {
    const {
      usuarioId,
      pesoKg,
      cantidad,
      direccion,
      referencia = "",
      costoEnvio = 0,
    } = req.body;

    // Validar campos obligatorios
    if (!usuarioId) {
      return res.status(400).json({
        mensaje: "El usuarioId es obligatorio",
      });
    }

    if (pesoKg === undefined) {
      return res.status(400).json({
        mensaje: "El pesoKg es obligatorio",
      });
    }

    if (cantidad === undefined) {
      return res.status(400).json({
        mensaje: "La cantidad es obligatoria",
      });
    }

    if (!direccion || direccion.trim() === "") {
      return res.status(400).json({
        mensaje: "La dirección es obligatoria",
      });
    }

    // Convertir valores numéricos
    const pesoNumerico = Number(pesoKg);
    const cantidadNumerica = Number(cantidad);
    const costoEnvioNumerico = Number(costoEnvio);

    // Buscar el cilindro seleccionado
    const productoSeleccionado = CILINDROS[pesoNumerico];

    if (!productoSeleccionado) {
      return res.status(400).json({
        mensaje: "El peso de cilindro seleccionado no está disponible",
        pesosDisponibles: Object.keys(CILINDROS).map(Number),
      });
    }

    if (
      !Number.isInteger(cantidadNumerica) ||
      cantidadNumerica <= 0
    ) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser un número entero mayor que cero",
      });
    }

    if (
      Number.isNaN(costoEnvioNumerico) ||
      costoEnvioNumerico < 0
    ) {
      return res.status(400).json({
        mensaje: "El costo de envío no es válido",
      });
    }

    // Crear referencia al usuario
    const usuarioRef = db
      .collection(COLECCION_USUARIOS)
      .doc(usuarioId);

    // Comprobar que el usuario existe
    const usuarioDocumento = await usuarioRef.get();

    if (!usuarioDocumento.exists) {
      return res.status(404).json({
        mensaje: "El usuario indicado no existe",
      });
    }

    // Calcular valores desde el backend
    const subtotal =
      productoSeleccionado.precio * cantidadNumerica;

    const total = subtotal + costoEnvioNumerico;

    // Crear pedido
    const nuevoPedido = {
      Id_Usuario: usuarioRef,

      Producto: {
        nombre: productoSeleccionado.nombre,
        presentacion: productoSeleccionado.presentacion,
        pesoKg: productoSeleccionado.pesoKg,
        precio: productoSeleccionado.precio,
      },

      Ubicacion: {
        direccion: direccion.trim(),
        referencia: referencia.trim(),
      },

      cantidad: cantidadNumerica,
      costoEnvio: costoEnvioNumerico,
      subtotal,
      total,
      estado: "pendiente",
      fecha: Timestamp.now(),
    };

    const resultado = await db
      .collection(COLECCION_PEDIDOS)
      .add(nuevoPedido);

    return res.status(201).json({
      mensaje: "Pedido creado correctamente",
      id: resultado.id,

      pedido: {
        usuarioId,
        Producto: nuevoPedido.Producto,
        Ubicacion: nuevoPedido.Ubicacion,
        cantidad: cantidadNumerica,
        costoEnvio: costoEnvioNumerico,
        subtotal,
        total,
        estado: "pendiente",
      },
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);

    return res.status(500).json({
      mensaje: "No se pudo crear el pedido",
      error: error.message,
    });
  }
};

// =========================
// Obtener todos los pedidos
// =========================

const obtenerPedidos = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLECCION_PEDIDOS)
      .get();

    const pedidos = snapshot.docs.map(formatearPedido);

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);

    return res.status(500).json({
      mensaje: "No se pudieron obtener los pedidos",
      error: error.message,
    });
  }
};

// =========================
// Obtener pedido por ID
// =========================

const obtenerPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await db
      .collection(COLECCION_PEDIDOS)
      .doc(id)
      .get();

    if (!documento.exists) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    return res.status(200).json(formatearPedido(documento));
  } catch (error) {
    console.error("Error al obtener pedido:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener el pedido",
      error: error.message,
    });
  }
};

// =========================
// Obtener pedidos de usuario
// =========================

const obtenerPedidosUsuario = async (req, res) => {
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
      .collection(COLECCION_PEDIDOS)
      .where("Id_Usuario", "==", usuarioRef)
      .get();

    const pedidos = snapshot.docs.map(formatearPedido);

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error(
      "Error al obtener pedidos del usuario:",
      error
    );

    return res.status(500).json({
      mensaje: "No se pudieron obtener los pedidos del usuario",
      error: error.message,
    });
  }
};

// =========================
// Actualizar pedido
// =========================
// Permite cambiar peso, cantidad, dirección,
// referencia o costo de envío.
// El total se calcula nuevamente.

const actualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const referenciaPedido = db
      .collection(COLECCION_PEDIDOS)
      .doc(id);

    const documentoPedido = await referenciaPedido.get();

    if (!documentoPedido.exists) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    const pedidoActual = documentoPedido.data();

    // No permitir modificar pedidos finalizados
    if (
      pedidoActual.estado === "entregado" ||
      pedidoActual.estado === "cancelado"
    ) {
      return res.status(400).json({
        mensaje:
          "No se puede modificar un pedido entregado o cancelado",
      });
    }

    const pesoActual = pedidoActual.Producto?.pesoKg;
    const direccionActual =
      pedidoActual.Ubicacion?.direccion || "";
    const referenciaActual =
      pedidoActual.Ubicacion?.referencia || "";

    const pesoKg =
      req.body.pesoKg !== undefined
        ? Number(req.body.pesoKg)
        : pesoActual;

    const cantidad =
      req.body.cantidad !== undefined
        ? Number(req.body.cantidad)
        : pedidoActual.cantidad;

    const costoEnvio =
      req.body.costoEnvio !== undefined
        ? Number(req.body.costoEnvio)
        : pedidoActual.costoEnvio;

    const direccion =
      req.body.direccion !== undefined
        ? req.body.direccion
        : direccionActual;

    const referencia =
      req.body.referencia !== undefined
        ? req.body.referencia
        : referenciaActual;

    const productoSeleccionado = CILINDROS[pesoKg];

    if (!productoSeleccionado) {
      return res.status(400).json({
        mensaje: "El peso seleccionado no está disponible",
        pesosDisponibles: Object.keys(CILINDROS).map(Number),
      });
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser un entero mayor que cero",
      });
    }

    if (Number.isNaN(costoEnvio) || costoEnvio < 0) {
      return res.status(400).json({
        mensaje: "El costo de envío no es válido",
      });
    }

    if (!direccion || direccion.trim() === "") {
      return res.status(400).json({
        mensaje: "La dirección es obligatoria",
      });
    }

    const subtotal = productoSeleccionado.precio * cantidad;
    const total = subtotal + costoEnvio;

    const datosActualizados = {
      Producto: {
        nombre: productoSeleccionado.nombre,
        presentacion: productoSeleccionado.presentacion,
        pesoKg: productoSeleccionado.pesoKg,
        precio: productoSeleccionado.precio,
      },

      Ubicacion: {
        direccion: direccion.trim(),
        referencia: referencia.trim(),
      },

      cantidad,
      costoEnvio,
      subtotal,
      total,
      fechaActualizacion: Timestamp.now(),
    };

    await referenciaPedido.update(datosActualizados);

    const pedidoActualizado = await referenciaPedido.get();

    return res.status(200).json({
      mensaje: "Pedido actualizado correctamente",
      pedido: formatearPedido(pedidoActualizado),
    });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);

    return res.status(500).json({
      mensaje: "No se pudo actualizar el pedido",
      error: error.message,
    });
  }
};

// =========================
// Actualizar estado
// =========================

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || typeof estado !== "string") {
      return res.status(400).json({
        mensaje: "El estado es obligatorio",
      });
    }

    const estadoNormalizado = estado
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (!ESTADOS_PERMITIDOS.includes(estadoNormalizado)) {
      return res.status(400).json({
        mensaje: "El estado indicado no es válido",
        estadosPermitidos: ESTADOS_PERMITIDOS,
      });
    }

    const referenciaPedido = db
      .collection(COLECCION_PEDIDOS)
      .doc(id);

    const documentoPedido = await referenciaPedido.get();

    if (!documentoPedido.exists) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    await referenciaPedido.update({
      estado: estadoNormalizado,
      fechaActualizacion: Timestamp.now(),
    });

    return res.status(200).json({
      mensaje: "Estado actualizado correctamente",
      id,
      estado: estadoNormalizado,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);

    return res.status(500).json({
      mensaje: "No se pudo actualizar el estado",
      error: error.message,
    });
  }
};

// =========================
// Eliminar pedido
// =========================

const eliminarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const referenciaPedido = db
      .collection(COLECCION_PEDIDOS)
      .doc(id);

    const documentoPedido = await referenciaPedido.get();

    if (!documentoPedido.exists) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    await referenciaPedido.delete();

    return res.status(200).json({
      mensaje: "Pedido eliminado correctamente",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar pedido:", error);

    return res.status(500).json({
      mensaje: "No se pudo eliminar el pedido",
      error: error.message,
    });
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidosUsuario,
  obtenerPedido,
  actualizarPedido,
  actualizarEstado,
  eliminarPedido
};