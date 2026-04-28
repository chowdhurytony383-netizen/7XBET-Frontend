import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownToLine, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import './DepositPage.css';

const quickAmounts = [100, 500, 1000, 2500];

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedOption = useMemo(
    () => options.find((item) => item.id === selectedId) || options[0] || null,
    [options, selectedId]
  );

  const loadOptions = async () => {
    setLoadingOptions(true);

    try {
      const response = await AccountAPI.agentDepositOptions();
      const nextOptions = response.data?.data || response.data?.options || [];
      setOptions(nextOptions);
      setSelectedId((current) => current || nextOptions[0]?.id || '');
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load deposit options'));
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

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

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setSubmitting(true);

    try {
      await AccountAPI.createAgentDepositRequest({
        agentId: selectedOption.agentId,
        methodKey: selectedOption.methodKey,
        amount: numericAmount,
        note,
      });

      toast.success('Deposit request sent to agent panel');
      setAmount('');
      setNote('');
      await refreshUser().catch(() => null);
    } catch (error) {
      toast.error(getApiError(error, 'Deposit request failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Wallet"
        title="Deposit"
        description="Choose an active agent payment method, send payment, then submit a deposit request."
        actions={<button className="btn btn-soft" onClick={loadOptions}><RefreshCw size={18} /> Refresh options</button>}
      />

      <div className="money-page-grid">
        <form className="card money-form-card form-grid" onSubmit={submitDepositRequest}>
          <div className="input-group">
            <label htmlFor="method">Deposit payment option</label>
            <select
              id="method"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={loadingOptions || !options.length}
            >
              {loadingOptions && <option>Loading payment options...</option>}
              {!loadingOptions && !options.length && <option>No active payment option</option>}
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.methodTitle} — {option.number || 'No number'} — {option.agentId}
                </option>
              ))}
            </select>
          </div>

          {selectedOption && (
            <div className="agent-payment-option-card">
              <div>
                <span className="page-eyebrow">Selected method</span>
                <h3>{selectedOption.methodTitle}</h3>
                <p>Agent: {selectedOption.agentId} — {selectedOption.agentName || 'Agent'}</p>
              </div>

              <div className="payment-number-row">
                <strong>{selectedOption.number || 'Number not set'}</strong>
                {selectedOption.number && (
                  <button className="btn btn-soft" type="button" onClick={copyNumber}>
                    <Copy size={17} /> Copy
                  </button>
                )}
              </div>

              {selectedOption.image && (
                <img className="payment-method-image" src={selectedOption.image} alt={selectedOption.methodTitle} />
              )}

              {selectedOption.note && <p className="payment-method-note">{selectedOption.note}</p>}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              min="1"
              step="1"
              placeholder="Enter deposit amount"
              required
            />
          </div>

          <div className="amount-buttons">
            {quickAmounts.map((value) => (
              <button className="btn btn-soft" type="button" key={value} onClick={() => setAmount(String(value))}>
                {formatCurrency(value)}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label htmlFor="note">Transaction ID / Sender Number / Note</label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write transaction ID, sender number or note for agent"
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting || !selectedOption}>
            <ArrowDownToLine size={18} /> {submitting ? 'Sending request...' : 'Submit deposit request'}
          </button>
        </form>

        <aside className="card money-info-card">
          <ShieldCheck size={28} />
          <h3>Agent deposit flow</h3>
          <p>After you submit this request, it will appear in the Agent Admin Panel. When the agent confirms it, your wallet balance will be credited.</p>
          <p>Current wallet balance: <strong>{formatCurrency(user?.wallet)}</strong></p>
        </aside>
      </div>
    </div>
  );
}
