const express = require('express');
const { handleFollowUps } = require('../services/emailService');

const sendFollowUpsRouter = express.Router();

sendFollowUpsRouter
    .route('/')
    .get((req, res, next) => {
        handleFollowUps();
        res.status(200).send('Follow ups sent');
    })
    .all((req, res, next) => {
        res.status(405).send('Only GET operations are allowed on this route');
    });

module.exports = sendFollowUpsRouter;
