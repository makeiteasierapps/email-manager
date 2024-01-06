import { db } from '../db.js';

export default (req, res) => {
    if (req.method === 'GET') {
        db.collection('clients')
            .doc('uid')
            .collection('emails')
            .get()
            .then((snapshot) => {
                let emailData = [];
                snapshot.forEach((doc) => {
                    emailData.push(doc.data());
                });
                res.status(200).send(emailData);
            })
            .catch((err) => {
                console.log('Error getting documents', err);
            });
    } else if (req.method === 'PUT') {
        // Allow manual updating of the response received field.
    } else {
        res.status(405).send(
            'Only GET and PUT operations are allowed on this route'
        );
    }
};
