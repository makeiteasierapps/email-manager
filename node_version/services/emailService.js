import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { db, timestamp, FieldValue } from '../db.js';
import { differenceInMinutes } from 'date-fns';

const mailgun = new Mailgun(formData);

const sendEmail = async (uid, template, batch) => {
    // Fetch the user document from Firestore
    const userDoc = await db.collection('clients').doc(uid).get();
    const userData = userDoc.data();
    const mailgunApiKey = userData['mailgun-api-key'];
    const mailgunDomain = userData['mailgun-domain'];

    // Initialize the Mailgun client with the API key from the user document
    const client = mailgun.client({
        username: 'api',
        key: mailgunApiKey,
    });

    const messageData = {
        from: `${template.from_name} <${template.from_email}>`,
        to: `${template.to_name} <${template.to_email}>`,
        subject: template.subject,
        text: template.message,
        html: `<html><body>${template.message}</body></html>`,
    };

    try {
        const res = await client.messages.create(mailgunDomain, messageData);
        if (res.status === 200) {
            let docRef = db
                .collection('clients')
                .doc(uid)
                .collection('emails')
                .doc();
            batch.set(docRef, {
                to_email: template.to_email,
                to_name: template.to_name,
                to_company: template.to_company,
                from_name: template.from_name,
                email: [
                    {
                        role: 'assistant',
                        content: template.message,
                    },
                ],
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
    let batch = db.batch();
    // Check if email_templates is an array
    if (Array.isArray(data.emailTemplates)) {
        // Send multiple emails
        for (let template of data.emailTemplates) {
            await sendEmail(data.uid, template, batch);
        }
    } else {
        // Send a single to_email
        const requiredFields = [
            'from_name',
            'from_email',
            'to_email',
            'to_name',
            'subject',
            'message',
        ];
        for (let field of requiredFields) {
            if (!data.emailTemplates[field]) {
                return { message: `${field} is required`, status: 400 };
            }
        }
        await sendEmail(data.uid, data.emailTemplates, batch);
    }
    await batch.commit();
};

export const handleFollowUps = async () => {
    let sentEmails = [];
    // Fetch all user documents from Firestore
    const usersSnapshot = await db.collection('clients').get();
    const users = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
    }));

    for (let userData of users) {
        const uid = userData.uid;

        // Initialize the Mailgun client with the API key from the user document
        const client = mailgun.client({
            username: 'api',
            key: userData['mailgun-api-key'],
        });

        // Fetch follow-up emails from Firestore
        const followUpEmailsSnapshot = await db
            .collection('clients')
            .doc(uid)
            .collection('follow-up-email-templates')
            .get();
        const followUpEmails = followUpEmailsSnapshot.docs.map((doc) =>
            doc.data()
        );

        // Access the 'emails' subcollection
        const emails = db.collection('clients').doc(uid).collection('emails');
        const snapshot = await emails
            .where('response_received', '==', false)
            .get();
        const docs = snapshot.docs;

        for (let doc of docs) {
            const data = doc.data();
            const timeSinceSent = differenceInMinutes(
                new Date(),
                data.sent_timestamp.toDate()
            );

            if (timeSinceSent > 3 && !data.follow_up_1_sent) {
                const followUp = followUpEmails.find(
                    (email) => email.id === 'follow-up1'
                );

                const messageData = {
                    from: `${userData.from_names[0]} <${userData.from_names[0]}@${userData['mailgun-domain']}>`,
                    to: `${data.to_name} <${data.to_email}>`,
                    subject: followUp.subject,
                    text: followUp.message,
                    html: `<html><body>${followUp.message}</body></html>`,
                };

                try {
                    const res = await client.messages.create(
                        userData['mailgun-domain'],
                        messageData
                    );
                    if (res.status === 200) {
                        await doc.ref.update({ follow_up_1_sent: true });
                        sentEmails.push(messageData);
                    }
                } catch (err) {
                    console.error(err);
                }
            } else if (timeSinceSent > 5 && !data.follow_up_2_sent) {
                const followUp = followUpEmails.find(
                    (email) => email.id === 'follow-up2'
                );

                const messageData = {
                    from: `${userData.from_names[0]} <${userData.from_names[0]}@${userData['mailgun-domain']}>`,
                    to: `${data.to_name} <${data.to_email}>`,
                    subject: followUp.subject,
                    text: followUp.message,
                    html: `<html><body>${followUp.message}</body></html>`,
                };
                try {
                    const res = await client.messages.create(
                        userData['mailgun-domain'],
                        messageData
                    );
                    if (res.status === 200) {
                        await doc.ref.update({ follow_up_2_sent: true });
                        sentEmails.push(messageData);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    return sentEmails;
};
