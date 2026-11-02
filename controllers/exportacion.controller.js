const PDFDocument = require("pdfkit");
const { db } = require("../config/firebase");

const exportarUsuariosCSV = async (req, res) => {
    try {
        const snapshot = await db.collection("Usuario").get();

        const usuarios = [];

        snapshot.forEach((doc) => {
            usuarios.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        let csv =
            "ID,Nombre,Correo,Telefono,Direccion,Rol,UsuarioKey,Activo,UID,FechaCreacion\n";

        usuarios.forEach((u) => {
            csv += `${u.id},${u.Nombre || ""},${u.Correo || ""},${u.Telefono || ""},${u.Direccion || ""},${u.Rol || ""},${u.Usuariokey || ""},${u.activo || false},${u.uid || ""},${u.fechaCreacion ? u.fechaCreacion.toDate().toLocaleString() : ""}\n`;
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=usuarios.csv"
        );

        res.send(csv);

    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};


const exportarPedidosCSV = async (req, res) => {
    try {

        const snapshot = await db.collection("Pedido").get();

        let csv =
            "ID,Usuario,Cantidad,Estado,Subtotal,Total,Fecha\n";

        snapshot.forEach((doc) => {

            const pedido = doc.data();

            csv += `${doc.id},${pedido.Id_Usuario?.id || ""},${pedido.cantidad || 0},${pedido.estado || ""},${pedido.subtotal || 0},${pedido.total || 0},${pedido.fecha ? pedido.fecha.toDate().toLocaleString() : ""}\n`;

        });

        res.setHeader("Content-Type", "text/csv");

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=pedidos.csv"
        );

        res.send(csv);

    } catch (error) {

        res.status(500).json({
            error: error.message,
        });

    }
};

const exportarHistorialCSV = async (req, res) => {
    try {

        const snapshot = await db.collection("Historial").get();

        let csv =
            "ID,Accion,Descripcion,Estado,FechaActualizacion,IdPedido,IdUsuario\n";

        snapshot.forEach((doc) => {

            const historial = doc.data();

            csv += `${doc.id},${historial.accion || ""},${historial.descripcion || ""},${historial.estado || ""},${historial.fechaActualizacion ? historial.fechaActualizacion.toDate().toLocaleString() : ""},${historial.id_pedido?.id || ""},${historial.id_usuario?.id || ""}\n`;

        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=historial.csv"
        );

        res.send(csv);

    } catch (error) {

        res.status(500).json({
            error: error.message,
        });

    }
};

const exportarIncidenciasCSV = async (req, res) => {
    try {

        const snapshot = await db.collection("Incidencia").get();

        let csv =
            "ID,TipoIncidente,Descripcion,Observaciones,Estado,FechaRegistro,FechaResolucion,IdPedido,IdRuta,IdUsuario\n";

        snapshot.forEach((doc) => {

            const incidencia = doc.data();

            csv += `${doc.id},${incidencia.tipo_incidente || ""},${incidencia.descripcion || ""},${incidencia.observaciones || ""},${incidencia.estado || ""},${incidencia.fechaRegistro ? incidencia.fechaRegistro.toDate().toLocaleString() : ""},${incidencia.fechaResolucion ? incidencia.fechaResolucion.toDate().toLocaleString() : ""},${incidencia.id_pedido?.id || ""},${incidencia.id_ruta?.id || ""},${incidencia.id_usuario?.id || ""}\n`;

        });

        res.setHeader("Content-Type", "text/csv");

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=incidencias.csv"
        );

        res.send(csv);

    } catch (error) {

        res.status(500).json({
            error: error.message,
        });

    }
};

const exportarResenasCSV = async (req, res) => {
    try {

        const snapshot = await db.collection("Resena").get();

        let csv =
            "ID,Cliente,Pedido,Calificacion,Comentario,FechaResena,Repartidor\n";

        snapshot.forEach((doc) => {

            const resena = doc.data();

            csv += `${doc.id},${resena.Id_Cliente?.id || ""},${resena.Id_Pedido?.id || ""},${resena.calificacion || ""},${resena.comentario || ""},${resena.fechaResena ? resena.fechaResena.toDate().toLocaleString() : ""},${resena.id_repartidor?.id || ""}\n`;

        });

        res.setHeader("Content-Type", "text/csv");

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=resenas.csv"
        );

        res.send(csv);

    } catch (error) {

        res.status(500).json({
            error: error.message,
        });

    }
};

const exportarRutasCSV = async (req, res) => {
    try {

        const snapshot = await db.collection("Ruta").get();

        let csv =
            "ID,Pedido,RutaAsignada,DistanciaEstimada,TiempoEstimado,FechaInicio,FechaFinal\n";

        snapshot.forEach((doc) => {

            const ruta = doc.data();

            csv += `${doc.id},${ruta.Pedido?.id || ""},${ruta.ruta_asignada || ""},${ruta.distancia_estimada || ""},${ruta.tiempo_estimado || ""},${ruta.fecha_inicio ? ruta.fecha_inicio.toDate().toLocaleString() : ""},${ruta.fecha_final ? ruta.fecha_final.toDate().toLocaleString() : ""}\n`;

        });

        res.setHeader("Content-Type", "text/csv");

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=rutas.csv"
        );

        res.send(csv);

    } catch (error) {

        res.status(500).json({
            error: error.message,
        });

    }
};

module.exports = {
    exportarUsuariosCSV,
    exportarPedidosCSV,
    exportarHistorialCSV,
    exportarIncidenciasCSV,
    exportarResenasCSV,
    exportarRutasCSV,
};

