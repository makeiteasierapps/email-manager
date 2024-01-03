const express = require('express');

const sendFollowUpEmailRouter = express.Router();

sendFollowUpEmailRouter
    .route('/')
    .get((req, res, next) => {
        // Call function that handles this operation
        res.send('ok');
    })
    .all((req, res, next) => {
        res.status(405).send('Only GET operations are allowed on this route');
    });

module.exports = sendFollowUpEmailRouter;
