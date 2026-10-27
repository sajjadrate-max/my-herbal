// Vercel Serverless Function
// Route: POST /api/upload-book
//
// عارضی نظام: ویب سائٹ سے نئی PDF کتابیں سب کے لیے شامل کرنا (صارف کی ہدایت پر بغیر پاس ورڈ؛
// تمام کتابیں اپ لوڈ ہو جانے کے بعد یہ فائل اور herbal.html میں "نئی کتاب شامل کریں" والا حصہ ہٹا دینا ہے)۔
//
// Vercel ایک درخواست میں ~4.5MB سے بڑا ڈیٹا قبول نہیں کرتا، اس لیے براؤزر بڑی PDF کو چھوٹے حصوں
// (ہر حصہ ایک مکمل PDF) میں توڑ کر ایک ایک حصہ بھیجتا ہے:
//   1) { action:'blob', kind:'pdf'|'json', content:<base64> }  → GitHub پر blob بنتا ہے، اس کا sha واپس
//   2) { action:'commit', title, files:[{ path, sha }] }        → سب حصے + کتاب کا متن ایک ہی commit میں
//      books/ فولڈر میں شامل ہوتے ہیں اور books/uploads.json (ترتیب کی فہرست) کے آخر میں اندراج ہوتا ہے
//
// اہم: GITHUB_TOKEN کبھی کلائنٹ کوڈ میں نہیں — صرف Vercel کے Environment Variables میں
// (GitHub fine-grained token، صرف اسی ریپو پر Contents: Read and write)

const REPO = process.env.GITHUB_REPO || 'sajjadrate-max/my-herbal';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const MANIFEST = 'books/uploads.json';
const MAX_B64 = 4300000;
const PDF_PATH = /^books\/up_[A-Za-z0-9_]{1,80}(_part\d{1,3})?\.pdf$/;
const JSON_PATH = /^books\/pm-data-up-[a-z0-9_-]{1,80}\.json$/;

async function gh(path, opts = {}) {
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
  const b = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content, encoding: 'base64' }) });
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
    const ref = await gh('/git/ref/heads/' + BRANCH);
    const head = await gh('/git/commits/' + ref.object.sha);
    let manifest = [];
    try {
      const m = await gh('/contents/' + MANIFEST + '?ref=' + ref.object.sha);
      manifest = JSON.parse(Buffer.from(m.content, 'base64').toString('utf8'));
      if (!Array.isArray(manifest)) manifest = [];
    } catch (e) { if (e.status !== 404) throw e; }
    const dataPath = dataFiles[0].path;
    if (manifest.some(x => x && x.data === dataPath)) throw new Error('یہ کتاب پہلے سے شامل ہے');
    manifest.push({ data: dataPath, title: String(title || '').slice(0, 200), addedAt: Date.now() });
    const tree = await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: head.tree.sha,
        tree: files.map(f => ({ path: f.path, mode: '100644', type: 'blob', sha: f.sha })).concat([
          { path: MANIFEST, mode: '100644', type: 'blob', content: JSON.stringify(manifest, null, 1) + '\n' }
        ])
      })
    });
    const commit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: 'Add book via website upload: ' + String(title || dataPath).slice(0, 120), tree: tree.sha, parents: [ref.object.sha] })
    });
    try {
      await gh('/git/refs/heads/' + BRANCH, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
      return commit.sha;
    } catch (e) {
      if (e.status !== 422 || attempt === 3) throw e;
    }
  }
}

export default async function handler(req, res) {
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
    if (body.action === 'commit') {
      return res.status(200).json({ commit: await commitFiles(body.title, body.files) });
    }
    return res.status(400).json({ error: 'غلط درخواست' });
  } catch (e) {
    return res.status(e.status && e.status < 500 ? 400 : 500).json({ error: e.message || 'نامعلوم خرابی' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };
