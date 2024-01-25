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
        console.log(req.body)
        const { timestamp, token, signature, sender, recipient } = req.body;
        const receivedEmail = req.body['stripped-text'];
        const emailResponseId = req.body['In-Reply-To'];
        const match = emailResponseId.match(/<([^@-]+)-([^@]+)@/);
        if (!match) {
            return res.status(400).send('Invalid In-Reply-To format');
        }
        const uid = match[1];
        const docId = match[2];

        if (!verify({ timestamp, token, signature })) {
            return res.status(403).send('Invalid signature');
        }

        const emailDocRef = db
            .collection('clients')
            .doc(uid)
            .collection('emails')
            .doc(docId);

        const emailDoc = await emailDocRef.get();

        if (!emailDoc.exists) {
            return res.status(404).send('Email document not found');
        }

        const emailData = emailDoc.data();
        const emailUpdate = { role: 'user', content: receivedEmail };
        const aiLimit = emailData.AiLimit || 0;
        const emailChain = [...emailData.email, emailUpdate];
        const toName = emailData.to_name;

        // Update the document with the new user email
        await emailDocRef.update({
            email: FieldValue.arrayUnion(emailUpdate),
            response_received: true,
        });

        const aiResponse = await aiEmailResponse({
            uid,
            docId,
            emailChain,
            toName,
            toEmail: sender,
            clientEmail: recipient,
            aiLimit,
        });
        console.log('aiResponse', aiResponse);

        // Update the document with the AI response
        const assistantEmailUpdate = { role: 'assistant', content: aiResponse };
        await emailDocRef.update({
            email: FieldValue.arrayUnion(assistantEmailUpdate),
            AiLimit: FieldValue.increment(1),
        });
        res.send('OK');
    } else {
        res.status(405).send('Access Forbidden');
    }
};
