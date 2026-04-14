const https = require('https');
const nodemailer = require('nodemailer');

if (!process.env.BREVO_API_KEY) {
    console.warn('Warning: BREVO_API_KEY is not set. Email sending will fail until you set it in your environment.');
}

// Brevo provides two useful tokens:
// - Transactional REST API keys (start with `xkeysib-`) -> use HTTP API
// - SMTP tokens (start with `xsmtpsib-`) -> can be used with SMTP relay
const _brevoKey = process.env.BREVO_API_KEY || '';
let useSmtpFallback = false;
let smtpTransporter = null;
if (_brevoKey.startsWith('xsmtpsib-')) {
    useSmtpFallback = true;
    console.warn('Detected a Brevo SMTP token (xsmtpsib-...). Falling back to SMTP relay using nodemailer.');

    // Create SMTP transporter using Brevo relay
    // Use BREVO_SENDER_EMAIL as the SMTP username and the xsmtpsib token as the password
    smtpTransporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER || '',
            pass: _brevoKey
        }
    });

    // optional: verify transporter non-blocking
    smtpTransporter.verify().then(() => {
        console.log('Brevo SMTP transporter ready.');
    }).catch(err => {
        console.warn('Brevo SMTP transporter verification failed:', err && err.message ? err.message : err);
    });
}

const EmailService = async (email, subject_text, message) => {
    if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY missing from environment');
    }

    // If the token is an SMTP token, use nodemailer to send via SMTP relay
    if (useSmtpFallback && smtpTransporter) {
        const mailOptions = {
            from: `${process.env.BREVO_SENDER_NAME || 'Digital Sanctuary'} <${process.env.BREVO_SENDER_EMAIL}>`,
            to: email,
            subject: subject_text,
            html: message,
        };

        return smtpTransporter.sendMail(mailOptions).then(info => {
            console.log('Brevo SMTP email sent:', info.messageId || info.response || info);
            return info;
        }).catch(err => {
            console.error('Brevo SMTP send error:', err && err.message ? err.message : err);
            throw err;
        });
    }

    // Otherwise use Brevo REST API (xkeysib- keys)
    const postData = JSON.stringify({
        sender: {
            name: process.env.BREVO_SENDER_NAME || 'Digital Sanctuary',
            email: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SENDER || '',
        },
        to: [ { email } ],
        subject: subject_text,
        htmlContent: message,
    });

    const options = {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'api-key': process.env.BREVO_API_KEY,
            'Accept': 'application/json',
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(data || '{}');
                        console.log('Brevo email sent, id:', parsed.messageId || parsed.messageId);
                        resolve(parsed);
                    } catch (e) {
                        resolve({ raw: data });
                    }
                } else {
                    let errMsg = `Brevo API error ${res.statusCode}`;
                    try { const parsed = JSON.parse(data); errMsg += `: ${parsed.message || JSON.stringify(parsed)}` } catch(e) { errMsg += `: ${data}` }
                    reject(new Error(errMsg));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(postData);
        req.end();
    });
};

module.exports = EmailService;

// Non-blocking API key verification at startup to give clearer logs
const verifyApiKey = () => {
    if (!process.env.BREVO_API_KEY) return;

    const options = {
        hostname: 'api.brevo.com',
        path: '/v3/account',
        method: 'GET',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
                // include response body for easier debugging
                let parsedBody;
                try { parsedBody = JSON.parse(data || '{}') } catch(e) { parsedBody = data }
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('Brevo API key validated. Email sending enabled.');
                } else {
                    console.warn(`Brevo API key validation failed at startup (status ${res.statusCode}). Response:`, parsedBody);
                }
            });
    });

    req.on('error', (err) => {
        console.warn('Brevo API verification request failed:', err && err.message ? err.message : err);
    });

    req.end();
};

verifyApiKey();