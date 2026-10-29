const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const {
  getFirestore,
} = require("firebase-admin/firestore");

const {
  getAuth,
} = require("firebase-admin/auth");

// =========================
// Buscar credencial Firebase
// =========================

const rutaLocal = path.join(
  __dirname,
  "..",
  "serviceAccountKey.json"
);

const rutaRender =
  "/etc/secrets/serviceAccountKey.json";

let rutaCredencial;
let serviceAccount;

if (fs.existsSync(rutaRender)) {
  rutaCredencial = rutaRender;
  serviceAccount = JSON.parse(fs.readFileSync(rutaCredencial, "utf8"));
  console.log("Credencial cargada desde: Secret File de Render");
} else if (fs.existsSync(rutaLocal)) {
  rutaCredencial = rutaLocal;
  serviceAccount = JSON.parse(fs.readFileSync(rutaCredencial, "utf8"));
  console.log("Credencial cargada desde: archivo local");
} else if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID.trim(),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
  console.log("Credencial cargada desde: variables de entorno (.env)");
} else {
  throw new Error(
    "No se encontró la credencial de Firebase. " +
      "En local debe existir serviceAccountKey.json o variables de entorno en .env, " +
      "y en Render debe configurarse como Secret File (/etc/secrets/serviceAccountKey.json) o variables de entorno."
  );
}

// =========================
// Inicializar Firebase Admin
// =========================

const app =
  getApps().length === 0
    ? initializeApp({
      credential: cert(serviceAccount),
    })
    : getApps()[0];

// Tu base de Firestore se llama "default"
const db = getFirestore(app, "default");
const auth = getAuth(app);

const projectId = serviceAccount.project_id || serviceAccount.projectId;
console.log("Firebase Admin conectado al proyecto:", projectId);
console.log('Base de Firestore utilizada: "default"');

module.exports = {
  db,
  auth,
};
