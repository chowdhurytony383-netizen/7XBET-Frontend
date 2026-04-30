import { currencyLocale, resolveCurrencyCode } from './currency.js';

export function formatCurrency(value, currencyOrUser) {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currency = resolveCurrencyCode(currencyOrUser);
  const fractionDigits = Number.isInteger(safeAmount) ? 0 : 2;

  try {
    return new Intl.NumberFormat(currencyLocale(currency), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch (_) {
    return `${currency} ${safeAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

export function formatCurrencyWithCode(value, currencyOrUser) {
  const currency = resolveCurrencyCode(currencyOrUser);
  return `${formatCurrency(value, currency)} ${currency}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function gameName(game) {
  if (!game) return 'Game';
  if (typeof game === 'string') return game;
  return game.displayName || game.name || 'Game';
}
