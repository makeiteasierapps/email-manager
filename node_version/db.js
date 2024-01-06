import admin from 'firebase-admin';

// Parse the JSON string from the environment variable into an object
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
export const timestamp = admin.firestore.Timestamp.now();
