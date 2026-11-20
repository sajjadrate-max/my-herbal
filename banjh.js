// ===== بانجھ پن — میاں بیوی کا کھاتہ (مرحلہ وار ٹیسٹ اور تشخیص) =====
// ریکارڈ صرف اسی فون میں (IndexedDB) — مریضوں کے نام اور رپورٹیں کبھی ویب سائٹ/GitHub پر نہیں جاتیں۔
// بیک اپ: "📤 بیک اپ" سے فائل بنتی ہے، "📥" سے واپس لگتی ہے۔ رپورٹ کی تصویر صرف پڑھنے کے لیے AI کو جاتی ہے (محفوظ نہیں ہوتی)۔
(function(){
  // ---------- ٹیسٹوں کی مرحلہ وار فہرست ----------
  // [id, انگریزی نام, اردو نام, یہ ٹیسٹ کیوں / نارمل حد]
  const TESTS = {
    m: [
      { st:'مرحلہ 1 — بنیادی ٹیسٹ (Basic)', items:[
        ['semen','Semen Analysis','مادہ منویہ کا ٹیسٹ','مرد کا سب سے پہلا اور اہم ٹیسٹ — سپرم کی تعداد، حرکت اور بناوٹ دیکھی جاتی ہے۔ 2 سے 5 دن پرہیز کے بعد۔ نارمل (WHO): مقدار 1.4ml+، تعداد 16 ملین/ml+، پروگریسو حرکت 30٪+، کل حرکت 42٪+، بناوٹ 4٪+، pH 7.2+۔ ⚠ سپرم کم ہوں تو ٹیسٹوسٹیرون کی گولی/ٹیکہ ہرگز نہیں — سپرم اور کم ہو جاتے ہیں'],
        ['urine_m','Urine R/E','پیشاب کا ٹیسٹ','پیشاب کی نالی کا انفیکشن، پس سیلز یا شوگر — یہ سپرم کو نقصان دیتے ہیں'],
        ['cbc_m','CBC','خون کا مکمل ٹیسٹ','خون کی کمی یا جسم میں انفیکشن تو نہیں'],
        ['sugar_m','HbA1c / Blood Sugar','شوگر کا ٹیسٹ','شوگر سے کمزوری، انزال کی خرابی اور سپرم کمزور ہوتے ہیں']
      ]},
      { st:'مرحلہ 2 — ہارمون (اگر سیمن خراب ہو)', items:[
        ['semen2','Repeat Semen Analysis','دوبارہ سیمن ٹیسٹ','پہلی رپورٹ خراب ہو تو 2–3 ماہ بعد تصدیق — ایک سپرم کو بن کر تیار ہونے میں تقریباً 3 ماہ لگتے ہیں، اس لیے علاج یا بیماری کا اثر رپورٹ میں 3 ماہ بعد نظر آتا ہے'],
        ['fsh_m','FSH','سپرم بنانے والا ہارمون','زیادہ ہو تو خصیہ کمزور ہے؛ کم ہو تو دماغی غدود (پچوٹری) سے حکم نہیں آ رہا'],
        ['lh_m','LH','ٹیسٹوسٹیرون بنانے کا حکم دینے والا ہارمون','FSH کے ساتھ دیکھا جاتا ہے کہ خرابی خصیے میں ہے یا دماغی غدود میں'],
        ['testo','Total Testosterone','مردانہ ہارمون (صبح 8–10 بجے)','کم ہو تو کمزوری، خواہش کی کمی اور سپرم کم۔ نارمل تقریباً 300–1000 ng/dl۔ ⚠ کم ہو تب بھی بانجھ مرد کو ٹیسٹوسٹیرون خود نہ دیں — سپرم بننا رک جاتا ہے؛ ماہر hCG یا Clomiphene دیتا ہے'],
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
        ['urine_f','Urine R/E','پیشاب کا ٹیسٹ','پیشاب کی نالی کا انفیکشن (پس سیلز) — حمل سے پہلے ختم ہونا ضروری'],
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

  // ---------- خرابی ← عام طور پر دی جانے والی دوائیں (معروف بین الاقوامی کمپنیاں؛ خوراک نہیں — صرف ڈاکٹر کے نسخے سے) ----------
  // ہر دوا: [اصل دوا (نمک/Generic)، [[برانڈ (بازار میں نام)، کمپنی، ملک], ...]]
  const MEDS = [
    { re:/پرولیکٹن|prolactin/i, items:[['Cabergoline',[['Dostinex','Pfizer','امریکہ']],'first','ہفتے میں 1–2 بار؛ عام طور پر کئی ماہ — 4 ہفتے بعد پرولیکٹن دوبارہ چیک؛ حمل ٹھہرتے ہی ڈاکٹر سے پوچھ کر بند'],['Bromocriptine',[['Parlodel','Novartis','سوئٹزرلینڈ']],'alt','روزانہ؛ عام طور پر کئی ماہ — 4 ہفتے بعد پرولیکٹن دوبارہ چیک']], note:'پرولیکٹن بہت زیادہ ہو تو دماغی غدود کا MRI بھی کروائیں' },
    { re:/انڈا نہ|انڈا نہیں|اوویولیشن|ovulation|PCOS|پی سی او/i, items:[['Letrozole',[['Femara','Novartis','سوئٹزرلینڈ']],'first','ہر ماہ صرف 5 دن (ماہواری کے دن 3 سے 7)؛ زیادہ سے زیادہ 3–6 ماہ، ہر ماہ فولیکل ٹریکنگ کے ساتھ'],['Clomiphene Citrate',[['Clomid','Sanofi','فرانس']],'alt','ہر ماہ صرف 5 دن (ماہواری کے دن 2 سے 6)؛ زندگی میں کل زیادہ سے زیادہ 6 ماہ'],['Metformin',[['Glucophage','Merck','جرمنی']],'add','روزانہ، لگاتار 3–6 ماہ — پھر شوگر/انسولین دیکھ کر']], note:'Metformin صرف PCOS / انسولین مزاحمت میں۔ انڈا بننے کی دوا کے ساتھ فولیکل ٹریکنگ ضروری' },
    { re:/پروجیسٹرون|progesterone|لیوٹیل/i, items:[['Dydrogesterone',[['Duphaston','Abbott','امریکہ']],'first','ہر ماہ تقریباً 10 دن (ماہواری کے دن 15 سے 25) — یا ڈاکٹر کے مطابق'],['Micronized Progesterone',[['Utrogestan','Besins','فرانس']],'alt','ہر ماہ تقریباً 10–14 دن (انڈا پھٹنے کے بعد) — یا ڈاکٹر کے مطابق']], note:'' },
    { re:/تھائیرائیڈ کم|ہائپو تھائیرائیڈ|hypothyroid|TSH زیادہ/i, items:[['Levothyroxine',[['Eltroxin','GSK','برطانیہ'],['Euthyrox','Merck','جرمنی']],'first','روزانہ، لمبے عرصے تک — 6–8 ہفتے بعد TSH دوبارہ']], note:'' },
    { re:/تھائیرائیڈ زیادہ|ہائپر تھائیرائیڈ|hyperthyroid/i, items:[['Carbimazole',[['Neo-Mercazole','Amdipharm','برطانیہ']],'first','کئی ماہ — ہر 4–6 ہفتے ٹیسٹ، ماہر کی نگرانی میں']], note:'' },
    { re:/پیشاب.*(انفیکشن|پس)|پس سیلز|UTI|urine/i, items:[['Co-amoxiclav',[['Augmentin','GSK','برطانیہ']],'first','عام طور پر 5–7 دن (کورس پورا کریں)'],['Ciprofloxacin',[['Ciproxin','Bayer','جرمنی']],'alt','عام طور پر 3–7 دن — حمل کی کوشش کے مہینے میں نہ دیں']], note:'پہلے Urine C/S (کلچر) کروائیں — اینٹی بائیوٹک اسی رپورٹ کے مطابق' },
    { re:/ویجائنل|لیکوریا|بیکٹیریل ویجائنوسس|ٹرائیکو/i, items:[['Metronidazole',[['Flagyl','Sanofi','فرانس']],'first','7 دن — دوران علاج شوہر بھی ساتھ'],['Clotrimazole',[['Canesten','Bayer','جرمنی']],'fungal','اندرونی گولی/کریم 3–6 دن']], note:'Clotrimazole فنگس کے لیے۔ میاں بیوی دونوں کا علاج ساتھ' },
    { re:/سیمن.*(انفیکشن|پس)|لیوکو/i, items:[['Doxycycline',[['Vibramycin','Pfizer','امریکہ']],'first','عام طور پر 2–4 ہفتے (سیمن کلچر کے مطابق)']], note:'سیمن کلچر کے مطابق' },
    { re:/سپرم.*(کمی|کم)|اولیگو|oligo|استھینو|حرکت کم|بناوٹ|ٹیراٹو/i, items:[['L-Carnitine + Acetyl-L-Carnitine',[['Proxeed Plus','Alfasigma','اٹلی']],'first','روزانہ کم از کم 3 ماہ (بہتر 6 ماہ) — سپرم 3 ماہ میں تیار ہوتے ہیں'],['Clomiphene Citrate',[['Clomid','Sanofi','فرانس']],'add','3–6 ماہ — صرف ماہر کی نگرانی میں']], note:'Clomiphene صرف ماہر کے مشورے سے۔ ⚠ ٹیسٹوسٹیرون کی گولی/ٹیکہ ہرگز نہیں — اس سے سپرم اور کم ہو جاتے ہیں' },
    { re:/ٹیسٹوسٹیرون کم|low testosterone|ہائپو گونیڈ/i, items:[['hCG (injection)',[['Pregnyl','Organon','امریکہ']],'first','کئی ماہ — صرف ماہر کی نگرانی میں']], note:'⚠ بانجھ پن میں ٹیسٹوسٹیرون خود نہ دیں — سپرم بننا رک جاتا ہے' },
    { re:/شوگر|ذیابیطس|diabet/i, items:[['Metformin',[['Glucophage','Merck','جرمنی']],'first','روزانہ، لمبے عرصے تک — ڈاکٹر کے مطابق']], note:'' },
    { re:/خون کی کمی|ہیموگلوبن|anemi/i, items:[['Iron + Folic Acid',[['Fefol','GSK','برطانیہ'],['Ferrograd-Folic','Abbott','امریکہ']],'first','روزانہ تقریباً 3 ماہ — 4 ہفتے بعد Hb دوبارہ']], note:'' },
    { re:/وٹامن ڈی|vitamin d/i, items:[['Cholecalciferol (Vitamin D3)',[],'first','8–12 ہفتے — پھر 3 ماہ بعد دوبارہ ٹیسٹ']], note:'' }
  ];
  // جہاں دوا سے فائدہ نہیں — صرف مشورہ
  const ADVICE = [
    { re:/ازو سپرمیا|azoospermia|سپرم صفر|سپرم نہیں/i, t:'ماہرِ امراضِ مردانہ (Urologist / Andrologist) سے رجوع — وجہ کے مطابق ہارمون، سرجری یا TESA' },
    { re:/ویریکوسیل|varicocele/i, t:'سرجری (Varicocelectomy) — یورولوجسٹ سے رجوع' },
    { re:/AMH کم|ذخیرہ کم|FSH زیادہ/i, t:'دوا سے انڈوں کا ذخیرہ نہیں بڑھتا — جلد ماہرِ بانجھ پن (IVF) سے رجوع' },
    { re:/نالیاں بند|نالی بند|tubal|HSG خراب/i, t:'لیپرو / ہسٹرو اسکوپی یا IVF — ماہر سے رجوع' }
  ];
  function treatHtml(list){
    return `<ol class="bj-tl">${list.map(x=>{
      const ms = MEDS.filter(m=> m.re.test(x)), ad = ADVICE.filter(a=> a.re.test(x));
      const ROLE = { first:'<span class="bj-role first">✅ پہلی پسند</span>', alt:'<span class="bj-role alt">↔ متبادل — پہلی کی جگہ (دونوں ساتھ نہیں)</span>', add:'<span class="bj-role add">➕ ساتھ میں — صرف ضرورت ہو تو</span>', fungal:'<span class="bj-role add">➕ صرف فنگس (سفید دہی جیسا پانی) ہو تو</span>' };
      const meds = ms.map(m=> m.items.map(([g, brands, role, days])=> `<div class="bj-med">
          ${role ? ROLE[role] : ''}
          <div>💊 <span class="bj-lb">دوا (اصل نمک):</span> <b class="bj-en" dir="ltr">${esc(g)}</b></div>
          ${brands.map(([b, co, cn])=> `<div class="bj-mrow"><span class="bj-lb">برانڈ (بازار میں نام):</span> <b class="bj-brand" dir="ltr">${esc(b)}</b></div><div class="bj-mrow"><span class="bj-lb">کمپنی:</span> <b class="bj-co" dir="ltr">${esc(co)}</b> <span class="bj-cn">(${esc(cn)})</span></div>`).join('')}
          ${days ? `<div class="bj-days">⏱ <span class="bj-lb">کتنے دن:</span> ${esc(days)}</div>` : ''}
        </div>`).join('') + (m.note ? `<div class="bj-mnote">${esc(m.note)}</div>` : '')).join('');
      const adv = ad.map(a=> `<div class="bj-mnote">👨‍⚕️ ${esc(a.t)}</div>`).join('');
      const many = ms.some(m=> m.items.filter(i=> i[2] === 'first' || i[2] === 'alt').length > 1);
      return `<li><b>${esc(x)}</b>${meds || adv ? `<div class="bj-meds">${many ? '<div class="bj-one">👉 سب ایک ساتھ نہیں — "پہلی پسند" والی ایک دوا؛ وہ نہ ملے یا راس نہ آئے تو "متبادل"</div>' : ''}${meds}${adv}</div>` : ''}</li>`;
    }).join('')}</ol>
    <div class="bj-rx">⚠ یہ دوائیں عام طور پر ڈاکٹر دیتے ہیں — صرف مستند ڈاکٹر کے نسخے سے۔ دن عام اندازہ ہیں — اصل خوراک اور مدت ڈاکٹر مریض دیکھ کر طے کرے۔ حمل ٹھہرنے کا شبہ ہو تو کوئی دوا ڈاکٹر سے پوچھے بغیر جاری نہ رکھیں۔</div>`;
  }

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
      <button type="button" class="bj-dots" aria-label="مزید" onclick="event.stopPropagation(); banjhMenu(this, '${c.id}')">⋮</button>
      <div class="bj-case-names">👨 ${esc(c.husband)} <span style="color:var(--muted);">&</span> 👩 ${esc(c.wife)}</div>
      <div class="bj-case-meta">مرد: <b class="ok">✓ ${m.ok}</b> <b class="bad">✗ ${m.bad}</b> · عورت: <b class="ok">✓ ${f.ok}</b> <b class="bad">✗ ${f.bad}</b> · ${fmtD(c.created)} سے</div>
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
    const t = c[s].tests, ex = c[s].extra || {}, nxt = new Set(nextFor(c, s));
    const order = TESTS[s].map(g=> g.items.map(([id])=> id)).flat();
    // ہو چکے ٹیسٹ: فہرست والے + رپورٹ میں آئے فہرست سے باہر والے
    const done = order.filter(id=> t[id] && t[id].status).map(id=> ({ key:id, en:ALL[id].en, ur:ALL[id].ur, r:t[id], tap:`banjhTest('${s}','${id}')` }))
      .concat(Object.keys(ex).filter(k=> ex[k].status).map(k=> ({ key:k, en:k, ur:'', r:ex[k], tap:`banjhExtra('${s}',${JSON.stringify(k).replace(/"/g, '&quot;')})` })));
    const okD = done.filter(d=> d.r.status === 'ok'), badD = done.filter(d=> d.r.status === 'bad');
    const row = (d, i)=> `<div class="bj-done ${d.r.status}" onclick="${d.tap}"><span class="bj-no ${d.r.status}">${i + 1}</span><span class="bj-pill ${d.r.status}">${d.r.status === 'ok' ? '✓ ٹھیک' : '✗ خراب'}</span>
        <div class="bj-tb"><b class="bj-en" dir="ltr">${esc(d.en)}</b>${d.ur ? ` <span class="bj-ur">— ${esc(d.ur)}</span>` : ''}
        ${d.r.value ? `<div class="bj-val">${esc(d.r.value)}</div>` : ''}${d.r.note ? `<div class="bj-tn">${esc(d.r.note)}</div>` : ''}<div class="bj-hint">📅 ${fmtD(d.r.date || Date.now())}</div></div></div>`;
    let treat = (c[s].treat || []).slice();
    if(!treat.length) treat = badD.map(d=> d.r.note || (d.en + ' خراب')).filter(Boolean);
    const pendN = order.filter(id=> !(t[id] && t[id].status)).length;
    let pno = 0;
    const stages = TESTS[s].map((g, gi)=>{
      const pend = g.items.filter(([id])=> !(t[id] && t[id].status));
      const doneN = g.items.length - pend.length;
      if(!pend.length) return `<div class="bj-stage"><div class="bj-st done">${gi === 0 ? '⭐ ' : ''}${esc(g.st)} — ✓ سب ٹیسٹ ہو گئے (اوپر)</div></div>`;
      const rows = pend.map(([id, en, ur, hint])=>{
        pno++;
        const icon = `<span class="bj-no pd${nxt.has(id) ? ' nx' : ''}">${pno}</span>`;
        return `<div class="bj-test${nxt.has(id) ? ' nx' : ''}" onclick="banjhTest('${s}','${id}')">${icon}<div class="bj-tb">${gi === 0 ? '<span class="bj-basic">⭐ BASIC</span> ' : ''}<b class="bj-en" dir="ltr">${esc(en)}</b><div class="bj-ur">${esc(ur)}</div>
          ${hint ? `<div class="bj-hint">❓ کیوں: ${esc(hint)}</div>` : ''}</div></div>`;
      }).join('');
      return `<div class="bj-stage"><div class="bj-st">${gi === 0 ? '⭐ ' : ''}${esc(g.st)}${doneN ? ` <small>(${doneN} ہو گئے — اوپر)</small>` : ''}</div>${rows}</div>`;
    }).join('');
    const who = s === 'm' ? c.husband : c.wife;
    const nextList = [...nxt].map(id=> `<li>${ALL[id].stage === 0 ? '⭐ ' : ''}<b class="bj-en" dir="ltr">${esc(ALL[id].en)}</b> — ${esc(ALL[id].ur)}</li>`).join('');
    return `<div class="bj-side bj-${s}">
      <h3>${SIDE[s]} — ${esc(who)}</h3>
      ${s === 'm' ? `<div class="bj-warn">⚠ اہم: بانجھ پن (سپرم کی کمی) میں ٹیسٹوسٹیرون کی گولی، ٹیکہ، جیل یا باڈی بلڈنگ کے سٹیرائیڈ ہرگز نہ دیں — اس سے دماغ سپرم بنانے کا حکم (FSH/LH) بند کر دیتا ہے اور سپرم کم یا بالکل ختم ہو جاتے ہیں۔ دوا بند کرنے کے بعد سپرم واپس آنے میں 6–12 ماہ یا زیادہ لگ سکتے ہیں، کبھی پوری طرح واپس نہیں آتے۔ مریض سے ضرور پوچھیں کہ کہیں جم/طاقت کے ٹیکے تو نہیں لے رہا۔</div>` : ''}
      <div class="bj-box all"><div class="bj-bh">✅ مکمل ہو چکے ٹیسٹ (${done.length})</div>
        <div class="bj-cnt"><span class="ok">✓ ٹھیک: ${okD.length}</span><span class="bad">✗ خراب: ${badD.length}</span><span class="pd">⏳ باقی: ${pendN}</span></div>
        ${done.length ? (okD.length ? `<div class="bj-sub ok">✓ ٹھیک ٹیسٹ (${okD.length})</div>` + okD.map(row).join('') : '') + (badD.length ? `<div class="bj-sub bad">✗ خراب ٹیسٹ (${badD.length})</div>` + badD.map(row).join('') : '') : '<div class="bj-hint">ابھی کوئی ٹیسٹ نہیں ہوا — نیچے والے ٹیسٹ کروا کر رپورٹ کی تصویر بھیجیں۔</div>'}
      </div>
      ${badD.length ? `<div class="bj-box bad"><div class="bj-bh">❌ خراب ٹیسٹ (${badD.length}) — پہلے ان کا علاج مکمل کریں، پھر یہی ٹیسٹ دوبارہ کروائیں</div>
        <div class="bj-chips">${badD.map(d=> `<span class="bj-chip bad">✗ ${esc(d.en)}</span>`).join('')}</div>
        ${treat.length ? `<details class="bj-tdet"><summary>🩺 ان بیماریوں کا علاج اور دوائیں دیکھیں (${treat.length})</summary>${treatHtml(treat)}</details>` : ''}
        <div class="bj-hint">علاج کے بعد یہی ٹیسٹ دوبارہ کروا کر رپورٹ بھیجیں — ٹھیک آئے تو سبز ✓ لگ جائے گا</div></div>` : ''}
      ${nxt.size ? `<div class="bj-next"><div class="bj-bh">👉 ${badD.length ? 'ہو سکے تو ساتھ میں یہ ٹیسٹ بھی کروائیں' : 'آگے یہ ٹیسٹ کروائیں'}:</div><ol>${nextList}</ol></div>`
        : `<div class="bj-next done">✓ اس وقت کوئی نیا ٹیسٹ ضروری نہیں${badD.length ? ' — پہلے اوپر والا علاج کریں' : ''}</div>`}
      <label class="btn bj-up">📷 ${s === 'm' ? 'مرد' : 'عورت'} کی رپورٹ کی تصویر بھیجیں<input type="file" accept="image/*" multiple hidden onchange="banjhReport('${s}', this)"></label>
      <div id="bjStatus_${s}" class="bj-status"></div>
      <div class="bj-bh" style="margin-top:12px; color:var(--gold);">⏳ باقی ٹیسٹ (${pendN}) — مرحلہ وار</div>
      ${stages}
    </div>`;
  }
  // فہرست سے باہر والا ٹیسٹ (رپورٹ سے آیا): نتیجہ بدلیں یا ہٹائیں
  window.banjhExtra = async (s, k)=>{
    const c = CUR, ex = (c[s].extra = c[s].extra || {}), r = ex[k] || {};
    const a = prompt(k + '\n\n1 = ✓ ٹھیک\n2 = ✗ خراب\n0 = ہٹا دیں', r.status === 'ok' ? '1' : '2');
    if(a === null) return;
    const m = a.trim().match(/^([012])/); if(!m) return;
    if(m[1] === '0') delete ex[k]; else ex[k] = Object.assign({}, r, { status: m[1] === '1' ? 'ok' : 'bad', date: Date.now() });
    c.log.push({ t:Date.now(), side:s, text: k + ': ' + (m[1] === '0' ? 'ہٹا دیا' : m[1] === '1' ? '✓ ٹھیک' : '✗ خراب') + ' (خود لکھا)' });
    await put(c); render();
  };
  // ریکارڈ: ہر رپورٹ ایک خانے میں — تصویریں اوپر، پھر ✅ ٹھیک / ❌ خراب + علاج / 👉 اگلے ٹیسٹ
  function logEntries(c){
    const out = []; let pend = [];
    (c.log || []).forEach(e=>{
      if(e.img && /^\(رپورٹ کا صفحہ \d+\)$/.test(e.text || '')){ pend.push(e.img); return; }
      const g = Object.assign({}, e);
      g.imgs = (e.imgs || []).slice();
      if(e.img) g.imgs.push(e.img);
      if(pend.length){ g.imgs = pend.concat(g.imgs); pend = []; }
      out.push(g);
    });
    if(pend.length) out.push({ t: Date.now(), side: '', imgs: pend, text: '' });
    return out.reverse();
  }
  function logParse(e){
    if(e.ok || e.bad) return e;
    const r = { summary: [], ok: [], bad: [], treat: [], next: [] };
    String(e.text || '').split('\n').forEach(l=>{
      l = l.trim(); if(!l) return;
      let m;
      if((m = l.match(/^[✓✔]\s*(.*)$/))) r.ok.push(m[1]);
      else if((m = l.match(/^[✗✖]\s*(.*)$/))) r.bad.push(m[1]);
      else if((m = l.match(/^•\s*(.*)$/))) (/زیادہ|کم|انفیکشن|خراب|غیر نارمل|abnormal|high|low/i.test(m[1]) ? r.bad : r.ok).push(m[1]);
      else if((m = l.match(/^🩺\s*علاج کریں\s*:\s*(.*)$/))) r.treat = m[1].split(/\s*،\s*/).filter(Boolean);
      else if((m = l.match(/^👉\s*اگلا ٹیسٹ\s*:\s*(.*)$/))) r.next = m[1].split(/\s*،\s*/).filter(Boolean);
      else r.summary.push(l);
    });
    r.summary = r.summary.join('\n');
    return r;
  }
  function logHtml(c){
    const list = logEntries(c);
    return `<h3 style="color:var(--gold); margin:18px 0 6px; text-align:center;">📒 مکمل ریکارڈ (${list.length})</h3>`
      + (list.map(e=>{
        const p = logParse(e), isRep = p.ok.length || p.bad.length || p.treat.length || p.next.length;
        const li = a=> `<ol>${a.map(x=> `<li>${esc(x)}</li>`).join('')}</ol>`;
        return `<div class="bj-log bj-${e.side}"><div class="bj-log-h">${e.side === 'm' ? '👨 مرد' : e.side === 'f' ? '👩 عورت' : '📝'} · ${new Date(e.t).toLocaleString('en-GB')}${e.imgs.length ? ' · 📷 ' + e.imgs.length + ' صفحے' : ''}</div>
          ${e.imgs.length ? `<div class="bj-imgs">${e.imgs.map(u=> `<img src="${u}" alt="رپورٹ" class="bj-thumb" onclick="this.classList.toggle('big')">`).join('')}</div>` : ''}
          ${isRep ? `${p.summary ? `<div class="bj-lsum">${esc(p.summary)}</div>` : ''}
            ${p.ok.length ? `<div class="bj-box ok"><div class="bj-bh">✅ یہ ٹیسٹ ہو گئے اور ٹھیک ہیں — دوبارہ کروانے کی ضرورت نہیں</div>${li(p.ok)}</div>` : ''}
            ${p.bad.length ? `<div class="bj-box bad"><div class="bj-bh">❌ یہ ٹیسٹ خراب ہیں</div>${li(p.bad)}
              ${p.treat.length ? `<details class="bj-tdet"><summary>🩺 ان بیماریوں کا علاج اور دوائیں دیکھیں (${p.treat.length})</summary>${treatHtml(p.treat)}</details>` : ''}
              <div class="bj-hint" style="font-weight:700;">علاج مکمل ہونے کے بعد یہی ٹیسٹ دوبارہ کروا کر رپورٹ دکھائیں</div></div>` : ''}
            ${p.next.length ? `<div class="bj-next"><div class="bj-bh">👉 آگے یہ ٹیسٹ کروائیں:</div>${li(p.next)}</div>` : ''}`
          : `<div style="white-space:pre-wrap;">${esc(e.text || '')}</div>`}
        </div>`;
      }).join('') || '<p style="text-align:center; color:var(--muted);">ابھی کوئی رپورٹ نہیں</p>');
  }
  function render(){
    const c = CUR, el = root(); if(!c || !el) return;
    el.innerHTML = `<div style="text-align:center; margin-bottom:8px;"><button type="button" class="btn" onclick="banjhList()">⬅ تمام کھاتے</button></div>
      <div class="bj-head">👨 ${esc(c.husband)} <span style="color:var(--muted);">&</span> 👩 ${esc(c.wife)}<div class="bj-case-meta">کھاتہ: ${fmtD(c.created)} · آخری تبدیلی: ${fmtD(c.updated || c.created)}</div></div>
      <div class="bj-tabs"><button type="button" class="${TAB === 'm' ? 'on' : ''}" onclick="banjhTab('m')">👨 مرد</button><button type="button" class="${TAB === 'f' ? 'on' : ''}" onclick="banjhTab('f')">👩 عورت</button></div>
      <div class="bj-cols tab-${TAB}">${sideHtml(c, 'm')}${sideHtml(c, 'f')}</div>
      ${logHtml(c)}
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
  // ⋮ مینیو: کھولیں / نام درست / ڈیلیٹ
  window.banjhMenu = (btn, id)=>{
    const old = document.querySelector('.bj-menu'); if(old){ const same = old.previousElementSibling === btn; old.remove(); if(same) return; }
    const m = document.createElement('div'); m.className = 'bj-menu';
    [['📂 کھاتہ کھولیں', ()=> banjhOpen(id)], ['✏ نام درست کریں', ()=> banjhRenameId(id)], ['🗑 ڈیلیٹ کریں', ()=> banjhDeleteId(id), 1]].forEach(([t, fn, red])=>{
      const b = document.createElement('button'); b.type = 'button'; b.textContent = t; if(red) b.style.color = '#e0524f';
      b.onclick = e=>{ e.stopPropagation(); m.remove(); fn(); }; m.appendChild(b);
    });
    btn.after(m);
  };
  document.addEventListener('click', ()=>{ const m = document.querySelector('.bj-menu'); if(m) m.remove(); });
  window.banjhRenameId = async (id)=>{
    const c = await get(id); if(!c) return;
    const h = prompt('شوہر کا نام:', c.husband); if(h === null) return;
    const w = prompt('بیوی کا نام:', c.wife); if(w === null) return;
    if(h.trim()) c.husband = h.trim(); if(w.trim()) c.wife = w.trim();
    await put(c); list();
  };
  window.banjhDeleteId = async (id)=>{
    const c = await get(id); if(!c) return;
    if(!confirm('"' + c.husband + ' & ' + c.wife + '" کا پورا کھاتہ (سب ٹیسٹ اور رپورٹیں) ہمیشہ کے لیے ڈیلیٹ کر دیں؟')) return;
    await del(id); list();
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
    const lines = [], okL = [], badL = [];
    (d.results || []).forEach(x=>{
      if(!ALL[x.id] || ALL[x.id].side !== s) return;
      if(x.status !== 'ok' && x.status !== 'bad') return;
      c[s].tests[x.id] = { status: x.status, value: x.value || '', note: x.note || '', date: Date.now() };
      const ln = ALL[x.id].name + (x.value ? ': ' + x.value : '') + (x.note ? ' — ' + x.note : '');
      lines.push((x.status === 'ok' ? '✓ ' : '✗ ') + ln); (x.status === 'ok' ? okL : badL).push(ln);
    });
    c[s].extra = c[s].extra || {};
    (d.other || []).forEach(x=>{
      if(x.status === 'ok' || x.status === 'bad') c[s].extra[x.name] = { status: x.status, value: x.value || '', note: x.note || '', date: Date.now() };
      const ln = x.name + (x.value ? ': ' + x.value : '') + (x.note ? ' — ' + x.note : '');
      lines.push((x.status === 'ok' ? '✓ ' : x.status === 'bad' ? '✗ ' : '• ') + ln);
      if(x.status === 'ok') okL.push(ln); else if(x.status === 'bad') badL.push(ln);
    });
    if(Array.isArray(d.treat)) c[s].treat = d.treat;
    c[s].next = (d.next || []).filter(id=> ALL[id] && ALL[id].side === s);
    const text = (d.summary ? d.summary + '\n' : '') + lines.join('\n')
      + (c[s].treat.length ? '\n🩺 علاج کریں: ' + c[s].treat.join('، ') : '')
      + (c[s].next.length ? '\n👉 اگلا ٹیسٹ: ' + c[s].next.map(id=> ALL[id].name).join('، ') : '');
    c.log.push({ t: Date.now(), side: s, imgs: thumbs, text, summary: d.summary || '', ok: okL, bad: badL, treat: c[s].treat.slice(), next: c[s].next.map(id=> ALL[id].name) });
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
  .bj-case{position:relative;}
  .bj-dots{position:absolute; top:6px; left:6px; width:32px; height:32px; border:none; background:transparent; color:var(--gold); font-size:1.5rem; line-height:1; border-radius:50%; cursor:pointer;}
  .bj-dots:hover{background:var(--border);}
  .bj-menu{position:absolute; top:40px; left:6px; z-index:20; background:var(--card); border:1px solid var(--border); border-radius:10px; box-shadow:0 6px 18px rgba(0,0,0,.18); display:flex; flex-direction:column; min-width:170px; overflow:hidden;}
  .bj-menu button{background:none; border:none; border-bottom:1px solid var(--border); padding:10px 14px; text-align:right; font-family:inherit; font-size:.92rem; color:var(--text); cursor:pointer;}
  .bj-menu button:last-child{border-bottom:none;}
  .bj-case-names{padding-left:40px; font-weight:700; color:var(--gold); font-size:1.05rem;}
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
  .bj-box.all{background:rgba(31,157,85,.05); border:2px solid #1f9d55;}
  .bj-box.all > .bj-bh{color:#1f9d55;}
  .bj-no{flex:0 0 24px; height:24px; line-height:24px; border-radius:50%; text-align:center; color:#fff; font-weight:700; font-size:.8rem; font-family:Poppins, Arial, sans-serif; margin-top:2px;}
  .bj-no.ok{background:#1f9d55;} .bj-no.bad{background:#e0524f;} .bj-no.pd{background:#8a8a8a;} .bj-no.pd.nx{background:#c9821b;}
  .bj-sub{font-weight:700; font-size:.85rem; margin:8px 0 2px; padding:2px 8px; border-radius:8px; color:#fff;}
  .bj-sub.ok{background:#1f9d55;} .bj-sub.bad{background:#e0524f;}
  .bj-tl{margin:4px 22px 0 0; padding:0;} .bj-tl > li{margin:6px 0;}
  .bj-meds{background:var(--card); border:1px dashed var(--border); border-radius:8px; padding:4px 8px; margin-top:3px;}
  .bj-med{font-size:.82rem; line-height:1.9; padding:4px 0; border-bottom:1px dotted var(--border);}
  .bj-role{display:inline-block; font-size:.72rem; font-weight:700; border-radius:10px; padding:0 8px; color:#fff; margin-bottom:2px;}
  .bj-role.first{background:#1f9d55;} .bj-role.alt{background:#8a8a8a;} .bj-role.add{background:#2b6cb0;}
  .bj-one{font-size:.8rem; font-weight:700; color:#c9821b; margin-bottom:4px;}
  .bj-days{margin-right:22px; font-size:.8rem; color:#1f6f3f; font-weight:700;}
  .bj-warn{background:#fdecea; border:2px solid #e0524f; color:#b03a37; border-radius:10px; padding:6px 10px; font-size:.82rem; font-weight:700; line-height:1.9; margin-bottom:8px;}
  .bj-tdet{margin-top:8px; border:1px solid #e0524f; border-radius:10px; background:var(--card);}
  .bj-tdet > summary{cursor:pointer; padding:8px 10px; font-weight:700; color:var(--text); font-size:.92rem; list-style:none;}
  .bj-tdet > summary::-webkit-details-marker{display:none;}
  .bj-tdet > summary::before{content:'◀'; display:inline-block; margin-left:8px; color:#e0524f; transition:transform .2s;}
  .bj-tdet[open] > summary::before{transform:rotate(-90deg);}
  .bj-tdet[open] > summary{border-bottom:1px dashed var(--border);}
  .bj-tdet > .bj-tl, .bj-tdet > .bj-rx{margin-left:8px; margin-right:8px;} .bj-tdet > .bj-rx{padding-bottom:8px;}
  .bj-mrow{margin-right:22px;} .bj-lb{color:var(--muted); font-size:.75rem;}
  .bj-brand{color:#2b6cb0; font-family:Poppins, Arial, sans-serif; font-size:.85rem;} .bj-co{color:#7b3fa0; font-family:Poppins, Arial, sans-serif; font-size:.82rem;} .bj-cn{font-size:.75rem; color:var(--muted);}
  .bj-mnote{font-size:.75rem; color:#b03a37;}
  .bj-rx{font-size:.74rem; color:#b03a37; margin-top:6px; font-weight:700;}
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
  .bj-imgs{display:flex; flex-wrap:wrap; gap:6px; margin:6px 0;}
  .bj-thumb{width:84px; height:110px; object-fit:cover; border-radius:6px; border:1px solid var(--border); cursor:zoom-in;}
  .bj-thumb.big{width:100%; height:auto; object-fit:contain;}
  .bj-lsum{white-space:pre-wrap; margin:4px 0 6px;}
  .bj-log .bj-box ol, .bj-log .bj-next ol{margin:2px 22px 0 0; padding:0;}
  `;
  document.head.appendChild(css);

  window.banjhInit = ()=>{ if(!CUR) list(); };
})();
