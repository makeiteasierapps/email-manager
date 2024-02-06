export async function linkedin(req, res) {
    if (req.method === 'GET') {
        res.redirect(
            `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&state=foobar&scope=profile%20email%20openid`
        );
    }
}
