const { auth } = require("../config/firebase");

const verificarToken = async (req, res, next) => {
  try {
    const encabezado = req.headers.authorization;

    if (!encabezado) {
      return res.status(401).json({
        mensaje: "Token requerido",
      });
    }

    if (!encabezado.startsWith("Bearer ")) {
      return res.status(401).json({
        mensaje:
          "Formato incorrecto. Usa Bearer seguido del token",
      });
    }

    const token = encabezado
      .substring(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        mensaje: "Token requerido",
      });
    }

    const decodedToken =
      await auth.verifyIdToken(token);

    req.usuario = {
      uid: decodedToken.uid,
      correo: decodedToken.email || null,
    };

    return next();
  } catch (error) {
    console.error("Error verificando token:", {
      codigo: error.code,
      mensaje: error.message,
    });

    return res.status(401).json({
      mensaje: "Token inválido o expirado",
    });
  }
};

module.exports = verificarToken;