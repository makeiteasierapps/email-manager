const express = require('express');
const crypto = require('crypto');

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
        const { signingKey, timestamp, token, signature } = req.body;
        if (!verify({ signingKey, timestamp, token, signature })) {
            return res.status(403).send('Invalid signature');
        }
        console.log(req.body);
        res.send('ok');
    })
    .all((req, res, next) => {
        res.status(405).send('Access Forbidden');
    });

module.exports = webHookRouter;
