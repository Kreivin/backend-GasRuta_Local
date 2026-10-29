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

const serviceAccount = require(
  "../serviceAccountKey.json"
);

const app =
  getApps().length === 0
    ? initializeApp({
      credential: cert(serviceAccount),
    })
    : getApps()[0];

// Tu base de Firestore se llama "default"
const db = getFirestore(app, "default");
const auth = getAuth(app);

console.log("Proyecto:", serviceAccount.project_id);
console.log('Base de Firestore utilizada: "default"');

module.exports = {
  db,
  auth,
};