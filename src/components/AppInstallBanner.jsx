import { useEffect, useState } from 'react';
import { FaAndroid } from 'react-icons/fa';
import './AppInstallBanner.css';

const APK_URL = '/downloads/7xbet-android.apk';
const STORAGE_KEY = '7xbet_android_app_banner_hidden';
const APP_VIEW_KEY = '7xbet_running_inside_android_app';

function isAndroidWebView() {
  const userAgent = navigator.userAgent || '';

  return (
    /Android/i.test(userAgent) &&
    (
      /; wv\)/i.test(userAgent) ||
      /Version\/[\d.]+/i.test(userAgent) ||
      /WebView/i.test(userAgent)
    )
  );
}

export default function AppInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appFlag = params.get('app');

    // If website is opened from your Android WebView app with ?app=android
    if (appFlag === 'android') {
      localStorage.setItem(APP_VIEW_KEY, 'true');
      setVisible(false);
      return;
    }

    // If Android WebView is detected automatically
    if (isAndroidWebView()) {
      localStorage.setItem(APP_VIEW_KEY, 'true');
      setVisible(false);
      return;
    }

    // If this browser was already marked as inside app
    const isInsideAndroidApp = localStorage.getItem(APP_VIEW_KEY) === 'true';
    if (isInsideAndroidApp) {
      setVisible(false);
      return;
    }

    const hidden = localStorage.getItem(STORAGE_KEY) === 'true';
    const userAgent = navigator.userAgent || '';
    const isAndroid = /Android/i.test(userAgent);

    // Show only on normal Android browser
    if (!hidden && isAndroid) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleDownload = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="app-install-banner">
      <button
        type="button"
        className="app-install-close"
        onClick={handleClose}
        aria-label="Close app download banner"
      >
        ×
      </button>

      <div className="app-install-icon">
        <FaAndroid />
      </div>

      <div className="app-install-text">
        <strong>Install the app</strong>
        <span>It&apos;s quicker and easier</span>
      </div>

      <a
        className="app-install-download"
        href={APK_URL}
        download="7xbet-android.apk"
        onClick={handleDownload}
        aria-label="Download 7XBET Android App"
      >
        Download
      </a>
    </div>
  );
}