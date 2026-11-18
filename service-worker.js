const CACHE_NAME = 'prasannaone-nonogram-shell-v25';
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
  './web-port/completion.js',
  './web-port/pointer-input.js',
  './web-port/keyboard-input.js',
  './web-port/puzzle-preloader.js',
  './web-port/puzzle-preload-core.js',
  './web-port/puzzle-worker.js'
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
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const previousShells = keys.filter(key =>
      key.startsWith('prasannaone-nonogram-shell-') && key !== CACHE_NAME
    );
    await Promise.all(previousShells.map(key => caches.delete(key)));
    await self.clients.claim();

    // When upgrading an existing installation, navigate open game tabs once so
    // they immediately load the new shell. First installs do not force a reload.
    if (previousShells.length) {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(clients.map(client => {
        const url = new URL(client.url);
        if (url.origin !== self.location.origin || !url.href.startsWith(APP_BASE.href)) return null;
        return client.navigate(client.url).catch(() => null);
      }));
    }
  })());
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

  // Network-first for app assets: online visits pick up new deployments without
  // asking users to clear browser data. The installed shell remains the offline fallback.
  event.respondWith(
    fetch(new Request(request, { cache: 'no-cache' }))
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || Response.error())
  );
});
