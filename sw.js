const CACHE_VERSION = 'cabas-2.4.1';
const CORE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
const CDN = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION && k !== 'cabas-photos').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Page : réseau d'abord
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, {cache:'no-store'}).then(r => {
        const copy = r.clone();
        caches.open(CACHE_VERSION).then(c => c.put('./index.html', copy));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Ressources locales et bibliothèque cartographique : cache d'abord
  if (url.origin === location.origin || CDN.includes(url.host)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if (r.ok || r.type === 'opaque') {
          const copy = r.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return r;
      }))
    );
  }
  // API externes (OpenStreetMap, Open Food Facts…) : réseau direct
});
