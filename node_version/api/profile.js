import { encryptText } from '../services/securityService.js';
import { db } from '../db.js';

export default async (req, res) => {
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        const { mailgunApiKey, mailgunDomain, uid } = req.body;

        if (!mailgunApiKey || !mailgunDomain) {
            res.status(400).send('Missing mailgunApiKey or mailgunDomain');
            return;
        }

        let encryptedMailgunApiKey;

        try {
            encryptedMailgunApiKey = await encryptText(mailgunApiKey);
            console.log(encryptedMailgunApiKey);
        } catch (err) {
            return res.status(500).send(`Encryption failed, ${err}`);
        }

        try {
            await db.collection('clients').doc(uid).set({
                mailgunApiKey: encryptedMailgunApiKey,
                mailgunDomain: mailgunDomain,
            });
            res.status(200).send(`keys: ${encryptedMailgunApiKey}`);
        } catch (err) {
            return res.status(500).send(
                `An error occurred while processing your request': ${err}`
            );
        }
    }
};
