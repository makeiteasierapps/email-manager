import axios from 'axios';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { db } from '../../../db.js';

export async function callback(req, res) {
    if (req.method === 'GET') {
        const { code, error, error_description } = req.query;

        if (error) {
            // Handle failed authentication here
            console.error('LinkedIn authentication failed:', error_description);
            return res.status(401).json({ error, error_description });
        }

        if (code) {
            let idToken;
            try {
                const accessTokenResponse = await axios.post(
                    'https://www.linkedin.com/oauth/v2/accessToken',
                    null,
                    {
                        params: {
                            grant_type: 'authorization_code',
                            code: code,
                            client_id: process.env.LINKEDIN_CLIENT_ID,
                            client_secret: process.env.LINKEDIN_SECRET,
                            redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                        },
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }
                );

                idToken = accessTokenResponse.data.id_token;
                const accessToken = accessTokenResponse.data.access_token;

                const decodedIdToken = jwt.decode(idToken);

                // Extract user information from the decoded ID token
                const userProfile = {
                    id: decodedIdToken.sub,
                    firstName: decodedIdToken.given_name,
                    lastName: decodedIdToken.family_name,
                    email: decodedIdToken.email,
                    profilePicture: decodedIdToken.picture,
                };

                let userRecord;
                const userUid = userProfile.id;

                // Check if the user already exists
                try {
                    userRecord = await admin.auth().getUser(userUid);
                } catch (userNotFoundError) {
                    // If user does not exist, create a new user account with Firebase Admin SDK
                    if (userNotFoundError.code === 'auth/user-not-found') {
                        userRecord = await admin.auth().createUser({
                            uid: userUid,
                            email: userProfile.email,
                            photoURL: userProfile.profilePicture,
                            emailVerified: true,
                            displayName: `${userProfile.firstName} ${userProfile.lastName}`,
                            disabled: false,
                        });
                    } else {
                        // Handle other errors
                        throw userNotFoundError;
                    }
                }

                // Create a custom token for the new user
                const firebaseToken = await admin
                    .auth()
                    .createCustomToken(userRecord.uid);

                // Update the database with the user's LinkedIn information
                await db.collection('clients').doc(userRecord.uid).set(
                    {
                        linkedinAccessToken: accessToken,
                        displayName: userRecord.displayName,
                        photoURL: userRecord.photoURL,
                    },
                    { merge: true }
                );
                // Redirect the user to the client application with the custom token
                console.log(process.env.FRONTEND_URL);

                const redirectUrl = `${
                    process.env.FRONTEND_URL
                }/login?token=${encodeURIComponent(firebaseToken)}`;

                res.redirect(redirectUrl);
            } catch (error) {
                // Handle errors from the access token request
                console.error('Error fetching access token:', error);
                return res
                    .status(500)
                    .json({ message: 'Internal Server Error' });
            }
        } else {
            return res.status(405).json({ message: 'Method Not Allowed' });
        }
    }
}
