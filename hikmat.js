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
  function tabs(){
    return DATA.map((c, i)=> `<button type="button" class="${i === CI ? 'on' : ''}" onclick="hkCourse(${i})">${esc(c.title)}</button>`).join('');
  }
  function render(){
    const c = DATA[CI], root = $('hkRoot');
    root.innerHTML = `<div class="hk-tabs">${tabs()}</div>
      ${CI === 1 ? '<div class="hk-warn">⚠ اس کلاس میں ہرتال، سنکھیا، پارہ، کچلہ جیسے کشتے ہیں — یہ زہریلی دھاتیں/بوٹیاں ہیں۔ صرف ماہر حکیم کی نگرانی میں بنائیں اور دیں؛ حاملہ، بچوں، گردے/جگر کے مریضوں کو نہیں۔</div>' : ''}
      <input class="search" id="hkQ" type="search" placeholder="🔍 کورس میں کوئی لفظ تلاش کریں (مثلاً نبض، اکسیر، بانجھ پن)..." oninput="hkSearch()" style="display:block; width:100%; box-sizing:border-box; margin:8px 0;">
      <div id="hkRes"></div>
      <details class="nk-det hk-toc"><summary>📑 فہرست — ${c.toc.length} موضوعات</summary><ol>${c.toc.map(([t, p])=> `<li onclick="hkGo(${p})"><span>${esc(t)}</span> <small>صفحہ ${p}</small></li>`).join('')}</ol></details>
      <div class="hk-bar"><button type="button" onclick="hkGo(PAGE_PREV())">▶ پچھلا</button>
        <span>صفحہ <input id="hkPg" type="number" min="1" max="${c.pages}" value="${PAGE}" onchange="hkGo(+this.value)"> / ${c.pages}</span>
        <button type="button" onclick="hkGo(PAGE_NEXT())">اگلا ◀</button></div>
      <div class="hk-bar small"><button type="button" onclick="hkZoom(-1)">➖</button><button type="button" onclick="hkZoom(1)">➕</button><a href="/${c.file}" target="_blank" rel="noopener">📄 پوری PDF کھولیں</a></div>
      <div id="hkView" class="hk-view"><p class="hk-msg">⏳ صفحہ کھل رہا ہے...</p></div>`;
    show();
  }
  window.PAGE_PREV = ()=> Math.max(1, PAGE - 1);
  window.PAGE_NEXT = ()=> Math.min(DATA[CI].pages, PAGE + 1);
  async function doc(){
    const c = DATA[CI];
    if(!DOCS[CI]) DOCS[CI] = pdfjsLib.getDocument({ url: '/' + c.file }).promise;
    return DOCS[CI];
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
  window.hkGo = p=>{ const c = DATA[CI]; PAGE = Math.max(1, Math.min(c.pages, p || 1)); show(); const v = $('hkView'); if(v) v.scrollIntoView({ behavior:'smooth', block:'start' }); };
  window.hkZoom = d=>{ ZOOM = Math.max(1, Math.min(3, ZOOM + d * 0.5)); show(); };
  window.hkSearch = ()=>{
    const q = norm(($('hkQ').value || '').trim()), out = $('hkRes');
    if(!q || q.length < 2){ out.innerHTML = ''; return; }
    const c = DATA[CI], hits = [];
    c.text.forEach((t, i)=>{ const n = norm(t), k = n.indexOf(q); if(k >= 0) hits.push([i + 1, t.slice(Math.max(0, k - 40), k + 80)]); });
    // فہرست والے صفحات آخر میں، اصل مضمون پہلے
    const tocMax = CI === 0 ? 16 : 0; hits.sort((x, y)=> ((x[0] <= tocMax) - (y[0] <= tocMax)) || x[0] - y[0]);
    out.innerHTML = hits.length ? `<div class="hk-res">${hits.length} صفحات ملے:${hits.slice(0, 40).map(([p, s])=> `<div onclick="hkGo(${p})"><b>صفحہ ${p}</b> — ${esc(s)}…</div>`).join('')}</div>` : '<p class="hk-msg">کچھ نہیں ملا</p>';
  };
  window.hikmatInit = async ()=>{
    const root = $('hkRoot'); if(!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    try{ await load(); render(); }catch(e){ root.dataset.ready = ''; root.innerHTML = '<p class="hk-msg" style="color:#e0524f;">No internet 🛜 — کورس پہلی بار کھولنے کے لیے انٹرنیٹ آن کریں</p>'; }
  };
  const css = document.createElement('style');
  css.textContent = `.hk-tabs{display:flex; gap:6px; flex-wrap:wrap;} .hk-tabs button{flex:1 1 45%; padding:8px; border-radius:12px; border:1px solid var(--gold); background:var(--card); color:var(--gold); font-family:inherit; font-size:.9rem; cursor:pointer;} .hk-tabs button.on{background:var(--gold); color:#fff;}
  .hk-warn{background:#fdecea; border:1px solid #e0524f; color:#b03a37; border-radius:10px; padding:6px 10px; font-size:.82rem; margin-top:8px; line-height:1.9;}
  .hk-toc ol{margin:4px 22px 6px 0; padding:0; font-size:.88rem; line-height:2;} .hk-toc li{cursor:pointer;} .hk-toc li small{color:var(--muted);}
  .hk-bar{display:flex; gap:8px; justify-content:center; align-items:center; margin:8px 0; flex-wrap:wrap;} .hk-bar button, .hk-bar a{background:var(--gold); color:#fff; border:none; border-radius:16px; padding:5px 14px; font-family:inherit; font-size:.88rem; cursor:pointer; text-decoration:none;} .hk-bar input{width:60px; text-align:center;}
  .hk-view{overflow:auto; border:1px solid var(--border); border-radius:8px; background:#fff; min-height:200px;} .hk-view canvas{display:block; margin:0 auto;}
  .hk-msg{text-align:center; color:var(--muted); padding:20px 8px;}
  .hk-res{border:1px solid var(--border); border-radius:8px; background:var(--card); padding:6px 8px; font-size:.84rem; max-height:300px; overflow:auto;} .hk-res div{padding:4px 0; border-bottom:1px dashed var(--border); cursor:pointer; line-height:1.9;}`;
  document.head.appendChild(css);
})();
