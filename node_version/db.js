import admin from 'firebase-admin';

admin.initializeApp({
    credential: admin.credential.cert(process.env.FIREBASE_CONFIG),
});

export const db = admin.firestore();
export const timestamp = admin.firestore.Timestamp.now();
