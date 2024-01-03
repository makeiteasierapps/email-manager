const formData = require('form-data');
const Mailgun = require('mailgun.js');
const { db, timestamp } = require('../db');
const domain = 'mg.shauno.co';

const apiKeys = {
    testing: process.env.DEV_TEST_KEY,
};

const mailgun = new Mailgun(formData);
let batch = db.batch();

const sendEmail = async (client, template) => {
    console.log(template);
    const messageData = {
        from: `Shaun <shauno@mg.shauno.co>`,
        to: `${template.recipient_name} <${template.email}>`,
        subject: template.subject,
        text: template.message,
        html: `<html><body>${template.message}</body></html>`,
    };
    try {
        const res = await client.messages.create(domain, messageData);
        if (res.status === 200) {
            let docRef = db
                .collection('clients')
                .doc('uid')
                .collection('emails')
                .doc();
            batch.set(docRef, {
                recipient_email: template.email,
                recipient_name: template.recipient_name,
                recipient_company: template.recipient_company,
                sender_name: 'Shaun',
                sent_timestamp: timestamp,
                follow_up_1_sent: false,
                follow_up_2_sent: false,
                response_received: false,
            });
        }
    } catch (err) {
        console.error(err);
    }
};

const handleEmailSending = async (data) => {
    const apiKey = apiKeys[data.user_id];
    const client = mailgun.client({ username: 'api', key: apiKey });

    // Check if email_templates is an array
    if (Array.isArray(data.emailTemplates)) {
        // Send multiple emails
        for (let template of data.emailTemplates) {
            await sendEmail(client, template);
        }
    } else {
        // Send a single email
        const requiredFields = [
            'sender_name',
            'sender_email',
            'email',
            'recipient_name',
            'subject',
            'message',
        ];
        for (let field of requiredFields) {
            if (!data.emailTemplates[field]) {
                return { message: `${field} is required`, status: 400 };
            }
        }
        await sendEmail(client, data.emailTemplates);
    }
    await batch.commit();
};

module.exports = handleEmailSending;
