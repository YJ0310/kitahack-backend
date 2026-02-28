// ─── Firebase Admin SDK + Firestore Init ─────────────────────────────────────
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'kitahack-tehais.firebasestorage.app';

// Use service-account file locally; let ADC handle it on Cloud Run / App Hosting
const saPath = process.env.FIREBASE_SERVICE_ACCOUNT
  ? path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT)
  : path.resolve(__dirname, '..', 'kitahack-tehais-firebase-adminsdk-fbsvc-5c3eff98c9.json');

if (fs.existsSync(saPath)) {
  const serviceAccount = require(saPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket,
  });
} else {
  // Cloud Run / App Hosting — use Application Default Credentials
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket,
    projectId: process.env.GCP_PROJECT_ID || 'kitahack-tehais',
  });
}

const db = admin.firestore();
const storage = admin.storage();

module.exports = { admin, db, storage };
