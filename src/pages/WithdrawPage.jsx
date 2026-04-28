import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpFromLine, Landmark, RefreshCw } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import './DepositPage.css';

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const [options, setOptions] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [form, setForm] = useState({
    amount: '',
    methodKey: 'bkash',
    accountNumber: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const loadAgents = async () => {
    try {
      const response = await AccountAPI.agentDepositOptions();
      const nextOptions = response.data?.data || response.data?.options || [];
      setOptions(nextOptions);
      setAgentId((current) => current || nextOptions[0]?.agentId || '');
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load active agents'));
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if ((user?.wallet || 0) < amount) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setSubmitting(true);

    try {
      await AccountAPI.createAgentWithdrawRequest({
        amount,
        agentId,
        methodKey: form.methodKey,
        accountNumber: form.accountNumber,
        note: form.note || form.accountNumber,
      });

      await refreshUser().catch(() => null);
      toast.success('Withdrawal request sent to agent panel');
      setForm({ amount: '', methodKey: 'bkash', accountNumber: '', note: '' });
    } catch (error) {
      toast.error(getApiError(error, 'Withdrawal request failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueAgents = Array.from(new Map(options.map((item) => [item.agentId, item])).values());

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Wallet"
        title="Withdraw"
        description="Submit a withdrawal request. The amount will be deducted after agent confirmation."
        actions={<button className="btn btn-soft" onClick={loadAgents}><RefreshCw size={18} /> Refresh agents</button>}
      />

      <div className="money-page-grid">
        <form className="card money-form-card form-grid" onSubmit={submit}>
          <div className="input-group">
            <label htmlFor="agentId">Agent</label>
            <select id="agentId" value={agentId} onChange={(event) => setAgentId(event.target.value)}>
              {uniqueAgents.length ? uniqueAgents.map((item) => (
                <option key={item.agentId} value={item.agentId}>
                  {item.agentId} — {item.agentName || 'Agent'}
                </option>
              )) : (
                <option value="">No active agent</option>
              )}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="methodKey">Withdraw method</label>
            <select id="methodKey" name="methodKey" value={form.methodKey} onChange={updateField}>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank account</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              value={form.amount}
              onChange={updateField}
              type="number"
              min="1"
              step="1"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="accountNumber">Receiving number/account</label>
            <input
              id="accountNumber"
              name="accountNumber"
              value={form.accountNumber}
              onChange={updateField}
              placeholder="Your bKash/Nagad/Rocket/bank account"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="note">Note</label>
            <textarea
              id="note"
              name="note"
              value={form.note}
              onChange={updateField}
              placeholder="Optional note for agent"
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting || !agentId}>
            <ArrowUpFromLine size={18} /> {submitting ? 'Submitting...' : 'Submit withdraw request'}
          </button>
        </form>

        <aside className="card money-info-card">
          <Landmark size={28} />
          <h3>Wallet balance</h3>
          <p>{formatCurrency(user?.wallet)}</p>
          <p>When the agent confirms your request, the withdrawn amount will be deducted from your wallet and added to the agent balance.</p>
        </aside>
      </div>
    </div>
  );
}
