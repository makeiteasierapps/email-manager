import { encryptText } from '../../services/securityService.js';
import { db } from '../../db.js';

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        const { uid } = req.body;

        const clientData = {
            admin: false,
            hasMailgunConfig: false,
            onTrial: false,
        };

        try {
            // Set the document with the object
            await db.collection('clients').doc(uid).set(clientData);

            // Return the same object as a response
            res.status(200).json(clientData);
        } catch (err) {
            return res
                .status(500)
                .send(
                    `An error occurred while processing your request: ${err}`
                );
        }
    }
};
