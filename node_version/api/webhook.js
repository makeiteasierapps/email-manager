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
            const { signingKey, timestamp, token, signature, sender } =
                req.body;
            if (!verify({ signingKey, timestamp, token, signature })) {
                return res.status(403).send('Invalid signature');
            }
            const emails = db
                .collection('clients')
                .doc('uid')
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
