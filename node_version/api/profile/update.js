import { encryptText } from '../../services/securityService.js';
import { db } from '../../db.js';

export default async function update(req, res) {
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
        } catch (err) {
            return res.status(500).send(`Encryption failed, ${err}`);
        }

        try {
            await db.collection('clients').doc(uid).update({
                mailgunApiKey: encryptedMailgunApiKey,
                mailgunDomain: mailgunDomain,
                hasMailgunConfig: true,
            });
            res.status(200).send(`${encryptedMailgunApiKey}`);
        } catch (err) {
            return res
                .status(500)
                .send(
                    `An error occurred while processing your request': ${err}`
                );
        }
    }
}
