const admin = require('firebase-admin');

// Firebase configuration
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
} catch (error) {
  // Initialize Firebase Admin SDK with service account credentials
  const serviceAccount = {
    "type": "service_account",
    "project_id": "kappudoctor",
    "private_key_id": "e0536101194885fc70ecc96f340e6258bb39dd56",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDZGAcjy5dQmgl3\nC2bZWrTtw95LmEQ5SShfi9WsAfbpOPLTbJnzIsScWL0Bs10NQ4Eo+f7WUo0i7FBG\nM8lok73aEzedl4ZjKCdn/oXmuzOLM6b8LqpeyOV4HavyEo3hl4PLMPeQVgVH9WxQ\n7FtYOKY3sySeatGyKLyPTPRVf8erTFWWthWOrOwPavBiLCmLct1x5zuAHAG6r9Ee\nlxGmHuoZQmiMbJJUIKWDwjN9Jv8AGLyUxhQhEDKYWJUptRqAP0uUEe4nWjTFEuIC\nH5oYIhFP89jo+NlOO4bjeuOJdKX6AEdpmzZcx3QRDf9BiW1rH/aI+lMZCBGWcKwQ\nszXyK0jzAgMBAAECggEABn1AYWKJkGA6XjOaDG84r07Gi03u5CN6sHh2l6CrZ8dL\nAuThKTJl3CKO68kXw/i7mKT4aCGplFyp/Z84qwaXizg91lkcLEScAPDLwdzgqo2N\ntUYT06d/rHp+lErXsOGdj+pTzB22JLOCXFzkUhvHZCzXsGCTChdLo6DyQMgECOu+\nHO6thGDONHDeRv26Xs01dutZnPTGimtDqCABgqZ9Saq5sHW58hwl5PnI16w6uoLK\nVP9E9bcr89Q+ZvwGlR5sB2CT9WUwV3KcfFJZPY7GpPS7jPXade15nN23UvW4hN4M\nOKm3vhXWw8EQiamJhhEzDkA6UrpwZ4mjDBdON9zZCQKBgQD0P7NKKxhiJlAk6+ZX\nWytl3jSBOmLimWA9bzkBuyQuPieq8R2DVW4eV/KA8Rjq76VDKP4sTUVMwY/Jv7/y\n9TZ1jY0lXrqUhGbKEiFRwwymKvrBTWXeKSv9/tMbVQYBtCYMTTL0Q290uA0QX1Mp\nCyc1hhBDd0/bs9DTbPUWXzD9xwKBgQDjid9SX3yt0Kh8z8l/h8Ijy4W0Wg7pqDJs\n9ASYQsuyjqfTzEJUaCScMbvbprQ/4CmpRvtEnH+KGjBkii3s+uUkMpve3zYz1izS\nKefc7TEYlyMayLx7XpFb5SKYay5I+2wOllaxuXroiDN3vXs9ww//rayymBSVSK3i\nFYSVjiJLdQKBgE+tVAx24H5sJyrUNZD7sb2KbjBV3pozFH0WAk+5P8VCC2itPUZx\noPmPERHVFJ7XTF8LSVckYd33KrPStIhKS9ivM4MkUtNOGcYDghENAtxWGvTiDcAa\nSDqUXUOGSe5WWS8cI+og8YPu4nwbzKIP/Ftuf3Gywz9VemLuIUmKBg5TAoGAPZzN\nve5hQmen1/Qj6caHCU5I7CcetqJ21Q3WWKxtn/IE+9LpexWgJDNLXRTs5gb7AP1Z\neKCv4GNrCy5ndS4S8hRKJLVoZezuwhHa2PXZP4FdXhlRAE8BKVMIZSFQrS53ehO3\ncfR5lZGb7iZ+wqCZKnCKvOl1WV8OxpNxDVYpbykCgYAabrpR2qEvvYPfMK4oDGFt\nbY30MijuyjQVncTRdrRzIvr7IqBYElFW3j7c3OtZgsyFUjqqZ40wo8wWAX+qfYSy\nD64Xlcmc43GUcBtV7Pckt3g2HQjKW2kt8DDF8lufVROQ8d8YURQQMW4Kv7SE8oLh\nu/Iy70dEwZr+Ws69HEBydg==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@kappudoctor.iam.gserviceaccount.com",
    "client_id": "113290396761730364667",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40kappudoctor.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  };

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

// Get messaging instance
const messaging = firebaseApp.messaging();

module.exports = {
  firebaseConfig,
  messaging,
  admin
};