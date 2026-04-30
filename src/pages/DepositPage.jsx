import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import './DepositPage.css';

const categoryLabels = {
  recommended: 'Recommended',
  'e-wallets': 'E-wallets',
  bank: 'Bank Transfer',
  crypto: 'Crypto',
  other: 'Other Methods',
};

const categoryOrder = ['recommended', 'e-wallets', 'bank', 'crypto', 'other'];

function getOptionImage(option) {
  return option?.image || '';
}

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [amount, setAmount] = useState('100');
  const [payerNumber, setPayerNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const groupedOptions = useMemo(() => {
    const groups = {};

    for (const option of options) {
      const category = option.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(option);
    }

    return categoryOrder
      .filter((category) => groups[category]?.length)
      .map((category) => ({ category, title: categoryLabels[category] || category, items: groups[category] }));
  }, [options]);

  const loadOptions = async () => {
    setLoadingOptions(true);

    try {
      const response = await AccountAPI.agentDepositOptions();
      const nextOptions = response.data?.data || response.data?.options || [];
      setOptions(nextOptions);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load deposit options'));
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const openDepositPopup = (option) => {
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

  const copyNumber = async () => {
    if (!selectedOption?.number) return;
    await navigator.clipboard.writeText(selectedOption.number);
    toast.success('Payment number copied');
  };

  const submitDepositRequest = async (event) => {
    event.preventDefault();

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
        actions={<button className="btn btn-soft" onClick={loadOptions}><RefreshCw size={18} /> Refresh</button>}
      />

      <div className="deposit-account-card">
        <span>Account {user?.userId || user?._id || '—'}</span>
        <small>Main account balance: {formatCurrency(user?.wallet)}</small>
      </div>

      <div className="deposit-alert-box">
        Coming Soon!
      </div>

      {loadingOptions ? (
        <div className="deposit-section-card"><div className="deposit-empty">Loading payment options...</div></div>
      ) : groupedOptions.length ? (
        groupedOptions.map((group) => (
          <section className="deposit-section-card" key={group.category}>
            <h2>{group.title}</h2>
            <div className="deposit-method-grid">
              {group.items.map((option) => (
                <button className="deposit-method-card" key={option.id} type="button" onClick={() => openDepositPopup(option)}>
                  <span className="deposit-method-logo-box">
                    {getOptionImage(option) ? (
                      <img src={getOptionImage(option)} alt={option.methodTitle} />
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
        <h3>Agent deposit flow</h3>
        <p>Popup-Up Comming</p>
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
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min={selectedOption.minAmount || 1}
                max={selectedOption.maxAmount || 1000000}
                step="1"
                required
              />
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

            <button className="deposit-confirm-btn" type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Confirm'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
