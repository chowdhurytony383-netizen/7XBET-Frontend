import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { NotificationsAPI } from '../api/notifications.js';

const TOKEN_STORAGE_KEY = '7xbet.webPushTokenSaved';

function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

function hasFirebaseConfig() {
  const config = getFirebaseConfig();

  return Boolean(
    config.apiKey &&
    config.projectId &&
    config.messagingSenderId &&
    config.appId &&
    import.meta.env.VITE_FIREBASE_VAPID_KEY
  );
}

async function registerFirebaseServiceWorker() {
  if (!('serviceWorker' in navigator)) return undefined;

  // Service workers must be registered from a same-origin JavaScript file.
  // Blob URLs are not supported by Chrome for ServiceWorker registration.
  return navigator.serviceWorker.register('/firebase-messaging-sw.js');
}

async function loadFirebaseMessaging() {
  const supported = await isSupported();
  if (!supported) return null;

  const app = initializeApp(getFirebaseConfig());

  return {
    messaging: getMessaging(app),
    getToken,
  };
}

export async function enableLuckyWheelPushNotifications() {
  if (typeof window === 'undefined') return { enabled: false, reason: 'browser-unavailable' };
  if (!hasFirebaseConfig()) return { enabled: false, reason: 'firebase-config-missing' };
  if (!('Notification' in window)) return { enabled: false, reason: 'notification-api-unavailable' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { enabled: false, reason: permission };

  const serviceWorkerRegistration = await registerFirebaseServiceWorker();
  const firebaseMessaging = await loadFirebaseMessaging();

  if (!firebaseMessaging) return { enabled: false, reason: 'firebase-messaging-unsupported' };

  const token = await firebaseMessaging.getToken(firebaseMessaging.messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });

  if (!token) return { enabled: false, reason: 'token-unavailable' };

  await NotificationsAPI.saveToken({ token, permission: 'granted' });
  localStorage.setItem(TOKEN_STORAGE_KEY, 'true');

  return { enabled: true, token };
}

export function shouldShowLuckyWheelNotificationPrompt(user) {
  if (!user) return false;
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!hasFirebaseConfig()) return false;
  if (Notification.permission === 'denied') return false;
  if (localStorage.getItem(TOKEN_STORAGE_KEY) === 'true' && Notification.permission === 'granted') return false;
  return true;
}
