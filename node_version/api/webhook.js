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
    if (req.method === 'POST') {
        console.log(req.body['In-Reply-To']);
        const { timestamp, token, signature, sender, recipient } = req.body;
        const receivedEmail = req.body['stripped-text'];
        const emailResponseId = req.body['In-Reply-To'];
        const uid = emailResponseId.match(/<([^@]+)@/)[1];

        if (!verify({ timestamp, token, signature })) {
            return res.status(403).send('Invalid signature');
        }

        // Check each client's email collection for the matching to_email
        const emailsSnapshot = await db
            .collection('clients')
            .doc(uid)
            .collection('emails')
            .where('to_email', '==', sender)
            .get();

        if (!uid) {
            return res.status(404).send('Client not found');
        }

        let emailChain;
        let toName;
        let aiLimit = 0;

        emailsSnapshot.forEach((doc) => {
            aiLimit = doc.data().AiLimit || 0;
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
            aiLimit,
        });

        emailsSnapshot.forEach((doc) => {
            const emailUpdate = { role: 'assistant', content: aiResponse };
            doc.ref.update({
                email: FieldValue.arrayUnion(emailUpdate),
                AiLimit: FieldValue.increment(1),
            });
        });
        res.send('OK');
    } else {
        res.status(405).send('Access Forbidden');
    }
};
