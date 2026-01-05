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
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_CONNECTION_TIMEOUT = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 15000;
const SMTP_SOCKET_TIMEOUT = Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000;
// Accept comma-separated list via TO_EMAILS or TO_EMAIL; default to three recipients
const TO_EMAILS = (process.env.TO_EMAILS || process.env.TO_EMAIL || 'sirtheprogrammer@gmail.com,beastcodes27@gmail.com,galousmgaya@gmail.com')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);
const PORT = process.env.PORT || 5001;
const START_TIME = Date.now();

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
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE, // true for 465, false for 587 with STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  connectionTimeout: SMTP_CONNECTION_TIMEOUT,
  socketTimeout: SMTP_SOCKET_TIMEOUT,
});

// Simple status page with themed styling and live uptime counter
app.get('/', (_req, res) => {
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>DevConnect Email Server</title>
      <style>
        :root {
          --bg: ${BRAND.bg};
          --card: ${BRAND.card};
          --primary: ${BRAND.primary};
          --primary-dark: ${BRAND.primaryDark};
          --border: ${BRAND.border};
          --text: ${BRAND.text};
          --muted: ${BRAND.muted};
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'Inter','Segoe UI',sans-serif;
          background: var(--bg);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .card {
          width: min(640px, 92vw);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 12px 35px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: #fff;
          padding: 28px 32px;
        }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 6px 0 0; color: #fef3c7; font-size: 14px; }
        .body {
          padding: 24px 32px 28px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf3;
          color: #166534;
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 14px;
          border: 1px solid #bbf7d0;
        }
        .muted { color: var(--muted); font-size: 14px; margin-top: 12px; }
        .uptime {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px solid var(--border);
          background: var(--primary)10;
          border-radius: 12px;
          font-size: 15px;
          color: var(--primary-dark);
        }
        .uptime strong { color: var(--primary-dark); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>DevConnect Email Server</h1>
          <p>SMTP relay for contact, hire, and achievements forms.</p>
        </div>
        <div class="body">
          <div class="pill">● Running</div>
          <div class="uptime">Uptime: <strong id="uptime">calculating…</strong></div>
          <div class="muted">Listening on port ${PORT}. Refresh to re-check status.</div>
        </div>
      </div>
      <script>
        const startedAt = ${START_TIME};
        const el = document.getElementById('uptime');
        const format = (ms) => {
          const totalSeconds = Math.floor(ms / 1000);
          const days = Math.floor(totalSeconds / 86400);
          const hours = Math.floor((totalSeconds % 86400) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const parts = [];
          if (days) parts.push(days + 'd');
          if (hours) parts.push(hours + 'h');
          if (minutes) parts.push(minutes + 'm');
          parts.push(seconds + 's');
          return parts.join(' ');
        };
        const tick = () => {
          const diff = Date.now() - startedAt;
          el.textContent = format(diff);
        };
        tick();
        setInterval(tick, 1000);
      </script>
    </body>
  </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
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

