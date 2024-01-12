import multer from 'multer';
import csv from 'csv-parser';
import { PassThrough } from 'stream';

const upload = multer();

export default (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method === 'POST') {
        upload.single('file')(req, res, (err) => {
            if (err) {
                return res.status(500).send('Upload error');
            }

            if (!req.file) {
                return res.status(400).send('No file uploaded');
            }

            const results = [];
            const bufferStream = new PassThrough();
            bufferStream.end(req.file.buffer);
            bufferStream
                .pipe(csv())
                .on('data', (data) => {
                    results.push(data);
                })
                .on('end', () => {
                    res.status(200).send({ results });
                })
                .on('error', (err) => {
                    return res.status(500).send('CSV parsing error');
                });
        });
    } else {
        res.status(405).send('Only POST operations are allowed on this route');
    }
};
