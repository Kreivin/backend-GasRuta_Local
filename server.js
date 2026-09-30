const express = require("express");
const cors = require("cors");

require("dotenv").config();

// Firebase
const { db } = require("./config/firebase");

// Crear aplicación
const app = express();

// Rutas
const authRoutes = require("./routes/authRoutes");
const productoRoutes = require("./routes/productoRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");

// ======================
// Middlewares
// ======================

app.use(cors());
app.use(express.json());

// ======================
// Ruta principal
// ======================

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de GasFácil funcionando correctamente",
  });
});

// ======================
// Ruta prueba Firebase
// ======================

app.get("/firebase-test", async (req, res) => {
  try {
    const prueba = await db.collection("pruebas").add({
      mensaje: "Firebase conectado correctamente",
      fecha: new Date(),
    });

    res.json({
      mensaje: "Firebase conectado correctamente",
      id: prueba.id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al conectar con Firebase",
      error: error.message,
    });
  }
});

// ======================
// API Routes
// ======================

app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/usuarios", usuarioRoutes);

// ======================
// Ruta no encontrada
// ======================

app.use((req, res) => {
  res.status(404).json({
    mensaje: "Ruta no encontrada",
  });
});

// ======================
// Diagnóstico
// ======================

process.on("uncaughtException", (err) => {
  console.error("Error no capturado:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Promesa rechazada:", err);
});

// ======================
// Iniciar servidor
// ======================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});