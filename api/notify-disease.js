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
      sizeLimit: '9mb' // سکرین شاٹ / رپورٹ کی تصویروں کی گنجائش کے لیے
    }
  }
};

export const maxDuration = 60;

// ===== بانجھ پن: لیب رپورٹ کی تصویر پڑھ کر ہر ٹیسٹ ٹھیک/خراب، کس بیماری کا علاج کرنا ہے، اور اگلا ٹیسٹ =====
// مریض کا نام نہیں بھیجا جاتا؛ تصویر صرف پڑھی جاتی ہے، کہیں محفوظ نہیں ہوتی۔ دوا/نسخہ AI نہیں بتاتا — صرف بیماری کا نام۔
async function banjhReport(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'صرف POST' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'سرور پر OPENAI_API_KEY سیٹ نہیں ہے۔' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const side = b.side === 'f' ? 'f' : 'm';
    const images = (Array.isArray(b.images) ? b.images : []).slice(0, 3).map(String).filter(u => /^data:image\/(jpeg|png|webp);base64,/.test(u) && u.length < 2_600_000);
    if (!images.length) return res.status(400).json({ error: 'رپورٹ کی تصویر نہیں ملی' });
    const tests = (Array.isArray(b.tests) ? b.tests : []).slice(0, 40).map(t => ({ id: String(t.id || '').slice(0, 20), name: String(t.name || '').slice(0, 80), stage: +t.stage || 1, hint: String(t.hint || '').slice(0, 200) })).filter(t => /^[a-z0-9_]+$/.test(t.id));
    const done = (Array.isArray(b.done) ? b.done : []).slice(0, 40).map(t => ({ id: String(t.id || '').slice(0, 20), name: String(t.name || '').slice(0, 80), status: t.status === 'ok' ? 'ok' : 'bad', value: String(t.value || '').slice(0, 120) }));
    const who = side === 'm' ? 'مرد (شوہر) — مردانہ بانجھ پن' : 'عورت (بیوی) — زنانہ بانجھ پن';
    const system = `آپ ایک تجربہ کار لیبارٹری/زچگی و بانجھ پن کے ماہر ہیں جو ایک حکیم کی مدد کر رہے ہیں۔ مریض: ${who}۔
آپ کو لیب رپورٹ کی تصویریں، ٹیسٹوں کی مرحلہ وار فہرست (id کے ساتھ) اور پہلے سے ہو چکے ٹیسٹوں کے نتیجے دیے جائیں گے۔
کام:
1) تصویر میں جو ٹیسٹ اس فہرست کے ہیں ان کی ویلیو پڑھیں اور معیاری نارمل حد (رپورٹ پر لکھی حد، ورنہ WHO 2021 / عام معیار) کے مطابق فیصلہ کریں: "ok" (ٹھیک) یا "bad" (خراب)۔ رپورٹ کی ہر سطر غور سے پڑھیں — جو ٹیسٹ نارمل ہیں وہ بھی لازمی "ok" کے ساتھ شامل کریں (صرف خراب والے نہیں)؛ ایک بھی ٹیسٹ نہ چھوڑیں۔ صرف وہی چھوڑیں جو بالکل پڑھا نہ جا سکے۔
   ایک ٹیسٹ میں کئی ویلیو ہوں (مثلاً سیمن: تعداد، حرکت، بناوٹ، پس سیلز) تو کوئی ایک بھی اہم ویلیو خراب ہو تو "bad"، اور note میں بتائیں کیا خراب ہے۔
2) "value": اہم ویلیو مختصر؛ کئی حصوں والے ٹیسٹ میں ہر اہم حصہ اپنے نشان کے ساتھ (مثلاً "شوگر Nil ✓، البیومن Nil ✓، پس سیلز 10-12 ✗" یا "تعداد 8 ملین/ml ✗، حرکت 45٪ ✓")۔ پیشاب کی شوگر کو خون کی شوگر (HbA1c) کا نتیجہ نہ سمجھیں۔ "note": اردو میں ایک مختصر جملہ — کیا ٹھیک ہے یا کیا خرابی ہے۔
   رپورٹ کا ٹیسٹ فہرست کے کسی ٹیسٹ سے ملتا ہو (مثلاً AMH، Testosterone/DHEA-S، FSH/LH/E2، TSH، Hb، Urine) تو اسے results میں اسی id سے دیں — other میں ہرگز نہیں۔
3) فہرست سے بالکل باہر کوئی ٹیسٹ رپورٹ میں ہو تو "other" میں {name (انگریزی نام، مثلاً "Urine R/E"),value,status ("ok" یا "bad"),note}۔
4) "treat": جو خرابیاں ملیں ان کی بیماریوں کے صرف نام اردو میں (مثلاً "سپرم کی کمی (اولیگو سپرمیا)"، "سپرم کی حرکت کم (استھینو سپرمیا)"، "پرولیکٹن زیادہ"، "تھائیرائیڈ کم (ہائپو تھائیرائیڈ)"، "PCOS"، "سیمن میں انفیکشن (پس سیلز)")۔ کوئی دوا، نسخہ یا خوراک ہرگز نہ لکھیں — علاج حکیم خود کرے گا۔ خرابی نہ ہو تو خالی۔
   پہلے کے خراب نتیجوں کی بیماریاں بھی شامل رکھیں جب تک نئی رپورٹ انہیں ٹھیک نہ دکھائے۔
5) "next": فہرست کے صرف id — مرحلہ وار اگلے کون سے ٹیسٹ کروانے چاہئیں (ابھی تک نہ ہوئے ہوں)۔ سب بنیادی ٹیسٹ ٹھیک ہوں تو اگلے مرحلے پر صرف تب جائیں جب واقعی ضروری ہو۔ خرابی ہو تو اس کی وجہ ڈھونڈنے والا ٹیسٹ (مثلاً سیمن خراب → ہارمون، ویریکوسیل کا الٹراساؤنڈ؛ پس سیلز → سیمن کلچر؛ سپرم صفر → FSH، کیریو ٹائپ، Y مائیکرو ڈیلیشن)۔ 0 سے 4 id۔
6) "summary": اردو میں 1–2 جملے کہ رپورٹ میں کیا ملا اور آگے کیا کرنا ہے۔
ہر عبارت اردو رسم الخط میں (ٹیسٹ کے انگریزی مخففات جیسے FSH، AMH، TSH ٹھیک ہیں)۔
صرف JSON: {"results":[{"id":"semen","status":"bad","value":"...","note":"..."}],"other":[{"name":"...","value":"...","note":"..."}],"treat":["..."],"next":["fsh_m"],"summary":"..."}`;
    // کسی خاص ٹیسٹ کے خانے سے بھیجی گئی رپورٹ: اسی ٹیسٹ کی مانی جائے، رپورٹ پر نام کچھ بھی لکھا ہو
    const target = tests.find(t => t.id === String(b.target || ''));
    const content = [{ type: 'text', text: (target ? `⚠ یہ رپورٹ مالک نے "${target.name}" (id: ${target.id}) کے خانے سے بھیجی ہے — اسے اسی ٹیسٹ کی رپورٹ مانیں، چاہے رپورٹ پر نام مختلف یا غلط لکھا ہو۔ results میں لازمی id "${target.id}" کے ساتھ اس کا فیصلہ (ok/bad) دیں۔ رپورٹ میں اور ٹیسٹ بھی ہوں تو ان کے بھی دیں۔\n\n` : '') + 'ٹیسٹوں کی فہرست:\n' + tests.map(t => `${t.id} — مرحلہ ${t.stage} — ${t.name}${t.hint ? ' (' + t.hint + ')' : ''}`).join('\n')
      + '\n\nپہلے کے نتیجے:\n' + (done.length ? done.map(t => `${t.id} ${t.name}: ${t.status === 'ok' ? 'ٹھیک' : 'خراب'} ${t.value}`).join('\n') : 'کوئی نہیں') + '\n\nرپورٹ کی تصویریں:' }];
    images.forEach(u => content.push({ type: 'image_url', image_url: { url: u, detail: 'high' } }));
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL || 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content }], temperature: 0, response_format: { type: 'json_object' } })
    });
    if (!r.ok) return res.status(502).json({ error: 'AI سے جواب نہیں ملا — دوبارہ کوشش کریں' });
    const data = await r.json();
    let out = {};
    try { out = JSON.parse((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '{}'); } catch (e) { out = {}; }
    const ids = new Set(tests.map(t => t.id));
    const s = (x, n) => String(x == null ? '' : x).trim().slice(0, n);
    return res.status(200).json({
      results: (Array.isArray(out.results) ? out.results : []).filter(x => x && ids.has(x.id) && (x.status === 'ok' || x.status === 'bad')).map(x => ({ id: x.id, status: x.status, value: s(x.value, 160), note: s(x.note, 240) })).slice(0, 30),
      other: (Array.isArray(out.other) ? out.other : []).filter(x => x && x.name).map(x => ({ name: s(x.name, 80), value: s(x.value, 120), status: x.status === 'ok' ? 'ok' : x.status === 'bad' ? 'bad' : '', note: s(x.note, 200) })).slice(0, 12),
      treat: (Array.isArray(out.treat) ? out.treat : []).map(x => s(x, 80)).filter(Boolean).slice(0, 10),
      next: (Array.isArray(out.next) ? out.next : []).filter(x => ids.has(x)).slice(0, 4),
      summary: s(out.summary, 500)
    });
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message ? err.message : err).slice(0, 200) });
  }
}

// ===== ڈاکٹر کے بل میں دوائی کی تبدیلی: نسخے/بل کی تصویر → ہر دوا، کمپنی، اور لوکل ہو تو اچھی کمپنی کی وہی دوا =====
const RX_SYSTEM = `You read doctors' prescriptions and pharmacy bills from Pakistan (printed or handwritten, English/Urdu).
For EACH medicine line you can see, return:
- "written": the brand/name exactly as written (keep spelling)
- "company": manufacturer if printed or if you reliably know this Pakistani brand's maker, else ""
- "country": the country the company is from, in Urdu (e.g. "پاکستان", "فرانس", "امریکہ", "برطانیہ", "سوئٹزرلینڈ", "جرمنی", "بھارت", "چین"), "" if not known
- "generic": the active ingredient(s) (salt). If you cannot tell with confidence, return "" — never guess.
- "strength": e.g. "500 mg", "250 mg/5 ml"; "" if not visible and not certain
- "form": tablet / capsule / syrup / suspension / injection / drops / cream / ointment / inhaler / sachet / other
- "dose": dosing instructions exactly as written (e.g. "1+0+1 x 5 days"), else ""
- "uses": 2 to 4 short Urdu points on what this generic medicine is used for / its benefits (e.g. "بخار کم کرتی ہے"), from standard medical knowledge of the generic; [] if the generic is not known
- "status": "good" if the maker is a multinational or a large reputable Pakistani manufacturer (e.g. GSK, Abbott, Pfizer, Sanofi, Novartis, Bayer, Roche, AstraZeneca, MSD, Getz Pharma, Searle, Sami, Hilton, Martin Dow, Ferozsons, Highnoon, AGP, CCL, Bosch, PharmEvo, Barrett Hodgson, Atco, Platinum, Nabiqasim, Macter, OBS, Genix, Tabros, Wilson's, Indus, Medisure, Zafa); "local" if it is a small/local or little-known maker; "unknown" if you cannot tell the maker; "unclear" if the line itself cannot be read.
- "reason": one short Urdu sentence why (e.g. "یہ ایک چھوٹی مقامی کمپنی کا برانڈ ہے")
- "alternatives": ONLY when status is "local" or "unknown" AND generic is known: up to 3 brands sold in Pakistan by the reputable makers above that contain EXACTLY the same generic(s), same strength and same form. Each {"brand","company","country"} where country is the company's home country in Urdu. Never suggest a different medicine, different strength or different form. If unsure a brand exists in that strength/form, leave it out. Prefer brands that are commonly stocked in ordinary Pakistani pharmacies and affordable; do NOT suggest imported brands that are often out of stock or very expensive in Pakistan (e.g. Dostinex, Proxeed Plus, Parlodel) — choose the commonly available Pakistani-made equivalent instead (e.g. Cabergoline: Caburli by Macter; Bromocriptine: Brotin by Shaigan).
Do not add, remove or change any medicine, dose or duration. Not a diagnosis.
Return JSON: {"medicines":[...], "note": short Urdu note if the image is not a prescription/bill or is hard to read, else ""}.`;
async function rxSwap(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'صرف POST' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'سرور پر OPENAI_API_KEY سیٹ نہیں ہے۔' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const images = (Array.isArray(body.images) ? body.images : []).slice(0, 3).map(String).filter(u => /^data:image\/(jpeg|png|webp);base64,/.test(u));
    if (!images.length) return res.status(400).json({ error: 'نسخے/بل کی تصویر موجود نہیں۔' });
    const content = [{ type: 'text', text: 'Doctor prescription / pharmacy bill:' }];
    images.forEach(u => content.push({ type: 'image_url', image_url: { url: u, detail: 'high' } }));
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL || 'gpt-4o', messages: [{ role: 'system', content: RX_SYSTEM }, { role: 'user', content }], temperature: 0, response_format: { type: 'json_object' } })
    });
    if (!r.ok) return res.status(502).json({ error: 'AI سے جواب نہیں ملا — دوبارہ کوشش کریں' });
    const data = await r.json();
    let o = {};
    try { o = JSON.parse((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '{}'); } catch (e) { o = {}; }
    const str = (v, n) => String(v || '').trim().slice(0, n);
    const medicines = (Array.isArray(o.medicines) ? o.medicines : []).slice(0, 25).map(m => {
      const status = ['good', 'local', 'unknown', 'unclear'].includes(m && m.status) ? m.status : 'unknown';
      const generic = str(m && m.generic, 120);
      return {
        written: str(m && m.written, 80), company: str(m && m.company, 60), country: str(m && m.country, 40), generic,
        strength: str(m && m.strength, 40), form: str(m && m.form, 30), dose: str(m && m.dose, 80), status, reason: str(m && m.reason, 160),
        uses: generic ? (Array.isArray(m && m.uses) ? m.uses : []).map(u => str(u, 120)).filter(Boolean).slice(0, 4) : [],
        alternatives: (status === 'local' || status === 'unknown') && generic
          ? (Array.isArray(m.alternatives) ? m.alternatives : []).map(a => ({ brand: str(a && a.brand, 60), company: str(a && a.company, 60), country: str(a && a.country, 40) })).filter(a => a.brand).slice(0, 3) : []
      };
    }).filter(m => m.written || m.generic);
    return res.status(200).json({ medicines, note: str(o.note, 300) });
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message ? err.message : err).slice(0, 200) });
  }
}

export default async function handler(req, res) {
  if (req.query && req.query.upload === '1') return uploadBookHandler(req, res);
  if (req.query && req.query.apk === '1') return apkDownload(req, res);
  if (req.query && req.query.ilaj === '1') return ilajSave(req, res);
  if (req.query && req.query.banjh === '1') return banjhReport(req, res);
  if (req.query && req.query.rx === '1') return rxSwap(req, res);
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

// "بیماریاں اور علاج": مالک ویب سائٹ کے خانے میں جو مزاج/علاج لکھیں وہ ilaj.txt (GitHub) میں اسی بیماری کے نیچے محفوظ
// صرف مالک (خفیہ لنک والا براؤزر) — key ساتھ آتی ہے؛ GITHUB_TOKEN صرف Vercel میں
const ILAJ_FILE = 'ilaj.txt';
const ILAJ_KEY = process.env.ILAJ_KEY || 'owner-Bhatti786';
async function ilajSave(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'صرف POST' });
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: 'سرور پر GITHUB_TOKEN سیٹ نہیں' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (b.key !== ILAJ_KEY) return res.status(403).json({ error: 'اجازت نہیں' });
    // عارضی: کتاب کس صفحے پر دکھے (kitab-jagah.json) — بیماری کی تلاش / نسخہ سازی / میڈیکل
    if (b.jagah) {
      const fn = String(b.jagah.fileName || '').slice(0, 200), sec = String(b.jagah.sec || '');
      if (!fn || !['pdfmulti', 'naskhesaz', 'wajah', 'hikmat'].includes(sec)) return res.status(400).json({ error: 'غلط' });
      for (let attempt = 0; attempt < 4; attempt++) {
        let map = {}, sha;
        try { const f = await upGh('/contents/kitab-jagah.json?ref=' + BRANCH); sha = f.sha; map = JSON.parse(Buffer.from(f.content, 'base64').toString('utf8')) || {}; }
        catch (e) { if (e.status !== 404) throw e; }
        map[fn] = sec;
        try {
          await upGh('/contents/kitab-jagah.json', { method: 'PUT', body: JSON.stringify(Object.assign({
            message: 'کتاب کی جگہ: ' + fn + ' → ' + sec, branch: BRANCH,
            content: Buffer.from(JSON.stringify(map, null, 1) + '\n', 'utf8').toString('base64') }, sha ? { sha } : {})) });
          return res.status(200).json({ ok: true });
        } catch (e) { if ((e.status !== 409 && e.status !== 422) || attempt === 3) throw e; }
      }
    }
    let name = String(b.name || '').trim();
    if (!name || name.length > 120 || /[\r\n]/.test(name) || /^[#=]/.test(name)) return res.status(400).json({ error: 'غلط نام' });
    const clean = t => String(t || '').replace(/\r/g, '').split('\n').map(l => l.replace(/^\s*#+/, '').trimEnd()).join('\n').trim().slice(0, 4000);
    const blocks = (Array.isArray(b.blocks) ? b.blocks : []).slice(0, 12).map(x => ({ mizaj: clean(x && x.mizaj).replace(/\n/g, ' ').slice(0, 120), text: clean(x && x.text) })).filter(x => x.mizaj || x.text);
    const body = blocks.length
      ? blocks.map(x => 'مزاج: ' + x.mizaj + '\n' + x.text.split('\n').map((l, i) => (i === 0 ? 'علاج: ' + l : l)).join('\n')).join('\n')
      : 'مزاج:\nعلاج:';
    for (let attempt = 0; attempt < 4; attempt++) {
      const f = await upGh('/contents/' + ILAJ_FILE + '?ref=' + BRANCH);
      const lines = Buffer.from(f.content, 'base64').toString('utf8').split('\n');
      // 🔗 تعلق: "تعلق" والے حصے میں "* نسخہ => بیماری" (خالی = اپنی جگہ واپس)
      if (b.link !== undefined) {
        const to = String(b.link || '').trim();
        if (to.length > 120 || /[\r\n]|=>/.test(to)) return res.status(400).json({ error: 'غلط' });
        let h = lines.findIndex(l => /^=+\s*تعلق\s*=+$/.test(l.trim()));
        if (h < 0) { const g = lines.findIndex(l => /^=+/.test(l.trim())); h = g < 0 ? lines.length : g; lines.splice(h, 0, '==================== تعلق ====================', ''); }
        let e = h + 1;
        while (e < lines.length && !/^=+/.test(lines[e].trim())) e++;
        const sec = lines.slice(h + 1, e).filter(l => !(l.trim().startsWith('* ') && l.trim().replace(/^\*\s*/, '').split(/\s*=>\s*/)[0] === name));
        while (sec.length && !sec[sec.length - 1].trim()) sec.pop();
        if (to) sec.push('* ' + name + ' => ' + to);
        const next = lines.slice(0, h + 1).concat(sec, [''], lines.slice(e));
        try {
          await upGh('/contents/' + ILAJ_FILE, { method: 'PUT', body: JSON.stringify({
            message: 'تعلق: ' + name + ' → ' + (to || 'اپنی جگہ'), branch: BRANCH, sha: f.sha,
            content: Buffer.from(next.join('\n'), 'utf8').toString('base64') }) });
          return res.status(200).json({ ok: true });
        } catch (e2) { if ((e2.status !== 409 && e2.status !== 422) || attempt === 3) throw e2; continue; }
      }
      // ڈبہ ڈیلیٹ: "## نام" کا پورا حصہ، اسپیشل کی "* نام" لائن، اور "دیکھیں: نام" والے اشارے ہٹائیں
      if (b.remove === true) {
        if (!lines.some(l => l.trim() === '## ' + name)) return res.status(400).json({ error: 'یہ نام ilaj.txt میں نہیں ملا' });
        const out = [];
        for (let k = 0; k < lines.length; k++) {
          const t = lines[k].trim();
          if (t === '* ' + name) continue;
          if (t.startsWith('## ')) {
            let j = k + 1;
            while (j < lines.length && !/^(##\s|=+|#\s*-+)/.test(lines[j].trim())) j++;
            const sec = lines.slice(k + 1, j).map(x => x.trim()).filter(Boolean);
            const isPointer = sec.length === 1 && /^دیکھیں\s*:/.test(sec[0]) && sec[0].replace(/^دیکھیں\s*:\s*/, '') === name;
            if (t === '## ' + name || isPointer) { k = j - 1; continue; }
          }
          out.push(lines[k]);
        }
        await upGh('/contents/' + ILAJ_FILE, { method: 'PUT', body: JSON.stringify({
          message: 'ڈبہ ڈیلیٹ: ' + name, branch: BRANCH, sha: f.sha,
          content: Buffer.from(out.join('\n').replace(/\n{3,}/g, '\n\n'), 'utf8').toString('base64') }) });
        return res.status(200).json({ ok: true });
      }
      // نام بدلنا: "## پرانا" کو "## نیا"، اور اسپیشل/اشارے والی لائنیں بھی
      if (b.newName !== undefined) {
        const nn = String(b.newName || '').trim();
        if (!nn || nn.length > 120 || /[\r\n]/.test(nn) || /^[#=*]/.test(nn)) return res.status(400).json({ error: 'غلط نیا نام' });
        if (nn !== name) {
          if (lines.some(l => l.trim() === '## ' + nn)) return res.status(400).json({ error: 'یہ نام پہلے سے موجود ہے' });
          if (!lines.some(l => l.trim() === '## ' + name)) return res.status(400).json({ error: 'یہ نام ilaj.txt میں نہیں ملا' });
          for (let k = 0; k < lines.length; k++) {
            const t = lines[k].trim();
            if (t === '## ' + name) lines[k] = '## ' + nn;
            else if (t === '* ' + name) lines[k] = '* ' + nn;
            else if (/^دیکھیں\s*:/.test(t) && t.replace(/^دیکھیں\s*:\s*/, '') === name) lines[k] = 'دیکھیں: ' + nn;
          }
          name = nn;
        }
      }
      let i = lines.findIndex(l => l.trim() === '## ' + name);
      let next;
      if (typeof b.special === 'boolean') {
        // ⭐ اسپیشل / عام: "اسپیشل" والے حصے میں "* نام" کی لائن
        let h = lines.findIndex(l => /^=+\s*اسپیشل\s*=+$/.test(l.trim()));
        if (h < 0) { const g = lines.findIndex(l => /^=+/.test(l.trim())); h = g < 0 ? lines.length : g; lines.splice(h, 0, '==================== اسپیشل ====================', ''); }
        let e = h + 1;
        while (e < lines.length && !/^=+/.test(lines[e].trim())) e++;
        const sec = lines.slice(h + 1, e).filter(l => l.trim() !== '* ' + name);
        while (sec.length && !sec[sec.length - 1].trim()) sec.pop();
        if (b.special) sec.push('* ' + name);
        next = lines.slice(0, h + 1).concat(sec, [''], lines.slice(e));
      } else {
        // نیا نام: اپنے حصے ("نئے نسخے" یا "بیماری کے علاج") کے آخر میں؛ پہلے سے موجود نام کو "بیماری کے علاج" میں "* نام" سے جوڑیں
        const G = ['نئے نسخے', 'بیماری کے علاج'].includes(b.group) ? b.group : 'نئے نسخے';
        const work = lines.slice();
        let h = work.findIndex(l => new RegExp('^=+\\s*' + G + '\\s*=+$').test(l.trim()));
        if (h < 0) { while (work.length && !work[work.length - 1].trim()) work.pop(); work.push('', '==================== ' + G + ' ===================='); h = work.length - 1; }
        let e = h + 1;
        while (e < work.length && !/^=+/.test(work[e].trim())) e++;
        while (e > h + 1 && !work[e - 1].trim()) e--;
        const inGroup = work.slice(h + 1, e).some(l => l.trim() === '## ' + name || l.trim() === '* ' + name);
        if (i < 0) {
          if (!b.create || !blocks.length) return res.status(400).json({ error: 'یہ نام ilaj.txt میں نہیں ملا' });
          next = work.slice(0, e).concat(['', '## ' + name], body.split('\n'), [''], work.slice(e));
        } else {
          let j = i + 1;
          while (j < work.length && !/^(##\s|=+|#\s*-+)/.test(work[j].trim())) j++;
          const upd = work.slice(0, i + 1).concat(body.split('\n'), [''], work.slice(j));
          if (G === 'بیماری کے علاج' && !inGroup) {
            let h2 = upd.findIndex(l => /^=+\s*بیماری کے علاج\s*=+$/.test(l.trim()));
            let e2 = h2 + 1; while (e2 < upd.length && !/^=+/.test(upd[e2].trim())) e2++;
            while (e2 > h2 + 1 && !upd[e2 - 1].trim()) e2--;
            next = upd.slice(0, e2).concat(['* ' + name], upd.slice(e2));
          } else next = upd;
        }
      }
      try {
        await upGh('/contents/' + ILAJ_FILE, { method: 'PUT', body: JSON.stringify({
          message: 'علاج درج: ' + name, branch: BRANCH, sha: f.sha,
          content: Buffer.from(next.join('\n'), 'utf8').toString('base64') }) });
        return res.status(200).json({ ok: true });
      } catch (e) { if ((e.status !== 409 && e.status !== 422) || attempt === 3) throw e; }
    }
  } catch (e) {
    return res.status(e.status && e.status < 500 ? 400 : 500).json({ error: e.message || 'نامعلوم خرابی' });
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
