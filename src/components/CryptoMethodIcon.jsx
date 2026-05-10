function normaliseCryptoText(option = {}) {
  return String([
    option.key,
    option.methodKey,
    option.symbol,
    option.coin,
    option.network,
    option.displayName,
    option.methodTitle,
    option.name,
    option.title,
  ].filter(Boolean).join(' ')).toUpperCase();
}

export function getCryptoBrandKey(option = {}) {
  const value = normaliseCryptoText(option);

  if (value.includes('BTC') || value.includes('BITCOIN')) return 'btc';
  if (value.includes('ETH') || value.includes('ETHEREUM') || value.includes('ERC20')) return 'eth';
  if (value.includes('USDT') || value.includes('TETHER')) return 'usdt';
  if (value.includes('LTC') || value.includes('LITECOIN')) return 'ltc';
  if (value.includes('BNB') || value.includes('BSC') || value.includes('BEP20') || value.includes('BINANCE')) return 'bnb';
  if (value.includes('TRX') || value.includes('TRON') || value.includes('TRC20')) return 'trx';

  return 'crypto';
}

export function getCryptoBrandClass(option = {}) {
  return `crypto-brand-${getCryptoBrandKey(option)}`;
}

export function getCryptoShortLabel(option = {}) {
  const key = getCryptoBrandKey(option);
  if (key === 'btc') return 'BTC';
  if (key === 'eth') return 'ETH';
  if (key === 'usdt') return 'USDT';
  if (key === 'ltc') return 'LTC';
  if (key === 'bnb') return 'BNB';
  if (key === 'trx') return 'TRX';

  const value = option.symbol || option.coin || option.methodTitle || option.displayName || option.key || '?';
  return String(value).slice(0, 5).toUpperCase();
}

function BitcoinSvg() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#f7931a" />
      <path fill="#fff" d="M39.6 29.7c3-1.5 4.3-3.9 3.7-7.1-.8-4.1-4.4-5.5-9.1-6.1V11h-3.4v5.3h-2.7V11h-3.4v5.4h-6.8v3.7s2.5 0 2.5.1c1.4 0 1.9.8 2 1.5v20.7c-.1.5-.5 1.2-1.5 1.2.1 0-2.5 0-2.5 0l-.7 4.1h6.9V53H28v-5.4h2.7V53h3.4v-5.4c5.7-.4 9.8-1.9 10.3-7.1.4-4.2-1.6-6.7-4.8-8.1Zm-10.8-8.9c1.9 0 7.8-.6 7.8 3.4 0 3.9-5.9 3.4-7.8 3.4v-6.8Zm0 22.4v-7.5c2.3 0 9.2-.6 9.2 3.8 0 4.3-6.9 3.7-9.2 3.7Z" />
    </svg>
  );
}

function EthereumSvg() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#627eea" />
      <path fill="#fff" fillOpacity=".92" d="M32 8 18 32.1 32 40.3l14-8.2L32 8Z" />
      <path fill="#d8dcff" d="M32 8v32.3l14-8.2L32 8Z" />
      <path fill="#fff" fillOpacity=".82" d="m18 34.8 14 21.1 14-21.1L32 43l-14-8.2Z" />
      <path fill="#d8dcff" d="M32 55.9 46 34.8 32 43v12.9Z" />
    </svg>
  );
}

function TetherSvg() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#26a17b" />
      <path fill="#fff" d="M48.4 17.8H15.6v7.9h12.4v4.2c-10 .5-17.5 2.5-17.5 4.9s7.5 4.4 17.5 4.9v13.4h8V39.7c10-.5 17.5-2.5 17.5-4.9s-7.5-4.4-17.5-4.9v-4.2h12.4v-7.9ZM32 36.4c-9.6 0-17.3-1.1-17.3-2.5 0-1.2 5.6-2.2 13.3-2.4v4.1c1.3.1 2.7.1 4 .1s2.7 0 4-.1v-4.1c7.7.3 13.3 1.2 13.3 2.4 0 1.4-7.7 2.5-17.3 2.5Z" />
    </svg>
  );
}

function LitecoinSvg() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#345d9d" />
      <path fill="#fff" d="M38.9 45.5H21.4l3.2-12.2-4.8 1.7 1.2-4.5 4.8-1.7 4.7-17.7h7.4l-3.8 14.4 5.1-1.8-1.2 4.6-5.1 1.8-2.2 8.3h10.1l-1.9 7.1Z" />
    </svg>
  );
}

function BnbSvg() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#f3ba2f" />
      <path fill="#1e2329" d="m32 12.8 8.3 8.3-4.8 4.8L32 22.4l-3.5 3.5-4.8-4.8L32 12.8Zm-14.9 15 4.8-4.8 4.8 4.8-4.8 4.8-4.8-4.8Zm10 4.2L32 27.1l4.9 4.9-4.9 4.9-4.9-4.9Zm10.2-4.2 4.8-4.8 4.8 4.8-4.8 4.8-4.8-4.8ZM32 41.6l3.5-3.5 4.8 4.8L32 51.2l-8.3-8.3 4.8-4.8 3.5 3.5Z" />
    </svg>
  );
}

function TronSvg() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#eb0029" />
      <path fill="#fff" d="m17 15 32 5.8-17.5 28.8L17 15Zm5.6 5.3 8.3 21.1 3.9-14.5-12.2-6.6Zm14.2 7.2-4.2 15.6 10.7-17.5-6.5 1.9Zm6.8-4.8-17.3-3.1 11 5.8 6.3-2.7Z" />
    </svg>
  );
}

function GenericCryptoSvg({ label }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#38bdf8" />
      <text x="32" y="38" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="900" fill="#0f172a">
        {label}
      </text>
    </svg>
  );
}

function CryptoSvg({ brandKey, label }) {
  if (brandKey === 'btc') return <BitcoinSvg />;
  if (brandKey === 'eth') return <EthereumSvg />;
  if (brandKey === 'usdt') return <TetherSvg />;
  if (brandKey === 'ltc') return <LitecoinSvg />;
  if (brandKey === 'bnb') return <BnbSvg />;
  if (brandKey === 'trx') return <TronSvg />;
  return <GenericCryptoSvg label={label} />;
}

export default function CryptoMethodIcon({ option, size = 'card' }) {
  const brandKey = getCryptoBrandKey(option);
  const label = getCryptoShortLabel(option);
  const title = option?.displayName || option?.methodTitle || option?.coin || option?.symbol || label;

  return (
    <span className={`crypto-method-icon crypto-method-icon--${size} crypto-brand-${brandKey}`} title={title} aria-label={`${title} icon`}>
      <CryptoSvg brandKey={brandKey} label={label} />
    </span>
  );
}
