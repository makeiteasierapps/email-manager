import { db } from '../db.js';
import { decryptText } from './securityService.js';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const mailgun = new Mailgun(formData);

const sendAiEmail = async ({
    uid,
    docId,
    toEmail,
    toName,
    clientEmail,
    email,
}) => {
    let mailgunApiKey;
    let mailgunDomain;
    // Fetch the user document from Firestore
    try {
        const userDoc = await db.collection('clients').doc(uid).get();
        const userData = userDoc.data();
        const encrytedMailgunKey = userData['mailgunApiKey'];

        mailgunApiKey = await decryptText(encrytedMailgunKey);
        mailgunDomain = userData['mailgunDomain'];
    } catch (err) {
        console.error(err);
    }

    // Initialize the Mailgun client with the API key from the user document
    const client = mailgun.client({
        username: 'api',
        key: mailgunApiKey,
    });

    const messageData = {
        from: `Shaun's AI Assistant <${clientEmail}>`,
        to: `${toName} <${toEmail}>`,
        subject: 'Email Manager Demo',
        text: email,
        html: `<html><body>${email}</body></html>`,
        'h:Message-ID': `<${uid}-${docId}@${mailgunDomain}>`,
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
    docId,
    emailChain,
    toName,
    toEmail,
    clientEmail,
    aiLimit,
}) => {
    if (aiLimit > 3) {
        const email = `You have reached the end of the trial. Thank you for checking things out! To contact Shaun: <a href="https://www.linkedin.com/in/shaun-o-940b591b5/" target="_blank">LinkedIn</a> <a href="https://github.com/makeiteasierapps" target="_blank">GitHub</a>`;
        const endCommunicationEmail = await sendAiEmail({
            uid,
            toEmail,
            toName,
            clientEmail,
            email,
        });

        if (endCommunicationEmail.success) {
            return email;
        } else {
            throw new Error(endCommunicationEmail.message);
        }
    }
    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    const messages = [
        {
            role: 'system',
            content: `You are my personal assistant, my name is Shaun Offenbacher and you are part of a demo I created for a school project. 
                      
            ABOUT ME(Shaun Offenbacher):
            -- Aspiring full stack developer transitioning out of the restaurant industry. I love building systems and tend to lean more towards backend
            developmet. I believe that tech is the way in which we can lift society up and solve most if not all of the worlds problems. I intend to find
            a group of people with whom I can create a positive impact, making peoples lives easier.
            -- Age: 40
            -- Hobbies: Snowboarding, Rock Climbing, VR, Tech
            Languages: Python, JavaScript
            Frameworks/libraries: React, React Native, Firebase, Google Cloud, Material-UI, OpenAI, Langchain, Node.js, Flask, Bootstrap, Postgres, MongoDB
            
            
            PROJECT: 
            -- Users can send emails individually or in bulk using CSV
            files.

            -- There is an option to write custom messages or use
            predefined templates.

            -- Emails have a webhook for replies, which triggers an AI
            response considering the context of the received email.

            -- Interactions are saved in a database to provide
            continuity and context for AI responses.

            -- Users can monitor conversations to check for any
            inaccurate information.

            -- The app offers a trial with 5 free emails, and users can
            also provide their own Mailgun credentials.

            -- The project is a side project and may undergo frequent
            changes, including data persistence.

            *** Instructions *** 
            Only answer questions that pertain to myself or my project. If they ask other questions kindly remind them of your function, which is to only answer
            questions about me or the project.
            
            -- If you do not know the answer, suggest that they contact me directly. 
            
             *** DO NOT MAKE UP THE ANSWER ***
            
            -- When possible use the persons name ${toName}. 
                 
            -- Always finish the email asking if they would like to know more about my project or myself. 
            Suggest something they can ask based off of the information I have provided here.`,
        },
        ...emailChain,
    ];

    const completionStream = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-4-1106-preview',
        stream: true,
    });

    let fullResponseContent = '';

    for await (const chunk of completionStream) {
        if (chunk.choices[0].delta.content) {
            fullResponseContent += chunk.choices[0].delta.content;
        }
    }

    const emailResult = await sendAiEmail({
        uid,
        docId,
        toEmail,
        toName,
        clientEmail,
        email: fullResponseContent,
    });

    if (emailResult.success) {
        return fullResponseContent;
    } else {
        throw new Error(emailResult.message);
    }
};
