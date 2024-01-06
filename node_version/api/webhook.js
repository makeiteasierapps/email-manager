import cors from 'cors';
import { createHmac } from 'crypto';
import { db } from '../db.js';

const verify = ({ signingKey, timestamp, token, signature }) => {
    const encodedToken = createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex');

    return encodedToken === signature;
};

export default (req, res) => {
    cors()(req, res, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (req.method === 'POST') {
            const { signingKey, timestamp, token, signature, sender } =
                req.body;
            if (!verify({ signingKey, timestamp, token, signature })) {
                return res.status(403).send('Invalid signature');
            }
            const emails = db
                .collection('clients')
                .doc('uid')
                .collection('emails');
            emails
                .where('response_received', '==', sender)
                .get()
                .then((snapshot) => {
                    snapshot.forEach((doc) => {
                        doc.ref.update({ response_received: true });
                    });
                });
            res.send('ok');
        } else {
            res.status(405).send('Access Forbidden');
        }
    });
};
