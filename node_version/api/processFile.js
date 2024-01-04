const multer = require('multer');
const upload = multer();
const csv = require('csv-parser');
const stream = require('stream');
const cors = require('cors');

module.exports = (req, res) => {
    cors()(req, res, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        if (req.method === 'POST') {
            upload.single('file')(req, res, (err) => {
                if (err) {
                    return res.status(500).send(err);
                }

                const results = [];
                const bufferStream = new stream.PassThrough();
                bufferStream.end(req.file.buffer);
                bufferStream
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => {
                        const emailTemplates = results.map((data) => ({
                            recipient_name: data.first_name,
                            recipient_company: data.company,
                            email: data.email,
                            subject: `New Opportunities for ${data.company}`,
                            message: `
                                <p>
                                    Hello ${data.first_name},
                                </p>
                                <p>
                                    I'm Christoph, the Lead Project Manager at <a href="https://www.example.com" target="_blank">Example Company</a>. Our CEO, John Doe, suggested I get in touch with you to explore potential collaborations that could enhance your brand's visibility and growth.
                                </p>
                                <p>
                                    We have a proven history of helping our partners achieve significant milestones, from securing media coverage to organizing memorable events and creating impactful social media campaigns. <a href="https://www.example.com/our-work" target="_blank">Here's a link</a> to some of our previous projects.
                                </p>
                                <p>
                                    Would you be available for a brief discussion this week? Alternatively, if there's someone else in your team who would be the right person to talk to, I'd appreciate it if you could point me in their direction.
                                </p>
                                <p>
                                    Thank you in advance!
                                </p>                
                            `,
                        }));

                        res.status(200).send({ results, emailTemplates });
                    });
            });
        } else {
            res.status(405).send(
                'Only POST operations are allowed on this route'
            );
        }
    });
};
