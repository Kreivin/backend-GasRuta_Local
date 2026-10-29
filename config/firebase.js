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

require("dotenv").config();

let serviceAccount;
try {
  serviceAccount = require("../serviceAccountKey.json");
} catch (e) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID?.trim(),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

// Tu base se llama "default"
const db = getFirestore(app, "default");
const auth = getAuth(app);

console.log("Proyecto:", serviceAccount.projectId || serviceAccount.project_id);
console.log('Base de Firestore utilizada: "default"');

module.exports = {
  db,
  auth,
};