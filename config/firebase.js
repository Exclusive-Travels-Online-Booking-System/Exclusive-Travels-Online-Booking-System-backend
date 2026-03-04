const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path (see ADMIN_SETUP.md)
let credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath && process.env.FIREBASE_SERVICE_ACCOUNT) {
  credPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (credPath && !path.isAbsolute(credPath)) {
  credPath = path.resolve(__dirname, '..', credPath);
}

try {
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID || "exclusive-travels-85070",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "exclusive-travels-85070.firebasestorage.app"
  };
  if (credPath) {
    config.credential = admin.credential.cert(require(path.resolve(credPath)));
  }
  admin.initializeApp(config);
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

// Get Firestore and Storage instances
const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  storage,
  auth
};
