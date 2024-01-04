const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');

const verify = ({ signingKey, timestamp, token, signature }) => {
    const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex');

    return encodedToken === signature;
};

const webHookRouter = express.Router();
webHookRouter
    .route('/listen')
    .post((req, res, next) => {
        const { signingKey, timestamp, token, signature, sender } = req.body;
        if (!verify({ signingKey, timestamp, token, signature })) {
            return res.status(403).send('Invalid signature');
        }
        const emails = db.collection('clients').doc('uid').collection('emails');
        emails.where('response_received', '==', sender).get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.update({ response_received: true });
            });
        });
        res.send('ok');
    })
    .all((req, res, next) => {
        res.status(405).send('Access Forbidden');
    });

module.exports = webHookRouter;
