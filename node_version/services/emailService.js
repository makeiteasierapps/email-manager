import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { db, timestamp } from '../db.js';
import { differenceInMinutes, differenceInDays } from 'date-fns';

const domain = 'mg.shauno.co';
const apiKeys = {
    testing: process.env.DEV_TEST_KEY,
};

const mailgun = new Mailgun(formData);
let batch = db.batch();

const sendEmail = async (client, template) => {
    const messageData = {
        from: `Shaun <shauno@mg.shauno.co>`,
        to: `${template.recipient_name} <${template.email}>`,
        subject: template.subject,
        text: template.message,
        html: `<html><body>${template.message}</body></html>`,
    };
    try {
        const res = await client.messages.create(domain, messageData);
        console.log(messageData);
        console.log('res', res);
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

export const handleEmailSending = async (data) => {
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

export const handleFollowUps = async () => {
    const apiKey = apiKeys['testing'];
    const client = mailgun.client({ username: 'api', key: apiKey });

    const emails = db.collection('clients').doc('uid').collection('emails');
    const snapshot = await emails.where('response_received', '==', false).get();
    const docs = snapshot.docs;

    for (let doc of docs) {
        const data = doc.data();
        const timeSinceSent = differenceInMinutes(
            new Date(),
            data.sent_timestamp.toDate()
        );
        if (timeSinceSent > 3 && !data.follow_up_1_sent) {
            const firstFollowUp = `<p>Hi ${data.recipient_name},</p>
            <p>This is follow up number 1.</p>
            <p>Thanks,</p>
            <p>Shaun</p>`;

            const messageData = {
                from: `Shaun <shauno@mg.shauno.co>`,
                to: `${data.recipient_name} <${data.recipient_email}>`,
                subject: `Re: Custom Subject for ${data.recipient_company}`,
                text: firstFollowUp,
                html: `<html><body>${firstFollowUp}</body></html>`,
            };
            try {
                const res = await client.messages.create(domain, messageData);
                if (res.status === 200) {
                    console.log('First follow up sent');
                    await doc.ref.update({ follow_up_1_sent: true });
                }
            } catch (err) {
                console.error(err);
            }
        } else if (timeSinceSent > 5 && !data.follow_up_2_sent) {
            const secondFollowUp = `<p>Hi ${data.recipient_name},</p>
            <p>This is follow up number 2.</p>
            <p>Thanks,</p>
            <p>Shaun</p>`;

            const messageData = {
                from: `Shaun <shauno@mg.shauno.co>`,
                to: `${data.recipient_name} <${data.recipient_email}>`,
                subject: `Re: Custom Subject for ${data.recipient_company}`,
                text: secondFollowUp,
                html: `<html><body>${secondFollowUp}</body></html>`,
            };
            try {
                const res = await client.messages.create(domain, messageData);
                if (res.status === 200) {
                    console.log('Second follow up sent');
                    await doc.ref.update({ follow_up_2_sent: true });
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
};
