console.log('Service Worker loaded');

self.addEventListener('install', (event) => {
console.log('Service Worker installé');
event.waitUntil(self.skipWaiting()); // Activation immédiate
});

self.addEventListener('activate', (event) => {
console.log('Service Worker activé');
event.waitUntil(self.clients.claim()); // Prend le contrôle des pages ouvertes
});

self.addEventListener('fetch', (event) => {
console.log('Intercepting request:', event.request.url);
});