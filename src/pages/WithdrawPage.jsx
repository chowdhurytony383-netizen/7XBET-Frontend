import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowUpFromLine, RefreshCw, ShieldCheck, WalletCards, X } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import './DepositPage.css';
import './WithdrawPage.css';

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

function compactTitle(value) {
  return String(value || '?').slice(0, 2).toUpperCase();
}

function buildReceivingPlaceholder(option) {
  const title = String(option?.methodTitle || 'payment').toLowerCase();
  if (title.includes('bank')) return 'Your bank account number / IBAN';
  if (title.includes('rocket')) return 'Your Rocket account number';
  if (title.includes('nagad')) return 'Your Nagad account number';
  if (title.includes('bkash')) return 'Your bKash account number';
  if (title.includes('crypto')) return 'Your wallet address';
  return `Your ${option?.methodTitle || 'payment'} account number`;
}

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [amount, setAmount] = useState('');
  const [receiverNumber, setReceiverNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
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

  const walletBalance = Number(user?.wallet || 0);

  const loadOptions = async () => {
    setLoadingOptions(true);

    try {
      const response = await AccountAPI.agentWithdrawOptions();
      const nextOptions = response.data?.data || response.data?.options || [];
      setOptions(nextOptions);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load withdrawal options'));
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const openWithdrawPopup = (option) => {
    setSelectedOption(option);
    setAmount(String(option.minAmount || 100));
    setReceiverNumber('');
    setAccountHolderName(user?.fullName || user?.name || '');
    setNote('');
  };

  const closeWithdrawPopup = () => {
    if (submitting) return;
    setSelectedOption(null);
  };

  const submitWithdrawRequest = async (event) => {
    event.preventDefault();

    if (!selectedOption) {
      toast.error('No active withdrawal option found');
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

    if (numericAmount > walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    if (!receiverNumber.trim()) {
      toast.error('Enter your receiving number/account');
      return;
    }

    setSubmitting(true);

    try {
      await AccountAPI.createAgentWithdrawRequest({
        agentId: selectedOption.agentId,
        methodKey: selectedOption.methodKey,
        amount: numericAmount,
        accountNumber: receiverNumber.trim(),
        receiverNumber: receiverNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        note: note.trim(),
      });

      toast.success('Withdraw request sent to agent panel');
      setSelectedOption(null);
      setAmount('');
      setReceiverNumber('');
      setAccountHolderName('');
      setNote('');
      await refreshUser().catch(() => null);
    } catch (error) {
      toast.error(getApiError(error, 'Withdraw request failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack deposit-page withdraw-page">
      <PageHeader
        eyebrow="Wallet"
        title="Withdraw"
        description="Choose a payout option, add your receiving account, and submit your withdrawal request to the assigned agent."
        actions={<button className="btn btn-soft" onClick={loadOptions}><RefreshCw size={18} /> Refresh</button>}
      />

      <div className="deposit-account-card withdraw-account-card">
        <span>Account {user?.userId || user?._id || '—'}</span>
        <small>Available main balance: {formatCurrency(walletBalance)}</small>
      </div>

      <div className="deposit-alert-box withdraw-alert-box">
        Withdraw request submit করলে amount আপনার wallet থেকে hold/deduct হবে। Agent payout confirm করলে request success হবে। Agent reject করলে amount আবার wallet-এ refund হবে। Receiving number/account ভুল দিলে payout delay বা reject হতে পারে।
      </div>

      {loadingOptions ? (
        <div className="deposit-section-card"><div className="deposit-empty">Loading withdrawal options...</div></div>
      ) : groupedOptions.length ? (
        groupedOptions.map((group) => (
          <section className="deposit-section-card" key={group.category}>
            <h2>{group.title}</h2>
            <div className="deposit-method-grid withdraw-method-grid">
              {group.items.map((option) => (
                <button className="deposit-method-card withdraw-method-card" key={option.id || option.key || option.methodKey} type="button" onClick={() => openWithdrawPopup(option)}>
                  <span className="deposit-method-logo-box">
                    {getOptionImage(option) ? (
                      <img src={getOptionImage(option)} alt={option.methodTitle} />
                    ) : (
                      <strong>{compactTitle(option.methodTitle)}</strong>
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
          <div className="deposit-empty">No active withdrawal option found. Main Admin must create methods and Agent Admin must keep methods active.</div>
        </div>
      )}

      <aside className="card money-info-card deposit-info-card withdraw-info-card">
        <ShieldCheck size={28} />
        <h3>Withdraw flow</h3>
        <p>User submits request → wallet amount is held → request goes to Agent Admin panel → agent pays user externally → agent confirms or rejects the request.</p>
      </aside>

      {selectedOption && (
        <div className="deposit-modal-backdrop" role="presentation" onMouseDown={closeWithdrawPopup}>
          <form className="deposit-popup withdraw-popup" onSubmit={submitWithdrawRequest} onMouseDown={(event) => event.stopPropagation()}>
            <button className="deposit-popup-close" type="button" onClick={closeWithdrawPopup} aria-label="Close"><X size={28} /></button>

            <div className="deposit-popup-logo">
              {selectedOption.image ? <img src={selectedOption.image} alt={selectedOption.methodTitle} /> : <strong>{compactTitle(selectedOption.methodTitle)}</strong>}
            </div>

            <div className="withdraw-popup-heading">
              <h3>{selectedOption.methodTitle} Withdraw</h3>
            </div>

            <div className="deposit-popup-line" />

            <div className="withdraw-warning-box">
              <AlertTriangle size={20} />
              <p>Before confirming, make sure your receiving number/account is correct. Wrong information may cause payout delay or rejection.</p>
            </div>

            <div className="withdraw-balance-strip">
              <span>Available Balance</span>
              <strong>{formatCurrency(walletBalance)}</strong>
            </div>

            <label className="deposit-popup-field amount-field">
              <span>Amount (Min {Number(selectedOption.minAmount || 0).toLocaleString()} BDT / Max {Number(selectedOption.maxAmount || 0).toLocaleString()} BDT):</span>
              <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min={selectedOption.minAmount || 1} max={selectedOption.maxAmount || 1000000} step="1" required />
            </label>

            <label className="deposit-popup-field">
              <span>Your {selectedOption.methodTitle} receiving number/account:</span>
              <input value={receiverNumber} onChange={(event) => setReceiverNumber(event.target.value)} placeholder={buildReceivingPlaceholder(selectedOption)} required />
            </label>

            <label className="deposit-popup-field">
              <span>Account holder name (optional):</span>
              <input value={accountHolderName} onChange={(event) => setAccountHolderName(event.target.value)} placeholder="Name on receiving account" />
            </label>

            <label className="deposit-popup-field full-field">
              <span>Extra note (optional):</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Any additional information for agent" />
            </label>

            <button className="deposit-confirm-btn withdraw-confirm-btn" type="submit" disabled={submitting}>
              <ArrowUpFromLine size={20} /> {submitting ? 'Sending...' : 'Confirm Withdraw'}
            </button>
          </form>
        </div>
      )}

      {!loadingOptions && !options.length && (
        <div className="withdraw-empty-help card">
          <WalletCards size={28} />
          <p>Withdrawal methods use the same Main Admin payment method list and Agent Admin availability rules as deposits.</p>
        </div>
      )}
    </div>
  );
}
