// Simple placeholder service worker for PWA installability.
self.addEventListener('install', () => {
  // No-op for now; extend with caching later.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
