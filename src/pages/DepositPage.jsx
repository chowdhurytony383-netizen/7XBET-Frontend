import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Copy, ShieldCheck, WalletCards, X } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { CryptoAPI } from '../api/crypto.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import './DepositPage.css';

const categoryLabels = {
  recommended: 'Recommended',
  'e-wallets': 'E-wallets',
  bank: 'Bank Transfer',
  crypto: 'Crypto Currency',
  other: 'Other Methods',
};

const categoryOrder = ['recommended', 'e-wallets', 'bank', 'crypto', 'other'];

function getOptionImage(option) {
  return option?.image || option?.logo || '';
}

function cryptoLogoText(option) {
  const symbol = option.symbol || option.coin || option.methodTitle || '?';
  return String(symbol).slice(0, 4).toUpperCase();
}

function getQrUrl(value) {
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
}

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const [options, setOptions] = useState([]);
  const [cryptoOptions, setCryptoOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [amount, setAmount] = useState('100');
  const [payerNumber, setPayerNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const depositAllowed = user?.depositEnabled !== false;
  const allOptions = useMemo(() => [...options, ...cryptoOptions], [options, cryptoOptions]);

  const groupedOptions = useMemo(() => {
    const groups = {};

    for (const option of allOptions) {
      const category = option.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(option);
    }

    return categoryOrder
      .filter((category) => groups[category]?.length)
      .map((category) => ({ category, title: categoryLabels[category] || category, items: groups[category] }));
  }, [allOptions]);

  const loadOptions = async () => {
    if (!depositAllowed) {
      setOptions([]);
      setCryptoOptions([]);
      setLoadingOptions(false);
      return;
    }

    setLoadingOptions(true);

    try {
      const [agentResponse, cryptoResponse] = await Promise.allSettled([
        AccountAPI.agentDepositOptions(),
        CryptoAPI.addresses(),
      ]);

      if (agentResponse.status === 'fulfilled') {
        const nextOptions = agentResponse.value.data?.data || agentResponse.value.data?.options || [];
        setOptions(nextOptions);
      } else {
        toast.error(getApiError(agentResponse.reason, 'Unable to load deposit options'));
      }

      if (cryptoResponse.status === 'fulfilled') {
        const addresses = cryptoResponse.value.data?.data || cryptoResponse.value.data?.addresses || [];
        setCryptoOptions(addresses.map((item) => ({
          ...item,
          id: `crypto-${item.key}`,
          type: 'crypto',
          category: 'crypto',
          methodTitle: item.displayName || item.key,
          image: item.logo || '',
          minAmount: item.minDepositFiat || 0,
          maxAmount: 0,
        })));
      } else {
        setCryptoOptions([]);
      }
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, [depositAllowed]);

  const openDepositPopup = (option) => {
    if (!depositAllowed) {
      toast.error('Deposit is disabled for your account. Please contact support.');
      return;
    }

    if (option.type === 'crypto') {
      setSelectedCrypto(option);
      return;
    }

    setSelectedOption(option);
    setAmount(String(option.minAmount || 100));
    setPayerNumber('');
    setTransactionRef('');
    setNote('');
  };

  const closeDepositPopup = () => {
    if (submitting) return;
    setSelectedOption(null);
  };

  const closeCryptoPopup = () => setSelectedCrypto(null);

  const copyText = async (value, successMessage = 'Copied') => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  };

  const copyNumber = async () => {
    if (!selectedOption?.number) return;
    await copyText(selectedOption.number, 'Payment number copied');
  };

  const submitDepositRequest = async (event) => {
    event.preventDefault();

    if (!depositAllowed) {
      toast.error('Deposit is disabled for your account. Please contact support.');
      return;
    }

    if (!selectedOption) {
      toast.error('No active deposit payment option found');
      return;
    }

    const numericAmount = Number(amount);
    const minAmount = Number(selectedOption.minAmount || 1);
    const maxAmount = Number(selectedOption.maxAmount || 1_000_000);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (numericAmount < minAmount || numericAmount > maxAmount) {
      toast.error(`Amount must be between ${formatCurrency(minAmount)} and ${formatCurrency(maxAmount)}`);
      return;
    }

    if (!payerNumber.trim()) {
      toast.error('Enter your wallet number');
      return;
    }

    if (!transactionRef.trim()) {
      toast.error('Enter transaction ID / reference number');
      return;
    }

    setSubmitting(true);

    try {
      await AccountAPI.createAgentDepositRequest({
        agentId: selectedOption.agentId,
        methodKey: selectedOption.methodKey,
        amount: numericAmount,
        payerNumber,
        transactionRef,
        note,
      });

      toast.success('Deposit request sent to agent panel');
      setSelectedOption(null);
      setAmount('100');
      setPayerNumber('');
      setTransactionRef('');
      setNote('');
      await refreshUser().catch(() => null);
    } catch (error) {
      toast.error(getApiError(error, 'Deposit request failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack deposit-page">
      <PageHeader
        eyebrow="Wallet"
        title="Deposit"
        description="Choose a payment option, send money to the shown number, then confirm your deposit request."
      />

      <div className="deposit-account-card">
        <span>Account {user?.userId || user?._id || '—'}</span>
        <small>Main account balance: {formatCurrency(user?.wallet)}</small>
      </div>

      <div className="deposit-alert-box">
        If your deposit is not credited to your gaming account within 5 minutes, please contact our support team.
Email: support-en@7xbet.asia
We are currently looking for Country Managers and Payment Provider Agents across Asian countries.
Before making a crypto deposit, please carefully verify that you have selected the correct network.
      </div>

      {!depositAllowed ? (
        <div className="deposit-section-card"><div className="deposit-empty">Deposit is disabled for your account. Please contact support.</div></div>
      ) : loadingOptions ? (
        <div className="deposit-section-card"><div className="deposit-empty">Loading payment options...</div></div>
      ) : groupedOptions.length ? (
        groupedOptions.map((group) => (
          <section className="deposit-section-card" key={group.category}>
            <h2>{group.title}</h2>
            <div className="deposit-method-grid">
              {group.items.map((option) => (
                <button className={`deposit-method-card ${option.type === 'crypto' ? 'crypto-method-card' : ''}`} key={option.id || option.key || option.methodKey} type="button" onClick={() => openDepositPopup(option)}>
                  <span className="deposit-method-logo-box">
                    {getOptionImage(option) ? (
                      <img src={getOptionImage(option)} alt={option.methodTitle} />
                    ) : option.type === 'crypto' ? (
                      <strong>{cryptoLogoText(option)}</strong>
                    ) : (
                      <strong>{String(option.methodTitle || '?').slice(0, 2)}</strong>
                    )}
                  </span>
                  <span className="deposit-method-title">{option.methodTitle}</span>
                </button>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="deposit-section-card">
          <div className="deposit-empty">No active deposit option found. Main Admin must create methods and Agent Admin must add number/note.</div>
        </div>
      )}

      <aside className="card money-info-card deposit-info-card">
        <ShieldCheck size={28} />
        <h3>Deposit flow</h3>
        <p>For e-wallet deposits, send money to the shown agent number. For crypto deposits, send only the selected asset on the selected network to your unique address.</p>
      </aside>

      {selectedOption && (
        <div className="deposit-modal-backdrop" role="presentation" onMouseDown={closeDepositPopup}>
          <form className="deposit-popup" onSubmit={submitDepositRequest} onMouseDown={(event) => event.stopPropagation()}>
            <button className="deposit-popup-close" type="button" onClick={closeDepositPopup} aria-label="Close"><X size={28} /></button>

            <div className="deposit-popup-logo">
              {selectedOption.image ? <img src={selectedOption.image} alt={selectedOption.methodTitle} /> : <strong>{String(selectedOption.methodTitle).slice(0, 2)}</strong>}
            </div>

            <div className="deposit-popup-line" />

            <p className="deposit-popup-warning">
              Before making a request please transfer funds within 5 minutes using the payment details specified below.
            </p>

            <div className="deposit-number-row">
              <strong>{selectedOption.methodTitle} ওয়ালেট নাম্বার</strong>
              <span>{selectedOption.number}</span>
              <button type="button" onClick={copyNumber}><Copy size={22} /></button>
            </div>

            {selectedOption.note && (
              <div className="deposit-agent-note">{selectedOption.note}</div>
            )}

            <label className="deposit-popup-field amount-field">
              <span>Amount (Min {Number(selectedOption.minAmount || 0).toLocaleString()} BDT / Max {Number(selectedOption.maxAmount || 0).toLocaleString()} BDT):</span>
              <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min={selectedOption.minAmount || 1} max={selectedOption.maxAmount || 1000000} step="1" required />
            </label>

            <label className="deposit-popup-field">
              <span>Your {selectedOption.methodTitle} wallet number - শুধুমাত্র ক্যাশ আউট করুন:</span>
              <input value={payerNumber} onChange={(event) => setPayerNumber(event.target.value)} required />
            </label>

            <label className="deposit-popup-field">
              <span>Transaction ID (UTR, Reference No):</span>
              <input value={transactionRef} onChange={(event) => setTransactionRef(event.target.value)} required />
            </label>

            <label className="deposit-popup-field full-field">
              <span>Extra note (optional):</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Any additional information" />
            </label>

            <button className="deposit-confirm-btn" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Confirm'}</button>
          </form>
        </div>
      )}

      {selectedCrypto && (
        <div className="deposit-modal-backdrop" role="presentation" onMouseDown={closeCryptoPopup}>
          <div className="deposit-popup crypto-deposit-popup" onMouseDown={(event) => event.stopPropagation()}>
            <button className="deposit-popup-close" type="button" onClick={closeCryptoPopup} aria-label="Close"><X size={28} /></button>

            <div className="deposit-popup-logo crypto-popup-logo">
              <strong>{cryptoLogoText(selectedCrypto)}</strong>
            </div>

            <div className="crypto-popup-title">
              <h3>{selectedCrypto.displayName || selectedCrypto.methodTitle}</h3>
              <p>{selectedCrypto.network}</p>
            </div>

            <div className="deposit-popup-line" />

            {selectedCrypto.status === 'active' && selectedCrypto.address ? (
              <>
                <div className="crypto-qr-box">
                  <img src={getQrUrl(selectedCrypto.address)} alt={`${selectedCrypto.methodTitle} deposit QR`} />
                </div>

                <div className="crypto-address-box">
                  <span>Your unique deposit address</span>
                  <strong>{selectedCrypto.address}</strong>
                  <button className="btn btn-soft" type="button" onClick={() => copyText(selectedCrypto.address, 'Crypto address copied')}><Copy size={18} /> Copy address</button>
                </div>

                {selectedCrypto.memo && (
                  <div className="crypto-address-box">
                    <span>Memo / Tag</span>
                    <strong>{selectedCrypto.memo}</strong>
                    <button className="btn btn-soft" type="button" onClick={() => copyText(selectedCrypto.memo, 'Memo copied')}><Copy size={18} /> Copy memo</button>
                  </div>
                )}

                <div className="crypto-warning-box">
                  <AlertTriangle size={20} />
                  <p>{selectedCrypto.warning || `Only send ${selectedCrypto.coin} on ${selectedCrypto.network} to this address.`}</p>
                </div>

                <div className="crypto-meta-grid">
                  <div><span>Coin</span><strong>{selectedCrypto.coin}</strong></div>
                  <div><span>Network</span><strong>{selectedCrypto.network}</strong></div>
                  <div><span>Confirmations</span><strong>{selectedCrypto.confirmations || 1}</strong></div>
                </div>
              </>
            ) : (
              <div className="crypto-pending-box">
                <WalletCards size={32} />
                <h3>Address not ready</h3>
                <p>{selectedCrypto.errorMessage || 'Crypto address is being generated. Please try again after a moment.'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
