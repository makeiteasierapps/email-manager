import express from 'express';
import cors from 'cors';
import send from './api/send.js';
import sendFollowup from './api/send-followup.js';
import processFile from './api/process-file.js';
import emailData from './api/email-data.js';
import webhook from './api/webhook.js';
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/send', send);
app.use('/api/send-followup', sendFollowup);
app.use('/api/process-file', processFile);
app.use('/api/email-data', emailData);
app.use('/api/webhook', webhook);

app.listen(5001, () => console.log('Server running on port 5001'));
