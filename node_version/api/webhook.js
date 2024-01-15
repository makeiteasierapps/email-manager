import { createHmac } from 'crypto';
import { db } from '../db.js';

const verify = ({ signingKey, timestamp, token, signature }) => {
    const encodedToken = createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex');

    return encodedToken === signature;
};

export default async (req, res) => {
    try {
        if (req.method === 'POST') {
            console.log(req.body);
            const {
                signingKey,
                timestamp,
                token,
                signature,
                sender,
                recipient,
            } = req.body;
            if (!verify({ signingKey, timestamp, token, signature })) {
                return res.status(403).send('Invalid signature');
            }

            // Extract the domain from the recipient email
            const domain = recipient.split('@')[1];

            // Search the client collection for a document with the extracted domain
            const clientDoc = await db
                .collection('clients')
                .where('domain', '==', domain)
                .get();

            // If no client is found, return an error
            if (clientDoc.empty) {
                return res.status(404).send('Client not found');
            }

            // Get the uid of the client
            const uid = clientDoc.docs[0].id;

            // Use the uid to grab the email collection
            const emails = db
                .collection('clients')
                .doc(uid)
                .collection('emails');

            const snapshot = await emails
                .where('response_received', '==', sender)
                .get();
            snapshot.forEach((doc) => {
                doc.ref.update({ response_received: true });
            });
            res.send('ok');
        } else {
            res.status(405).send('Access Forbidden');
        }
    } catch (err) {
        res.status(500).send('An error occurred while processing webhook');
    }
};
