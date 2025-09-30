const CACHE_NAME = 'chefbook-v1';
const urlsToCache = [
  'https://sweizeur.github.io/chefbook-pwa/',
  'https://sweizeur.github.io/chefbook-pwa/index.html',
  'https://sweizeur.github.io/chefbook-pwa/manifest.json',
  'https://sweizeur.github.io/chefbook-pwa/icon-192.png',
  'https://sweizeur.github.io/chefbook-pwa/icon-512.png',
  'https://sweizeur.github.io/chefbook-pwa/favicon.ico',
  'https://sweizeur.github.io/chefbook-pwa/static/js/index-72b8e7d22565edb680c689056efbcdab.js'
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
