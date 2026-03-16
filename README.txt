==============================================
  BulkMailer Pro v2.0  |  Developer: Raja
==============================================

HOW TO USE (READ FIRST)
------------------------
1. Open the ZIP
2. Edit ONE file: js/app.js (first 10 lines)
3. Upload ALL files to your web host
4. Done!


STEP 1 — EDIT js/app.js (IMPORTANT)
--------------------------------------
Open js/app.js and change these lines at the top:

  WA_NUMBER:   '919876543210'    <- Your WhatsApp number
                                    (country code + number, NO + sign)
                                    Example India: 919876543210
                                    Example UK:    447911123456

  WA_MSG:      'Hi Raja...'      <- The message users send you

  ADMIN_PASS:  'Raja@Admin2024'  <- Change to your own password!


STEP 2 — UPLOAD TO YOUR WEB HOST
-----------------------------------
Upload ALL of these files keeping the SAME folder structure:

  BulkMailerPro/
  ├── index.html           <- Main page
  ├── css/
  │   └── style.css        <- All styles
  ├── js/
  │   └── app.js           <- All logic
  └── assets/
      └── favicon.svg      <- App icon

IMPORTANT: Keep folder structure exactly the same!


STEP 3 — HOSTING OPTIONS
--------------------------

FREE HOSTING (Netlify — recommended, takes 60 seconds):
  1. Go to: netlify.com/drop
  2. Drag the entire BulkMailerPro folder onto the page
  3. Done! You get a free .netlify.app URL

FREE HOSTING (GitHub Pages):
  1. Create a GitHub account
  2. New repository → upload all files
  3. Settings → Pages → Deploy from main branch

PAID HOSTING (cPanel / any web host):
  1. Login to cPanel → File Manager
  2. Go to public_html folder
  3. Upload all files there
  4. Visit yourdomain.com

VPS / Server (Nginx):
  Copy files to /var/www/bulkmailer/
  Nginx config:
    server {
      listen 80;
      server_name yourdomain.com;
      root /var/www/bulkmailer;
      index index.html;
      location / { try_files $uri /index.html; }
    }


HOW THE KEY SYSTEM WORKS
--------------------------
1. User visits your website
2. They see the KEY GATE (locked screen)
3. No key? They click "Chat Raja on WhatsApp"
   → Opens YOUR WhatsApp automatically
4. You sell them a plan → give them a key
5. They enter the key → app unlocks

To manage keys:
  → Go to Admin tab in the app
  → Enter your admin password
  → Add / revoke / expire keys as needed


DEFAULT TEST KEYS (Change these in Admin!)
-------------------------------------------
  DEMO-FREE-0000   Basic plan (500/day)
  PRO-RAJA-7X9K    Pro plan (10K/day)
  MASTER-ADMIN-1   Ultimate plan (unlimited)


PLANS & PRICING (shown on the gate)
--------------------------------------
  $10/day  - 10,000 emails - Without stuff - Basic
  $40/day  - 10,000 emails - With stuff    - Pro
  Custom   - More than 10K - DM Raja       - Enterprise


SUPPORTED EMAIL PROVIDERS
---------------------------
  Gmail SMTP
  Gmail App Password (recommended)
  Gmail API / OAuth
  Yahoo Mail
  iCloud Mail
  Microsoft 365 / Outlook
  Amazon AWS SES
  SendGrid
  Mailgun
  Any custom SMTP server


GMAIL APP PASSWORD SETUP
--------------------------
1. Go to myaccount.google.com
2. Security → Enable 2-Step Verification
3. Security → App Passwords
4. Create new → copy the 16-character password
5. Enter that password in BulkMailer Pro
6. Daily limit: ~500 emails


GMAIL API SETUP (for 2000/day)
--------------------------------
1. Go to console.cloud.google.com
2. New Project → Enable Gmail API
3. Create OAuth 2.0 credentials
4. Download credentials JSON
5. Enter API key in BulkMailer Pro


RECIPIENT FILE FORMAT (.txt)
------------------------------
One email per line.
Name is optional (after the comma):

  john@example.com,John Smith
  jane@gmail.com,Jane Doe
  bob@yahoo.com
  alice@hotmail.com,Alice Johnson


TFN FILE FORMAT
----------------
The invoice page auto-reads TFN from a .txt file.
Format your file like this:

  TFN: 123 456 789

Or just:
  123 456 789


EMAIL VARIABLES (auto-personalised)
--------------------------------------
Use these in Subject and Message Body:
  {name}   → recipient's name
  {email}  → recipient's email
  {from}   → your "from name"


BACKEND NOTE
-------------
This is a frontend-only website.
Real SMTP email sending needs a backend server.

For real sending, you need either:
  Option A: Node.js + Nodemailer (see below)
  Option B: PHP + PHPMailer
  Option C: Contact Raja for full server setup

Node.js backend example (server.js):
---------------------------------------
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
app.use(cors(), express.json());

app.post('/api/send', async (req, res) => {
  const { smtp, recipients, subject, fromName, message } = req.body;
  const t = nodemailer.createTransport({
    host: smtp.host, port: smtp.port,
    auth: { user: smtp.email, pass: smtp.password },
    tls: { rejectUnauthorized: false }
  });
  let sent = 0, failed = 0;
  for (const r of recipients) {
    try {
      await t.sendMail({
        from: `"${fromName}" <${smtp.email}>`,
        to: r.email,
        subject: subject.replace(/{name}/gi, r.name),
        text: message.replace(/{name}/gi, r.name).replace(/{from}/gi, fromName),
      });
      sent++;
    } catch { failed++; }
  }
  res.json({ sent, failed });
});
app.listen(3001);
---------------------------------------
Then in js/app.js, replace the simulation
with: await fetch('http://yourserver.com:3001/api/send', ...)


DAILY SEND LIMITS (Approximate)
----------------------------------
Gmail App Password    ~500/day
Gmail API             ~2,000/day
Yahoo SMTP            ~500/day
iCloud SMTP           ~1,000/day
Microsoft 365         ~10,000/day
Amazon AWS SES        50,000+/day
SendGrid (free)       100/day
SendGrid (paid)       Unlimited
Custom SMTP           Depends on host


FILES IN THIS ZIP
------------------
  index.html      Main application page
  css/style.css   All visual styles
  js/app.js       All application logic
  assets/favicon.svg  App icon
  README.txt      This file


SUPPORT
--------
WhatsApp: Chat with Raja (button in the app)
Email: support@bulkmailerpro.com

==============================================
  Built by Raja  |  BulkMailer Pro v2.0.0
==============================================
