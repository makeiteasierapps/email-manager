const { db } = require('../db');
const cors = require('cors');

module.exports = (req, res) => {
    cors()(req, res, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

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
    });
};
