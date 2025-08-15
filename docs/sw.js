// StackSleuth Service Worker v1.0.0
const CACHE_NAME = 'stacksleuth-docs-v1';
const urlsToCache = [
  '/StackSleuth/',
  '/StackSleuth/css/gitbook.css',
  '/StackSleuth/js/gitbook.js',
  '/StackSleuth/logo.svg',
  '/StackSleuth/getting-started.html',
  '/StackSleuth/dashboard.html',
  '/StackSleuth/packages.html',
  '/StackSleuth/api-reference.html',
  '/StackSleuth/examples.html',
  '/StackSleuth/configuration.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
