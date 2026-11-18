// ===== بانجھ پن — میاں بیوی کا کھاتہ (مرحلہ وار ٹیسٹ اور تشخیص) =====
// ریکارڈ صرف اسی فون میں (IndexedDB) — مریضوں کے نام اور رپورٹیں کبھی ویب سائٹ/GitHub پر نہیں جاتیں۔
// بیک اپ: "📤 بیک اپ" سے فائل بنتی ہے، "📥" سے واپس لگتی ہے۔ رپورٹ کی تصویر صرف پڑھنے کے لیے AI کو جاتی ہے (محفوظ نہیں ہوتی)۔
(function(){
  // ---------- ٹیسٹوں کی مرحلہ وار فہرست ----------
  // [id, انگریزی نام, اردو نام, یہ ٹیسٹ کیوں / نارمل حد]
  const TESTS = {
    m: [
      { st:'مرحلہ 1 — بنیادی ٹیسٹ (Basic)', items:[
        ['semen','Semen Analysis','مادہ منویہ کا ٹیسٹ','مرد کا سب سے پہلا اور اہم ٹیسٹ — سپرم کی تعداد، حرکت اور بناوٹ دیکھی جاتی ہے۔ 2 سے 5 دن پرہیز کے بعد۔ نارمل (WHO): مقدار 1.4ml+، تعداد 16 ملین/ml+، پروگریسو حرکت 30٪+، کل حرکت 42٪+، بناوٹ 4٪+، pH 7.2+'],
        ['urine_m','Urine R/E','پیشاب کا ٹیسٹ','پیشاب کی نالی کا انفیکشن، پس سیلز یا شوگر — یہ سپرم کو نقصان دیتے ہیں'],
        ['cbc_m','CBC','خون کا مکمل ٹیسٹ','خون کی کمی یا جسم میں انفیکشن تو نہیں'],
        ['sugar_m','HbA1c / Blood Sugar','شوگر کا ٹیسٹ','شوگر سے کمزوری، انزال کی خرابی اور سپرم کمزور ہوتے ہیں']
      ]},
      { st:'مرحلہ 2 — ہارمون (اگر سیمن خراب ہو)', items:[
        ['semen2','Repeat Semen Analysis','دوبارہ سیمن ٹیسٹ','پہلی رپورٹ خراب ہو تو 2–3 ماہ بعد تصدیق — ایک سپرم کو بن کر تیار ہونے میں تقریباً 3 ماہ لگتے ہیں، اس لیے علاج یا بیماری کا اثر رپورٹ میں 3 ماہ بعد نظر آتا ہے'],
        ['fsh_m','FSH','سپرم بنانے والا ہارمون','زیادہ ہو تو خصیہ کمزور ہے؛ کم ہو تو دماغی غدود (پچوٹری) سے حکم نہیں آ رہا'],
        ['lh_m','LH','ٹیسٹوسٹیرون بنانے کا حکم دینے والا ہارمون','FSH کے ساتھ دیکھا جاتا ہے کہ خرابی خصیے میں ہے یا دماغی غدود میں'],
        ['testo','Total Testosterone','مردانہ ہارمون (صبح 8–10 بجے)','کم ہو تو کمزوری، خواہش کی کمی اور سپرم کم۔ نارمل تقریباً 300–1000 ng/dl'],
        ['prl_m','Prolactin','پرولیکٹن ہارمون','زیادہ ہو تو ٹیسٹوسٹیرون کم، کمزوری اور سپرم کی کمی'],
        ['tsh_m','TSH','تھائیرائیڈ کا ٹیسٹ','تھائیرائیڈ کی کمی/زیادتی سے سپرم اور جنسی طاقت متاثر ہوتی ہے']
      ]},
      { st:'مرحلہ 3 — وجہ کی تلاش', items:[
        ['us_scrotal','Scrotal Ultrasound / Doppler','خصیوں کا الٹراساؤنڈ / ڈوپلر','ویریکوسیل (خصیے کی رگوں کا پھولنا) — سپرم کی کمی کی عام وجہ؛ خصیے کا سائز اور رکاوٹ'],
        ['semen_cs','Semen Culture & Sensitivity','سیمن کلچر','سیمن میں پس سیلز زیادہ ہوں تو انفیکشن کا جراثیم معلوم کرنا'],
        ['peu','Post-Ejaculatory Urine','انزال کے بعد پیشاب کا ٹیسٹ','سیمن کی مقدار بہت کم ہو تو دیکھا جاتا ہے کہ مادہ پیچھے مثانے میں تو نہیں جا رہا'],
        ['asa','Anti-Sperm Antibodies (MAR test)','سپرم کے خلاف اینٹی باڈیز','سپرم آپس میں چپکے ہوں (agglutination) تو']
      ]},
      { st:'مرحلہ 4 — ماہر کے ٹیسٹ', items:[
        ['dfi','Sperm DNA Fragmentation (DFI)','سپرم کے DNA کی ٹوٹ پھوٹ','رپورٹ نارمل ہو پھر بھی حمل نہ ہو، یا بار بار حمل ضائع ہو'],
        ['karyo_m','Karyotype','کروموسوم کا ٹیسٹ','سپرم بالکل نہ ہوں (Azoospermia) یا بہت ہی کم ہوں'],
        ['ymicro','Y-Chromosome Microdeletion','Y کروموسوم کا ٹیسٹ','Azoospermia یا شدید کمی میں — سپرم بننے کا جینیاتی مسئلہ']
      ]}
    ],
    f: [
      { st:'مرحلہ 1 — بنیادی ٹیسٹ (Basic)', items:[
        ['tvs','Pelvic / Transvaginal Ultrasound (TVS)','بچہ دانی اور بیضہ دانی کا الٹراساؤنڈ','رسولی (Fibroid)، سسٹ، PCOS، بچہ دانی کی بناوٹ، اور انڈوں کی تعداد (AFC)'],
        ['d2','Day 2–3 FSH, LH, Estradiol (E2)','ماہواری کے 2–3 دن کے ہارمون','انڈے بنانے والے ہارمون۔ FSH 10 سے کم بہتر؛ LH، FSH سے دگنا ہو تو PCOS کا شبہ'],
        ['amh','AMH (Anti-Müllerian Hormone)','انڈوں کا ذخیرہ','بیضہ دانی میں کتنے انڈے باقی ہیں۔ تقریباً 1–3.5 ng/ml نارمل؛ کم = ذخیرہ کم، بہت زیادہ = PCOS'],
        ['tsh_f','TSH','تھائیرائیڈ کا ٹیسٹ','تھائیرائیڈ کی خرابی سے انڈا نہیں بنتا اور حمل ضائع ہو سکتا ہے۔ حمل کے لیے 2.5 سے کم بہتر'],
        ['prl_f','Prolactin','پرولیکٹن ہارمون','زیادہ ہو تو انڈا نہیں بنتا اور ماہواری بے قاعدہ ہو جاتی ہے'],
        ['cbc_f','CBC / Hemoglobin','خون کا مکمل ٹیسٹ','خون کی کمی — حمل سے پہلے پوری ہونی چاہیے'],
        ['sugar_f','HbA1c / Blood Sugar','شوگر کا ٹیسٹ','شوگر اور انسولین کی مزاحمت PCOS کے ساتھ عام ہے'],
        ['prog21','Day-21 Progesterone (Mid-luteal)','انڈا بننے کی تصدیق کا ٹیسٹ','ماہواری آنے سے 7 دن پہلے (28 دن کے سائیکل میں 21واں دن)۔ 10 ng/ml سے زیادہ = انڈا بنا اور پھٹا (Ovulation)؛ کم = انڈا نہیں بن رہا']
      ]},
      { st:'مرحلہ 2 — نالیاں اور انفیکشن (ضروری — چاہے پہلا مرحلہ ٹھیک ہو)', always:true, items:[
        ['hvs','High Vaginal Swab (HVS)','ویجائنل سواب','HSG سے پہلے انفیکشن ختم ہونا ضروری — لیکوریا، بدبو، سوزش کا جراثیم معلوم کرنا'],
        ['hsg','HSG (Hysterosalpingography)','نالیوں کا ٹیسٹ (ماہواری کے دن 7–10)','فیلوپین نالیاں کھلی ہیں یا بند، اور بچہ دانی کے اندر کی بناوٹ'],
        ['rubella','Rubella IgG','روبیلا کا ٹیسٹ','حمل سے پہلے حفاظت — منفی ہو تو ٹیکہ لگوانا']
      ]},
      { st:'مرحلہ 3 — اگر انڈا نہ بنے / PCOS', items:[
        ['follicle','Follicular Tracking','انڈے کی نشوونما کا الٹراساؤنڈ','ماہواری کے 10ویں دن سے — انڈا 18–24mm بن کر پھٹتا ہے یا نہیں'],
        ['androgen','Testosterone / DHEA-S','مردانہ ہارمون (عورت میں)','چہرے پر بال، دانے، بے قاعدہ ماہواری — PCOS کی تصدیق'],
        ['vitd','Vitamin D','وٹامن ڈی','کمی سے انڈے کی کوالٹی اور حمل ٹھہرنے پر اثر']
      ]},
      { st:'مرحلہ 4 — ماہر کے ٹیسٹ', items:[
        ['sis','Saline Sonography / 3D Ultrasound','بچہ دانی کا خاص الٹراساؤنڈ','بچہ دانی کے اندر پولیپ، پردہ (Septum) یا چپکاؤ'],
        ['hysteroscopy','Hysteroscopy','بچہ دانی کے اندر کیمرے سے معائنہ','اندر کی رکاوٹ دیکھنا اور اسی وقت ٹھیک کرنا'],
        ['laparoscopy','Laparoscopy','پیٹ میں کیمرے سے معائنہ','اینڈومیٹریوسس، نالیوں کی رکاوٹ اور چپکاؤ']
      ]}
    ]
  };
  const SIDE = { m:'👨 مرد (شوہر)', f:'👩 عورت (بیوی)' };
  const ALL = {}; ['m','f'].forEach(s=> TESTS[s].forEach((g, gi)=> g.items.forEach(([id, en, ur, why])=> ALL[id] = { id, en, ur, why, name: en + ' (' + ur + ')', side:s, stage:gi })));
  const esc = s=> String(s == null ? '' : s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---------- فون میں محفوظ (IndexedDB) ----------
  let dbp = null;
  function db(){
    if(dbp) return dbp;
    dbp = new Promise((ok, no)=>{
      const r = indexedDB.open('banjhDB', 1);
      r.onupgradeneeded = ()=> r.result.createObjectStore('cases', { keyPath:'id' });
      r.onsuccess = ()=> ok(r.result); r.onerror = ()=> no(r.error);
    });
    return dbp;
  }
  async function all(){ const d = await db(); return new Promise((ok, no)=>{ const q = d.transaction('cases').objectStore('cases').getAll(); q.onsuccess = ()=> ok(q.result || []); q.onerror = ()=> no(q.error); }); }
  async function put(c){ c.updated = Date.now(); const d = await db(); return new Promise((ok, no)=>{ const t = d.transaction('cases', 'readwrite'); t.objectStore('cases').put(c); t.oncomplete = ()=> ok(); t.onerror = ()=> no(t.error); }); }
  async function del(id){ const d = await db(); return new Promise((ok, no)=>{ const t = d.transaction('cases', 'readwrite'); t.objectStore('cases').delete(id); t.oncomplete = ()=> ok(); t.onerror = ()=> no(t.error); }); }
  async function get(id){ return (await all()).find(c=> c.id === id); }

  let CUR = null, TAB = 'm';
  const root = ()=> document.getElementById('banjhRoot');
  const fmtD = t=> new Date(t).toLocaleDateString('en-GB');

  // ---------- کیسوں کی فہرست ----------
  async function list(){
    CUR = null;
    const el = root(); if(!el) return;
    let cases = [];
    try{ cases = (await all()).sort((a, b)=> (b.updated || 0) - (a.updated || 0)); }catch(e){ el.innerHTML = '<p style="color:#e0524f; text-align:center;">⚠ اس فون میں ریکارڈ محفوظ کرنے کی اجازت نہیں (پرائیویٹ موڈ؟)</p>'; return; }
    el.innerHTML = `<div class="bj-new">
        <input id="bjHus" class="search" placeholder="👨 شوہر کا نام">
        <input id="bjWife" class="search" placeholder="👩 بیوی کا نام">
        <button type="button" class="btn" onclick="banjhCreate()">➕ نیا کھاتہ بنائیں</button>
      </div>
      ${cases.length ? `<input id="bjFind" class="search" type="search" placeholder="🔍 نام سے کھاتہ تلاش کریں..." oninput="banjhFind()" style="display:block; width:100%; box-sizing:border-box; margin:10px 0;">` : ''}
      <div id="bjList">${cases.map(c=> card(c)).join('') || '<p style="text-align:center; color:var(--muted);">ابھی کوئی کھاتہ نہیں — اوپر میاں بیوی کے نام لکھ کر بنائیں۔</p>'}</div>
      <div class="bj-backup">
        <button type="button" class="btn secondary" onclick="banjhExport()">📤 بیک اپ فائل بنائیں</button>
        <label class="btn secondary" style="cursor:pointer;">📥 بیک اپ واپس لگائیں<input type="file" accept=".json,application/json" hidden onchange="banjhImport(this)"></label>
      </div>
      <p class="bj-note">🔒 یہ ریکارڈ صرف اسی فون میں محفوظ ہے، ویب سائٹ پر نہیں جاتا۔ فون بدلنے یا ایپ صاف کرنے سے پہلے "بیک اپ فائل" ضرور بنا لیں۔</p>`;
  }
  function counts(c, s){
    const t = (c[s] && c[s].tests) || {}; let ok = 0, bad = 0;
    Object.keys(t).forEach(k=>{ if(t[k].status === 'ok') ok++; else if(t[k].status === 'bad') bad++; });
    return { ok, bad };
  }
  function card(c){
    const m = counts(c, 'm'), f = counts(c, 'f');
    return `<div class="bj-case" data-q="${esc((c.husband + ' ' + c.wife).toLowerCase())}" onclick="banjhOpen('${c.id}')">
      <div class="bj-case-names">👨 ${esc(c.husband)} <span style="color:var(--muted);">&</span> 👩 ${esc(c.wife)}</div>
      <div class="bj-case-meta">مرد: <b class="ok">✔ ${m.ok}</b> <b class="bad">✖ ${m.bad}</b> · عورت: <b class="ok">✔ ${f.ok}</b> <b class="bad">✖ ${f.bad}</b> · ${fmtD(c.created)} سے</div>
    </div>`;
  }
  window.banjhFind = ()=>{
    const q = (document.getElementById('bjFind').value || '').trim().toLowerCase();
    document.querySelectorAll('#bjList .bj-case').forEach(x=> x.style.display = !q || x.dataset.q.includes(q) ? '' : 'none');
  };
  window.banjhCreate = async ()=>{
    const h = document.getElementById('bjHus').value.trim(), w = document.getElementById('bjWife').value.trim();
    if(!h || !w){ alert('شوہر اور بیوی دونوں کے نام لکھیں'); return; }
    const c = { id: 'c' + Date.now().toString(36), husband:h, wife:w, created:Date.now(), m:{ tests:{} }, f:{ tests:{} }, log:[] };
    await put(c);
    banjhOpen(c.id);
  };

  // ---------- ایک کھاتہ ----------
  window.banjhOpen = async (id)=>{
    const c = await get(id); if(!c) return list();
    CUR = c;
    render();
    window.scrollTo({ top: root().getBoundingClientRect().top + window.scrollY - 70 });
  };
  // اگلا ٹیسٹ: AI نے جو کہا وہ، ورنہ پہلے مرحلے کا جو ٹیسٹ ابھی نہیں ہوا
  function nextFor(c, s){
    const t = c[s].tests, sug = (c[s].next || []).filter(id=> ALL[id] && !(t[id] && t[id].status));
    if(sug.length) return sug;
    for(const g of TESTS[s]){
      const pend = g.items.filter(([id])=> !(t[id] && t[id].status));
      if(pend.length){
        // مرحلہ 2 سے آگے: صرف تب جب پچھلے مرحلے میں کچھ خراب ہو
        const gi = TESTS[s].indexOf(g);
        if(gi > 0 && !g.always && !Object.keys(t).some(k=> t[k].status === 'bad')) return [];
        return pend.map(([id])=> id);
      }
    }
    return [];
  }
  function sideHtml(c, s){
    const t = c[s].tests, nxt = new Set(nextFor(c, s));
    const order = TESTS[s].map(g=> g.items.map(([id])=> id)).flat();
    const okIds = order.filter(id=> t[id] && t[id].status === 'ok'), badIds = order.filter(id=> t[id] && t[id].status === 'bad');
    // ہو چکا ٹیسٹ: صاف رنگین نشان (✓ ٹھیک / ✗ خراب) — ٹیپ کر کے بدل سکتے ہیں
    const doneRow = id=>{
      const r = t[id], a = ALL[id], ok = r.status === 'ok';
      return `<div class="bj-done ${r.status}" onclick="banjhTest('${s}','${id}')"><span class="bj-pill ${r.status}">${ok ? '✓ ٹھیک' : '✗ خراب'}</span>
        <div class="bj-tb"><b class="bj-en" dir="ltr">${esc(a.en)}</b> <span class="bj-ur">— ${esc(a.ur)}</span>
        ${r.value ? `<div class="bj-val">${esc(r.value)}</div>` : ''}${r.note ? `<div class="bj-tn">${esc(r.note)}</div>` : ''}<div class="bj-hint">📅 ${fmtD(r.date || Date.now())}</div></div></div>`;
    };
    // علاج: AI کی بتائی بیماریاں؛ نہ ہوں تو خراب ٹیسٹوں کی خرابی
    let treat = (c[s].treat || []).slice();
    if(!treat.length) treat = badIds.map(id=> t[id].note || (ALL[id].en + ' خراب')).filter(Boolean);
    const stages = TESTS[s].map((g, gi)=>{
      const pend = g.items.filter(([id])=> !(t[id] && t[id].status));
      const doneN = g.items.length - pend.length;
      if(!pend.length) return `<div class="bj-stage"><div class="bj-st done">${gi === 0 ? '⭐ ' : ''}${esc(g.st)} — ✓ سب ٹیسٹ ہو گئے (اوپر)</div></div>`;
      const rows = pend.map(([id, en, ur, hint])=>{
        const icon = nxt.has(id) ? '<span class="bj-ic nx">👉</span>' : '<span class="bj-ic">○</span>';
        return `<div class="bj-test${nxt.has(id) ? ' nx' : ''}" onclick="banjhTest('${s}','${id}')">${icon}<div class="bj-tb">${gi === 0 ? '<span class="bj-basic">⭐ BASIC</span> ' : ''}<b class="bj-en" dir="ltr">${esc(en)}</b><div class="bj-ur">${esc(ur)}</div>
          ${hint ? `<div class="bj-hint">❓ کیوں: ${esc(hint)}</div>` : ''}</div></div>`;
      }).join('');
      return `<div class="bj-stage"><div class="bj-st">${gi === 0 ? '⭐ ' : ''}${esc(g.st)}${doneN ? ` <small>(${doneN} ہو گئے — اوپر)</small>` : ''}</div>${rows}</div>`;
    }).join('');
    const who = s === 'm' ? c.husband : c.wife;
    return `<div class="bj-side bj-${s}">
      <h3>${SIDE[s]} — ${esc(who)}</h3>
      <div class="bj-sum"><div class="bj-bh">📊 خلاصہ — کل ${order.length} ٹیسٹ</div>
        <div class="bj-cnt"><span class="ok">✓ ٹھیک: ${okIds.length}</span><span class="bad">✗ خراب: ${badIds.length}</span><span class="pd">⏳ باقی: ${order.length - okIds.length - badIds.length}</span></div>
        <div class="bj-chips">${okIds.map(id=> `<span class="bj-chip ok">✓ ${esc(ALL[id].en)}</span>`).join('')}${badIds.map(id=> `<span class="bj-chip bad">✗ ${esc(ALL[id].en)}</span>`).join('')}${!okIds.length && !badIds.length ? '<span class="bj-hint">ابھی کوئی ٹیسٹ نہیں ہوا</span>' : ''}</div>
      </div>
      ${okIds.length ? `<div class="bj-box ok"><div class="bj-bh">✅ ٹھیک ٹیسٹ — مکمل (${okIds.length})</div>${okIds.map(doneRow).join('')}</div>`
        : (badIds.length ? `<div class="bj-box ok"><div class="bj-bh">✅ ٹھیک ٹیسٹ — مکمل (0)</div><div class="bj-hint">ابھی کوئی ٹیسٹ ٹھیک نہیں آیا۔ جو ٹیسٹ رپورٹ میں نہیں تھے وہ نیچے "باقی" میں ہیں — ان کی رپورٹ بھیجیں یا ٹیسٹ پر ٹیپ کر کے خود ✓ لگائیں۔</div></div>` : '')}
      ${badIds.length ? `<div class="bj-box bad"><div class="bj-bh">❌ خراب ٹیسٹ (${badIds.length})</div>${badIds.map(doneRow).join('')}</div>` : ''}
      ${treat.length ? `<div class="bj-treat"><div class="bj-bh">🩺 اب ان بیماریوں کا علاج کریں:</div><ol>${treat.map(x=> `<li>${esc(x)}</li>`).join('')}</ol><div class="bj-hint">علاج کے بعد یہی ٹیسٹ دوبارہ کروا کر رپورٹ بھیجیں — ٹھیک ہو تو ✓ لگ جائے گا</div></div>` : ''}
      ${nxt.size ? `<div class="bj-next"><div class="bj-bh">👉 ${badIds.length ? 'ساتھ میں' : 'اب'} یہ ٹیسٹ کروائیں:</div><ol>${[...nxt].map(id=> `<li>${ALL[id].stage === 0 ? '⭐ ' : ''}<b class="bj-en" dir="ltr">${esc(ALL[id].en)}</b> — ${esc(ALL[id].ur)}</li>`).join('')}</ol></div>`
        : `<div class="bj-next done">✓ اس وقت کوئی نیا ٹیسٹ ضروری نہیں${treat.length ? ' — پہلے اوپر والا علاج کریں' : ''}</div>`}
      <label class="btn bj-up">📷 ${s === 'm' ? 'مرد' : 'عورت'} کی رپورٹ کی تصویر بھیجیں<input type="file" accept="image/*" multiple hidden onchange="banjhReport('${s}', this)"></label>
      <div id="bjStatus_${s}" class="bj-status"></div>
      <div class="bj-bh" style="margin-top:12px; color:var(--gold);">⏳ باقی ٹیسٹ (مرحلہ وار)</div>
      ${stages}
    </div>`;
  }
  function render(){
    const c = CUR, el = root(); if(!c || !el) return;
    const log = (c.log || []).slice().reverse();
    el.innerHTML = `<div style="text-align:center; margin-bottom:8px;"><button type="button" class="btn" onclick="banjhList()">⬅ تمام کھاتے</button></div>
      <div class="bj-head">👨 ${esc(c.husband)} <span style="color:var(--muted);">&</span> 👩 ${esc(c.wife)}<div class="bj-case-meta">کھاتہ: ${fmtD(c.created)} · آخری تبدیلی: ${fmtD(c.updated || c.created)}</div></div>
      <div class="bj-tabs"><button type="button" class="${TAB === 'm' ? 'on' : ''}" onclick="banjhTab('m')">👨 مرد</button><button type="button" class="${TAB === 'f' ? 'on' : ''}" onclick="banjhTab('f')">👩 عورت</button></div>
      <div class="bj-cols tab-${TAB}">${sideHtml(c, 'm')}${sideHtml(c, 'f')}</div>
      <h3 style="color:var(--gold); margin:18px 0 6px; text-align:center;">📒 مکمل ریکارڈ (${log.length})</h3>
      ${log.map(e=> `<div class="bj-log bj-${e.side}"><div class="bj-log-h">${e.side === 'm' ? '👨' : e.side === 'f' ? '👩' : '📝'} ${new Date(e.t).toLocaleString('en-GB')}</div>
        ${e.img ? `<img src="${e.img}" alt="رپورٹ" class="bj-thumb" onclick="this.classList.toggle('big')">` : ''}
        <div style="white-space:pre-wrap;">${esc(e.text)}</div></div>`).join('') || '<p style="text-align:center; color:var(--muted);">ابھی کوئی رپورٹ نہیں</p>'}
      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin:14px 0;">
        <button type="button" class="btn secondary" onclick="banjhNote()">📝 نوٹ لکھیں</button>
        <button type="button" class="btn secondary" onclick="banjhRename()">✏ نام درست کریں</button>
        <button type="button" class="btn secondary" style="color:#e0524f; border-color:#e0524f;" onclick="banjhDelete()">🗑 کھاتہ ڈیلیٹ</button>
      </div>`;
  }
  window.banjhList = list;
  window.banjhTab = s=>{ TAB = s; render(); };

  // ٹیسٹ پر ٹیپ: خود سے نتیجہ لکھیں
  window.banjhTest = async (s, id)=>{
    const c = CUR, r = c[s].tests[id] || {};
    const a = prompt(ALL[id].name + '\n\nنتیجہ لکھیں:\n1 = ✔ ٹھیک\n2 = ✖ خراب\n0 = ابھی نہیں ہوا (صاف کریں)\n\n(نمبر کے بعد چاہیں تو ویلیو/نوٹ بھی لکھیں، مثلاً: 2 سپرم 8 ملین)', r.status ? (r.status === 'ok' ? '1 ' : '2 ') + (r.value || '') : '');
    if(a === null) return;
    const m = a.trim().match(/^([012])\s*(.*)$/);
    if(!m){ alert('پہلے 1، 2 یا 0 لکھیں'); return; }
    if(m[1] === '0') delete c[s].tests[id];
    else c[s].tests[id] = { status: m[1] === '1' ? 'ok' : 'bad', value: m[2] || r.value || '', note: r.note || '', date: Date.now() };
    c[s].next = (c[s].next || []).filter(x=> x !== id);
    c.log.push({ t:Date.now(), side:s, text: ALL[id].name + ': ' + (m[1] === '0' ? 'صاف کیا' : (m[1] === '1' ? '✔ ٹھیک' : '✖ خراب') + (m[2] ? ' — ' + m[2] : '')) + ' (خود لکھا)' });
    await put(c); render();
  };
  window.banjhNote = async ()=>{
    const n = prompt('نوٹ لکھیں (مثلاً کون سا علاج شروع کیا):'); if(!n || !n.trim()) return;
    CUR.log.push({ t:Date.now(), side:'', text:'📝 ' + n.trim() }); await put(CUR); render();
  };
  window.banjhRename = async ()=>{
    const h = prompt('شوہر کا نام:', CUR.husband); if(h === null) return;
    const w = prompt('بیوی کا نام:', CUR.wife); if(w === null) return;
    if(h.trim()) CUR.husband = h.trim(); if(w.trim()) CUR.wife = w.trim();
    await put(CUR); render();
  };
  window.banjhDelete = async ()=>{
    if(!confirm('"' + CUR.husband + ' & ' + CUR.wife + '" کا پورا کھاتہ ہمیشہ کے لیے ڈیلیٹ کر دیں؟')) return;
    await del(CUR.id); list();
  };

  // ---------- رپورٹ کی تصویر → AI ----------
  function shrink(file, max, q){
    return new Promise((ok, no)=>{
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = ()=>{ const k = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(u); ok(cv.toDataURL('image/jpeg', q)); };
      img.onerror = ()=>{ URL.revokeObjectURL(u); no(new Error('تصویر نہیں کھلی')); };
      img.src = u;
    });
  }
  window.banjhReport = async (s, input)=>{
    const files = Array.from(input.files || []).slice(0, 3); input.value = '';
    if(!files.length) return;
    const c = CUR, st = document.getElementById('bjStatus_' + s);
    const say = (t, col)=>{ const e = document.getElementById('bjStatus_' + s); if(e){ e.style.color = col || 'var(--muted)'; e.textContent = t; } };
    if(!navigator.onLine){ say('📶 رپورٹ پڑھنے کے لیے انٹرنیٹ آن کریں', '#e0524f'); return; }
    say('⏳ رپورٹ پڑھی جا رہی ہے... (آدھا منٹ لگ سکتا ہے)');
    let images, thumbs;
    try{ images = await Promise.all(files.map(f=> shrink(f, 1600, .82))); thumbs = await Promise.all(files.map(f=> shrink(f, 500, .6))); }
    catch(e){ say('⚠ ' + e.message, '#e0524f'); return; }
    const tests = TESTS[s].map((g, gi)=> g.items.map(([id, en, ur, hint])=> ({ id, name: en + ' — ' + ur, stage: gi + 1, hint }))).flat();
    const done = Object.keys(c[s].tests).map(id=> ({ id, name: ALL[id] ? ALL[id].name : id, status: c[s].tests[id].status, value: c[s].tests[id].value }));
    let d = null;
    try{
      const r = await fetch('/api/notify-disease?banjh=1', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ side: s, images, tests, done }) });
      d = await r.json().catch(()=> ({}));
      if(!r.ok || d.error){ say('⚠ ' + (d.error || ('خرابی ' + r.status)), '#e0524f'); return; }
    }catch(e){ say('⚠ انٹرنیٹ کا مسئلہ — دوبارہ کوشش کریں', '#e0524f'); return; }
    const lines = [];
    (d.results || []).forEach(x=>{
      if(!ALL[x.id] || ALL[x.id].side !== s) return;
      if(x.status !== 'ok' && x.status !== 'bad') return;
      c[s].tests[x.id] = { status: x.status, value: x.value || '', note: x.note || '', date: Date.now() };
      lines.push((x.status === 'ok' ? '✔ ' : '✖ ') + ALL[x.id].name + (x.value ? ': ' + x.value : '') + (x.note ? ' — ' + x.note : ''));
    });
    (d.other || []).forEach(x=> lines.push('• ' + x.name + (x.value ? ': ' + x.value : '') + (x.note ? ' — ' + x.note : '')));
    if(Array.isArray(d.treat)) c[s].treat = d.treat;
    c[s].next = (d.next || []).filter(id=> ALL[id] && ALL[id].side === s);
    const text = (d.summary ? d.summary + '\n' : '') + lines.join('\n')
      + (c[s].treat.length ? '\n🩺 علاج کریں: ' + c[s].treat.join('، ') : '')
      + (c[s].next.length ? '\n👉 اگلا ٹیسٹ: ' + c[s].next.map(id=> ALL[id].name).join('، ') : '');
    thumbs.forEach((img, i)=> c.log.push({ t: Date.now() + i, side: s, img, text: i === thumbs.length - 1 ? text : '(رپورٹ کا صفحہ ' + (i + 1) + ')' }));
    await put(c);
    render();
    say(lines.length ? '✅ رپورٹ پڑھ لی — نتیجہ اوپر لگ گیا' : '⚠ اس تصویر میں فہرست کا کوئی ٹیسٹ صاف نہیں پڑھا جا سکا — صاف تصویر بھیجیں یا ٹیسٹ پر ٹیپ کر کے خود لکھیں', lines.length ? 'var(--leaf)' : '#c9821b');
  };

  // ---------- بیک اپ ----------
  window.banjhExport = async ()=>{
    const cases = await all();
    const blob = new Blob([JSON.stringify({ app:'banjh', v:1, at:Date.now(), cases })], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'banjh-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  };
  window.banjhImport = async (input)=>{
    const f = input.files && input.files[0]; input.value = ''; if(!f) return;
    try{
      const j = JSON.parse(await f.text());
      if(!j || j.app !== 'banjh' || !Array.isArray(j.cases)) throw new Error('یہ بیک اپ فائل نہیں');
      const have = new Map((await all()).map(c=> [c.id, c]));
      let n = 0;
      for(const c of j.cases){ if(!c || !c.id) continue; const o = have.get(c.id); if(!o || (c.updated || 0) >= (o.updated || 0)){ const u = c.updated; await put(c); c.updated = u; n++; } }
      alert('✅ ' + n + ' کھاتے واپس لگ گئے'); list();
    }catch(e){ alert('⚠ ' + e.message); }
  };

  // ---------- انداز ----------
  const css = document.createElement('style');
  css.textContent = `
  .bj-new{display:grid; grid-template-columns:1fr 1fr; gap:8px;}
  .bj-new .btn{grid-column:1 / -1;}
  .bj-new input{width:100%; box-sizing:border-box;}
  .bj-case{border:1px solid var(--border); border-right:5px solid var(--gold); border-radius:12px; padding:10px 12px; margin:8px 0; background:var(--card); cursor:pointer;}
  .bj-case-names{font-weight:700; color:var(--gold); font-size:1.05rem;}
  .bj-case-meta{font-size:.78rem; color:var(--muted); margin-top:2px;}
  .bj-case-meta .ok, .bj-ic.ok{color:#1f9d55;} .bj-case-meta .bad, .bj-ic.bad{color:#e0524f;}
  .bj-backup{display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:14px;}
  .bj-note{font-size:.78rem; color:var(--muted); text-align:center; margin-top:8px;}
  .bj-head{text-align:center; font-weight:700; color:var(--gold); font-size:1.15rem;}
  .bj-tabs{display:none; gap:6px; margin:10px 0;}
  .bj-tabs button{flex:1; padding:8px; border-radius:20px; border:1px solid var(--gold); background:var(--card); color:var(--gold); font-family:inherit; font-size:1rem;}
  .bj-tabs button.on{background:var(--gold); color:#fff;}
  .bj-cols{display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;}
  @media (max-width:760px){ .bj-tabs{display:flex;} .bj-cols{grid-template-columns:1fr;} .bj-cols.tab-m .bj-f, .bj-cols.tab-f .bj-m{display:none;} }
  .bj-side{border:1px solid var(--border); border-radius:12px; padding:8px; background:var(--card);}
  .bj-side h3{color:var(--gold); text-align:center; margin:2px 0 8px; font-size:1.05rem;}
  .bj-m{border-top:4px solid #2b6cb0;} .bj-f{border-top:4px solid #c05680;}
  .bj-next{background:rgba(201,130,27,.12); border:1px solid #c9821b; border-radius:10px; padding:6px 10px; font-size:.88rem; margin-bottom:6px;}
  .bj-next.done{background:rgba(31,157,85,.1); border-color:#1f9d55; color:#1f9d55;}
  .bj-treat{background:rgba(224,82,79,.08); border:1px solid #e0524f; border-radius:10px; padding:6px 10px; font-size:.88rem; margin-bottom:6px;}
  .bj-treat ul{margin:4px 18px 0 0; padding:0;}
  .bj-up{display:block; text-align:center; margin:8px 0; cursor:pointer;}
  .bj-status{font-size:.85rem; text-align:center; min-height:1em;}
  .bj-st{background:var(--gold); color:#fff; border-radius:8px; padding:3px 10px; font-size:.82rem; margin:10px 0 4px;}
  .bj-test{display:flex; gap:8px; align-items:flex-start; padding:7px 6px; border-bottom:1px dashed var(--border); cursor:pointer; font-size:.88rem;}
  .bj-test.ok{background:rgba(31,157,85,.08);} .bj-test.bad{background:rgba(224,82,79,.08);} .bj-test.nx{background:rgba(201,130,27,.1);}
  .bj-en{font-family:Poppins, Arial, sans-serif; font-size:.95rem; display:inline-block; direction:ltr; unicode-bidi:isolate;}
  .bj-sum{border:2px solid var(--gold); border-radius:10px; padding:6px 8px; margin-bottom:8px; background:var(--card);}
  .bj-cnt{display:flex; gap:6px; flex-wrap:wrap; margin:4px 0;}
  .bj-cnt span{border-radius:12px; padding:1px 10px; font-weight:700; font-size:.85rem; color:#fff;}
  .bj-cnt .ok{background:#1f9d55;} .bj-cnt .bad{background:#e0524f;} .bj-cnt .pd{background:#8a8a8a;}
  .bj-chips{display:flex; flex-wrap:wrap; gap:4px;}
  .bj-chip{font-family:Poppins, Arial, sans-serif; direction:ltr; font-size:.75rem; border-radius:10px; padding:1px 8px; border:1px solid;}
  .bj-chip.ok{color:#1f9d55; border-color:#1f9d55; background:rgba(31,157,85,.08);} .bj-chip.bad{color:#e0524f; border-color:#e0524f; background:rgba(224,82,79,.07);}
  .bj-box{border-radius:10px; padding:6px 8px; margin-bottom:8px;}
  .bj-box.ok{background:rgba(31,157,85,.08); border:2px solid #1f9d55;}
  .bj-box.bad{background:rgba(224,82,79,.07); border:2px solid #e0524f;}
  .bj-bh{font-weight:700; font-size:.92rem; margin-bottom:4px;}
  .bj-box.ok .bj-bh{color:#1f9d55;} .bj-box.bad .bj-bh{color:#e0524f;}
  .bj-done{display:flex; gap:8px; align-items:flex-start; padding:6px 2px; border-top:1px dashed var(--border); cursor:pointer; font-size:.86rem;}
  .bj-pill{flex:0 0 auto; color:#fff; font-weight:700; font-size:.8rem; border-radius:12px; padding:1px 9px; margin-top:2px; white-space:nowrap;}
  .bj-pill.ok{background:#1f9d55;} .bj-pill.bad{background:#e0524f;}
  .bj-done.ok .bj-tn{color:#1f9d55;}
  .bj-treat ol, .bj-next ol{margin:4px 22px 0 0; padding:0;}
  .bj-st.done{background:#1f9d55;}
  .bj-basic{display:inline-block; background:#c9821b; color:#fff; font-size:.7rem; font-weight:700; border-radius:10px; padding:0 7px; margin-left:4px; direction:ltr;}
  .bj-ur{color:var(--gold); font-size:.85rem;}
  .bj-next ol{margin:4px 22px 0 0; padding:0;} .bj-next li{margin:2px 0;}
  .bj-ic{flex:0 0 22px; text-align:center; font-weight:700; font-size:1.05rem; color:var(--muted);}
  .bj-tb{flex:1;} .bj-val{color:var(--text); font-size:.82rem;} .bj-tn{color:#b03a37; font-size:.8rem;} .bj-hint{color:var(--muted); font-size:.75rem;}
  .bj-test.ok .bj-tn{color:#1f9d55;}
  .bj-log{border:1px solid var(--border); border-radius:10px; padding:8px; margin:6px 0; background:var(--card); font-size:.86rem; line-height:1.9;}
  .bj-log.bj-m{border-right:4px solid #2b6cb0;} .bj-log.bj-f{border-right:4px solid #c05680;}
  .bj-log-h{color:var(--muted); font-size:.75rem;}
  .bj-thumb{max-width:110px; border-radius:6px; float:left; margin:0 0 4px 8px; cursor:zoom-in;}
  .bj-thumb.big{max-width:100%; float:none; display:block; margin:6px auto;}
  `;
  document.head.appendChild(css);

  window.banjhInit = ()=>{ if(!CUR) list(); };
})();
