import {
    exportarEstadisticasPDF,
    exportarUsuariosCSV,
    exportarPedidosCSV,
    exportarHistorialCSV,
    exportarIncidenciasCSV,
    exportarResenasCSV,
    exportarRutasCSV,

} from "../controllers/exportacion.controller.js";

router.get("/usuarios/csv", exportarUsuariosCSV);