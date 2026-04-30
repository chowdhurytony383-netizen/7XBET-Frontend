import { countries, defaultCountry, findCountryByName } from './countries.js';

export const CURRENCY_STORAGE_KEY = 'xbet_preferred_currency';
export const COUNTRY_STORAGE_KEY = 'xbet_preferred_country';

const currencyLocaleMap = {
  AED: 'ar-AE', AFN: 'fa-AF', ALL: 'sq-AL', AMD: 'hy-AM', ANG: 'nl-CW', AOA: 'pt-AO', ARS: 'es-AR', AUD: 'en-AU', AWG: 'nl-AW', AZN: 'az-AZ',
  BAM: 'bs-BA', BBD: 'en-BB', BDT: 'bn-BD', BGN: 'bg-BG', BHD: 'ar-BH', BIF: 'fr-BI', BMD: 'en-BM', BND: 'ms-BN', BOB: 'es-BO', BRL: 'pt-BR', BSD: 'en-BS', BTN: 'dz-BT', BWP: 'en-BW', BYN: 'be-BY', BZD: 'en-BZ',
  CAD: 'en-CA', CDF: 'fr-CD', CHF: 'de-CH', CLP: 'es-CL', CNY: 'zh-CN', COP: 'es-CO', CRC: 'es-CR', CUP: 'es-CU', CVE: 'pt-CV', CZK: 'cs-CZ',
  DJF: 'fr-DJ', DKK: 'da-DK', DOP: 'es-DO', DZD: 'ar-DZ', EGP: 'ar-EG', ERN: 'ti-ER', ETB: 'am-ET', EUR: 'de-DE', FJD: 'en-FJ', FKP: 'en-FK', GBP: 'en-GB', GEL: 'ka-GE', GHS: 'en-GH', GIP: 'en-GI', GMD: 'en-GM', GNF: 'fr-GN', GTQ: 'es-GT', GYD: 'en-GY',
  HKD: 'zh-HK', HNL: 'es-HN', HRK: 'hr-HR', HTG: 'fr-HT', HUF: 'hu-HU', IDR: 'id-ID', ILS: 'he-IL', INR: 'en-IN', IQD: 'ar-IQ', IRR: 'fa-IR', ISK: 'is-IS', JMD: 'en-JM', JOD: 'ar-JO', JPY: 'ja-JP', KES: 'en-KE', KGS: 'ky-KG', KHR: 'km-KH', KMF: 'fr-KM', KPW: 'ko-KP', KRW: 'ko-KR', KWD: 'ar-KW', KYD: 'en-KY', KZT: 'kk-KZ',
  LAK: 'lo-LA', LBP: 'ar-LB', LKR: 'si-LK', LRD: 'en-LR', LSL: 'en-LS', LYD: 'ar-LY', MAD: 'ar-MA', MDL: 'ro-MD', MGA: 'fr-MG', MKD: 'mk-MK', MMK: 'my-MM', MNT: 'mn-MN', MOP: 'zh-MO', MRU: 'ar-MR', MUR: 'en-MU', MVR: 'dv-MV', MWK: 'en-MW', MXN: 'es-MX', MYR: 'ms-MY', MZN: 'pt-MZ',
  NAD: 'en-NA', NGN: 'en-NG', NIO: 'es-NI', NOK: 'nb-NO', NPR: 'ne-NP', NZD: 'en-NZ', OMR: 'ar-OM', PAB: 'es-PA', PEN: 'es-PE', PGK: 'en-PG', PHP: 'en-PH', PKR: 'ur-PK', PLN: 'pl-PL', PYG: 'es-PY', QAR: 'ar-QA', RON: 'ro-RO', RSD: 'sr-RS', RUB: 'ru-RU', RWF: 'rw-RW',
  SAR: 'ar-SA', SBD: 'en-SB', SCR: 'fr-SC', SDG: 'ar-SD', SEK: 'sv-SE', SGD: 'en-SG', SHP: 'en-SH', SLE: 'en-SL', SOS: 'so-SO', SRD: 'nl-SR', SSP: 'en-SS', STN: 'pt-ST', SYP: 'ar-SY', SZL: 'en-SZ', THB: 'th-TH', TJS: 'tg-TJ', TMT: 'tk-TM', TND: 'ar-TN', TOP: 'to-TO', TRY: 'tr-TR', TTD: 'en-TT', TWD: 'zh-TW', TZS: 'sw-TZ',
  UAH: 'uk-UA', UGX: 'en-UG', USD: 'en-US', UYU: 'es-UY', UZS: 'uz-UZ', VES: 'es-VE', VND: 'vi-VN', VUV: 'bi-VU', WST: 'en-WS', XAF: 'fr-CM', XCD: 'en-AG', XOF: 'fr-SN', XPF: 'fr-PF', YER: 'ar-YE', ZAR: 'en-ZA', ZMW: 'en-ZM', ZWG: 'en-ZW',
};

const timeZoneCountryMap = {
  'Asia/Dhaka': 'BD',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK',
  'Asia/Kathmandu': 'NP',
  'Asia/Colombo': 'LK',
  'Asia/Thimphu': 'BT',
  'Asia/Phnom_Penh': 'KH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Singapore': 'SG',
  'Asia/Manila': 'PH',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Warsaw': 'PL',
  'Europe/Moscow': 'RU',
  'Africa/Cairo': 'EG',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Santiago': 'CL',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function storageGet(key) {
  if (!isBrowser()) return '';
  try { return window.localStorage.getItem(key) || ''; } catch (_) { return ''; }
}

function storageSet(key, value) {
  if (!isBrowser() || !value) return;
  try { window.localStorage.setItem(key, String(value)); } catch (_) { /* ignore */ }
}

function storageRemove(key) {
  if (!isBrowser()) return;
  try { window.localStorage.removeItem(key); } catch (_) { /* ignore */ }
}

function lookupCountryByCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  return countries.find((country) => country.code === normalized) || null;
}

function countryFromLocale(locale) {
  if (!locale) return null;
  const parts = String(locale).replace('_', '-').split('-');
  const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  return /^[A-Z]{2}$/.test(region) ? lookupCountryByCode(region) : null;
}

export function detectCountryFromBrowser() {
  if (!isBrowser()) return defaultCountry;

  const languages = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ].filter(Boolean);

  for (const language of languages) {
    const country = countryFromLocale(language);
    if (country) return country;
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = timeZoneCountryMap[timeZone];
    if (countryCode) return lookupCountryByCode(countryCode) || defaultCountry;
  } catch (_) {
    // ignore timezone detection failure
  }

  return defaultCountry;
}

export function getDefaultRegistrationCountry() {
  const storedCode = storageGet(COUNTRY_STORAGE_KEY);
  if (storedCode) return lookupCountryByCode(storedCode) || defaultCountry;
  return detectCountryFromBrowser();
}

export function resolveCurrencyCode(input) {
  if (typeof input === 'string' && input.trim()) return input.trim().toUpperCase();

  if (input && typeof input === 'object') {
    if (input.currency) return String(input.currency).toUpperCase();
    if (input.countryCode) return (lookupCountryByCode(input.countryCode)?.currency || defaultCountry.currency).toUpperCase();
    if (input.country) return (findCountryByName(input.country)?.currency || defaultCountry.currency).toUpperCase();
  }

  const storedCurrency = storageGet(CURRENCY_STORAGE_KEY);
  if (storedCurrency) return storedCurrency.toUpperCase();

  const storedCountry = storageGet(COUNTRY_STORAGE_KEY);
  if (storedCountry) return (lookupCountryByCode(storedCountry)?.currency || defaultCountry.currency).toUpperCase();

  return getDefaultRegistrationCountry().currency || defaultCountry.currency || 'BDT';
}

export function currencyLocale(currency) {
  return currencyLocaleMap[resolveCurrencyCode(currency)] || 'en-US';
}

export function currencySymbol(currency) {
  const code = resolveCurrencyCode(currency);
  try {
    const parts = new Intl.NumberFormat(currencyLocale(code), {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    return parts.find((part) => part.type === 'currency')?.value || code;
  } catch (_) {
    return code;
  }
}

export function rememberUserCurrency(user) {
  if (!user) return;
  if (user.currency) storageSet(CURRENCY_STORAGE_KEY, String(user.currency).toUpperCase());
  if (user.countryCode) storageSet(COUNTRY_STORAGE_KEY, String(user.countryCode).toUpperCase());
}

export function clearRememberedCurrency() {
  storageRemove(CURRENCY_STORAGE_KEY);
  storageRemove(COUNTRY_STORAGE_KEY);
}

export function countryForCurrency(currency) {
  const code = resolveCurrencyCode(currency);
  return countries.find((country) => country.currency === code) || defaultCountry;
}
