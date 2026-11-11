// sw.js — My Herbal | قانونِ مفرد اعضاء
// مقصد: ویب سائٹ انٹرنیٹ کے بغیر بھی پوری کھلے اور چلے؛ صرف AI کے جواب (/api/) کے لیے انٹرنیٹ چاہیے

const CACHE_NAME = 'my-herbal-cache-v112';
// کتابوں کا متن، PDF، لائبریریاں اور فونٹ الگ کیش میں — نئی ریلیز پر یہ نہیں مٹتا (ورنہ ہر اپ ڈیٹ کے بعد آف لائن کتابیں غائب)
const DATA_CACHE = 'my-herbal-data-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/herbal.html',
  '/icon-192.png',
  '/icon-512-maskable.png'
];
// پہلی بار انٹرنیٹ پر کھلتے ہی یہ سب فون میں محفوظ — تاکہ بعد میں آف لائن سب کچھ چلے
const DATA_TO_CACHE = [
  '/pm-data-ilaj-ul-amraz.json',
  '/pm-data-cholesterol-urdu.json',
  '/pm-data-asaan-ilaj.json',
  '/pm-data-gharelu-nuskhe-1.json',
  '/pm-data-mamoolat-matab.json',
  '/pm-data-qanoon-mufrad-aza-dama.json',
  '/pm-data-amraz-e-gurda-masana.json',
  '/pm-data-mufrad-aza-mizaj-chart.json',
  '/pm-data-mujarrabat-sehranasheen.json',
  '/pm-data-mujarrabat-zikai.json',
  '/pm-data-aurat-shadi-se-zachgi.json',
  '/hz-data-khawas-ul-mufradat-adalati.json',
  '/hz-data-khawas-ul-mufradat-ghudi.json',
  '/hz-data-khawas-ul-mufradat-asabi.json',
  '/hz-data-kushta-jaat.json',
  '/ilaj.txt',
  '/kitab-jagah.json',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Amiri:wght@400;700&family=Poppins:wght@400;600;700&display=swap'
];
const OFFLINE_MSG = '📶 انٹرنیٹ بند ہے — اس جواب کے لیے انٹرنیٹ آن کریں۔';

// انسٹال: بنیادی فائلیں اور کتابوں کا ڈیٹا کیش کریں (ایک فائل نہ ملے تو باقی پھر بھی)
self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then((cache) => Promise.allSettled(ASSETS_TO_CACHE.map((u) => cache.add(u)))),
    caches.open(DATA_CACHE).then((cache) => Promise.allSettled(DATA_TO_CACHE.map((u) =>
      fetch(u, { cache: 'no-cache', mode: u.startsWith('http') ? 'cors' : 'same-origin' })
        .then((res) => { if (res && (res.ok || res.type === 'opaque')) return cache.put(u, res); })
    )))
  ]));
  self.skipWaiting();
});

// ایکٹیویٹ: صرف پرانے ورژن کا کیش صاف کریں — کتابوں والا کیش رہنے دیں
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME && key !== DATA_CACHE).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

const okToCache = (res) => res && (res.status === 200 || res.type === 'opaque');

// نیٹ ورک پہلے، نہ ملے تو محفوظ ورژن
function networkFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    fetch(request).then((res) => {
      if (res && res.status === 200) cache.put(request, res.clone());
      return res;
    }).catch(() => cache.match(request, { ignoreSearch: true }).then((c) => c || caches.match(request, { ignoreSearch: true })))
  );
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // AI کے جواب: ہمیشہ انٹرنیٹ سے؛ نہ ہو تو صاف پیغام (کبھی کیش نہیں)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response(
      JSON.stringify({ error: OFFLINE_MSG, offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'X-Offline': '1' } }
    )));
    return;
  }

  if (event.request.method !== 'GET') return;

  // Google AdSense کی درخواستیں سیدھی نیٹ ورک پر جائیں (کیش نہ ہوں)
  if (/(^|\.)(googlesyndication|doubleclick|googleadservices|adtrafficquality)\.|google\.com$/.test(url.hostname)) return;
  // GitHub API (کتابوں کی خودکار فہرست) اور فارم — کیش کی ضرورت نہیں
  if (url.hostname === 'api.github.com' || url.hostname === 'formsubmit.co') return;

  // PDF کتابیں: صفحہ کھولتے وقت صرف ضرورت کا حصہ (Range) سیدھا نیٹ سے؛ پوری فائل صرف "hc=1" والی درخواست پر
  // فون میں محفوظ ہوتی ہے (اسی کے بغیر والے پتے پر)؛ محفوظ ہو تو پوری فائل فون سے
  if (/\.pdf$/i.test(url.pathname)) {
    if (event.request.headers.has('range')) return;
    const clean = new URL(url.href); clean.searchParams.delete('hc');
    if (url.searchParams.get('hc') === '1') {
      event.respondWith(caches.open(DATA_CACHE).then((cache) => cache.match(clean.href).then((c) => c ||
        fetch(clean.href).then((res) => { if (res && res.status === 200) cache.put(clean.href, res.clone()); return res; }))));
      return;
    }
    event.respondWith(caches.open(DATA_CACHE).then((cache) => cache.match(clean.href).then((c) => c || fetch(event.request))));
    return;
  }

  // بدلتی رہنے والی فہرستیں: ہمیشہ تازہ (نیٹ نہ ہو تو محفوظ ورژن)
  if (url.pathname.endsWith('/books/uploads.json') || url.pathname === '/ilaj.txt' || url.pathname === '/kitab-jagah.json') {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
    return;
  }

  // صفحات (HTML): نیٹ ورک سے تازہ — نیٹ نہ ہو یا 5 سیکنڈ میں جواب نہ آئے تو محفوظ ورژن
  const isPage = event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  if (isPage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        const network = fetch(event.request).then((res) => {
          if (res && res.status === 200) cache.put(event.request, res.clone());
          return res;
        });
        const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
        return Promise.race([network.catch(() => null), timeout]).then((res) =>
          res || cache.match(event.request, { ignoreSearch: true })
            .then((cached) => cached || cache.match('/herbal.html') || cache.match('/'))
            .then((cached) => cached || network)
        );
      })
    );
    return;
  }

  // باقی سب (کتابوں کا متن، PDF، تصاویر، لائبریریاں، فونٹ): محفوظ ورژن فوراً، پیچھے سے تازہ
  const cacheName = url.origin === self.location.origin && /\.(png|ico|svg)$/i.test(url.pathname) ? CACHE_NAME : DATA_CACHE;
  event.respondWith(
    caches.open(cacheName).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request).then((res) => {
          if (okToCache(res)) cache.put(event.request, res.clone());
          return res;
        }).catch(() => cached || caches.match(event.request));
        if (cached) {
          event.waitUntil(network.catch(() => {}));
          return cached;
        }
        return network;
      })
    )
  );
});
