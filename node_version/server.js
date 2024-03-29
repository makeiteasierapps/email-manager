import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import send from './api/send.js';
import sendFollowup from './api/send-followup.js';
import processFile from './api/process-file.js';
import emailData from './api/email-data.js';
import webhook from './api/webhook.js';
import update from './api/profile/update.js';
import create from './api/profile/create.js';
import profile from './api/profile.js';
import startTrial from './api/start-trial.js';
import linkedInOauth from './api/auth/linkedin.js';
import linkedInCallback from './api/auth/linkedin/callback.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/send', send);
app.use('/api/send-followup', sendFollowup);
app.use('/api/process-file', processFile);
app.use('/api/email-data', emailData);
app.use('/api/webhook', webhook);
app.use('/api/profile/update', update);
app.use('/api/profile/create', create);
app.use('/api/profile', profile);
app.use('/api/start-trial', startTrial);
app.use('/api/auth/linkedin/callback', linkedInCallback);
app.use('/api/auth/linkedin', linkedInOauth);

// Conditionally start the server only if not running in a Google Cloud Function environment
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 5001;
    app.listen(port, () => console.log(`Server running on port ${port}`));
}

// Export the app for Google Cloud Functions
export { app };
