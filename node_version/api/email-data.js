import { db } from '../db.js';

export default async function emailData(req, res){
    try {
        const uid = req.query.uid;
        if (req.method === 'GET') {
            const snapshot = await db
                .collection('clients')
                .doc(uid)
                .collection('emails')
                .get();
            let emailData = [];
            snapshot.forEach((doc) => {
                emailData.push(doc.data());
            });
            res.status(200).send(emailData);
        } else if (req.method === 'PUT') {
            // Allow manual updating of the response received field.
        } else {
            res.status(405).send(
                'Only GET and PUT operations are allowed on this route'
            );
        }
    } catch (err) {
        res.status(500).send('An error occurred while processing your request');
    }
};
