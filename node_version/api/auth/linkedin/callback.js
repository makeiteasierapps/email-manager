import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
passport.use(
    new LinkedInStrategy(
        {
            clientID: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_SECRET,
            callbackURL: 'http://localhost:5001/api/auth/linkedin/callback',
            scope: ['r_emailaddress', 'r_liteprofile'],
            state: false,
        },
        function (accessToken, refreshToken, profile, done) {
            console.log('profile', profile);
            done(null, profile);
        }
    )
);

export default async (req, res) => {
    if (req.method === 'GET') {
        // Start the authentication process by redirecting the user to LinkedIn.
        passport.authenticate('linkedin', {
            successRedirect: '/',
            failureRedirect: '/login',
        });
    }
};
