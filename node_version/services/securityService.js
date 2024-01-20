import dotenv from 'dotenv';
import { KeyManagementServiceClient } from '@google-cloud/kms';

dotenv.config();

process.env.NODE_ENV === 'production'
    ? Buffer.from(process.env.GOOGLE_CREDENTIALS_ENCODED, 'base64').toString(
          'utf8'
      )
    : process.env.GOOGLE_APPLICATION_CREDENTIALS;

const keyName = process.env.KMS_KEY_NAME;

export const encryptText = async (plaintext) => {
    const client = new KeyManagementServiceClient();

    // Converts the text to encrypt to a buffer
    const plaintextBuffer = Buffer.from(plaintext);

    // Calls the API
    const [encryptResponse] = await client.encrypt({
        name: keyName,
        plaintext: plaintextBuffer,
    });

    const ciphertext = encryptResponse.ciphertext;
    const ciphertextStr = Buffer.from(ciphertext).toString('base64');
    return ciphertextStr;
};

export const decryptText = async (ciphertext) => {
    const client = new KeyManagementServiceClient();

    try {
        // Calls the API
        const [decryptResponse] = await client.decrypt({
            name: keyName,
            ciphertext: ciphertext,
        });

        // Returns the decrypted plaintext
        return decryptResponse.plaintext.toString();
    } catch (error) {
        // Logs the error and rethrows it or handles it as needed
        console.error('Error during decryption:', error);
        throw error; // Rethrow the error if you want the caller to handle it
        // Or handle the error as needed
    }
};
