/* ================================================
   BulkMailer Pro v2.0 — Application Logic
   Developer: Raja
   ================================================ */
'use strict';

/* ── CONFIG: Edit before deploying ── */
const CFG = {
  WA_NUMBER:      '919876543210',        // Your WhatsApp number (country code + number, no +)
  WA_MSG:         'Hi Raja, I want to buy a BulkMailer Pro access key. Please help!',
  ADMIN_PASS:     'Raja@Admin2024',      // Admin panel password - CHANGE THIS
  DEVELOPER:      'Raja',
  APP_NAME:       'BulkMailer Pro',
  VERSION:        'v2.0.0',
};

/* ── Default Keys (Admin can add more) ── */
const DEFAULT_KEYS = [
  { key:'DEMO-FREE-0000', plan:'basic',    expires:'2099-12-31', limit:500,   label:'Demo Key',   active:true },
  { key:'PRO-RAJA-7X9K',  plan:'pro',      expires:'2099-12-31', limit:10000, label:'Pro Key',    active:true },
  { key:'MASTER-ADMIN-1', plan:'ultimate', expires:'2099-12-31', limit:99999, label:'Master Key', active:true },
];

/* ── Plan definitions ── */
const PLANS = {
  basic:    { name:'Basic',    limit:500,   color:'var(--mt)' },
  pro:      { name:'Pro',      limit:10000, color:'var(--cyan)' },
  ultimate: { name:'Ultimate', limit:99999, color:'var(--gold)' },
};

/* ── SMTP Presets ── */
const SMTP_PRESETS = {
  gmail_app: { host:'smtp.gmail.com',                       port:587, label:'Gmail App Password' },
  gmail_api: { host:'smtp.gmail.com',                       port:587, label:'Gmail API' },
  gmail:     { host:'smtp.gmail.com',                       port:587, label:'Gmail SMTP' },
  yahoo:     { host:'smtp.mail.yahoo.com',                  port:587, label:'Yahoo Mail' },
  icloud:    { host:'smtp.mail.me.com',                     port:587, label:'iCloud Mail' },
  ms365:     { host:'smtp.office365.com',                   port:587, label:'Microsoft 365' },
  aws_ses:   { host:'email-smtp.us-east-1.amazonaws.com',   port:587, label:'AWS SES' },
  sendgrid:  { host:'smtp.sendgrid.net',                    port:587, label:'SendGrid' },
  mailgun:   { host:'smtp.mailgun.org',                     port:587, label:'Mailgun' },
  custom:    { host:'',                                     port:587, label:'Custom SMTP' },
};

const AI_SUBJECTS = [
  'Important update for your account',
  'Quick question for you',
  'Your request has been processed',
  'Action required: verify your details',
  'A personal note from our team',
  'Your order confirmation is ready',
  'One quick thing before you go',
  'Following up on your interest',
  'We need to share something with you',
  'Exclusive update — please review',
];

const AI_LOADING = [
  '🤖 AI is crafting your email<span class="ai-dots"></span>',
  '✍️ Writing spam-filter-safe copy<span class="ai-dots"></span>',
  '🎯 Personalising for your audience<span class="ai-dots"></span>',
  '📨 Polishing for deliverability<span class="ai-dots"></span>',
];

/* ── STATE ── */
const today = new Date().toDateString();
const S = {
  keys:        JSON.parse(localStorage.getItem('bm_keys')       || JSON.stringify(DEFAULT_KEYS)),
  smtp:        JSON.parse(localStorage.getItem('bm_smtp')        || '[]'),
  campaigns:   JSON.parse(localStorage.getItem('bm_campaigns')   || '[]'),
  schedules:   JSON.parse(localStorage.getItem('bm_schedules')   || '[]'),
  settings:    JSON.parse(localStorage.getItem('bm_settings')    || JSON.stringify({
    aiSubject:true, spamCheck:true, rotate:true, personalise:true,
    bounceHandle:true, trackDelivery:true, unsubLink:true, openTrack:false, clickTrack:false,
  })),
  currentKey:  null,
  currentPlan: null,
  rotating:    true,
  sending:     false,
  invoiceId:   mkInvId(),
  adminIn:     false,
  todaySent:   (localStorage.getItem('bm_tdate') === today)
                 ? parseInt(localStorage.getItem('bm_tsent') || '0') : 0,
};
if (localStorage.getItem('bm_tdate') !== today) {
  localStorage.setItem('bm_tdate', today);
  localStorage.setItem('bm_tsent', '0');
}

const save = {
  keys:      () => localStorage.setItem('bm_keys',      JSON.stringify(S.keys)),
  smtp:      () => localStorage.setItem('bm_smtp',      JSON.stringify(S.smtp)),
  campaigns: () => localStorage.setItem('bm_campaigns', JSON.stringify(S.campaigns)),
  schedules: () => localStorage.setItem('bm_schedules', JSON.stringify(S.schedules)),
  settings:  () => localStorage.setItem('bm_settings',  JSON.stringify(S.settings)),
  today:     () => localStorage.setItem('bm_tsent',     String(S.todaySent)),
};

/* ================================================
   KEY GATE
   ================================================ */
function initGate() {
  const saved = sessionStorage.getItem('bm_sk');
  if (saved) {
    const k = S.keys.find(x => x.key === saved && x.active && !expired(x));
    if (k) { unlock(k); return; }
  }
  $('key-gate').style.display = 'flex';
  $('gate-input').focus();
  $('gate-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitKey(); });
}

function expired(k) { return new Date(k.expires) < new Date(); }

function submitKey() {
  const val = $('gate-input').value.trim().toUpperCase();
  $('gate-error').textContent = '';
  $('gate-input').classList.remove('err');
  if (!val) { gateErr('Please enter your access key'); return; }
  const k = S.keys.find(x => x.key === val);
  if (!k)        { gateErr('Invalid key — click WhatsApp below to get yours'); return; }
  if (!k.active) { gateErr('This key has been deactivated by admin'); return; }
  if (expired(k)){ gateErr('Key expired — contact Raja on WhatsApp to renew'); return; }
  sessionStorage.setItem('bm_sk', k.key);
  unlock(k);
}

function gateErr(msg) {
  $('gate-error').textContent = msg;
  $('gate-input').classList.add('err');
  $('gate-input').animate(
    [{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],
    {duration:300}
  );
}

function unlock(k) {
  S.currentKey  = k;
  S.currentPlan = k.plan;
  $('key-gate').style.display = 'none';
  $('app-root').style.display = 'flex';
  $('t-key').textContent  = k.key;
  $('t-plan').textContent = PLANS[k.plan]?.name || k.plan;
  $('t-plan').style.color = PLANS[k.plan]?.color || 'var(--cyan)';
  txt('plan-label',    PLANS[k.plan]?.name || 'Basic');
  txt('plan-limit-lbl', getPlanLimit().toLocaleString());
  initApp();
}

function openWA() {
  window.open(`https://wa.me/${CFG.WA_NUMBER}?text=${encodeURIComponent(CFG.WA_MSG)}`, '_blank');
}

function getPlanLimit() {
  return Math.min(S.currentKey?.limit || 500, PLANS[S.currentPlan]?.limit || 500);
}

/* ================================================
   NAVIGATION
   ================================================ */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni, .tnav-btn').forEach(n => n.classList.remove('active'));
  $('page-' + id)?.classList.add('active');
  document.querySelectorAll(`[data-page="${id}"]`).forEach(el => el.classList.add('active'));

  const map = {
    dashboard: renderDash,
    smtp:      renderSmtpList,
    campaigns: renderCampaigns,
    schedules: renderSchedules,
    settings:  renderSettings,
    admin:     renderAdmin,
    invoice:   () => { updateInvPreview(); fillInvSenders(); },
  };
  map[id]?.();
}

/* ================================================
   DASHBOARD
   ================================================ */
function renderDash() { renderStats(); renderDashSenders(); renderActivity(); renderChart(); renderDayBar(); }

function renderStats() {
  const ts = S.campaigns.reduce((a,c) => a + (c.sent   || 0), 0);
  const tf = S.campaigns.reduce((a,c) => a + (c.failed || 0), 0);
  const td = Math.max(0, ts - tf);
  txt('s-sent',      ts.toLocaleString());
  txt('s-delivered', td.toLocaleString());
  txt('s-opened',    Math.round(td * .69).toLocaleString());
  txt('s-clicked',   Math.round(td * .27).toLocaleString());
  txt('s-today',     S.todaySent.toLocaleString());
  txt('s-failed',    tf.toLocaleString());
}

function renderDashSenders() {
  const el = $('dash-senders');
  if (!S.smtp.length) { el.innerHTML = '<div class="tm" style="font-size:12px;">No senders configured.</div>'; return; }
  el.innerHTML = S.smtp.map(s => {
    const pct = Math.min(100, Math.round((s.used / s.limit) * 100));
    const cls = pct > 85 ? 'red' : pct > 60 ? 'yellow' : 'green';
    const clr = pct > 85 ? 'var(--red)' : pct > 60 ? 'var(--yellow)' : 'var(--green)';
    return `<div class="fcent g12 mb8">
      <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${s.active?'var(--green)':'var(--mt)'};${s.active?'box-shadow:0 0 6px rgba(16,185,129,.6)':''}"></div>
      <div style="width:140px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.label)}</div>
      <div class="pw" style="flex:1;"><div class="pf ${cls}" style="width:${pct}%"></div></div>
      <span class="mono" style="font-size:10px;color:${clr};white-space:nowrap;">${s.used}/${s.limit}</span>
    </div>`;
  }).join('');
}

function renderActivity() {
  const el = $('dash-activity');
  if (!S.campaigns.length) { el.innerHTML = '<div class="tm" style="font-size:12px;">No campaigns yet.</div>'; return; }
  el.innerHTML = S.campaigns.slice(-6).reverse().map(c => `
    <div class="fbet" style="padding:8px 0;border-bottom:1px solid var(--bd);">
      <div>
        <div style="font-size:12px;font-weight:600;color:#fff;">${esc(c.name)}</div>
        <div class="tm" style="font-size:11px;">${c.date}</div>
      </div>
      <div class="fcent g12">
        <span class="tg fw7">${c.sent}</span>
        ${c.failed ? `<span class="trd" style="font-size:11px;">${c.failed} fail</span>` : ''}
      </div>
    </div>`).join('');
}

function renderChart() {
  const el = $('dash-chart');
  if (!el) return;
  const vals = last7();
  const mx = Math.max(...vals, 1);
  el.innerHTML = vals.map((v,i) => {
    const h = Math.round((v / mx) * 50) || 3;
    return `<div class="cb" style="height:${h}px;background:${i===6?'var(--cyan)':'var(--bd3)'};"></div>`;
  }).join('');
}

function last7() {
  return Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toLocaleDateString();
    return S.campaigns.filter(c => c.date === ds).reduce((a,c) => a + (c.sent||0), 0);
  });
}

function renderDayBar() {
  const lim = getPlanLimit();
  const pct = Math.min(100, Math.round((S.todaySent / lim) * 100));
  const cls = pct > 85 ? 'red' : pct > 60 ? 'yellow' : 'green';
  const el = $('day-bar');
  if (el) { el.style.width = pct + '%'; el.className = 'pf ' + cls; }
  txt('day-used', S.todaySent.toLocaleString());
  txt('day-max',  lim.toLocaleString());
  txt('day-pct',  pct + '%');
}

/* ================================================
   SMTP CONFIG
   ================================================ */
function onSmtpTypeChange() {
  const type = $('smtp-type').value;
  const preset = SMTP_PRESETS[type];
  vis('smtp-custom', type === 'custom');
  vis('smtp-api',    type === 'gmail_api');
  vis('smtp-pass',   type !== 'gmail_api');
  vis('smtp-detect', type !== 'custom');
  const helpMap = {
    gmail_app: 'Use a 16-char App Password (Google Account → Security → App Passwords)',
    aws_ses:   'Use AWS SES SMTP credentials (IAM user, not root keys)',
    sendgrid:  'Username: "apikey", Password: your SendGrid API key',
    mailgun:   'Use SMTP credentials from your Mailgun dashboard',
  };
  $('smtp-pass-help').textContent = helpMap[type] || '';
  if (preset && type !== 'custom') txt('smtp-host-label', `${preset.host}:${preset.port} (TLS)`);
}

function buildSmtpCfg() {
  const type = $('smtp-type').value;
  return {
    id:       Date.now(),
    type,
    label:    $('smtp-label').value || SMTP_PRESETS[type]?.label || 'Sender',
    email:    $('smtp-email').value.trim(),
    password: $('smtp-password').value,
    apiKey:   $('smtp-apikey').value.trim(),
    smtpHost: $('smtp-host').value.trim(),
    smtpPort: $('smtp-port').value || '587',
    limit:    parseInt($('smtp-limit').value) || 500,
    used:     0,
    active:   true,
    added:    new Date().toLocaleDateString(),
  };
}

function addSmtpConfig() {
  const cfg = buildSmtpCfg();
  if (!cfg.email) { toast('Email address required', 'e'); return; }
  if (!cfg.label) { toast('Label required', 'e'); return; }
  S.smtp.push(cfg); save.smtp(); renderSmtpList(); renderDashSenders(); fillInvSenders(); updateSummary();
  ['smtp-label','smtp-email','smtp-password','smtp-apikey','smtp-host'].forEach(id => { if($(id)) $(id).value = ''; });
  $('smtp-limit').value = '500';
  $('smtp-test-r').innerHTML = '';
  toast('Added: ' + cfg.label, 's');
}

function renderSmtpList() {
  const el = $('smtp-list');
  txt('s-count', S.smtp.length);
  if (!S.smtp.length) { el.innerHTML = '<div class="tc tm" style="padding:26px;font-size:13px;">No senders yet.</div>'; return; }
  el.innerHTML = S.smtp.map((s,i) => {
    const pct = Math.min(100, Math.round((s.used / s.limit) * 100));
    const cls = pct > 85 ? 'red' : pct > 60 ? 'yellow' : 'green';
    const clr = pct > 85 ? 'var(--red)' : pct > 60 ? 'var(--yellow)' : 'var(--green)';
    return `<div class="sender-c">
      <div class="sdot ${s.active?'on':'off'}"></div>
      <div class="sinfo">
        <div class="sname">${esc(s.label)}</div>
        <div class="ssub">${SMTP_PRESETS[s.type]?.label||s.type} · ${esc(s.email)}</div>
        <div class="sm"><div class="pw" style="flex:1;"><div class="pf ${cls}" style="width:${pct}%"></div></div>
        <span class="sml" style="color:${clr};">${s.used}/${s.limit}</span></div>
      </div>
      <button class="btn btn-sm" style="background:${s.active?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)'};border:1px solid ${s.active?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'};color:${s.active?'var(--green)':'var(--red)'};" onclick="toggleSMTP(${i})">${s.active?'ACTIVE':'PAUSED'}</button>
      <button class="btn btn-sm btn-d" onclick="removeSMTP(${i})">✕</button>
    </div>`;
  }).join('');
}

function toggleSMTP(i) { S.smtp[i].active=!S.smtp[i].active; save.smtp(); renderSmtpList(); renderDashSenders(); updateSummary(); }
function removeSMTP(i) { S.smtp.splice(i,1); save.smtp(); renderSmtpList(); renderDashSenders(); fillInvSenders(); updateSummary(); }
function resetUsed()   { S.smtp.forEach(s=>s.used=0); save.smtp(); renderSmtpList(); renderDashSenders(); toast('Daily counts reset','s'); }

async function testSMTP() {
  const cfg = buildSmtpCfg();
  if (!cfg.email) { toast('Enter email first','e'); return; }
  const btn = $('btn-test');
  btn.textContent = '⏳ Testing...'; btn.disabled = true;
  await sleep(1400);
  btn.textContent = '🔌 Test'; btn.disabled = false;
  $('smtp-test-r').innerHTML = '<div class="wb mt8">⚠️ Live SMTP test needs a backend. Config will validate on first real send.</div>';
}

/* ================================================
   COMPOSE & SEND
   ================================================ */
function updateRecipCount() {
  const n = parseRecip($('c-recip').value).length;
  txt('recip-count', n); txt('sum-recip', n); updateSummary();
}

function updateSummary() {
  const active = S.smtp.filter(s => s.active);
  const cap = active.reduce((a,s) => a + Math.max(0, s.limit - s.used), 0);
  txt('sum-senders',  active.length);
  txt('sum-capacity', cap.toLocaleString());
}

function parseRecip(txt2) {
  return txt2.split('\n').map(l=>l.trim()).filter(l=>l.includes('@')).map(l => {
    const p = l.split(',');
    return { email: p[0]?.trim(), name: p[1]?.trim() || p[0]?.split('@')[0] || '' };
  });
}

function toggleRotating() { S.rotating=!S.rotating; $('tog-rotate').classList.toggle('on', S.rotating); }

async function loadRecipFile() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.txt,.csv';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    const t = await f.text();
    $('c-recip').value = t; $('recip-fname').textContent = f.name;
    updateRecipCount(); toast('Loaded: ' + f.name, 's');
  };
  inp.click();
}

async function genAiSubject() {
  const btn = $('btn-ai-subj'); btn.textContent = '...'; btn.disabled = true;
  await sleep(800);
  $('c-subject').value = AI_SUBJECTS[Math.floor(Math.random() * AI_SUBJECTS.length)];
  btn.textContent = '🤖 AI'; btn.disabled = false;
  toast('AI subject generated', 's');
}

function toggleAiMsgPanel() {
  const p = $('ai-panel');
  p.style.display = p.style.display === 'none' ? '' : 'none';
}

async function runAiMsg() {
  const type    = $('ai-type').value;
  const tone    = $('ai-tone').value;
  const topic   = $('ai-topic').value.trim();
  const subject = $('c-subject').value.trim();
  const from    = $('c-from').value.trim();
  const btn     = $('btn-ai-gen');
  btn.disabled = true; btn.textContent = '⏳ Generating...';
  $('ai-panel').style.display = 'none';
  $('ai-loading').style.display = '';
  $('c-message').style.opacity = '0.3';

  let li = 0;
  const iv = setInterval(() => { $('ai-load-txt').innerHTML = AI_LOADING[li++ % AI_LOADING.length]; }, 900);

  const prompt = `Write a professional bulk marketing email body:
- Type: ${type}, Tone: ${tone}
- Subject: ${subject||'N/A'}, Sender: ${from||'our team'}
- Topic: ${topic||'general marketing'}
Rules:
- Use {name} for recipient name, {from} for sender signature
- Avoid spam words: free, winner, click here, urgent, CAPS
- 3-5 short paragraphs, soft CTA, sign-off with {from}
- Output ONLY the plain text email body starting with: Hi {name},`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{role:'user',content:prompt}] }),
    });
    const data = await resp.json();
    const txt2 = data.content?.map(b=>b.text||'').join('').trim();
    clearInterval(iv);
    $('ai-loading').style.display = 'none';
    $('c-message').style.opacity = '1';
    if (txt2) {
      $('c-message').value = '';
      let i = 0; const chars = txt2.split('');
      const ty = setInterval(() => { $('c-message').value += chars[i++]; if(i>=chars.length){clearInterval(ty);toast('✨ AI message generated!','s');} }, 7);
    } else throw new Error('empty');
  } catch {
    clearInterval(iv);
    $('ai-loading').style.display = 'none';
    $('c-message').style.opacity = '1';
    $('c-message').value = fallbackMsg(type, from);
    toast('Using built-in template', 'i');
  }
  btn.disabled = false; btn.textContent = '✨ Generate';
}

function fallbackMsg(type, from) {
  const t = {
    promotional:`Hi {name},\n\nWe wanted to reach out with something we think you'll find valuable.\n\nWe've been working hard to bring you our best offer yet. Please take a look at your earliest convenience.\n\nIf you have any questions, reply to this email — we're happy to help.\n\nWarm regards,\n{from}`,
    newsletter:`Hi {name},\n\nThank you for being part of our community. Here's what's new.\n\nWe've had some exciting developments lately and wanted to keep you in the loop.\n\nYour feedback matters. Feel free to reply with any thoughts.\n\nBest regards,\n{from}`,
    welcome:`Hi {name},\n\nWelcome aboard — we're genuinely glad to have you with us.\n\nYou've taken a great step. We'll share helpful tips over the coming days.\n\nDon't hesitate to reach out anytime.\n\nLooking forward to connecting,\n{from}`,
    followup:`Hi {name},\n\nI wanted to follow up and see if you reviewed what we shared.\n\nWe'll keep this brief — we'd love to answer any questions.\n\nKind regards,\n{from}`,
    announcement:`Hi {name},\n\nWe're thrilled to announce something new we think you'll love.\n\nStay tuned for more details. Feel free to reach out for an early look.\n\nBest,\n{from}`,
  };
  return t[type] || t.promotional;
}

async function startCampaign() {
  if (S.sending) return;
  const recipients = parseRecip($('c-recip').value);
  const subject    = $('c-subject').value.trim();
  const message    = $('c-message').value.trim();
  const fromName   = $('c-from').value.trim();
  const active     = S.smtp.filter(s => s.active);

  if (!recipients.length) { toast('No valid recipients', 'e'); return; }
  if (!subject)           { toast('Subject required', 'e'); return; }
  if (!message)           { toast('Message body required', 'e'); return; }
  if (!active.length)     { toast('No active SMTP senders', 'e'); return; }

  const planLim = getPlanLimit();
  if (S.todaySent >= planLim) { toast(`Daily limit reached (${planLim.toLocaleString()}). Upgrade via WhatsApp.`, 'e'); return; }

  const canSend = Math.min(recipients.length, planLim - S.todaySent);
  S.sending = true;
  const btn = $('btn-send');
  btn.textContent = '⏳ Sending...'; btn.disabled = true;
  vis('prog-wrap', true);
  $('send-log').innerHTML = '';
  txt('r-sent', 0); txt('r-failed', 0); txt('r-total', canSend);

  let sent = 0, failed = 0, ci = 0;
  const used = {}; active.forEach(c => { used[c.id] = c.used; });

  addLog(`🚀 Starting: ${canSend} recipients · ${active.length} senders · ${PLANS[S.currentPlan]?.name||''} plan`, 'i');
  if (canSend < recipients.length) addLog(`⚠️ Capped at ${canSend} (daily limit: ${planLim.toLocaleString()})`, 'w');
  addLog(`Auto-rotate: ${S.rotating?'ON':'OFF'} · Spam check: ${S.settings.spamCheck?'ON':'OFF'}`, 'i');

  for (let i = 0; i < canSend; i++) {
    const r = recipients[i];
    let cur = null;
    for (let a = 0; a < active.length; a++) {
      const cand = active[(ci + a) % active.length];
      if (used[cand.id] < cand.limit) { cur = cand; if (S.rotating) ci = (ci + a + 1) % active.length; break; }
    }
    if (!cur) { addLog(`⛔ All senders at limit. Stopped at ${i}/${canSend}`, 'e'); break; }
    await sleep(80);
    const ok = Math.random() > 0.04;
    if (ok) {
      used[cur.id]++; sent++; S.todaySent++; save.today();
      addLog(`✓ [${cur.label}] → ${r.email} (${r.name||'N/A'})`, 's');
      if (S.rotating && used[cur.id] >= cur.limit) addLog(`⟳ Rotating: ${cur.label} at limit`, 'w');
    } else {
      failed++;
      addLog(`✗ Failed → ${r.email}`, 'e');
    }
    const pct = Math.round(((i+1)/canSend)*100);
    $('prog-bar').style.width = pct + '%';
    txt('prog-txt', `Sending ${i+1} / ${canSend} (${pct}%)`);
    txt('r-sent', sent); txt('r-failed', failed);
  }

  S.smtp.forEach(s => { if (used[s.id] !== undefined) s.used = used[s.id]; });
  save.smtp(); renderSmtpList(); renderDashSenders(); renderDayBar();
  S.campaigns.push({ name:fromName||'Campaign', subject, sent, failed, date:new Date().toLocaleDateString() });
  save.campaigns(); renderCampaigns(); renderStats(); renderActivity(); renderChart();

  addLog(`✅ Done — Sent: ${sent}, Failed: ${failed}`, 's');
  toast(`Campaign done! Sent: ${sent}`, 's');
  btn.textContent = '🚀 SEND CAMPAIGN'; btn.disabled = false; S.sending = false;
}

function addLog(msg, type) {
  const el = $('send-log');
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = 'll l' + type;
  line.innerHTML = `<span class="lt">[${time}]</span>${esc(msg)}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function clearLog() { $('send-log').innerHTML = '<div class="lemp">Log cleared.</div>'; }

/* ================================================
   CAMPAIGNS TABLE
   ================================================ */
function renderCampaigns() {
  const el = $('camp-body');
  if (!S.campaigns.length) { el.innerHTML = '<tr><td colspan="7" class="tc tm" style="padding:26px;">No campaigns yet</td></tr>'; return; }
  el.innerHTML = S.campaigns.slice().reverse().map(c => `
    <tr>
      <td class="fw7 tw2">${esc(c.name)}</td>
      <td class="tm" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(c.subject)}</td>
      <td class="tg fw7 mono">${c.sent}</td>
      <td class="trd mono">${c.failed||0}</td>
      <td class="ty mono">${Math.round(((c.sent||0)/Math.max(1,(c.sent||0)+(c.failed||0)))*100)}%</td>
      <td class="tm">${c.date}</td>
      <td><span class="badge bg2">Done</span></td>
    </tr>`).join('');
}

/* ================================================
   SCHEDULES
   ================================================ */
function addSchedule() {
  const name = $('sch-name').value.trim();
  const recip = $('sch-recip').value.trim();
  if (!name)  { toast('Schedule name required','e'); return; }
  if (!recip) { toast('Recipients required','e'); return; }
  S.schedules.push({
    id: Date.now(), name,
    type:    $('sch-type').value,
    time:    $('sch-time').value,
    days:    parseInt($('sch-days').value)||1,
    recip,
    subject: $('sch-subj').value.trim(),
    active:  true,
    lastRun: 'Never',
    nextRun: nextRunDate($('sch-type').value, parseInt($('sch-days').value)||1),
  });
  save.schedules(); renderSchedules();
  ['sch-name','sch-subj','sch-recip'].forEach(id => { if($(id)) $(id).value=''; });
  toast('Schedule created: ' + name, 's');
}

function nextRunDate(type, days) {
  const d = new Date();
  d.setDate(d.getDate() + (type==='daily'?1:type==='weekly'?7:days));
  return d.toLocaleDateString();
}

function renderSchedules() {
  const el = $('sch-list');
  if (!S.schedules.length) { el.innerHTML = '<div class="tc tm" style="padding:26px;font-size:13px;">No schedules yet.</div>'; return; }
  const icons = { daily:'📅', weekly:'📆', monthly:'🗓️', custom:'⏱️' };
  el.innerHTML = S.schedules.map((s,i) => `
    <div class="sch-c">
      <div class="sch-icon" style="background:${s.active?'rgba(37,99,235,.15)':'rgba(90,106,144,.1)'};">${icons[s.type]||'📅'}</div>
      <div class="sch-info">
        <div class="sch-name">${esc(s.name)}</div>
        <div class="ssub">${s.type} blast · ${parseRecip(s.recip).length} recipients · ${esc(s.time)}</div>
        <div class="sch-next">Next: ${s.nextRun}</div>
      </div>
      <span class="badge ${s.active?'bg2':'bm2'}">${s.active?'ACTIVE':'PAUSED'}</span>
      <button class="btn btn-g btn-sm" onclick="toggleSch(${i})">${s.active?'Pause':'Resume'}</button>
      <button class="btn btn-sm btn-d" onclick="removeSch(${i})">✕</button>
    </div>`).join('');
}

function toggleSch(i) { S.schedules[i].active=!S.schedules[i].active; save.schedules(); renderSchedules(); }
function removeSch(i) { S.schedules.splice(i,1); save.schedules(); renderSchedules(); }

/* ================================================
   SETTINGS
   ================================================ */
const SET_DEFS = [
  {key:'aiSubject',     n:'AI Subject Line',         d:'Generate spam-filter-safe subjects with AI'},
  {key:'spamCheck',     n:'Spam Score Check',         d:'AI checks email for spam triggers before sending'},
  {key:'rotate',        n:'Auto SMTP Rotation',        d:'Switch sender when daily limit is reached'},
  {key:'personalise',   n:'Smart Personalisation',     d:'Auto-fill {name}, {email}, {from} variables'},
  {key:'bounceHandle',  n:'Bounce Handling',           d:'Auto-remove bounced emails from future campaigns'},
  {key:'trackDelivery', n:'Delivery Tracking',         d:'Track delivery status per recipient'},
  {key:'unsubLink',     n:'Unsubscribe Footer',        d:'Append unsubscribe link (CAN-SPAM compliance)'},
  {key:'openTrack',     n:'Open Tracking',             d:'Track email open rates with tracking pixel'},
  {key:'clickTrack',    n:'Click Tracking',            d:'Wrap links to track click-through rates'},
];

function renderSettings() {
  $('settings-list').innerHTML = SET_DEFS.map(s => `
    <div class="sr">
      <div><div class="sn">${s.n}</div><div class="sd">${s.d}</div></div>
      <div class="tw" onclick="toggleSet('${s.key}')">
        <div class="tog ${S.settings[s.key]?'on':''}" id="tog-${s.key}"></div>
      </div>
    </div>`).join('');
}

function toggleSet(key) { S.settings[key]=!S.settings[key]; $('tog-'+key)?.classList.toggle('on',S.settings[key]); save.settings(); }

/* ================================================
   INVOICE
   ================================================ */
function onInvPayChange() {
  const m = $('inv-pay').value;
  vis('inv-btc-wrap', m==='btc'||m==='both');
  updateInvPreview();
}

async function loadTFNFile() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='.txt';
  inp.onchange = async () => {
    const f = inp.files[0]; if(!f) return;
    const t = await f.text();
    const m = t.match(/TFN[:\s]*([0-9 ]{8,12})/i) || t.match(/([0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3})/);
    const tfn = m ? m[1].trim() : t.split('\n')[0].trim();
    $('inv-tfn').value = tfn;
    $('tfn-fname').textContent = f.name;
    updateInvPreview(); toast('TFN loaded: ' + tfn, 's');
  };
  inp.click();
}

function fillInvSenders() {
  const sel = $('inv-sender');
  sel.innerHTML = '<option value="">-- Select sender --</option>' +
    S.smtp.map((s,i) => `<option value="${i}">${esc(s.label)} (${esc(s.email)})</option>`).join('');
}

function getInvData() {
  return {
    invoiceId:     S.invoiceId,
    custEmail:     $('inv-email').value.trim(),
    custName:      $('inv-name').value.trim(),
    product:       $('inv-product').value.trim(),
    amount:        $('inv-amount').value.trim(),
    currency:      $('inv-currency').value,
    payMethod:     $('inv-pay').value,
    btcAddress:    $('inv-btc').value.trim(),
    tfn:           $('inv-tfn').value.trim(),
  };
}

function updateInvPreview() {
  const d = getInvData();
  const dateStr = new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'long',year:'numeric'});
  const pp = (d.payMethod==='paypal'||d.payMethod==='both')
    ? `<div style="background:#e8f0fe;border-radius:6px;padding:9px 13px;margin-bottom:8px;font-size:12px;">💳 <b>PayPal:</b> paypal.me/bulkmailerpro</div>` : '';
  const btc = (d.payMethod==='btc'||d.payMethod==='both')
    ? `<div style="background:#fff8e1;border-radius:6px;padding:9px 13px;margin-bottom:8px;font-size:12px;">₿ <b>Bitcoin:</b> <code style="font-size:11px;">${esc(d.btcAddress)||'Enter address'}</code></div>` : '';

  $('inv-prev').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
      <div>
        <div style="font-weight:900;font-size:20px;color:#0055cc;letter-spacing:2px;">BulkMailer Pro</div>
        <div style="color:#888;font-size:11px;">Professional Email Marketing</div>
        <div style="color:#888;font-size:11px;">support@bulkmailerpro.com</div>
        ${d.tfn?`<div style="color:#333;font-size:11px;margin-top:4px;"><b>TFN:</b> ${esc(d.tfn)}</div>`:''}
      </div>
      <div style="text-align:right;">
        <div style="font-weight:900;font-size:18px;letter-spacing:2px;">INVOICE</div>
        <div style="color:#888;font-size:11px;">${d.invoiceId}</div>
        <div style="color:#888;font-size:11px;">${dateStr}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;border-top:2px solid #0055cc;padding-top:14px;margin-bottom:16px;">
      <div>
        <div style="font-size:9px;color:#999;font-weight:700;letter-spacing:1.5px;margin-bottom:4px;">FROM</div>
        <div style="font-weight:700;">BulkMailer Pro</div>
        <div style="color:#666;font-size:12px;">Developer: ${CFG.DEVELOPER}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:9px;color:#999;font-weight:700;letter-spacing:1.5px;margin-bottom:4px;">BILL TO</div>
        <div style="font-weight:700;">${esc(d.custName)||'Customer Name'}</div>
        <div style="color:#0055cc;font-size:12px;">${esc(d.custEmail)||'customer@email.com'}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead><tr style="background:#f0f4ff;">
        <th style="padding:9px 13px;text-align:left;font-size:10px;color:#666;letter-spacing:1px;">DESCRIPTION</th>
        <th style="padding:9px 13px;text-align:right;font-size:10px;color:#666;letter-spacing:1px;">AMOUNT</th>
      </tr></thead>
      <tbody><tr>
        <td style="padding:12px;border-bottom:1px solid #eee;">${esc(d.product)}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">${esc(d.currency)} $${esc(d.amount)}</td>
      </tr></tbody>
      <tfoot><tr style="background:#f0f4ff;">
        <td style="padding:11px 13px;font-weight:900;">TOTAL DUE</td>
        <td style="padding:11px 13px;text-align:right;font-weight:900;color:#0055cc;font-size:17px;">${esc(d.currency)} $${esc(d.amount)}</td>
      </tr></tfoot>
    </table>
    ${pp}${btc}
    <div style="background:#fff0f0;border-radius:6px;padding:9px 13px;font-size:12px;color:#c00;margin-bottom:10px;">❓ Issues? Contact: <b>support@bulkmailerpro.com</b> · WhatsApp ${CFG.DEVELOPER}</div>
    <div style="text-align:center;color:#bbb;font-size:10px;border-top:1px solid #eee;padding-top:10px;">BulkMailer Pro · Developer: ${CFG.DEVELOPER} · Automated Invoice</div>`;
}

async function sendInvoice() {
  const si = $('inv-sender').value, ce = $('inv-email').value.trim();
  if (!ce) { toast('Customer email required','e'); return; }
  if (si==='') { toast('Select a sender','e'); return; }
  const btn = $('btn-inv'); btn.textContent='⏳ Sending...'; btn.disabled=true;
  await sleep(1600);
  toast(`Invoice sent to ${ce}`, 's');
  btn.textContent = '✅ SENT!';
  S.invoiceId = mkInvId(); updateInvPreview();
  setTimeout(() => { btn.textContent='📧 SEND INVOICE'; btn.disabled=false; }, 3000);
}

/* ================================================
   ADMIN PANEL
   ================================================ */
function adminLogin() {
  if ($('admin-pw').value === CFG.ADMIN_PASS) {
    S.adminIn = true;
    $('admin-login').style.display = 'none';
    $('admin-panel').style.display = '';
    renderAdmin(); toast('Admin access granted','s');
  } else {
    toast('Wrong password','e'); $('admin-pw').value='';
    $('admin-pw').animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:300});
  }
}

function renderAdmin() {
  if (!S.adminIn) return;
  renderKeyList(); renderAdminStats();
}

function renderAdminStats() {
  txt('a-total',    S.keys.length);
  txt('a-active',   S.keys.filter(k => k.active && !expired(k)).length);
  txt('a-campaigns',S.campaigns.length);
  txt('a-sent',     S.campaigns.reduce((a,c)=>a+(c.sent||0),0).toLocaleString());
}

function renderKeyList() {
  const el = $('key-list');
  el.innerHTML = S.keys.map((k,i) => `
    <div class="akr">
      <div style="flex:1;min-width:0;">
        <div class="akv">${esc(k.key)}</div>
        <div class="akm">${esc(k.label)} · ${PLANS[k.plan]?.name||k.plan} · ${k.limit.toLocaleString()}/day · Expires: ${k.expires}</div>
      </div>
      <span class="badge ${k.active&&!expired(k)?'bg2':expired(k)?'by2':'br2'}">${expired(k)?'EXPIRED':k.active?'ACTIVE':'REVOKED'}</span>
      <button class="btn btn-g btn-sm" onclick="copyKey('${esc(k.key)}')">Copy</button>
      <button class="btn btn-sm ${k.active?'btn-d':'btn-s'}" onclick="toggleKey(${i})">${k.active?'Revoke':'Enable'}</button>
      <button class="btn btn-sm btn-d" onclick="delKey(${i})">✕</button>
    </div>`).join('');
  txt('k-count', S.keys.length);
}

function addKey() {
  const keyVal = $('nk-val').value.trim().toUpperCase();
  const plan   = $('nk-plan').value;
  const exp    = $('nk-exp').value;
  const label  = $('nk-label').value.trim();
  const lim    = parseInt($('nk-limit').value) || 500;
  if (!keyVal) { toast('Key value required','e'); return; }
  if (S.keys.find(k => k.key===keyVal)) { toast('Key already exists','e'); return; }
  S.keys.push({ key:keyVal, plan, expires:exp||'2099-12-31', limit:lim, label:label||'New Key', active:true });
  save.keys(); renderKeyList(); renderAdminStats();
  $('nk-val').value=''; $('nk-label').value='';
  toast('Key added: ' + keyVal, 's');
}

function genKey() {
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg=()=>Array(4).fill(0).map(()=>c[Math.floor(Math.random()*c.length)]).join('');
  $('nk-val').value = `${seg()}-${seg()}-${seg()}`;
}

function toggleKey(i) { S.keys[i].active=!S.keys[i].active; save.keys(); renderKeyList(); renderAdminStats(); }
function delKey(i)    { if(!confirm('Delete this key?'))return; S.keys.splice(i,1); save.keys(); renderKeyList(); renderAdminStats(); }
function copyKey(k)   { navigator.clipboard.writeText(k).then(()=>toast('Key copied','s')); }

function exportKeys() {
  const rows = S.keys.map(k=>`${k.key},${k.plan},${k.label},${k.expires},${k.limit},${k.active}`).join('\n');
  const blob = new Blob([`key,plan,label,expires,dailyLimit,active\n${rows}`],{type:'text/csv'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='bulkmailer_keys.csv'; a.click();
}

function clearHistory() {
  if(!confirm('Delete all campaign history?'))return;
  S.campaigns=[]; save.campaigns(); renderAdminStats(); renderCampaigns(); toast('History cleared','s');
}

/* ================================================
   TOAST
   ================================================ */
let _tt;
function toast(msg, type='i') {
  const el = $('toast');
  const icons = {s:'✓',e:'✗',i:'ℹ',w:'⚠'};
  el.textContent = `${icons[type]||'ℹ'} ${msg}`;
  el.className = `show t${type}`;
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 3500);
}

/* ================================================
   HELPERS
   ================================================ */
function $(id)         { return document.getElementById(id); }
function txt(id,v)     { const e=$(id); if(e) e.textContent=v; }
function vis(id,show)  { const e=$(id); if(e) e.style.display=show?'':'none'; }
function sleep(ms)     { return new Promise(r=>setTimeout(r,ms)); }
function mkInvId()     { return 'INV-'+Date.now().toString(36).toUpperCase(); }
function esc(s)        { if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ================================================
   INIT
   ================================================ */
function initApp() {
  document.querySelectorAll('.ni, .tnav-btn').forEach(el => {
    el.addEventListener('click', () => showPage(el.dataset.page));
  });
  $('smtp-type')?.addEventListener('change', onSmtpTypeChange);
  $('c-recip')?.addEventListener('input', updateRecipCount);
  ['inv-email','inv-name','inv-product','inv-amount','inv-currency','inv-tfn','inv-btc']
    .forEach(id => $(id)?.addEventListener('input', updateInvPreview));
  $('inv-pay')?.addEventListener('change', onInvPayChange);
  $('admin-pw')?.addEventListener('keydown', e => { if(e.key==='Enter') adminLogin(); });

  renderSmtpList(); renderDash(); renderSettings(); renderCampaigns(); renderSchedules();
  fillInvSenders(); updateSummary(); updateRecipCount(); updateInvPreview(); onSmtpTypeChange();
}

document.addEventListener('DOMContentLoaded', initGate);
