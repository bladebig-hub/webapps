const CACHE_NAME = 'winter-carnival-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle http/https requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }

        // Cache the response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(event.request, responseClone);
          } catch (err) {
            // Ignore cache errors (e.g. quota exceeded or opaque responses in strict modes)
          }
        });

        return response;
      })
      .catch(() => {
        // If network fails, try to return from cache
        return caches.match(event.request);
      })
  );
});