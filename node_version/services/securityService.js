import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { KeyManagementServiceClient } from '@google-cloud/kms';

dotenv.config();

// This function will handle the creation of the credentials file
const createCredentialsFile = async (encodedCredentials) => {
    // Decode the base64 credentials
    const credentials = Buffer.from(encodedCredentials, 'base64').toString(
        'utf8'
    );

    // Generate a file path in the temporary directory
    const tempFilePath = join(tmpdir(), 'google-application-credentials.json');

    // Write the credentials to the temporary file
    await writeFile(tempFilePath, credentials);

    // Return the file path
    return tempFilePath;
};

if (process.env.NODE_ENV === 'development') {
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

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
