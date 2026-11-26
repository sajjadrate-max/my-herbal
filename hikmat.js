// ===== حکمت کورس: دونوں کلاسوں کی کتاب — فہرست، تلاش، اور اصل صفحات (جیسے لکھے گئے) =====
(function(){
  let DATA = null, CI = 0, PAGE = 1, DOCS = {}, ZOOM = 1, rendering = false;
  const $ = id=> document.getElementById(id);
  const esc = s=> String(s == null ? '' : s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s=> String(s || '').toLowerCase().replace(/[ً-ٰٟ‌]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ه/g, 'ہ').replace(/لا|ال/g, '#').replace(/\s+/g, ' ');
  async function load(){
    if(DATA) return DATA;
    const r = await fetch('/hikmat-data.json'); DATA = await r.json(); return DATA;
  }
  // کورس میں منتقل کی گئی مزید کتابیں (جیسے فون والی) — بالکل کلاسوں کی طرح: ٹیب، فہرست، تلاش، اصل صفحات
  const XC = {};
  function extras(){
    let lib = typeof herbalBooksFor === 'function' ? herbalBooksFor('hikmat') : [];
    // ترتیب: شاہد منظور والا کورس سب سے اوپر، پھر لیکچر نمبر کے حساب سے (تیسرا، 5، 6، دسواں...)
    const rank = f=> rankT(f.title || f.fileName);
    lib = lib.slice().sort((a, b)=> rank(a) - rank(b));
    return lib.map(f=>{
      const n = Math.max((f.pdfDoc && f.pdfDoc.numPages) || 0, ...(f.pages || []).map(p=> p.pageNum || 0), (f.pages || []).length);
      let x = XC[f.fileName];
      if(!x || x.pages !== n){
        const text = Array.from({ length: n }, ()=> '');
        (f.pages || []).forEach((p, i)=>{ const k = (p.pageNum || i + 1) - 1; if(k >= 0 && k < n) text[k] = p.text || ''; });
        const t = autoToc(text);
        x = XC[f.fileName] = { title: f.title || f.fileName.replace(/\.pdf$/i, ''), extra: true, entry: f, pages: n, text, toc: t.toc, tocMax: t.tocMax };
      }
      x.entry = f; return x;
    });
  }
  function all(){ return (DATA || []).concat(extras()); }
  // کتاب کے اپنے فہرست والے صفحات سے موضوعات (عنوان ----- صفحہ) نکالیں، پھر صفحہ نمبر کو PDF کے صفحے سے ملائیں
  function autoToc(text){
    const lim = Math.min(text.length, 20), found = []; let tocMax = 0;
    const clean = x=> x.replace(/^\s*فہرست\s*(مضامین)?\s*/, '').replace(/^[\s—–\-:.،]+|[\s—–\-:.،]+$/g, '').replace(/\s+/g, ' ').trim();
    for(let i = 0; i < lim; i++){
      // ڈیش/نقطوں کی لکیر سے ٹکڑے: یا تو "عنوان 17" (نمبر آخر میں) یا "17 عنوان" (نمبر شروع میں، پچھلے عنوان کا)
      const ch = (text[i] || '').split(/[-–—_.…ـ]{4,}/);
      let end = 0, start = 0; ch.forEach(c=>{ if(/\d{1,3}\s*$/.test(c)) end++; if(/^\s*\d{1,3}(?!\d)/.test(c)) start++; });
      const got = [];
      if(end >= start) ch.forEach(c=>{ const m = c.match(/([^\d]*?)\s*[—–]?\s*(\d{1,3})\s*$/); if(m) got.push([clean(m[1]), +m[2]]); });
      else for(let k = 1; k < ch.length; k++){ const m = ch[k].match(/^\s*(\d{1,3})(?!\d)/), prev = ch[k - 1].replace(/^\s*\d{1,3}(?!\d)/, ''); if(m) got.push([clean(prev), +m[1]]); }
      const ok = got.filter(([ti, p])=> ti.length >= 3 && ti.length <= 90 && p > 0);
      if(ok.length >= 3){ found.push(...ok); tocMax = i + 1; }
    }
    if(!found.length) return { toc: [], tocMax: 0 };
    // چھپے ہوئے صفحہ نمبر اور PDF صفحے کا فرق: پہلے ہر صفحے کے اوپر/نیچے لکھا نمبر دیکھیں
    const hv = {}; let hn = 0;
    for(let k = tocMax; k < text.length; k++){
      const t = text[k] || '', nums = (t.slice(0, 40) + ' ' + t.slice(-25)).match(/\d{1,3}/g) || [];
      const ds = new Set(nums.map(n=> k + 1 - +n).filter(d=> Math.abs(d) <= 40)); ds.forEach(d=> hv[d] = (hv[d] || 0) + 1); hn++;
    }
    let off = 0, best = 0; Object.keys(hv).forEach(d=>{ if(hv[d] > best){ best = hv[d]; off = +d; } });
    if(best < hn * 0.3){
      // نمبر نہ ملیں تو عنوانات کو کتاب میں ڈھونڈ کر (ہر عنوان کا قریب ترین مقام)
      const votes = {}; off = 0; best = 0;
      found.forEach(([ti, p])=>{
        const q = norm(ti).trim(); if(q.length < 6) return;
        let bd = null;
        for(let k = tocMax; k < text.length; k++) if(norm(text[k]).includes(q)){ const d = k + 1 - p; if(Math.abs(d) <= 40 && (bd === null || Math.abs(d) < Math.abs(bd))) bd = d; }
        if(bd !== null) votes[bd] = (votes[bd] || 0) + 1;
      });
      Object.keys(votes).forEach(d=>{ if(votes[d] > best){ best = votes[d]; off = +d; } });
    }
    const toc = found.map(([ti, p])=> [ti, Math.max(1, Math.min(text.length, p + off))]);
    return { toc, tocMax };
  }
  const SHORT = ['پہلی کلاس', 'دوسری کلاس اسپیشل'];
  // لمبے نام بٹن پر مختصر
  const W = [['پہل',1],['دوسر',2],['تیسر',3],['چوتھ',4],['پانچو',5],['چھٹ',6],['ساتو',7],['آٹھو',8],['نو[اوی]',9],['دسو',10],['گیارہ',11],['بارہ',12]];
  const rankT = t=>{ if(/شاہد\s*منظور/.test(t)) return -1; const m = t.match(/\d+/); if(m) return +m[0]; const w = W.find(([k])=> new RegExp(k).test(t.replace(/لیکچر|کلاس/g, ''))); return w ? w[1] : 999; };
  const label = t=>{ if(/شاہد\s*منظور/.test(t)) return 'کورس شاہد منظور لاہور'; const r = rankT(t); return /لیکچر/.test(t) && r > 0 && r < 999 ? r + ' لیکچر' : t; };
  function tabs(){
    const C = all(), btn = (c, i)=> `<button type="button" class="${i === CI ? 'on' : ''}${c.extra && /شاہد\s*منظور/.test(c.title) ? ' full' : ''}" onclick="hkCourse(${i})">${esc(c.extra ? label(c.title) : (SHORT[i] || c.title))}</button>`;
    const base = C.map(btn).filter((_, i)=> !C[i].extra).join(''), more = C.map(btn).filter((_, i)=> C[i].extra).join('');
    return `<div class="hk-tabs">${base}</div>` + (more ? `<h3 style="color:var(--gold); text-align:center; margin:14px 0 8px;">📚 مزید کتابیں اور لیکچر</h3><div class="hk-tabs">${more}</div>` : '');
  }
  function render(){
    const C = all(); if(CI >= C.length) CI = 0;
    const c = C[CI], root = $('hkRoot');
    root.innerHTML = `<h3 style="color:var(--gold); text-align:center; margin:14px 0 8px; font-size:1.3rem;">🎓 حکمت کورس</h3>${tabs()}
      ${CI === 1 ? '<div class="hk-warn">⚠ اس کلاس میں ہرتال، سنکھیا، پارہ، کچلہ جیسے کشتے ہیں — یہ زہریلی دھاتیں/بوٹیاں ہیں۔ صرف ماہر حکیم کی نگرانی میں بنائیں اور دیں؛ حاملہ، بچوں، گردے/جگر کے مریضوں کو نہیں۔</div>' : ''}
      <input class="search" id="hkQ" type="search" placeholder="🔍 کورس میں کوئی لفظ تلاش کریں (مثلاً نبض، اکسیر، بانجھ پن)..." oninput="hkSearch()" style="display:block; width:100%; box-sizing:border-box; margin:8px 0;">
      <div id="hkRes"></div>
      ${c.toc.length ? `<details class="nk-det hk-toc"><summary>📑 فہرست — ${c.toc.length} موضوعات</summary><ol>${c.toc.map(([t, p])=> `<li onclick="hkGo(${p})"><span>${esc(t)}</span> <small>صفحہ ${p}</small></li>`).join('')}</ol></details>` : (c.extra ? '<p class="hk-msg" style="padding:4px;">اس کتاب میں فہرست کے صفحات نہیں ملے — اوپر تلاش سے موضوع ڈھونڈیں</p>' : '')}
      ${c.extra ? `<p style="font-size:.78rem; color:var(--muted); text-align:center; margin:2px 0;">${/^local_/.test(c.entry.fileName) ? '📱 یہ کتاب صرف اس فون میں محفوظ ہے' : ''}</p>` : ''}
      <div class="hk-bar"><button type="button" onclick="hkGo(PAGE_PREV())">▶ پچھلا</button>
        <span>صفحہ <input id="hkPg" type="number" min="1" max="${c.pages}" value="${PAGE}" onchange="hkGo(+this.value)"> / ${c.pages}</span>
        <button type="button" onclick="hkGo(PAGE_NEXT())">اگلا ◀</button></div>
      <div class="hk-bar small"><button type="button" onclick="hkZoom(-1)">➖</button><button type="button" onclick="hkZoom(1)">➕</button>${c.extra ? `<button type="button" onclick="hkFull()">📄 پوری PDF کھولیں</button>` : `<a href="/${c.file}" target="_blank" rel="noopener">📄 پوری PDF کھولیں</a>`}</div>
      <div id="hkView" class="hk-view"><p class="hk-msg">⏳ صفحہ کھل رہا ہے...</p></div>`;
    show();
  }
  window.PAGE_PREV = ()=> Math.max(1, PAGE - 1);
  window.PAGE_NEXT = ()=> Math.min(all()[CI].pages, PAGE + 1);
  async function doc(){
    const c = all()[CI];
    if(c.extra){
      const e = c.entry;
      if(e.pdfDoc) return e.pdfDoc;
      const path = typeof pmResolvePdfPath === 'function' ? pmResolvePdfPath(e.fileName) : null;
      if(!path) throw new Error('اس کتاب کی اصل PDF دستیاب نہیں');
      const parts = (typeof PM_BUILTIN_PDF_PARTS !== 'undefined' && (PM_BUILTIN_PDF_PARTS[path] || PM_BUILTIN_PDF_PARTS[e.fileName])) || (await pmAutoParts(e.fileName));
      e.pdfDoc = parts ? herbalMakeMultiPartPdfDoc(parts) : await pdfjsLib.getDocument({ url: herbalPdfAbs(herbalPdfUrl(path)), rangeChunkSize: 262144, disableAutoFetch: true, disableStream: true }).promise;
      return e.pdfDoc;
    }
    if(!DOCS[c.file]) DOCS[c.file] = pdfjsLib.getDocument({ url: '/' + c.file }).promise;
    return DOCS[c.file];
  }
  async function show(){
    const v = $('hkView'); if(!v || rendering) return; rendering = true;
    try{
      if(typeof pdfjsLib === 'undefined') throw new Error('PDF لائبریری لوڈ نہیں ہوئی');
      const d = await doc(), pg = await d.getPage(PAGE);
      const w = v.clientWidth || 360, vp0 = pg.getViewport({ scale: 1 });
      const scale = (w / vp0.width) * ZOOM, dpr = window.devicePixelRatio || 1;
      const vp = pg.getViewport({ scale: scale * dpr });
      const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; cv.style.width = (vp.width / dpr) + 'px';
      await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      v.innerHTML = ''; v.appendChild(cv);
      const pi = $('hkPg'); if(pi) pi.value = PAGE;
    }catch(e){ v.innerHTML = `<p class="hk-msg" style="color:#e0524f;">${navigator.onLine ? '⚠ صفحہ نہیں کھل سکا: ' + esc(e.message) : 'No internet 🛜 — پہلی بار یہ کتاب انٹرنیٹ پر کھولیں، پھر آف لائن بھی چلے گی'}</p>`; }
    rendering = false;
  }
  window.hkCourse = i=>{ CI = i; PAGE = 1; ZOOM = 1; render(); };
  window.hkFull = ()=>{ const c = all()[CI]; if(c && c.extra && typeof herbalOpenLibraryPdf === 'function') herbalOpenLibraryPdf(c.entry, PAGE, '', null); };
  // "مزید کتابیں" سے کھولیں: اسی کورس والے انداز میں اس کتاب کا ٹیب
  window.hkOpenFile = fn=>{ const i = all().findIndex(c=> c.extra && c.entry.fileName === fn); if(i < 0 || !DATA) return; hkCourse(i); const r = $('hkRoot'); if(r) r.scrollIntoView({ behavior:'smooth', block:'start' }); };
  // کتابیں بعد میں لوڈ ہوں / منتقل ہوں تو ٹیب دوبارہ بنیں
  let SIG = '';
  window.hkExtrasChanged = ()=>{ if(!DATA || !$('hkRoot')) return; const sig = all().map(c=> c.title + c.pages).join('|'); if(sig === SIG) return; SIG = sig; render(); };
  window.hkGo = p=>{ const c = all()[CI]; PAGE = Math.max(1, Math.min(c.pages, p || 1)); show(); const v = $('hkView'); if(v) v.scrollIntoView({ behavior:'smooth', block:'start' }); };
  window.hkZoom = d=>{ ZOOM = Math.max(1, Math.min(3, ZOOM + d * 0.5)); show(); };
  window.hkSearch = ()=>{
    const q = norm(($('hkQ').value || '').trim()), out = $('hkRes');
    if(!q || q.length < 2){ out.innerHTML = ''; return; }
    const c = all()[CI], hits = [];
    c.text.forEach((t, i)=>{ const n = norm(t), k = n.indexOf(q); if(k >= 0) hits.push([i + 1, t.slice(Math.max(0, k - 40), k + 80)]); });
    // فہرست والے صفحات آخر میں، اصل مضمون پہلے
    const tocMax = c.extra ? c.tocMax : (CI === 0 ? 16 : 0); hits.sort((x, y)=> ((x[0] <= tocMax) - (y[0] <= tocMax)) || x[0] - y[0]);
    out.innerHTML = hits.length ? `<div class="hk-res">${hits.length} صفحات ملے:${hits.slice(0, 40).map(([p, s])=> `<div onclick="hkGo(${p})"><b>صفحہ ${p}</b> — ${esc(s)}…</div>`).join('')}</div>` : '<p class="hk-msg">کچھ نہیں ملا</p>';
  };
  window.hikmatInit = async ()=>{
    const root = $('hkRoot'); if(!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    try{ await load(); SIG = all().map(c=> c.title + c.pages).join('|'); render(); }catch(e){ root.dataset.ready = ''; root.innerHTML = '<p class="hk-msg" style="color:#e0524f;">No internet 🛜 — کورس پہلی بار کھولنے کے لیے انٹرنیٹ آن کریں</p>'; }
  };
  const css = document.createElement('style');
  css.textContent = `.hk-tabs{display:flex; gap:6px; flex-wrap:wrap;} .hk-tabs button{flex:1 1 45%; padding:8px; border-radius:12px; border:1px solid var(--gold); background:var(--card); color:var(--gold); font-family:inherit; font-size:.9rem; cursor:pointer;} .hk-tabs button.full{flex-basis:100%;} .hk-tabs button.on{background:var(--gold); color:#fff;}
  .hk-warn{background:#fdecea; border:1px solid #e0524f; color:#b03a37; border-radius:10px; padding:6px 10px; font-size:.82rem; margin-top:8px; line-height:1.9;}
  .hk-toc ol{margin:4px 22px 6px 0; padding:0; font-size:.88rem; line-height:2;} .hk-toc li{cursor:pointer;} .hk-toc li small{color:var(--muted);}
  .hk-bar{display:flex; gap:8px; justify-content:center; align-items:center; margin:8px 0; flex-wrap:wrap;} .hk-bar button, .hk-bar a{background:var(--gold); color:#fff; border:none; border-radius:16px; padding:5px 14px; font-family:inherit; font-size:.88rem; cursor:pointer; text-decoration:none;} .hk-bar input{width:60px; text-align:center;}
  .hk-view{overflow:auto; border:1px solid var(--border); border-radius:8px; background:#fff; min-height:200px;} .hk-view canvas{display:block; margin:0 auto;}
  .hk-msg{text-align:center; color:var(--muted); padding:20px 8px;}
  .hk-res{border:1px solid var(--border); border-radius:8px; background:var(--card); padding:6px 8px; font-size:.84rem; max-height:300px; overflow:auto;} .hk-res div{padding:4px 0; border-bottom:1px dashed var(--border); cursor:pointer; line-height:1.9;}`;
  document.head.appendChild(css);
})();
