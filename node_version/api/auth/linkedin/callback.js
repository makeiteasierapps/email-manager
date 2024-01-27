import axios from 'axios';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { db } from '../../../db.js';

export default async (req, res) => {
    if (req.method === 'GET') {
        const { code, state, error, error_description } = req.query;
        console.log(req.query);
        // Check if there is an error query parameter
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

                // Access token is available in accessTokenResponse.data.access_token
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

                console.log(userProfile);

                const uid = `linkedin:${userProfile.id}`;
                const firebaseToken = await admin.auth().createCustomToken(uid);
                res.send(
                    signInFirebaseTemplate(
                        firebaseToken,
                        userProfile.firstName + ' ' + userProfile.lastName,
                        userProfile.profilePicture,
                        accessToken,
                        uid
                    )
                );
            } catch (error) {
                // Handle errors from the access token request
                console.error('Error fetching access token:', error);
                return res
                    .status(500)
                    .json({ message: 'Internal Server Error' });
            }
        } else {
            // Only GET method is supported for the callback
            return res.status(405).json({ message: 'Method Not Allowed' });
        }
    }
};

function signInFirebaseTemplate(
    token,
    displayName,
    photoURL,
    linkedinAccessToken,
    uid
) {
    return `
    <script src="https://www.gstatic.com/firebasejs/7.24.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/7.24.0/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/7.24.0/firebase-firestore.js"></script>
    <script src="promise.min.js"></script><!-- Promise Polyfill for older browsers -->
    <script>
      var token = '${token}';
      var displayName = '${displayName}';
      var photoURL = '${photoURL}';
      var linkedinAccessToken = '${linkedinAccessToken}';
      var uid = '${uid}'; // Ensure uid is properly assigned
      var config = {
        apiKey: '${process.env.FIREBASE_API_KEY}', 
        authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
        projectId: '${process.env.FIREBASE_PROJECT_ID}',
      };
      // Initialize error logging
      var errorLog = function(error) {
        console.error('Error during Firebase operations:', error);
      };
      // Initialize the Firebase app
      var tempApp;
      try {
        tempApp = firebase.initializeApp(config, '_temp_');
      } catch (error) {
        errorLog(error);
      }
      
      if (tempApp) {
        tempApp.auth().signInWithCustomToken(token).then(function() {
          var db = tempApp.firestore();
          return db.collection('clients').doc(uid).set({
            linkedinAccessToken: linkedinAccessToken,
            displayName: displayName,
            photoURL: photoURL
          }, { merge: true });
        })
        .then(function() {
          // Delete temporary Firebase app and sign in the default Firebase app, then close the popup.
          var defaultApp;
          try {
            defaultApp = firebase.initializeApp(config);
          } catch (error) {
            errorLog(error);
          }
          if (defaultApp) {
            return Promise.all([
                defaultApp.auth().signInWithCustomToken(token),
                tempApp.delete()
            ]);
          }
        })
        .then(function() {
          window.close(); // We're done! Closing the popup.
        })
        .catch(errorLog);
      }
    </script>`;
}
