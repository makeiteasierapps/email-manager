import { db } from '../db.js';

export default async function startTrial(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        const { uid, onTrial } = req.body;

        try {
            // Find the client document where the admin field is true
            const adminClientQuerySnapshot = await db
                .collection('clients')
                .where('admin', '==', true)
                .get();

            // Check if we have an admin client
            if (adminClientQuerySnapshot.empty) {
                return res.status(404).send('Admin client not found');
            }

            // Assuming there is only one admin, get the document
            const adminClientDoc = adminClientQuerySnapshot.docs[0];
            const adminClientData = adminClientDoc.data();

            // Extract mailgunDomain and mailgunApiKey
            const { mailgunDomain, mailgunApiKey } = adminClientData;

            await db.collection('clients').doc(uid).update({
                onTrial: onTrial,
                messagesLeft: 5,
                mailgunApiKey: mailgunApiKey,
                mailgunDomain: mailgunDomain,
            });
            res.status(200).send({
                message: 'Trial started successfully!',
                mailgunApiKey: mailgunApiKey,
                mailgunDomain: mailgunDomain,
            });
        } catch (err) {
            return res
                .status(500)
                .send(
                    `An error occurred while processing your request': ${err}`
                );
        }
    }
}
