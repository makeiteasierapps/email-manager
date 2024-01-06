import { handleEmailSending } from '../services/emailService.js';

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        const result = await handleEmailSending(req.body);
        res.status(200).send(result);
    } else {
        res.status(405).send('Only POST operations are allowed on this route');
    }
};
