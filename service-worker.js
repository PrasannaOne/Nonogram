const CACHE_NAME = 'prasannaone-nonogram-shell-v14';
const APP_BASE = new URL('./', self.location.href);
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/nonogram-192.png',
  './icons/nonogram-512.png',
  './web-port/styles.css',
  './web-port/app.js',
  './web-port/nonogram.js',
  './web-port/interaction.js',
  './web-port/progress.js',
  './web-port/storage.js',
  './web-port/layout.js',
  './web-port/pointer-input.js',
  './web-port/keyboard-input.js'
].map(path => new URL(path, APP_BASE).href);
const INDEX_URL = new URL('./index.html', APP_BASE).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('prasannaone-nonogram-shell-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(APP_BASE.href)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(INDEX_URL, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(INDEX_URL)) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
