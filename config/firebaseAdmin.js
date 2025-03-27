const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account credentials
const serviceAccount = require('../firebase/serviceAccountKeys.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
