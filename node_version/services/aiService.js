import dotenv from 'dotenv';
import OpenAI from 'openai';
import { sendAiEmail } from '../services/emailService.js';

dotenv.config();

export const aiEmailResponse = async ({
    uid,
    email,
    toName,
    toEmail,
    clientEmail,
}) => {
    console.log('aiEmailResponse');
    const openai = new OpenAI(process.env.OPENAI_API_KEY);

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a playful assistant who reads emails and responds.
                *** Instructions *** 
                When possible use the persons name ${toName}. 
                Always finish your response with a joke. 
                Format the email with colorful html. Exclude the <html> & <body> tags.`,
            },
            { role: 'user', content: email },
        ],
        model: 'gpt-4-1106-preview',
    });

    console.log(completion.choices[0].message.content);

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
