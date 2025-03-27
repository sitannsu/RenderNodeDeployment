const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account credentials
require('dotenv').config({ path: './environments/.dev.env' });

// Initialize Firebase Admin with service account from environment
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const serviceAccount = JSON.parse(serviceAccountStr.replace(/^'|'$/g, ''));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
