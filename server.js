const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { db } = require("./config/firebase");

const usuarioRoutes = require("./routes/usuarioRoutes");

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