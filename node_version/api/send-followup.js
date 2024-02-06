import { handleFollowUps } from '../services/emailService.js';

export default async function sendFollowup(req, res) {
    try {
        if (req.method === 'GET') {
            const followUpsSent = await handleFollowUps();
            res.status(200).send(followUpsSent);
        } else {
            res.status(405).send(
                'Only GET operations are allowed on this route'
            );
        }
    } catch (err) {
        res.status(500).send('An error occurred while sending follow ups');
    }
}
