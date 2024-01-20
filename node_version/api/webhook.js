import { createHmac } from 'crypto';
import { db, FieldValue } from '../db.js';
import { aiEmailResponse } from '../services/aiService.js';

const verify = ({ timestamp, token, signature }) => {
    const signingKey = process.env.MAILGUN_WEBHOOK_KEY;
    const encodedToken = createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex');

    return encodedToken === signature;
};

export default async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { timestamp, token, signature, sender, recipient } = req.body;
            const receivedEmail = req.body['stripped-text'];

            if (!verify({ timestamp, token, signature })) {
                return res.status(403).send('Invalid signature');
            }

            // Extract the domain from the recipient email
            const clientDomain = recipient.split('@')[1];

            // Search the client collection for a document with the extracted domain
            const clientDoc = await db
                .collection('clients')
                .where('mailgunDomain', '==', clientDomain)
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

            const snapshot = await emails.where('to_email', '==', sender).get();

            let emailChain;
            let toName;

            snapshot.forEach((doc) => {
                const emailUpdate = { role: 'user', content: receivedEmail };
                emailChain = [...doc.data().email, emailUpdate];
                
                toName = doc.data().to_name;
                doc.ref.update({
                    email: FieldValue.arrayUnion(emailUpdate),
                    response_received: true,
                });
            });

            const aiResponse = await aiEmailResponse({
                uid,
                emailChain,
                toName,
                toEmail: sender,
                clientEmail: recipient,
            });

            snapshot.forEach((doc) => {
                const emailUpdate = { role: 'assistant', content: aiResponse };
                doc.ref.update({
                    email: FieldValue.arrayUnion(emailUpdate),
                });
            });
            res.send('OK');
        } else {
            res.status(405).send('Access Forbidden');
        }
    } catch (err) {
        res.status(500).send('An error occurred while processing webhook');
    }
};
