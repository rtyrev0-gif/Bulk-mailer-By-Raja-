==========================================
  BulkMailer Pro — Backend Setup Guide
  Developer: Raja
==========================================

WHY YOU NEED THIS
-----------------
The BulkMailerPro.html dashboard is the frontend.
To actually SEND real emails, you need this Node.js
backend server running on your computer or a server.

The frontend sends email data to the backend via API.
The backend connects to Gmail/Yahoo/etc and sends them.


STEP 1 — INSTALL NODE.JS
--------------------------
Download from: https://nodejs.org
Install the LTS version (recommended)

Check it worked:
  node --version    (should show v18 or higher)
  npm --version


STEP 2 — INSTALL DEPENDENCIES
-------------------------------
Open Terminal / Command Prompt in THIS folder and run:

  npm install

This installs: express, nodemailer, cors


STEP 3 — START THE SERVER
---------------------------
In Terminal, run:

  node server.js

You should see:
  ╔═══════════════════════════════════════════╗
  ║        BulkMailer Pro — Backend           ║
  ║  Server running at: http://localhost:3000  ║
  ╚═══════════════════════════════════════════╝

Keep this terminal window OPEN while using the dashboard.


STEP 4 — OPEN DASHBOARD
-------------------------
Open BulkMailerPro.html in your browser (Chrome recommended)

Add your SMTP senders, load recipients, compose and hit
🚀 SEND CAMPAIGN — emails will now actually send!


GMAIL APP PASSWORD SETUP (Most Common)
----------------------------------------
1. Go to: myaccount.google.com
2. Security → Enable 2-Step Verification
3. Security → App Passwords
4. Create new app password (select "Mail")
5. Copy the 16-character password (e.g. "abcd efgh ijkl mnop")
6. In BulkMailer Pro SMTP Config:
   - Type: Gmail App Password
   - Email: your@gmail.com
   - Password: paste the 16-char app password
   - Limit: 500


KEEPING SERVER RUNNING 24/7 (VPS/Server)
------------------------------------------
Install PM2 (process manager):

  npm install -g pm2
  pm2 start server.js --name bulkmailer
  pm2 save
  pm2 startup

PM2 will keep it running even after restart.


RUNNING ON A VPS (Online Server)
----------------------------------
1. Upload the backend folder to your server
2. Run: npm install
3. Run: pm2 start server.js --name bulkmailer

Then update this line in BulkMailerPro.html:
  API: 'http://localhost:3000'
Change to:
  API: 'http://YOUR_SERVER_IP:3000'
  or
  API: 'https://yourapi.yourdomain.com'


TROUBLESHOOTING
----------------
Error: "Cannot reach sending server"
  → Make sure node server.js is running
  → Check terminal for errors

Error: "Invalid login" or "534 authentication failed"
  → For Gmail: use App Password, NOT your account password
  → Make sure 2-Step Verification is enabled first

Error: "Connection timeout"
  → Check your firewall allows port 587 outbound
  → Try port 465 for SSL (change in Custom SMTP)

Email sent but lands in spam?
  → Use a warm Gmail account (not new)
  → Send to real, valid email addresses
  → Use AI subject generator for spam-free subjects
  → Avoid words: free, click here, winner, urgent


DAILY LIMITS (Approximate)
----------------------------
Gmail App Password    ~500/day per account
Gmail API             ~2,000/day
Yahoo SMTP            ~500/day
Microsoft 365         ~10,000/day
AWS SES               50,000+/day (need AWS account)
SendGrid (free)       100/day
SendGrid (paid)       Unlimited

Add multiple accounts in BulkMailer Pro to combine limits.
With auto-rotate ON, it switches automatically when one hits limit.


SUPPORT
--------
WhatsApp Raja: +91 9508919048
==========================================
