const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

function loadFirebaseCredential() {
  // 1. Intentar cargar desde variable de entorno con JSON completo (FIREBASE_SERVICE_ACCOUNT)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed =
        typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : process.env.FIREBASE_SERVICE_ACCOUNT;
      return {
        credential: cert(parsed),
        projectId: parsed.project_id || parsed.projectId,
      };
    } catch (err) {
      console.error("Error al parsear FIREBASE_SERVICE_ACCOUNT:", err.message);
    }
  }

  // 2. Intentar cargar desde variables de entorno individuales (.env o variables en Render)
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (projectId && clientEmail && privateKey) {
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    // Reemplaza saltos de línea escapados \n por saltos de línea reales
    privateKey = privateKey.replace(/\\n/g, "\n");

    return {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    };
  }

  // 3. Intentar cargar desde archivo físico (local o Secret File de Render en /etc/secrets)
  const candidatePaths = [
    path.resolve(__dirname, "../serviceAccountKey.json"),
    path.resolve(__dirname, "serviceAccountKey.json"),
    "/etc/secrets/serviceAccountKey.json",
  ];

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = require(filePath);
        return {
          credential: cert(fileContent),
          projectId: fileContent.project_id || fileContent.projectId,
        };
      } catch (err) {
        console.error(`Error al cargar credenciales desde ${filePath}:`, err.message);
      }
    }
  }

  throw new Error(
    "No se encontraron credenciales de Firebase Admin.\n" +
      "En Render, ve a Environment y agrega:\n" +
      "- FIREBASE_PROJECT_ID\n" +
      "- FIREBASE_CLIENT_EMAIL\n" +
      "- FIREBASE_PRIVATE_KEY\n" +
      "(o FIREBASE_SERVICE_ACCOUNT con el JSON de la cuenta de servicio).\n" +
      "O bien, sube el archivo 'serviceAccountKey.json' como Secret File."
  );
}

const { credential, projectId } = loadFirebaseCredential();

const app =
  getApps().length === 0
    ? initializeApp({
        credential,
      })
    : getApps()[0];

// Tu base de la captura parece llamarse "default"
const db = getFirestore(app, "default");
const auth = getAuth(app);

if (projectId) {
  console.log("Proyecto:", projectId);
}
console.log('Base de Firestore utilizada: "default"');

module.exports = {
  db,
  auth,
};