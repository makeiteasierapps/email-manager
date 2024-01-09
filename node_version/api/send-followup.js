import { handleFollowUps } from '../services/emailService.js';

export default async (req, res) => {
    const uid = req.query.uid;
    try {
        if (req.method === 'GET') {
            await handleFollowUps(uid);
            res.status(200).send('Follow ups sent');
        } else {
            res.status(405).send(
                'Only GET operations are allowed on this route'
            );
        }
    } catch (err) {
        res.status(500).send('An error occurred while sending follow ups');
    }
};
