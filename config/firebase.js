const fs = require("fs");
const path = require("path");

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

if (fs.existsSync(rutaRender)) {
  rutaCredencial = rutaRender;
} else if (fs.existsSync(rutaLocal)) {
  rutaCredencial = rutaLocal;
} else {
  throw new Error(
    "No se encontró la credencial de Firebase. " +
      "En local debe existir serviceAccountKey.json y " +
      "en Render debe configurarse como Secret File."
  );
}

const serviceAccount = JSON.parse(
  fs.readFileSync(rutaCredencial, "utf8")
);

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

console.log(
  "Firebase Admin conectado al proyecto:",
  serviceAccount.project_id
);

console.log(
  "Credencial cargada desde:",
  rutaCredencial === rutaRender
    ? "Secret File de Render"
    : "archivo local"
);

module.exports = {
  db,
  auth,
};