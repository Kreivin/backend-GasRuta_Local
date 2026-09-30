const admin = require("firebase-admin");

const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        mensaje: "Token requerido",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.usuario = decodedToken;

    next();
  } catch (error) {
    res.status(401).json({
      mensaje: "Token inválido",
    });
  }
};

module.exports = verificarToken;