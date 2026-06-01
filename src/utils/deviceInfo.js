const DEVICE_ID_KEY = '7xbet.client.deviceId';
const DEVICE_REPORT_KEY = '7xbet.client.deviceInfoLastReportAt';
const DEFAULT_REPORT_INTERVAL_MS = 10 * 60 * 1000;

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeRead(key) {
  try {
    if (!storageAvailable()) return '';
    return window.localStorage.getItem(key) || '';
  } catch (_) {
    return '';
  }
}

function safeWrite(key, value) {
  try {
    if (!storageAvailable()) return;
    if (value === undefined || value === null || value === '') window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(value));
  } catch (_) {}
}

function createDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const randomPart = Math.random().toString(36).slice(2);
  const timePart = Date.now().toString(36);
  return `device-${timePart}-${randomPart}`;
}

export function getClientDeviceId() {
  const existing = safeRead(DEVICE_ID_KEY);
  if (existing) return existing;
  const nextId = createDeviceId();
  safeWrite(DEVICE_ID_KEY, nextId);
  return nextId;
}

function getConnectionInfo() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return {};
  return {
    effectiveType: connection.effectiveType || '',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: Boolean(connection.saveData),
  };
}

function getOrientation() {
  return window.screen?.orientation?.type || window.orientation || '';
}

export function collectDeviceInfo(activityType = 'heartbeat') {
  if (typeof window === 'undefined') return { activityType };

  const nav = window.navigator || {};
  const screen = window.screen || {};

  return {
    clientDeviceId: getClientDeviceId(),
    activityType,
    path: `${window.location.pathname || ''}${window.location.search || ''}`,
    userAgent: nav.userAgent || '',
    platform: nav.platform || '',
    vendor: nav.vendor || '',
    language: nav.language || '',
    languages: Array.isArray(nav.languages) ? nav.languages.slice(0, 8) : [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    cookiesEnabled: Boolean(nav.cookieEnabled),
    online: Boolean(nav.onLine),
    doNotTrack: nav.doNotTrack || window.doNotTrack || '',
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || 0,
    maxTouchPoints: nav.maxTouchPoints || 0,
    colorDepth: screen.colorDepth || 0,
    pixelRatio: window.devicePixelRatio || 1,
    screen: {
      width: screen.width || 0,
      height: screen.height || 0,
      availWidth: screen.availWidth || 0,
      availHeight: screen.availHeight || 0,
      orientation: String(getOrientation() || ''),
    },
    viewport: {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
    },
    connection: getConnectionInfo(),
  };
}

export function shouldReportDeviceInfo({ force = false, intervalMs = DEFAULT_REPORT_INTERVAL_MS } = {}) {
  if (force) return true;
  const last = Number(safeRead(DEVICE_REPORT_KEY) || 0);
  if (!last) return true;
  return Date.now() - last >= intervalMs;
}

export function markDeviceInfoReported() {
  safeWrite(DEVICE_REPORT_KEY, Date.now());
}
