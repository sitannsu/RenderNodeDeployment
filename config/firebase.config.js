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

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase is already initialized
  firebaseApp = admin.app();
  console.log('Using existing Firebase Admin SDK instance');
} catch (error) {
  try {
    // Try to load service account from environment variable first
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('Using Firebase service account from environment variable');
    } else {
      // Fall back to local JSON file
      const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
      serviceAccount = require(serviceAccountPath);
      console.log('Using Firebase service account from local file:', serviceAccountPath);
    }

    if (!serviceAccount) {
      throw new Error('Firebase service account credentials not found');
    }

    // Initialize Firebase Admin SDK with service account
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });

    console.log('Firebase Admin SDK initialized successfully with project:', serviceAccount.project_id);
  } catch (initError) {
    console.error('Failed to initialize Firebase Admin SDK:', initError);
    throw initError;
  }
}

// Get messaging instance
const messaging = firebaseApp.messaging();

module.exports = {
  firebaseConfig,
  messaging,
  admin
};