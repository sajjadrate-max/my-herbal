// sw.js — My Herbal | قانونِ مفرد اعضاء
// مقصد: سائٹ کو آف لائن اور ایپ کی طرح انسٹال کے قابل بنانا، اور دوبارہ کھولنے پر فوراً کھلنا

const CACHE_NAME = 'my-herbal-cache-v19';
const ASSETS_TO_CACHE = [
  '/',
  '/herbal.html',
  '/mareez-khata.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
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
