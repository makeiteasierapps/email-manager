const cors = require('cors');
const { handleFollowUps } = require('../services/emailService');

module.exports = (req, res) => {
    cors()(req, res, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        if (req.method === 'GET') {
            handleFollowUps();
            res.status(200).send('Follow ups sent');
        } else {
            res.status(405).send('Only GET operations are allowed on this route');
        }
    });
};
