import serviceAccount from '../firebase_service_account.json' assert { type: 'json' };
import admin from 'firebase-admin';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
export const timestamp = admin.firestore.Timestamp.now();
