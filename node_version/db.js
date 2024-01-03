const serviceAccount = require('../firebase_service_account.json');
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const timestamp = admin.firestore.Timestamp.now();
module.exports = { db, timestamp };
