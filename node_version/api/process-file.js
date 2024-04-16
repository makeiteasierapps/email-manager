import csv from 'csv-parser';
import Busboy from 'busboy';
import { tmpdir } from 'os';
import { join } from 'path';
import { createWriteStream, createReadStream, unlinkSync } from 'fs';

export default async function processFile(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        return res.status(405).send('Only POST operations are allowed on this route');
    }

    console.log('Processing POST request');
    console.log('Content-Type:', req.headers['content-type']);

    const busboy = new Busboy({ headers: req.headers });
    const tmpDir = tmpdir();
    let saveToPath;

    busboy.on('file', (fieldname, file, filename) => {
        console.log(`File [${fieldname}] with filename "${filename}" detected`);
        const saveTo = join(tmpDir, filename);
        saveToPath = saveTo;
        file.pipe(createWriteStream(saveTo));
    });

    busboy.on('finish', () => {
        console.log('Busboy finish event triggered');
        if (!saveToPath) {
            console.log('No file was uploaded');
            return res.status(400).send('No file uploaded');
        }

        console.log(`Processing file at ${saveToPath}`);
        const results = [];
        createReadStream(saveToPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log('CSV parsing completed');
                unlinkSync(saveToPath); // Clean up temp file
                res.status(200).send({ results });
            })
            .on('error', (err) => {
                console.error('Error during CSV parsing', err);
                unlinkSync(saveToPath); // Clean up temp file
                return res.status(500).send('CSV parsing error');
            });
    });

    req.pipe(busboy);
}