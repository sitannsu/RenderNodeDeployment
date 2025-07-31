const admin = require('firebase-admin');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjLZJ58v0LHpgTv4sADRH7iHG58DAnBh8",
  authDomain: "kappudoctor.firebaseapp.com",
  projectId: "kappudoctor",
  storageBucket: "kappudoctor.firebasestorage.app",
  messagingSenderId: "903130882940",
  appId: "1:903130882940:web:23effd11ea86be0ed37af9",
  measurementId: "G-KBDH4ZG562"
};

// Initialize Firebase Admin SDK
// Note: For production, you should use a service account key file
// For now, we'll use the default credentials
let firebaseApp;

try {
  // Check if Firebase is already initialized
  firebaseApp = admin.app();
} catch (error) {
  // Initialize Firebase Admin SDK
  firebaseApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
    messaging: {
      senderId: firebaseConfig.messagingSenderId
    }
  });
}

// Get messaging instance
const messaging = firebaseApp.messaging();

module.exports = {
  firebaseConfig,
  messaging,
  admin
}; 