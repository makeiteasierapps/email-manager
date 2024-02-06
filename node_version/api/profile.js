import { db } from '../db.js';

export default async function profile(req, res){
    if (req.method === 'GET') {
        const { uid } = req.query;

        try {
            // Get the document snapshot
            const docSnapshot = await db.collection('clients').doc(uid).get();

            // Check if the document exists
            if (!docSnapshot.exists) {
                return res.status(404).send('Document not found');
            }

            // Extract the data from the document snapshot
            const clientData = docSnapshot.data();

            // Return the data as a response
            res.status(200).json(clientData);
        } catch (err) {
            return res
                .status(500)
                .send(
                    `An error occurred while processing your request: ${err}`
                );
        }
    }
};
