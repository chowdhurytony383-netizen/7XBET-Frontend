/* 7XBET Firebase Messaging Service Worker */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBrtBb2c2mtDWem7bdAGhdw6FPFWU-PmM',
  authDomain: 'xbet-3aac9.firebaseapp.com',
  projectId: 'xbet-3aac9',
  storageBucket: 'xbet-3aac9.firebasestorage.app',
  messagingSenderId: '704595352584',
  appId: '1:704595352584:web:34aee5cbd2dc8ba040c5bd',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(notification.title || 'Lucky Wheel Ready', {
    body: notification.body || 'Your free spin is ready. Claim now!',
    icon: '/icons/notification-icon.png',
    badge: '/icons/notification-badge.png',
    tag: 'lucky-wheel-ready',
    data: {
      url: data.url || '/free-spin',
    },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/free-spin', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return null;
    })
  );
});
