const admin = require('firebase-admin');
const path = require('path');

// Firebase configuration for client SDK
const firebaseConfig = {
  apiKey: "AIzaSyDjLZJ58v0LHpgTv4sADRH7iHG58DAnBh8",
  authDomain: "kappudoctor.firebaseapp.com",
  projectId: "kappudoctor",
  storageBucket: "kappudoctor.appspot.com",
  messagingSenderId: "903130882940",
  appId: "1:903130882940:web:23effd11ea86be0ed37af9",
  measurementId: "G-KBDH4ZG562"
};

function parseServiceAccountFromEnv() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) return null;

  try {
    // Common when env value is wrapped in single quotes in some shells
    const trimmed = raw.replace(/^'|'$/g, '').trim();
    return JSON.parse(trimmed);
  } catch (e) {
    // Allow base64 JSON as a safer way to store multiline keys
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e2) {
      return null;
    }
  }
}

// Initialize Firebase Admin SDK
let firebaseApp;
let firebaseInitError;

try {
  // Check if Firebase is already initialized
  firebaseApp = admin.app();
  console.log('Using existing Firebase Admin SDK instance');
} catch (error) {
  try {
    // Try to load service account from environment variable(s) first
    let serviceAccount = parseServiceAccountFromEnv();
    if (serviceAccount) {
      console.log('Using Firebase service account from environment variable');
    } else {
      // Fall back to local JSON file (local development only)
      const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
      try {
        serviceAccount = require(serviceAccountPath);
        console.log('Using Firebase service account from local file:', serviceAccountPath);
      } catch (fileErr) {
        serviceAccount = null;
      }
    }

    if (serviceAccount) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      console.log('Firebase Admin SDK initialized successfully with project:', serviceAccount.project_id);
    } else {
      // Do not crash the whole server on startup; notifications can fail gracefully.
      firebaseInitError = new Error(
        'Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY (or FIREBASE_SERVICE_ACCOUNT / FIREBASE_SERVICE_ACCOUNT_JSON) on Render.'
      );
      console.warn(firebaseInitError.message);
    }
  } catch (initError) {
    firebaseInitError = initError;
    console.error('Failed to initialize Firebase Admin SDK:', initError);
  }
}

// Get messaging instance
const messaging = firebaseApp
  ? firebaseApp.messaging()
  : {
      send: async () => {
        throw firebaseInitError || new Error('Firebase Admin SDK is not initialized');
      }
    };

module.exports = {
  firebaseConfig,
  messaging,
  admin
};