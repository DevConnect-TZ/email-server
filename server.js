const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// --- SMTP configuration (defaults to provided Gmail app password) ---
const SMTP_USER = process.env.SMTP_USER || 'Devconnecttz@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'pnirbznpgddqjigb';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
// Accept comma-separated list via TO_EMAILS or TO_EMAIL; default to three recipients
const TO_EMAILS = (process.env.TO_EMAILS || process.env.TO_EMAIL || 'sirtheprogrammer@gmail.com,beastcodes27@gmail.com,galousmgaya@gmail.com')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);
const PORT = process.env.PORT || 5001;

// Brand palette (matches Tailwind primary)
const BRAND = {
  bg: '#faf7f4',
  card: '#ffffff',
  primary: '#9d6b4f',
  primaryDark: '#6f4632',
  border: '#e8d4c4',
  text: '#1f2937',
  muted: '#4b5563',
};

// Create a reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Build a styled HTML email matching the site's palette.
 */
const buildEmailTemplate = ({ title, subtitle, fields }) => {
  const rows = fields
    .filter((f) => f.value !== undefined && f.value !== null && f.value !== '')
    .map(
      (field) => `
        <tr>
          <td style="padding: 10px 12px; background: ${BRAND.card}; border: 1px solid ${BRAND.border}; width: 180px; font-weight: 600; color: ${BRAND.primaryDark};">${field.label}</td>
          <td style="padding: 10px 12px; background: ${BRAND.card}; border: 1px solid ${BRAND.border}; color: ${BRAND.text};">${field.value}</td>
        </tr>
      `
    )
    .join('');

  return `
  <!doctype html>
  <html>
    <body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Inter','Segoe UI',sans-serif;color:${BRAND.text};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.04);">
              <tr>
                <td style="background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%);padding:32px;">
                  <div style="color:#fff;font-size:22px;font-weight:700;">${title}</div>
                  <div style="color:#fef3c7;font-size:14px;margin-top:6px;">${subtitle}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px 12px 32px;">
                  <div style="font-size:16px;line-height:1.6;color:${BRAND.muted};margin-bottom:18px;">
                    You received a new submission from your DevConnect site.
                  </div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
                    ${rows}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 28px 32px;">
                  <div style="margin-top:18px;padding:14px 16px;background:${BRAND.primary}10;border:1px solid ${BRAND.border};border-radius:12px;color:${BRAND.primaryDark};font-size:14px;">
                    Reply to this email to contact the sender directly.
                  </div>
                  <div style="margin-top:16px;font-size:12px;color:${BRAND.muted};">
                    Sent automatically by DevConnect TZ • ${new Date().toLocaleString()}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

/**
 * Send an email using the shared transporter.
 */
const sendEmail = async ({ subject, text, html }) => {
  const info = await transporter.sendMail({
    from: `"DevConnect TZ" <${SMTP_FROM}>`,
    to: TO_EMAILS,
    subject,
    text,
    html,
  });
  return info;
};

/**
 * Contact form endpoint
 */
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const info = await sendEmail({
      subject: `[Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: buildEmailTemplate({
        title: 'New Contact Message',
        subtitle: 'Someone reached out via the contact form.',
        fields: [
          { label: 'Name', value: name },
          { label: 'Email', value: email },
          { label: 'Subject', value: subject },
          { label: 'Message', value: message },
        ],
      }),
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send contact email' });
  }
});

/**
 * Hire request endpoint
 */
app.post('/api/hire', async (req, res) => {
  const { name, email, phone, projectName, sampleLink, description } = req.body || {};

  if (!name || !email || !phone || !projectName || !description) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const info = await sendEmail({
      subject: `[Hire Request] ${projectName}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nProject: ${projectName}\nSample: ${sampleLink || 'N/A'}\n\n${description}`,
      html: buildEmailTemplate({
        title: 'New Hire Request',
        subtitle: 'A visitor submitted project details.',
        fields: [
          { label: 'Name', value: name },
          { label: 'Email', value: email },
          { label: 'Phone', value: phone },
          { label: 'Project', value: projectName },
          { label: 'Sample Link', value: sampleLink || 'N/A' },
          { label: 'Description', value: description },
        ],
      }),
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Hire request email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send hire request email' });
  }
});

/**
 * Achievements page message endpoint
 */
app.post('/api/achievement', async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const info = await sendEmail({
      subject: `[Achievements] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: buildEmailTemplate({
        title: 'New Achievements Message',
        subtitle: 'Feedback received from the Achievements page.',
        fields: [
          { label: 'Name', value: name },
          { label: 'Email', value: email },
          { label: 'Subject', value: subject },
          { label: 'Message', value: message },
        ],
      }),
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Achievements email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send achievements email' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Email service listening on http://localhost:${PORT}`);
});

