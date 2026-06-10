import { NotificationsAPI } from '../api/notifications.js';

const TOKEN_STORAGE_KEY = '7xbet.webPushTokenSaved';

function hasFirebaseConfig() {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID &&
    import.meta.env.VITE_FIREBASE_VAPID_KEY
  );
}

function replaceServiceWorkerConfig(source) {
  const replacements = {
    __VITE_FIREBASE_API_KEY__: import.meta.env.VITE_FIREBASE_API_KEY || '',
    __VITE_FIREBASE_AUTH_DOMAIN__: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    __VITE_FIREBASE_PROJECT_ID__: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    __VITE_FIREBASE_STORAGE_BUCKET__: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    __VITE_FIREBASE_MESSAGING_SENDER_ID__: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    __VITE_FIREBASE_APP_ID__: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  return Object.entries(replacements).reduce(
    (text, [key, value]) => text.replaceAll(key, value),
    source
  );
}

async function registerFirebaseServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  const response = await fetch('/firebase-messaging-sw.js', { cache: 'no-cache' });
  const swSource = await response.text();
  const blob = new Blob([replaceServiceWorkerConfig(swSource)], { type: 'text/javascript' });
  const swUrl = URL.createObjectURL(blob);

  return navigator.serviceWorker.register(swUrl);
}

async function loadFirebaseMessaging() {
  const [{ initializeApp }, { getMessaging, getToken, isSupported }] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ]);

  const supported = await isSupported();
  if (!supported) return null;

  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });

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
