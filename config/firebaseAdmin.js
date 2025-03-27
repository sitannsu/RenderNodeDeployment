const admin = require('firebase-admin');
require('dotenv').config({ path: './environments/.dev.env' });

try {
  // Initialize Firebase Admin with service account from environment
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountStr) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const serviceAccount = JSON.parse(serviceAccountStr.replace(/^'|'$/g, ''));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  throw error;
}

module.exports = admin;
