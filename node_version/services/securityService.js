import dotenv from 'dotenv';
import { KeyManagementServiceClient } from '@google-cloud/kms';

dotenv.config();

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

    // Returns the encrypted ciphertext
    return encryptResponse.ciphertext;
};

export const decryptText = async (ciphertext) => {
    const client = new KeyManagementServiceClient();

    // Calls the API
    const [decryptResponse] = await client.decrypt({
        name: keyName,
        ciphertext: ciphertext,
    });

    // Returns the decrypted plaintext
    return decryptResponse.plaintext.toString();
}
