const express = require('express');
const emailDataRouter = express.Router();
const { db } = require('../db');

emailDataRouter
    .route('/')
    .get((req, res, next) => {
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
    })
    .put((req, res, next) => {
        // Allow manual updating of the response received field.
    })
    .all((req, res, next) => {
        res.status(405).send(
            'Only GET and PUT operations are allowed on this route'
        );
    });

module.exports = emailDataRouter;
