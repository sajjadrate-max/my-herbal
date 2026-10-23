// Vercel Serverless Function
// Route: POST /api/disease-detail
//
// ایک بیماری/علامت کی مکمل تفصیل — ہر طریقۂ علاج کے مطابق الگ الگ: یہ کیوں ہوتی ہے، وجوہات، علامات، علاج کا اصول۔
// قانون مفرد اعضاء کی تحریک سائٹ خود بھیجتی ہے (کتاب سے) — AI اسے نہیں بدلتا۔ کتابوں کے جو اقتباسات (متن) سائٹ
// کے پاس ہیں وہ بھی ساتھ آتے ہیں تاکہ یونانی/مفرد اعضاء کا حصہ انہی کے مطابق رہے۔
// درخواست: { name, otherNames[], organ, tehreek[], excerpts:[{book,page,text}] }
// جواب: { summary, systems:[{key,title,why,causes[],signs[],principle,remedies[{name,when}],tests[],diet,caution}], warning }
//
// اہم: OPENAI_API_KEY صرف Vercel کے Environment Variables میں — کبھی براؤزر کوڈ میں نہیں۔

export const maxDuration = 60;

const SYSTEMS = [
  ['mufrad', 'قانون مفرد اعضاء'],
  ['unani', 'طب یونانی'],
  ['allo', 'ایلوپیتھک (انگریزی طب)'],
  ['medical', 'میڈیکل تشخیص (ٹیسٹ اور ڈاکٹر)'],
  ['homeo', 'ہومیوپیتھی'],
  ['biochemic', 'بائیوکیمک'],
  ['ayurveda', 'آیوروید']
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'صرف POST request قبول ہے۔' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'سرور پر OPENAI_API_KEY سیٹ نہیں ہے۔' });

  try {
    const b = req.body || {};
    const str = (x, n) => String(x || '').replace(/<[^>]+>/g, '').trim().slice(0, n);
    const name = str(b.name, 120);
    if (!name) return res.status(400).json({ error: 'بیماری کا نام فراہم نہیں کیا گیا۔' });
    const other = (Array.isArray(b.otherNames) ? b.otherNames : []).map(x => str(x, 60)).filter(Boolean).slice(0, 10);
    const organ = str(b.organ, 60);
    const tehreek = (Array.isArray(b.tehreek) ? b.tehreek : []).map(x => str(x, 40)).filter(Boolean).slice(0, 6);
    const excerpts = (Array.isArray(b.excerpts) ? b.excerpts : []).slice(0, 8)
      .map(e => ({ book: str(e && e.book, 100), page: str(e && e.page, 10), text: str(e && e.text, 1200) }))
      .filter(e => e.book && e.text);

    const system = `آپ طب یونانی، قانون مفرد اعضاء (حکیم صابر ملتانی)، ہومیوپیتھی، بائیوکیمک، آیوروید اور جدید ایلوپیتھک طب کے ماہر استاد ہیں اور آسان اردو میں سمجھاتے ہیں۔ یہ حکیموں کے لیے طبی ویب سائٹ ہے؛ جسم کے پوشیدہ اعضاء اور جنسی امراض کی بات بھی صاف طبی انداز میں کریں۔
کام: دی گئی بیماری/علامت کی تفصیل ہر طریقۂ علاج کے مطابق الگ الگ لکھیں — یہ کیوں ہوتی ہے، کیا کیا وجوہات ہو سکتی ہیں، پہچان کی علامات، اور اس طب میں علاج کا اصول۔
طریقے (اسی ترتیب اور انہی keys کے ساتھ): ${SYSTEMS.map(s => s[0] + '=' + s[1]).join('، ')}
اصول:
1) mufrad: تحریک وہی لکھیں جو "سائٹ کی تحریک" میں دی گئی ہے — اسے ہرگز نہ بدلیں۔ وضاحت کریں کہ کون سا عضو (اعصاب/عضلات/غدد) تیز ہے، کون سا ضعیف، اور علاج کا اصول (کس تحریک کی طرف لے جانا ہے)۔ کتاب کے اقتباسات ہوں تو انہی کی بات کو ترجیح دیں۔
2) unani: اخلاط (صفرا، بلغم، سودا، خون) اور سوء مزاج کے مطابق اسباب (سبب فاعلی/مادی وغیرہ جہاں مناسب)، اور اصول علاج (تنقیہ، تعدیل وغیرہ)۔
3) allo: جدید طب میں اس کی وجوہات (انفیکشن، ہارمون، سوزش، وراثت، طرز زندگی وغیرہ) اور جسم میں کیا خرابی ہوتی ہے۔ دوا کے برانڈ نہ لکھیں۔
4) medical: کون سے ٹیسٹ (tests میں)، کس ماہر ڈاکٹر کو دکھائیں، اور خطرے کی وہ علامات جن پر فوراً ہسپتال جانا چاہیے (caution میں)۔
5) homeo اور biochemic: remedies میں 3 سے 6 مشہور دوائیں انگریزی نام کے ساتھ (مثلاً "Nux Vomica 30" یا "Kali Mur 6X") اور ہر ایک کب دی جاتی ہے (when)۔ ayurveda: دوشا (وات، پت، کف) کے مطابق وجہ اور مشہور جڑی بوٹیاں remedies میں۔
6) ہر طریقے میں: why (2 سے 4 جملے)، causes (4 سے 10 مختصر وجوہات)، signs (3 سے 8 علامات)، principle (علاج کا اصول، 1 سے 3 جملے)، diet (پرہیز/غذا ایک جملہ، جہاں مناسب)۔ جو خانہ اس طب میں لاگو نہ ہو وہ خالی چھوڑ دیں۔
7) صرف معروف، درست طبی معلومات — اندازے یا گھڑی ہوئی باتیں نہیں۔ اگر یہ نام کسی واضح بیماری کا نہیں تو جو عام طور پر مراد ہوتا ہے اسی کو لیں۔
8) سب کچھ اردو رسم الخط میں (صرف ہومیو/بائیوکیمک دواؤں اور ٹیسٹوں کے نام انگریزی حروف میں)۔
صرف JSON: {"summary":"2 سے 3 جملوں میں یہ کیا ہے","systems":[{"key":"mufrad","why":"...","causes":["..."],"signs":["..."],"principle":"...","remedies":[{"name":"...","when":"..."}],"tests":["..."],"diet":"...","caution":"..."}],"warning":"خطرے کی علامات ایک جملے میں (اگر ہوں)"}`;

    const user = `بیماری/علامت: "${name}"`
      + (other.length ? `\nدوسرے نام: ${other.join('، ')}` : '')
      + (organ ? `\nعضو: ${organ}` : '')
      + `\nسائٹ کی تحریک (قانون مفرد اعضاء): ${tehreek.length ? tehreek.join('، ') : 'کتاب میں مقرر نہیں — علامات کے مطابق ممکنہ تحریکیں بتائیں'}`
      + (excerpts.length ? '\n\nسائٹ کی کتابوں کے اقتباسات:\n' + excerpts.map((e, i) => `--- ${i + 1}) ${e.book}، صفحہ ${e.page} ---\n${e.text}`).join('\n') : '');

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });
    if (!r.ok) return res.status(502).json({ error: 'OpenAI API سے جواب نہیں ملا۔', details: await r.text().catch(() => '') });
    const data = await r.json();
    let out = {};
    try { out = JSON.parse((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '{}'); } catch (e) { out = {}; }
    const list = (a, n, len) => (Array.isArray(a) ? a : []).map(x => str(x, len || 160)).filter(Boolean).slice(0, n);
    const byKey = {};
    (Array.isArray(out.systems) ? out.systems : []).forEach(s => { if (s && s.key) byKey[String(s.key)] = s; });
    const systems = SYSTEMS.map(([key, title]) => {
      const s = byKey[key] || {};
      return {
        key, title,
        why: str(s.why, 800), causes: list(s.causes, 12), signs: list(s.signs, 10),
        principle: str(s.principle, 600), diet: str(s.diet, 300), caution: str(s.caution, 400),
        tests: list(s.tests, 10, 80),
        remedies: (Array.isArray(s.remedies) ? s.remedies : []).slice(0, 8)
          .map(x => ({ name: str(x && x.name, 60), when: str(x && x.when, 200) })).filter(x => x.name)
      };
    }).filter(s => s.why || s.causes.length || s.principle);
    return res.status(200).json({ summary: str(out.summary, 600), systems, warning: str(out.warning, 400) });
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
