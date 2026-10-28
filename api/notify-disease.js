// Vercel Serverless Function
// Route: POST /api/notify-disease
//
// اس فائل کے دو استعمال ہیں:
// 1) جب کوئی مریض ایسی بیماری/علامت لکھے جو سائٹ کی موجودہ فہرست
//    (اعضاء کے مطابق) میں شامل نہیں ہے، تو وہ نام خودکار طور پر مزاج
//    کی تشخیص میں شامل نہیں کیا جاتا — بلکہ صرف نوٹ کر کے آپ (سائٹ
//    کے مالک) کو ای میل کے ذریعے مطلع کیا جاتا ہے (diseaseName)۔
// 2) تشخیص کے نتیجے کے سب سے آخر میں دیے گئے چھوٹے ڈبے کے ذریعے،
//    مریض خود آزادانہ طور پر کوئی بھی تجویز/سوال لکھ کر بھیج سکتا ہے —
//    مثلاً فلاں علامت شامل کریں، فلاں بیماری موجود نہیں، یا اگر ویب
//    سائٹ کا سوال/جواب اس کی علامات/بیماری کے مطابق نہ ملے (message) —
//    اس کے ساتھ ایک سکرین شاٹ/تصویر بھی منسلک کی جا سکتی ہے
//    (imageBase64, imageMime, imageFilename) — یہ سب اسی ای میل کے
//    ساتھ اٹیچمنٹ کے طور پر بھیج دیا جاتا ہے۔
//
// اہم: یہ فیچر کام کرنے کے لیے Resend (resend.com) کا مفت اکاؤنٹ اور
// API key درکار ہے۔ Vercel Environment Variables میں یہ تین ویلیوز شامل کریں:
// 1) RESEND_API_KEY   — Resend ڈیش بورڈ سے حاصل کریں
// 2) NOTIFY_EMAIL      — وہ ای میل ایڈریس جس پر اطلاع آنی چاہیے (آپ کا ای میل)
// 3) FROM_EMAIL         — بھیجنے والا ایڈریس (Resend کی verified domain سے، یا
//                         عارضی طور پر 'onboarding@resend.dev' استعمال کر سکتے ہیں)

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb' // سکرین شاٹ تصویر کی گنجائش کے لیے
    }
  }
};

export default async function handler(req, res) {
  if (req.query && req.query.upload === '1') return uploadBookHandler(req, res);
  if (req.query && req.query.apk === '1') return apkDownload(req, res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'صرف POST request قبول ہے۔' });
  }

  try {
    const { diseaseName, message, imageBase64, imageMime, imageFilename, unknownHerbs, nuskha } = req.body || {};

    // 4) سرگرمی رپورٹ: وزیٹر نے کیا لکھا/چنا اور سائٹ نے کیا جواب دیا — مالک کو ای میل تاکہ غلط جواب درست کروائے جا سکیں
    const log = (req.body || {}).activityLog;
    if (log && Array.isArray(log.events)) return sendActivityLog(req, res, log);

    // 3) نسخہ سازی میں جس بوٹی/چیز کا مزاج سائٹ اور کتابوں میں نہ ملے — مالک کو ای میل تاکہ وہ مزاج بتا دیں
    if (Array.isArray(unknownHerbs) && unknownHerbs.length) {
      const list = unknownHerbs.map(x => String(x || '').trim().slice(0, 60)).filter(Boolean).slice(0, 20);
      if (!list.length) return res.status(400).json({ error: 'نام خالی ہیں۔' });
      const subject0 = `مزاج معلوم نہیں: ${list.join('، ')}`;
      const text0 = `نسخہ سازی میں ان بوٹیوں/اشیاء کا مزاج نہ سائٹ کی فہرست میں ملا نہ کتابوں (خواص المفردات، کشتہ جات وغیرہ) میں:\n\n${list.map((n, i) => (i + 1) + '۔ ' + n).join('\n')}\n\n${nuskha ? 'مکمل نسخہ جو لکھا گیا تھا:\n"' + String(nuskha).slice(0, 400) + '"\n\n' : ''}براہ کرم ہر ایک کا مزاج (تحریک نمبر 1 سے 6) بتائیں تاکہ اسے سائٹ میں شامل کر دیا جائے اور اگلی بار یہ مسئلہ نہ آئے۔`;
      const sent0 = await sendOwnerEmail({ subject: subject0, text: text0 });
      return res.status(200).json({ ok: true, emailed: sent0 });
    }

    const hasDiseaseName = typeof diseaseName === 'string' && diseaseName.trim();
    const hasMessage = typeof message === 'string' && message.trim();
    const hasImage = typeof imageBase64 === 'string' && imageBase64.trim();

    if (!hasDiseaseName && !hasMessage && !hasImage) {
      return res.status(400).json({ error: 'کوئی بیماری کا نام، پیغام یا تصویر فراہم نہیں کی گئی۔' });
    }

    let subject, text;
    if (hasMessage || hasImage || !hasDiseaseName) {
      subject = 'ویب سائٹ سے مریض کی تجویز/سوال موصول ہوا';
      text = hasMessage
        ? `ایک مریض نے تشخیص کے نتیجے کے بعد یہ تجویز/سوال لکھ کر بھیجا:\n\n"${message.trim()}"\n\nبراہ کرم دیکھیں کہ اس کے مطابق سائٹ میں کوئی علامت/بیماری شامل کرنی ہے یا کوئی جواب دینا ہے۔${hasImage ? '\n\n(ساتھ ایک سکرین شاٹ/تصویر بھی منسلک ہے۔)' : ''}`
        : `ایک مریض نے تشخیص کے نتیجے کے بعد صرف ایک سکرین شاٹ/تصویر بھیجی ہے، کوئی متن نہیں لکھا۔ براہ کرم منسلک تصویر دیکھیں۔`;
    } else {
      subject = `نئی بیماری فہرست میں شامل نہیں ملی: ${diseaseName.trim()}`;
      text = `ایک مریض نے یہ بیماری/علامت لکھی جو فہرست میں موجود نہیں تھی:\n\n"${diseaseName.trim()}"\n\nبراہ کرم دیکھیں کہ اسے سائٹ کی بیماریوں کی فہرست میں شامل کرنا ہے یا نہیں۔`;
    }

    let attachments;
    if (hasImage) {
      // Resend base64 اٹیچمنٹ قبول کرتا ہے — بغیر ڈیٹا یو آر ائی پریفکس کے خالص base64 ہونا چاہیے
      const cleanBase64 = imageBase64.indexOf(',') !== -1 ? imageBase64.split(',').pop() : imageBase64;
      const ext = (imageMime && imageMime.split('/')[1]) ? imageMime.split('/')[1] : 'jpg';
      attachments = [{ filename: imageFilename || `screenshot.${ext}`, content: cleanBase64 }];
    }
    const sent = await sendOwnerEmail({ subject, text, attachments });
    return res.status(200).json({ ok: true, emailed: sent });

  } catch (err) {
    console.error('notify-disease error:', err);
    return res.status(200).json({ ok: true, emailed: false, note: String(err && err.message ? err.message : err) });
  }
}

// مالک کو ای میل: Resend سیٹ ہو تو اس سے، ورنہ (یا ناکام ہو تو) FormSubmit سے — جس کے لیے کوئی چابی نہیں چاہیے
// (FormSubmit پہلی بار مالک کے Gmail پر تصدیقی ای میل بھیجتا ہے؛ اسے ایک بار Activate کرنا ہوتا ہے)
const OWNER_EMAIL = process.env.FORMSUBMIT_EMAIL || 'h7927022@gmail.com';
async function sendOwnerEmail({ subject, text, html, attachments }) {
  const resendKey = process.env.RESEND_API_KEY, notifyEmail = process.env.NOTIFY_EMAIL;
  if (resendKey && notifyEmail) {
    try {
      const payload = { from: process.env.FROM_EMAIL || 'onboarding@resend.dev', to: [notifyEmail], subject, text };
      if (html) payload.html = html;
      if (attachments) payload.attachments = attachments;
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
        body: JSON.stringify(payload)
      });
      if (r.ok) return true;
      console.error('Resend error:', await r.text().catch(() => ''));
    } catch (e) { console.error('Resend error:', e); }
  }
  try {
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(OWNER_EMAIL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://myherbalpk.com', Referer: 'https://myherbalpk.com/' },
      body: JSON.stringify({ _subject: String(subject).slice(0, 200), _template: 'box', _captcha: 'false', 'تفصیل': String(text).slice(0, 30000) })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || String(d.success) === 'false') console.error('FormSubmit:', r.status, d.message || '');
    return r.ok && String(d.success) !== 'false';
  } catch (e) { console.error('FormSubmit error:', e); return false; }
}

// Android ایپ ڈاؤن لوڈ: تازہ ترین APK ورژن نمبر والے نام سے (MyHerbal-v4.apk) — تاکہ فون نام کے آگے (1)، (2) نہ لگائے
// (12 فنکشن کی حد کی وجہ سے یہ الگ فائل کے بجائے یہیں ہے)
async function apkDownload(req, res) {
  const repo = process.env.GITHUB_REPO || 'sajjadrate-max/my-herbal';
  const fallback = 'https://github.com/' + repo + '/releases/latest/download/MyHerbal.apk';
  try {
    const rel = await fetch('https://api.github.com/repos/' + repo + '/releases/latest', { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'my-herbal-apk' } }).then(r => r.ok ? r.json() : null);
    const asset = rel && (rel.assets || []).find(a => a.name === 'MyHerbal.apk');
    if (!asset) return res.redirect(302, fallback);
    const r = await fetch(asset.browser_download_url, { redirect: 'follow' });
    if (!r.ok) return res.redirect(302, fallback);
    const buf = Buffer.from(await r.arrayBuffer());
    const ver = String(rel.tag_name || '').replace(/^app-/, '').replace(/[^A-Za-z0-9.]/g, '') || 'latest';
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="MyHerbal-${ver}.apk"`);
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (e) {
    return res.redirect(302, fallback);
  }
}

const escHtml = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function sendActivityLog(req, res, log) {
  const events = log.events.slice(-300).map(e => ({
    t: Number(e && e.t) || Date.now(),
    page: String((e && e.page) || '').slice(0, 80),
    type: String((e && e.type) || '').slice(0, 30),
    text: String((e && e.text) || '').slice(0, 4000)
  })).filter(e => e.text);
  if (!events.length) return res.status(200).json({ ok: true, emailed: false });
  const sid = String(log.sid || '').replace(/[^A-Z0-9]/gi, '').slice(0, 10);
  const time = t => new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi' });
  const day = new Date(events[0].t).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' });
  const first = events.find(e => e.type === 'لکھا' || e.type === 'چنا');
  const subject = `سرگرمی رپورٹ ${sid ? '#' + sid : ''} — ${events.length} اندراج${first ? ' — ' + first.text.slice(0, 60) : ''}`;
  const colors = { 'لکھا': '#1f7a4d', 'چنا': '#1f7a4d', 'نتیجہ': '#8a5a00', 'AI سوال/جواب': '#6b3fa0', 'دبایا': '#777' };
  const rows = events.map(e => `<tr style="vertical-align:top;border-bottom:1px solid #eee">
<td style="padding:6px;white-space:nowrap;color:#777">${time(e.t)}</td>
<td style="padding:6px;white-space:nowrap">${escHtml(e.page)}</td>
<td style="padding:6px;white-space:nowrap;font-weight:bold;color:${colors[e.type] || '#333'}">${escHtml(e.type)}</td>
<td style="padding:6px;white-space:pre-wrap">${escHtml(e.text)}</td></tr>`).join('');
  const ua = String(req.headers['user-agent'] || '').slice(0, 200);
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:14px">
<p>ویب سائٹ پر ایک وزیٹر کی سرگرمی (سیشن ${escHtml(sid)}، تاریخ ${day}، پاکستانی وقت)۔ اگر کہیں جواب غلط ہے تو یہ ای میل دکھا کر درست کروائیں۔</p>
<table style="border-collapse:collapse;width:100%">
<tr style="background:#1f7a4d;color:#fff"><th style="padding:6px">وقت</th><th style="padding:6px">صفحہ</th><th style="padding:6px">کیا ہوا</th><th style="padding:6px">تفصیل</th></tr>
${rows}</table>
<p style="color:#999;font-size:12px">ڈیوائس: ${escHtml(ua)} · ${escHtml(String(log.screen || '').slice(0, 20))} · ${escHtml(String(log.lang || '').slice(0, 20))}</p></div>`;
  const text = events.map(e => `[${time(e.t)}] ${e.page} — ${e.type}: ${e.text}`).join('\n\n');
  const emailed = await sendOwnerEmail({ subject, html, text });
  return res.status(200).json({ ok: true, emailed });
}

// ---------------------------------------------------------------------------
// عارضی: ویب سائٹ سے PDF کتاب اپ لوڈ (POST /api/notify-disease?upload=1)
// Vercel کے مفت پلان میں 12 سے زیادہ فنکشن نہیں بن سکتے، اس لیے یہ کوڈ الگ فائل کے بجائے یہاں ہے۔
// تمام کتابیں اپ لوڈ ہو جانے کے بعد یہ پورا حصہ اور handler کی پہلی لائن والا upload چیک ہٹا دینا ہے۔
// GITHUB_TOKEN کبھی کلائنٹ کوڈ میں نہیں — صرف Vercel کے Environment Variables میں۔
const REPO = process.env.GITHUB_REPO || 'sajjadrate-max/my-herbal';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const MANIFEST = 'books/uploads.json';
const MAX_B64 = 4300000;
const PDF_PATH = /^books\/up_[A-Za-z0-9_]{1,80}(_part\d{1,3})?\.pdf$/;
const JSON_PATH = /^books\/pm-data-up-[a-z0-9_-]{1,80}\.json$/;

async function upGh(path, opts = {}) {
  const r = await fetch('https://api.github.com/repos/' + REPO + path, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'my-herbal-upload'
    }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error((data && data.message) || ('GitHub ' + r.status));
    e.status = r.status;
    throw e;
  }
  return data;
}

async function createBlob(kind, content) {
  if (typeof content !== 'string' || !content || content.length > MAX_B64) throw new Error('حصہ بہت بڑا یا خالی ہے');
  const buf = Buffer.from(content, 'base64');
  if (kind === 'pdf') {
    if (buf.slice(0, 5).toString('latin1') !== '%PDF-') throw new Error('یہ PDF فائل نہیں');
  } else if (kind === 'json') {
    const d = JSON.parse(buf.toString('utf8'));
    if (!d || !Array.isArray(d.pages) || typeof d.fileName !== 'string') throw new Error('کتاب کا ڈیٹا درست نہیں');
  } else {
    throw new Error('غلط قسم');
  }
  const b = await upGh('/git/blobs', { method: 'POST', body: JSON.stringify({ content, encoding: 'base64' }) });
  return b.sha;
}

async function commitFiles(title, files) {
  if (!Array.isArray(files) || !files.length || files.length > 300) throw new Error('فائلوں کی فہرست درست نہیں');
  const dataFiles = files.filter(f => JSON_PATH.test(f.path));
  if (dataFiles.length !== 1) throw new Error('کتاب کے متن کی ایک فائل ضروری ہے');
  for (const f of files) {
    if (!(PDF_PATH.test(f.path) || JSON_PATH.test(f.path)) || !/^[0-9a-f]{40}$/.test(String(f.sha))) throw new Error('غلط فائل: ' + f.path);
  }
  // کسی اور کے ساتھ بیک وقت commit ہو جائے تو دوبارہ کوشش
  for (let attempt = 0; attempt < 4; attempt++) {
    const ref = await upGh('/git/ref/heads/' + BRANCH);
    const head = await upGh('/git/commits/' + ref.object.sha);
    let manifest = [];
    try {
      const m = await upGh('/contents/' + MANIFEST + '?ref=' + ref.object.sha);
      manifest = JSON.parse(Buffer.from(m.content, 'base64').toString('utf8'));
      if (!Array.isArray(manifest)) manifest = [];
    } catch (e) { if (e.status !== 404) throw e; }
    const dataPath = dataFiles[0].path;
    if (manifest.some(x => x && x.data === dataPath)) throw new Error('یہ کتاب پہلے سے شامل ہے');
    manifest.push({ data: dataPath, title: String(title || '').slice(0, 200), addedAt: Date.now() });
    const tree = await upGh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: head.tree.sha,
        tree: files.map(f => ({ path: f.path, mode: '100644', type: 'blob', sha: f.sha })).concat([
          { path: MANIFEST, mode: '100644', type: 'blob', content: JSON.stringify(manifest, null, 1) + '\n' }
        ])
      })
    });
    const commit = await upGh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: 'Add book via website upload: ' + String(title || dataPath).slice(0, 120), tree: tree.sha, parents: [ref.object.sha] })
    });
    try {
      await upGh('/git/refs/heads/' + BRANCH, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
      return commit.sha;
    } catch (e) {
      if (e.status !== 422 || attempt === 3) throw e;
    }
  }
}

// ویب سائٹ سے اپ لوڈ کی گئی کتاب ہٹانا: فہرست (uploads.json) سے اندراج، کتاب کا متن اور اس کے PDF حصے
// صرف books/up_* اور books/pm-data-up-* فائلیں — اصل (مستقل) کتابیں اس سے کبھی ڈیلیٹ نہیں ہو سکتیں
async function deleteBook(dataPath, pdfFiles) {
  if (!JSON_PATH.test(String(dataPath))) throw new Error('غلط کتاب');
  const slug = dataPath.slice('books/pm-data-up-'.length, -'.json'.length);
  const pdfs = Array.isArray(pdfFiles) ? pdfFiles.map(String) : [];
  if (pdfs.length > 300) throw new Error('فائلوں کی فہرست درست نہیں');
  for (const f of pdfs) {
    const m = PDF_PATH.test(f) && f.toLowerCase().match(/^books\/up_(.+?)(_part\d{1,3})?\.pdf$/);
    if (!m || m[1] !== slug) throw new Error('غلط فائل: ' + f);
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    const ref = await upGh('/git/ref/heads/' + BRANCH);
    const head = await upGh('/git/commits/' + ref.object.sha);
    let manifest = [];
    try {
      const m = await upGh('/contents/' + MANIFEST + '?ref=' + ref.object.sha);
      manifest = JSON.parse(Buffer.from(m.content, 'base64').toString('utf8'));
      if (!Array.isArray(manifest)) manifest = [];
    } catch (e) { if (e.status !== 404) throw e; }
    const entry = manifest.find(x => x && x.data === dataPath);
    if (!entry) throw new Error('یہ کتاب فہرست میں نہیں ملی (شاید پہلے ہی ڈیلیٹ ہو چکی ہے)');
    const remove = [];
    for (const f of [dataPath].concat(pdfs)) {
      try { await upGh('/contents/' + f + '?ref=' + ref.object.sha); remove.push(f); } catch (e) { if (e.status !== 404) throw e; }
    }
    const tree = await upGh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: head.tree.sha,
        tree: remove.map(f => ({ path: f, mode: '100644', type: 'blob', sha: null })).concat([
          { path: MANIFEST, mode: '100644', type: 'blob', content: JSON.stringify(manifest.filter(x => x !== entry), null, 1) + '\n' }
        ])
      })
    });
    const commit = await upGh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: 'Remove website-uploaded book: ' + String(entry.title || dataPath).slice(0, 120), tree: tree.sha, parents: [ref.object.sha] })
    });
    try {
      await upGh('/git/refs/heads/' + BRANCH, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
      return commit.sha;
    } catch (e) {
      if (e.status !== 422 || attempt === 3) throw e;
    }
  }
}

async function uploadBookHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: 'سرور پر GITHUB_TOKEN سیٹ نہیں — Vercel کی Environment Variables میں شامل کریں' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.action === 'blob') {
      return res.status(200).json({ sha: await createBlob(body.kind, body.content) });
    }
    if (body.action === 'ping') {
      await upGh('/git/ref/heads/' + BRANCH);
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'delete') {
      return res.status(200).json({ commit: await deleteBook(body.data, body.files) });
    }
    if (body.action === 'commit') {
      return res.status(200).json({ commit: await commitFiles(body.title, body.files) });
    }
    return res.status(400).json({ error: 'غلط درخواست' });
  } catch (e) {
    return res.status(e.status && e.status < 500 ? 400 : 500).json({ error: e.message || 'نامعلوم خرابی' });
  }
}
