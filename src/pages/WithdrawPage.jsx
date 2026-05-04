import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowUpFromLine, ShieldCheck, WalletCards, X } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { CryptoAPI } from '../api/crypto.js';
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
  return String(value || '?').slice(0, 4).toUpperCase();
}

function buildReceivingPlaceholder(option) {
  if (option?.type === 'crypto-withdraw') return `${option.network || option.coin} wallet address`;
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
  const [agentOptions, setAgentOptions] = useState([]);
  const [cryptoOptions, setCryptoOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [amount, setAmount] = useState('');
  const [receiverNumber, setReceiverNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [memo, setMemo] = useState('');
  const [note, setNote] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(() => [...agentOptions, ...cryptoOptions], [agentOptions, cryptoOptions]);
  const walletBalance = Number(user?.wallet || 0);
  const isCryptoWithdraw = selectedOption?.type === 'crypto-withdraw';

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
      const [agentResponse, cryptoResponse] = await Promise.allSettled([
        AccountAPI.agentWithdrawOptions(),
        CryptoAPI.withdrawOptions(),
      ]);

      if (agentResponse.status === 'fulfilled') {
        setAgentOptions(agentResponse.value.data?.data || agentResponse.value.data?.options || []);
      } else {
        setAgentOptions([]);
      }

      if (cryptoResponse.status === 'fulfilled') {
        const nextCrypto = cryptoResponse.value.data?.data || cryptoResponse.value.data?.options || [];
        setCryptoOptions(nextCrypto.map((item) => ({
          ...item,
          id: `crypto-withdraw-${item.key || item.methodKey}`,
          type: 'crypto-withdraw',
          category: 'crypto',
          methodTitle: item.displayName || item.methodTitle || item.key,
          image: item.logo || item.image || '',
        })));
      } else {
        setCryptoOptions([]);
      }
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load withdrawal options'));
      setAgentOptions([]);
      setCryptoOptions([]);
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
    setMemo('');
    setNote('');
  };

  const closeWithdrawPopup = () => {
    if (submitting) return;
    setSelectedOption(null);
  };

  const resetForm = () => {
    setSelectedOption(null);
    setAmount('');
    setReceiverNumber('');
    setAccountHolderName('');
    setMemo('');
    setNote('');
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
      toast.error(isCryptoWithdraw ? 'Enter your crypto wallet address' : 'Enter your receiving number/account');
      return;
    }

    setSubmitting(true);

    try {
      if (isCryptoWithdraw) {
        await CryptoAPI.createWithdrawal({
          methodKey: selectedOption.methodKey || selectedOption.key,
          amount: numericAmount,
          address: receiverNumber.trim(),
          memo: memo.trim(),
        });
        toast.success('Crypto withdraw submitted');
      } else {
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
      }

      resetForm();
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
        description="Choose a payout option, add your receiving account or crypto wallet address, and submit your withdrawal request."
      />

      <div className="deposit-account-card withdraw-account-card">
        <span>Account {user?.userId || user?._id || '—'}</span>
        <small>Available main balance: {formatCurrency(walletBalance)}</small>
      </div>

      <div className="deposit-alert-box withdraw-alert-box">
        Withdraw request submit করলে amount আপনার wallet থেকে hold/deduct হবে। Crypto withdraw করার আগে সঠিক network এবং address ভালোভাবে check করুন। Wrong crypto address দিলে fund recover করা যায় না।
      </div>

      {loadingOptions ? (
        <div className="deposit-section-card"><div className="deposit-empty">Loading withdrawal options...</div></div>
      ) : groupedOptions.length ? (
        groupedOptions.map((group) => (
          <section className="deposit-section-card" key={group.category}>
            <h2>{group.title}</h2>
            <div className="deposit-method-grid withdraw-method-grid">
              {group.items.map((option) => (
                <button className={`deposit-method-card withdraw-method-card ${option.type === 'crypto-withdraw' ? 'crypto-method-card' : ''}`} key={option.id || option.key || option.methodKey} type="button" onClick={() => openWithdrawPopup(option)}>
                  <span className="deposit-method-logo-box">
                    {getOptionImage(option) ? (
                      <img src={getOptionImage(option)} alt={option.methodTitle} />
                    ) : (
                      <strong>{compactTitle(option.methodTitle || option.coin)}</strong>
                    )}
                  </span>
                  <span className="deposit-method-title">{option.methodTitle}</span>
                  {option.type === 'crypto-withdraw' && <small className="crypto-network-pill">{option.network}</small>}
                </button>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="deposit-section-card">
          <div className="deposit-empty">No active withdrawal option found. Main Admin must enable methods first.</div>
        </div>
      )}

      <aside className="card money-info-card deposit-info-card withdraw-info-card">
        <ShieldCheck size={28} />
        <h3>Withdraw flow</h3>
        <p>For agent withdrawals, the request goes to Agent Admin panel. For crypto withdrawals, your balance is deducted and the backend sends the payout through the configured crypto provider.</p>
      </aside>

      {selectedOption && (
        <div className="deposit-modal-backdrop" role="presentation" onMouseDown={closeWithdrawPopup}>
          <form className="deposit-popup withdraw-popup" onSubmit={submitWithdrawRequest} onMouseDown={(event) => event.stopPropagation()}>
            <button className="deposit-popup-close" type="button" onClick={closeWithdrawPopup} aria-label="Close"><X size={28} /></button>

            <div className="deposit-popup-logo">
              {selectedOption.image ? <img src={selectedOption.image} alt={selectedOption.methodTitle} /> : <strong>{compactTitle(selectedOption.methodTitle || selectedOption.coin)}</strong>}
            </div>

            <div className="withdraw-popup-heading">
              <h3>{selectedOption.methodTitle} Withdraw</h3>
              {isCryptoWithdraw && <p>{selectedOption.network}</p>}
            </div>

            <div className="deposit-popup-line" />

            <div className="withdraw-warning-box">
              <AlertTriangle size={20} />
              <p>{isCryptoWithdraw ? (selectedOption.warning || `Only withdraw ${selectedOption.coin} on ${selectedOption.network}. Wrong network/address may cause permanent loss.`) : 'Before confirming, make sure your receiving number/account is correct. Wrong information may cause payout delay or rejection.'}</p>
            </div>

            <div className="withdraw-balance-strip">
              <span>Available Balance</span>
              <strong>{formatCurrency(walletBalance)}</strong>
            </div>

            <label className="deposit-popup-field amount-field">
              <span>Amount (Min {Number(selectedOption.minAmount || 0).toLocaleString()} BDT / Max {Number(selectedOption.maxAmount || 0).toLocaleString()} BDT):</span>
              <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min={selectedOption.minAmount || 1} max={selectedOption.maxAmount || 1000000} step="1" required />
            </label>

            <label className="deposit-popup-field full-field">
              <span>{isCryptoWithdraw ? `Your ${selectedOption.methodTitle} wallet address:` : `Your ${selectedOption.methodTitle} receiving number/account:`}</span>
              <input value={receiverNumber} onChange={(event) => setReceiverNumber(event.target.value)} placeholder={buildReceivingPlaceholder(selectedOption)} required />
            </label>

            {isCryptoWithdraw ? (
              <label className="deposit-popup-field full-field">
                <span>Memo / Tag (optional):</span>
                <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="Only fill this if your wallet/exchange requires memo/tag" />
              </label>
            ) : (
              <>
                <label className="deposit-popup-field">
                  <span>Account holder name (optional):</span>
                  <input value={accountHolderName} onChange={(event) => setAccountHolderName(event.target.value)} placeholder="Name on receiving account" />
                </label>

                <label className="deposit-popup-field full-field">
                  <span>Extra note (optional):</span>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Any additional information for agent" />
                </label>
              </>
            )}

            {isCryptoWithdraw && selectedOption.dryRun && (
              <div className="crypto-dryrun-box">
                Test mode is active. Backend will create a request and deduct/hold wallet balance, but no live blockchain transaction will be sent until CRYPTO_WITHDRAW_DRY_RUN=false.
              </div>
            )}

            <button className="deposit-confirm-btn withdraw-confirm-btn" type="submit" disabled={submitting}>
              <ArrowUpFromLine size={20} /> {submitting ? 'Sending...' : isCryptoWithdraw ? 'Confirm Crypto Withdraw' : 'Confirm Withdraw'}
            </button>
          </form>
        </div>
      )}

      {!loadingOptions && !options.length && (
        <div className="withdraw-empty-help card">
          <WalletCards size={28} />
          <p>Withdrawal methods use Main Admin payment settings and crypto withdraw backend configuration.</p>
        </div>
      )}
    </div>
  );
}
