const express = require('express');
const handleEmailSending = require('../services/emailService');
const sendRouter = express.Router();

sendRouter
    .route('/')
    .post((req, res, next) => {
        const result = handleEmailSending(req.body);
        res.status(200).send(result);
    })
    .all((req, res, next) => {
        res.status(405).send('Only POST operations are allowed on this route');
    });

module.exports = sendRouter;
