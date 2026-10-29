// sw.js — My Herbal | قانونِ مفرد اعضاء
// مقصد: سائٹ کو آف لائن اور ایپ کی طرح انسٹال کے قابل بنانا، اور دوبارہ کھولنے پر فوراً کھلنا

const CACHE_NAME = 'my-herbal-cache-v90';
const ASSETS_TO_CACHE = [
  '/',
  '/herbal.html',
  '/icon-192.png',
  '/icon-512-maskable.png'
];

// انسٹال: بنیادی فائلیں کیش کریں
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // اگر کوئی فائل نہ ملے تو باقی فائلیں پھر بھی کیش ہو جائیں
      });
    })
  );
  self.skipWaiting();
});

// ایکٹیویٹ: پرانے کیش صاف کریں
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// فیچ: کیش میں ہو تو فوراً وہی دیں اور پیچھے سے نیٹ ورک سے تازہ کر لیں (اگلی بار نیا ورژن)؛
// کیش میں نہ ہو تو نیٹ ورک سے لیں۔ نئی ریلیز پر CACHE_NAME بدلنے سے پرانا کیش خود صاف ہو جاتا ہے۔
// نوٹ: /api/ کالز کبھی کیش نہ کریں (دوا کا جواب ہمیشہ تازہ ہونا چاہیے)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response(
      JSON.stringify({ error: 'آف لائن ہیں — انٹرنیٹ سے جڑیں۔' }),
      { headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  if (event.request.method !== 'GET') return;

  // Google AdSense کی درخواستیں سیدھی نیٹ ورک پر جائیں (کیش نہ ہوں)
  if (/(^|\.)(googlesyndication|doubleclick|googleadservices|adtrafficquality)\.|google\.com$/.test(url.hostname)) return;

  // ویب سائٹ سے اپ لوڈ کی گئی کتابوں کی فہرست ہمیشہ تازہ (نیٹ ورک نہ ہو تو محفوظ ورژن)
  if (url.pathname.endsWith('/books/uploads.json') || url.pathname === '/ilaj.txt') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        fetch(event.request).then((res) => {
          if (res && res.status === 200) cache.put(event.request, res.clone());
          return res;
        }).catch(() => cache.match(event.request))
      )
    );
    return;
  }

  // صفحات (HTML): ہمیشہ نیٹ ورک سے تازہ ورژن — نیٹ ورک نہ ہو یا 5 سیکنڈ میں جواب نہ آئے تو محفوظ ورژن
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
          res || cache.match(event.request).then((cached) => cached || network)
        );
      })
    );
    return;
  }

  // باقی فائلیں (تصاویر، ڈیٹا): محفوظ ورژن فوراً، پیچھے سے تازہ
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cached);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return network;
      })
    )
  );
});
