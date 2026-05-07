import { DEFAULT_SITE_LANGUAGE, SITE_LANGUAGES, getSavedSiteLanguage, saveSiteLanguage } from './languages.js';

const SCRIPT_ID = 'google-translate-widget-script';
const ELEMENT_ID = 'google_translate_element';
const PAGE_LANGUAGE = 'en';
let initPromise = null;

function getIncludedLanguages() {
  return SITE_LANGUAGES.map((item) => item.code).filter((code) => code !== DEFAULT_SITE_LANGUAGE).join(',');
}

function ensureTranslateContainer() {
  if (typeof document === 'undefined') return null;
  let container = document.getElementById(ELEMENT_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = ELEMENT_ID;
    container.className = 'google-translate-hidden';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);
  }
  return container;
}

function cookieDomainCandidates() {
  if (typeof window === 'undefined') return [''];
  const host = window.location.hostname;
  const parts = host.split('.').filter(Boolean);
  const candidates = [''];

  if (host && host !== 'localhost' && parts.length > 1) {
    candidates.push(host);
    candidates.push(`.${parts.slice(-2).join('.')}`);
  }

  return [...new Set(candidates)];
}

function setCookie(name, value, maxAgeSeconds = 31536000) {
  if (typeof document === 'undefined') return;
  for (const domain of cookieDomainCandidates()) {
    const domainPart = domain ? `;domain=${domain}` : '';
    document.cookie = `${name}=${value};path=/;max-age=${maxAgeSeconds};SameSite=Lax${domainPart}`;
  }
}

function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  for (const domain of cookieDomainCandidates()) {
    const domainPart = domain ? `;domain=${domain}` : '';
    document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax${domainPart}`;
  }
}

function dispatchComboChange(languageCode) {
  if (typeof document === 'undefined') return false;
  const combo = document.querySelector('select.goog-te-combo');
  if (!combo) return false;
  combo.value = languageCode;
  combo.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function restorePageTop() {
  if (typeof document === 'undefined') return;
  document.documentElement.style.top = '0px';
  document.body.style.top = '0px';
}

export function initGoogleTranslate() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  if (initPromise) return initPromise;

  ensureTranslateContainer();

  initPromise = new Promise((resolve) => {
    if (window.google?.translate?.TranslateElement) {
      try {
        window.google.translate.TranslateElement(
          {
            pageLanguage: PAGE_LANGUAGE,
            includedLanguages: getIncludedLanguages(),
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          ELEMENT_ID,
        );
      } catch (error) {
        // Ignore duplicate widget initialization. The existing widget can still be used.
      }
      resolve(true);
      return;
    }

    window.googleTranslateElementInit = () => {
      try {
        ensureTranslateContainer();
        window.google.translate.TranslateElement(
          {
            pageLanguage: PAGE_LANGUAGE,
            includedLanguages: getIncludedLanguages(),
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          ELEMENT_ID,
        );
      } catch (error) {
        // The script may call the callback more than once; keep the app running.
      }
      resolve(true);
    };

    if (document.getElementById(SCRIPT_ID)) {
      window.setTimeout(() => resolve(true), 900);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return initPromise;
}

export async function applySiteLanguage(languageCode, options = {}) {
  if (typeof window === 'undefined') return;

  const nextLanguage = languageCode || DEFAULT_SITE_LANGUAGE;
  const { reloadToOriginal = true } = options;

  saveSiteLanguage(nextLanguage);

  if (nextLanguage === DEFAULT_SITE_LANGUAGE) {
    deleteCookie('googtrans');
    restorePageTop();
    if (reloadToOriginal) {
      window.location.reload();
    }
    return;
  }

  setCookie('googtrans', `/${PAGE_LANGUAGE}/${nextLanguage}`);
  await initGoogleTranslate();

  let applied = dispatchComboChange(nextLanguage);

  if (!applied) {
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    applied = dispatchComboChange(nextLanguage);
  }

  if (!applied && options.reloadIfNeeded) {
    window.location.reload();
  }

  restorePageTop();
}

export function reapplySavedSiteLanguage() {
  if (typeof window === 'undefined') return;
  const savedLanguage = getSavedSiteLanguage();
  if (!savedLanguage || savedLanguage === DEFAULT_SITE_LANGUAGE) return;

  window.setTimeout(() => {
    applySiteLanguage(savedLanguage, { reloadToOriginal: false, reloadIfNeeded: false });
  }, 350);
}
