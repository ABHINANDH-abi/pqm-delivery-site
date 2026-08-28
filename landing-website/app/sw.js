// Service Worker for PQM Driver & Customer App Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🛵 PQM Driver Alert!', body: 'New Order Available for Delivery' };
  try {
    data = event.data ? event.data.json() : data;
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=128&q=80',
      badge: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=128&q=80',
      vibrate: [200, 100, 200, 100, 200],
      tag: data.tag || 'pqm-order-notification',
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/app');
    })
  );
});
