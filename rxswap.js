// ===== ڈاکٹر کے بل میں دوائی کی تبدیلی (rx swap) =====
// سرور: /api/notify-disease?rx=1 (Vercel کی 12 فائلوں کی حد کی وجہ سے اسی فائل میں)
// QM_COMPANY_COUNTRY، QM_MED_PURPOSE، wajahMatchKeys اور escapeHtmlSearch پہلے سے herbal.html میں ہیں
const RX_API = '/api/notify-disease?rx=1';
(function(){
  const css = document.createElement('style');
  css.textContent = `.rx-pick{display:flex; align-items:flex-start; gap:10px; padding:8px 10px; margin-top:6px; border:1px solid var(--border); border-radius:10px; cursor:pointer;}
  .rx-pick input{margin-top:6px; width:18px; height:18px; accent-color:var(--gold); flex:none;}
  .rx-pick:has(input:checked){border-color:var(--gold); background:rgba(31,122,77,.06);}`;
  document.head.appendChild(css);
})();
// ===== ڈاکٹر کے بل میں دوائی کی تبدیلی =====
let rxImages = [];
const RX_MAX = 20;
// تصویر چھوٹی کر کے JPEG بنائیں — پہلے <img> سے، نہ کھلے تو createImageBitmap سے، پھر FileReader سے
function rxDraw(src, w, h){
  const max = 1600, k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}
function rxLoadImg(url){
  return new Promise((ok, fail)=>{ const img = new Image(); img.onload = ()=> ok(img); img.onerror = ()=> fail(new Error('تصویر نہیں کھل سکی')); img.src = url; });
}
async function rxShrink(file){
  const url = URL.createObjectURL(file);
  try{ const img = await rxLoadImg(url); return rxDraw(img, img.naturalWidth || img.width, img.naturalHeight || img.height); }
  catch(e){}
  finally{ URL.revokeObjectURL(url); }
  if(window.createImageBitmap){
    try{ const bmp = await createImageBitmap(file); const out = rxDraw(bmp, bmp.width, bmp.height); try{ bmp.close(); }catch(e){} return out; }catch(e){}
  }
  const dataUrl = await new Promise((ok, fail)=>{ const fr = new FileReader(); fr.onload = ()=> ok(fr.result); fr.onerror = ()=> fail(fr.error); fr.readAsDataURL(file); });
  const img = await rxLoadImg(String(dataUrl).replace(/^data:[^;,]*/, 'data:image/jpeg'));
  return rxDraw(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
}
async function rxPick(list){
  // ایپ (WebView) میں گیلری سے آئی فائلوں کی type کبھی خالی یا application/octet-stream ہوتی ہے —
  // اس لیے صرف واضح غیر تصویری فائلیں (ویڈیو، آواز، متن، PDF) چھوڑیں، باقی سب کھولنے کی کوشش کریں
  const files = Array.from(list || []).filter(f=> !/^(video|audio|text)\/|pdf/i.test(f.type || ''));
  const cnt = document.getElementById('rxCount');
  let failed = 0, done = 0;
  for(const f of files){
    if(rxImages.length >= RX_MAX) break;
    if(cnt) cnt.textContent = '⏳ تصویریں لگ رہی ہیں... ' + (++done) + ' / ' + files.length;
    try{ rxImages.push(await rxShrink(f)); rxRenderThumbs(); }catch(e){ failed++; }
  }
  rxRenderThumbs();
  if(failed && cnt) cnt.textContent = (cnt.textContent ? cnt.textContent + ' — ' : '') + failed + ' تصویر نہیں کھل سکی، دوبارہ چنیں یا کیمرے سے نئی لیں';
}
function rxRenderThumbs(){
  const box = document.getElementById('rxThumbs');
  box.innerHTML = rxImages.map((u, i)=> `<div style="position:relative;"><img src="${u}" style="width:90px; height:110px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">`
    + `<button onclick="rxImages.splice(${i},1); rxRenderThumbs();" style="position:absolute; top:-6px; left:-6px; background:#e0524f; color:#fff; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer;">×</button></div>`).join('');
  document.getElementById('rxGoBtn').style.display = rxImages.length ? '' : 'none';
  const cnt = document.getElementById('rxCount');
  if(cnt) cnt.textContent = rxImages.length ? (rxImages.length + ' تصویریں — اور دوا ہو تو 📷 سے اگلی تصویر بھی لیں') + (rxImages.length >= RX_MAX ? ' (حد پوری)' : '') : '';
}
async function rxAnalyze(){
  const out = document.getElementById('rxResult'), btn = document.getElementById('rxGoBtn');
  if(!rxImages.length) return;
  btn.disabled = true;
  // سرور ایک وقت میں 3 تصویریں لیتا ہے: 3، 3 کر کے بھیجیں اور سب دوائیں ایک ہی نتیجے میں جوڑیں
  const groups = [];
  for(let k = 0; k < rxImages.length; k += 3) groups.push(rxImages.slice(k, k + 3));
  const all = [], notes = [], errs = [];
  for(let g = 0; g < groups.length; g++){
    out.innerHTML = `<div class="result-card"><p style="text-align:center; color:var(--muted);">⏳ دوائیں پڑھی جا رہی ہیں... (${Math.min((g + 1) * 3, rxImages.length)} / ${rxImages.length} تصویریں)</p></div>`;
    try{
      const r = await fetch(RX_API, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ action:'rx', images: groups[g] }) });
      const d = await r.json().catch(()=> ({}));
      if(!r.ok) throw new Error(d.error || ('سرور کی خرابی ' + r.status));
      (d.medicines || []).forEach(m=> all.push(m));
      if(d.note) notes.push(d.note);
    }catch(e){ errs.push(navigator.onLine ? (e.message || String(e)) : 'No internet 🛜 — انٹرنیٹ آن کریں'); }
  }
  // ایک ہی دوا دو تصویروں میں آئی ہو تو ایک بار
  const seen = new Set(), meds = all.filter(m=>{
    const key = (String(m.generic || m.written).toLowerCase() + '|' + String(m.strength || '').toLowerCase() + '|' + String(m.written || '').toLowerCase()).replace(/\s+/g, '');
    if(seen.has(key)) return false; seen.add(key); return true;
  });
  if(!meds.length && errs.length){
    out.innerHTML = `<div class="result-card"><p style="color:#e0524f;">نسخہ نہیں پڑھا جا سکا: ${escapeHtmlSearch(errs[0])}</p></div>`;
  } else {
    rxRender({ medicines: meds, note: notes.concat(errs.length ? ['کچھ تصویریں نہیں پڑھی جا سکیں: ' + errs[0]] : []).join(' — ') });
  }
  btn.disabled = false;
}
// کمپنی کس ملک کی ہے: سائٹ کی اپنی فہرست پہلے، ورنہ AI کا بتایا ہوا
function rxCountry(company, given){
  const c = String(company || '').trim();
  if(c && typeof QM_COMPANY_COUNTRY === 'object'){
    const k = Object.keys(QM_COMPANY_COUNTRY).find(x=> x.toLowerCase() === c.toLowerCase() || c.toLowerCase().startsWith(x.toLowerCase() + ' '));
    if(k) return QM_COMPANY_COUNTRY[k];
  }
  return String(given || '').trim();
}
// دوا کے فوائد: سائٹ کی اپنی فہرست (QM_MED_PURPOSE) + AI کے بتائے ہوئے نکات
function rxUsesHtml(m){
  const pts = [];
  try{
    if(m.generic && typeof QM_MED_PURPOSE === 'object' && typeof wajahMatchKeys === 'function')
      wajahMatchKeys(QM_MED_PURPOSE, m.generic).forEach(k=> pts.push(QM_MED_PURPOSE[k]));
  }catch(e){}
  (m.uses || []).forEach(u=> pts.push(u));
  const list = [...new Set(pts.map(x=> String(x).trim()).filter(Boolean))].slice(0, 5);
  if(!list.length) return '';
  const same = m.alternatives && m.alternatives.length ? '<p style="font-size:.8rem; color:var(--muted); margin-top:4px;">نیچے بتائے گئے برانڈز میں بھی یہی دوا ہے، اس لیے ان کے فائدے بھی بالکل یہی ہیں۔</p>' : '';
  return '<p style="margin-top:8px; color:var(--gold-soft); font-weight:700;">💊 فوائد (کس کام کی دوا ہے):</p><ul style="margin:2px 0 0; padding-inline-start:20px;">'
    + list.map(x=> '<li>' + escapeHtmlSearch(x) + '</li>').join('') + '</ul>' + same;
}
function rxRender(d){
  const out = document.getElementById('rxResult');
  const meds = d.medicines || [];
  const esc = escapeHtmlSearch, en = t=> `<bdi dir="ltr">${esc(t)}</bdi>`;
  if(!meds.length){ out.innerHTML = `<div class="result-card"><p>${esc(d.note || 'تصویر میں کوئی دوا نہیں پڑھی جا سکی۔ صاف اور سیدھی تصویر دوبارہ بھیجیں۔')}</p></div>`; return; }
  const n = s=> meds.filter(m=> m.status === s).length;
  const badge = { good:['✅','اچھی کمپنی — تبدیلی کی ضرورت نہیں','var(--gold)'], local:['⚠️','لوکل کمپنی','#c9821b'], unknown:['❔','کمپنی معلوم نہیں','#c9821b'], unclear:['❓','صاف پڑھا نہیں جا سکا','#e0524f'] };
  const finalList = [];
  let html = `<div class="result-card"><h3>نتیجہ</h3><p>کل ${meds.length} دوائیں — ✅ ${n('good')} اچھی کمپنی، ⚠️ ${n('local') + n('unknown')} بدلنے کے قابل، ❓ ${n('unclear')} صاف نہیں پڑھی گئیں</p></div>`;
  meds.forEach((m, i)=>{
    const b = badge[m.status] || badge.unknown;
    const base = [m.generic, m.strength].filter(Boolean).join(' ');
    html += `<div class="result-card" style="margin-top:12px; border-right:4px solid ${b[2]};">`
      + `<p style="font-weight:700;">${i+1}۔ ${en(m.written || m.generic)} ${m.company ? '<span style="color:var(--muted); font-size:.85rem;">(' + en(m.company) + ')</span>' : ''}</p>`
      + (m.company ? `<p style="font-size:.88rem;">🏭 کمپنی: ${en(m.company)} — 🌍 ملک: <b>${esc(rxCountry(m.company, m.country) || 'معلوم نہیں')}</b></p>` : '')
      + `<p style="color:${b[2]}; font-weight:700;">${b[0]} ${b[1]}</p>`
      + (m.reason ? `<p style="color:var(--muted); font-size:.85rem;">${esc(m.reason)}</p>` : '')
      + (base ? `<p>اصل دوا: <b>${en(base + (m.form ? ' · ' + m.form : ''))}</b></p>` : '<p style="color:#e0524f; font-size:.85rem;">اصل دوا (generic) کا نام پڑھا نہیں جا سکا — فارماسسٹ سے پوچھیں۔</p>')
      + (m.dose ? `<p style="font-size:.88rem;">ڈاکٹر کی ہدایت: ${en(m.dose)}</p>` : '')
      + rxUsesHtml(m);
    if(m.alternatives && m.alternatives.length){
      // جس برانڈ پر ٹک ہو وہی نیچے والی لسٹ میں جائے؛ شروع میں پہلا، چاہیں تو پرانی دوا ہی رکھیں
      html += `<p style="margin-top:8px; color:var(--gold-soft); font-weight:700;">اس کی جگہ لیں (وہی دوا، وہی طاقت) — جس پر ٹک کریں وہی لسٹ میں آئے گی:</p>`
        + m.alternatives.map((a, k)=> `<label class="rx-pick"><input type="radio" name="rxpick${i}" value="${k}" ${k === 0 ? 'checked' : ''} onchange="rxChoose(${i}, ${k})">`
          + `<span><b>${en(a.brand + (a.company ? ' — ' + a.company : ''))}</b>${rxCountry(a.company, a.country) ? '<br><span style="font-size:.85rem; color:var(--muted);">🌍 ملک: ' + esc(rxCountry(a.company, a.country)) + '</span>' : ''}</span></label>`).join('')
        + `<label class="rx-pick"><input type="radio" name="rxpick${i}" value="-1" onchange="rxChoose(${i}, -1)"><span style="color:var(--muted);">پرانی ہی رکھیں: ${en(m.written || m.generic)}</span></label>`;
    } else if(m.status === 'local' || m.status === 'unknown'){
      html += `<p style="font-size:.85rem; color:var(--muted);">اچھی کمپنی کا یہی برانڈ یقین سے نہیں بتایا جا سکا — فارماسسٹ سے اسی generic کا کسی بڑی کمپنی کا برانڈ مانگیں۔</p>`;
    }
    html += `</div>`;
  });
  window.rxMeds = meds;
  window.rxChoice = meds.map(m=> (m.alternatives && m.alternatives.length) ? 0 : -1);
  html += `<div class="result-card" style="margin-top:12px;"><h3>میڈیکل اسٹور کے لیے نئی لسٹ</h3><pre id="rxFinal" style="white-space:pre-wrap; direction:rtl; text-align:right; font-family:inherit; font-size:.92rem; line-height:2;"></pre>`
    + `<div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;"><button class="btn" onclick="rxShare()">📤 واٹس ایپ / شیئر</button><button class="btn secondary" onclick="rxCopy(this)">📋 کاپی</button></div></div>`;
  if(d.note) html += `<p style="color:var(--muted); font-size:.85rem; margin-top:8px;">ℹ️ ${esc(d.note)}</p>`;
  out.innerHTML = html;
  rxBuildFinal();
  out.scrollIntoView({behavior:'smooth'});
}
function rxChoose(i, k){ if(window.rxChoice){ window.rxChoice[i] = k; rxBuildFinal(); } }
// نئی لسٹ: ہر دوا کا صرف (چنا ہوا) نام، طریقہ استعمال اور فوائد
function rxBuildFinal(){
  const meds = window.rxMeds || [], lines = ['نئی دوا لسٹ'];
  meds.forEach((m, i)=>{
    const k = (window.rxChoice || [])[i];
    const a = (k >= 0 && m.alternatives) ? m.alternatives[k] : null;
    const name = a ? a.brand + (a.company ? ' (' + a.company + ')' : '') : (m.written || m.generic || 'صاف نہیں پڑھی گئی — ڈاکٹر/فارماسسٹ سے پوچھیں');
    const strength = m.strength ? ' ' + m.strength : '';
    lines.push('');
    lines.push((i + 1) + '۔ ' + name + strength);
    lines.push('   طریقہ استعمال: ' + (m.dose || 'ڈاکٹر کی ہدایت کے مطابق'));
    const u = (m.uses || []).slice(0, 2).join('، ');
    if(u) lines.push('   فوائد: ' + u);
  });
  window.rxFinalText = lines.join('\n');
  const el = document.getElementById('rxFinal');
  if(el) el.textContent = window.rxFinalText;
}
function rxShare(){
  const t = window.rxFinalText || '';
  if(navigator.share) navigator.share({ text: t }).catch(()=>{});
  else window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
}
function rxCopy(btn){
  const t = window.rxFinalText || '';
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>{ btn.textContent = '✅ کاپی ہو گئی'; }).catch(()=>{ window.prompt('کاپی کریں:', t); });
}

