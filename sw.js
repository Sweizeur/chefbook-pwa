const CACHE_NAME = 'chefbook-v1';
const urlsToCache = [
  '/chefbook-pwa/',
  '/chefbook-pwa/index.html',
  '/chefbook-pwa/manifest.json',
  '/chefbook-pwa/icon-192.png',
  '/chefbook-pwa/icon-512.png',
  '/chefbook-pwa/favicon.ico',
  '/chefbook-pwa/static/js/index-72b8e7d22565edb680c689056efbcdab.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
