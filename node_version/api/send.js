const handleEmailSending = require('../services/emailService');

module.exports = (req, res) => {
    cors()(req, res, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (req.method === 'POST') {
            const result = handleEmailSending(req.body);
            res.status(200).send(result);
        } else {
            res.status(405).send(
                'Only POST operations are allowed on this route'
            );
        }
    });
};
