import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import passport from 'passport';

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
    const callbackUrl = 'http://localhost:5001/api/auth/linkedin/callback';
    if (req.method === 'GET') {
        res.redirect(
            `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${callbackUrl}&state=foobar&scope=liteprofile%20emailaddress%20w_member_social`
        );
        // passport.authenticate('linkedin')(req, res);
    } else if (req.method === 'POST') {
        // Handle the callback from LinkedIn after authentication.
        passport.authenticate('linkedin', (err, user, info) => {
            if (err) {
                // Handle errors
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                // Authentication failed
                return res.status(401).json({ error: 'Authentication failed' });
            }
            // Successful authentication
            // Here you would typically create a user session or generate a token
            console.log('user', user);
            // Redirect the user or send user information
            return res.status(200).json({ success: true, user });
        })(req, res);
    }
};
