self.addEventListener('install', event => {
  event.waitUntil(
      self.skipWaiting()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
      clients.claim()
  );
});

self.addEventListener('push', event => {
  const data = event.data ? JSON.parse(event.data.text()) : null;
  if(!data) {
    console.error("No data received in push event");
    return;
  }
  
  console.log("Push event received:", data);
  event.waitUntil(
      self.registration.showNotification(data.title, data.options)
  );
});