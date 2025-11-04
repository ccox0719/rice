const CACHE_NAME = 'rice-bowl-planner-v6';
const PRECACHE_URLS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'Rice Co - Drinks.csv',
  'Rice Co - Equipment.csv',
  'Rice Co - Prices.csv',
  'Rice Co - Sauces.csv',
  'Rice Co - Seasoning.csv',
  'Rice Co - Time Study.csv'
];
const PRECACHE_URL_SET = new Set(PRECACHE_URLS.map(path => new URL(path, self.location.origin).href));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

const cacheFirst = async request => {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      await putInCache(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached;
  }
};

const networkFirst = async request => {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      await putInCache(request, fresh.clone());
    }
    return fresh;
  } catch (error) {
    return caches.match(request);
  }
};

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('index.html'))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('.csv')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (PRECACHE_URL_SET.has(event.request.url) || ['style', 'script', 'image', 'font'].includes(event.request.destination)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
