import formData from 'form-data';
import Mailgun from 'mailgun.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const mailgun = new Mailgun(formData);

const sendAiEmail = async ({ uid, toEmail, toName, clientEmail, email }) => {
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
        from: `Playful Assistant <${clientEmail}>`,
        to: `${toName} <${toEmail}>`,
        subject: 'A response from our funny and playful AI assistant',
        text: email,
        html: `<html><body>${email}</body></html>`,
    };

    try {
        await client.messages.create(mailgunDomain, messageData);

        return { success: true, message: 'Email sent successfully.' };
    } catch (err) {
        console.error(err);
        return { success: false, message: err.message };
    }
};

export const aiEmailResponse = async ({
    uid,
    emailChain,
    toName,
    toEmail,
    clientEmail,
}) => {
    const openai = new OpenAI(process.env.OPENAI_API_KEY);

    const messages = [
        {
            role: 'system',
            content: `You are a playful assistant who reads emails and responds.
                *** Instructions *** 
                When possible use the persons name ${toName}. 
                Always finish your response with a joke. 
                Format the email with colorful html. Exclude the <html> & <body> tags.`,
        },
        ...emailChain,
    ];

    const completion = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-4-1106-preview',
    });

    const emailResult = await sendAiEmail({
        uid,
        toEmail,
        toName,
        clientEmail,
        email: completion.choices[0].message.content,
    });

    if (emailResult.success) {
        return completion.choices[0].message.content;
    } else {
        throw new Error(emailResult.message);
    }
};
