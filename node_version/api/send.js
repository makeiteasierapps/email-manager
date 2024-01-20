import { handleEmailSending } from '../services/emailService.js';

export default async (req, res) => {
    try {
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        if (req.method === 'POST') {
            const result = await handleEmailSending(req.body);
            res.status(200).send(result);
        } else {
            res.status(405).send(
                'Only POST operations are allowed on this route'
            );
        }
    } catch (err) {
        // Check for the specific error message
        if (err.message === 'Trial has ended, no messages left') {
            res.status(403).send(err.message);
        } else {
            // Log the actual error for debugging purposes
            console.error(err);
            res.status(500).send('An error occurred while sending emails');
        }
    }
};
