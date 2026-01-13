const CACHE_NAME = 'skyemovie-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './tv-remote.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const respClone = resp.clone();
      // cache same-origin assets
      if (new URL(req.url).origin === self.location.origin) {
        caches.open(CACHE_NAME).then(cache => cache.put(req, respClone)).catch(()=>{});
      }
      return resp;
    }).catch(() => cached))
  );
});
