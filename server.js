const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { db } = require("./config/firebase.js");

const usuarioRoutes = require("./routes/usuario.Routes.js");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    mensaje: "API funcionando",
  });
});

// Prueba de Firebase
app.get("/firebase-test", async (req, res) => {
  try {
    const snapshot = await db.collection("Usuario").get();

    const usuarios = [];

    snapshot.forEach((doc) => {
      usuarios.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      conectado: true,
      datos: usuarios,
    });
  } catch (error) {
    res.status(500).json({
      conectado: false,
      error: error.message,
    });
  }
});

// Rutas usuarios
app.use("/api/usuarios", usuarioRoutes);

// Rutas pedidos
const pedidoRoutes = require("./routes/pedido.Routes.js");
app.use("/api/pedidos", pedidoRoutes);


// Rutas reseñas
const resenaRoutes = require("./routes/resena.Routes.js");
app.use("/api/resenas", resenaRoutes);


// Rutas de rutas
const rutaRoutes = require("./routes/ruta.Routes.js");
app.use("/api/rutas", rutaRoutes);

// Rutas de incidencias
const incidenciaRoutes = require("./routes/incidencia.Routes.js");
app.use("/api/incidencias", incidenciaRoutes);

// Rutas de historial
const historialRoutes = require("./routes/historial.routes");
app.use("/api/historial", historialRoutes);

// Rutas de autenticación
const authRoutes = require("./routes/auth.Routes.js");
app.use("/api/auth", authRoutes);


// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    mensaje: "Ruta no encontrada",
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});