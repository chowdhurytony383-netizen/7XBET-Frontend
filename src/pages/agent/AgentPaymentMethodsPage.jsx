import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { AgentAPI } from '../../api/agent.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import '../AgentPaymentMethods.css';

function MethodBadge({ method }) {
  if (method.image) {
    return <img className="agent-method-logo" src={method.image} alt={method.title} />;
  }

  return <span className={`method-badge ${method.key || 'custom'}`}>{String(method.title || method.key || '?').slice(0, 2)}</span>;
}

function methodTitle(method) {
  const title = method.displayTitle || method.title || method.key || 'Payment Method';
  const channel = method.channelLabel || (method.channelNumber ? `Channel ${method.channelNumber}` : '');
  return title.includes('Channel') || !channel ? title : `${title} - ${channel}`;
}

export default function AgentPaymentMethodsPage() {
  const [agent, setAgent] = useState(null);
  const [methods, setMethods] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await AgentAPI.paymentMethods();
      const data = response.data?.data;
      setAgent(data);
      setMethods(data?.paymentMethods || []);
    } catch (error) {
      setMessage(getApiError(error, 'Unable to load payment methods'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateMethod = async (methodKey, event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const active = form.querySelector('[name="depositEnabled"]')?.checked ? 'true' : 'false';

    // One switch controls both deposit and withdraw availability for this channel.
    formData.set('isActive', active);
    formData.set('depositEnabled', active);
    formData.delete('withdrawEnabled');

    try {
      await AgentAPI.updatePaymentMethod(methodKey, formData);
      toast.success('Payment channel updated');
      await loadData();
    } catch (error) {
      toast.error(getApiError(error, 'Update failed'));
    }
  };

  return (
    <div className="agent-payment-page page-stack">
      <div className="agent-payment-header admin-method-header">
        <div>
          <span className="page-eyebrow">Agent Admin Panel</span>
          <h1>Payment Channel Settings</h1>
          <p>
            Update each assigned channel separately. Only one Active/Inactive switch is needed:
            when Deposit Request is active, Withdraw Request is automatically active for the same channel.
          </p>
        </div>

        <div className="agent-header-actions">
          <Link className="btn btn-soft" to="/agent/dashboard"><ArrowLeft size={18} /> Dashboard</Link>
          <button className="btn btn-soft" onClick={loadData}><RefreshCw size={18} /> Refresh</button>
        </div>
      </div>

      {message && <div className="agent-payment-message">{message}</div>}

      {agent && (
        <div className="agent-summary-card">
          <div>
            <span className="page-eyebrow">Logged Agent</span>
            <h2>{agent.agentId} — {agent.name}</h2>
          </div>
          <strong>Balance {formatCurrency(agent.balance || 0, agent)}</strong>
        </div>
      )}

      <div className="agent-payment-grid">
        {loading ? (
          <div className="agent-payment-message">Loading payment channels...</div>
        ) : methods.length ? methods.map((method) => {
          const title = methodTitle(method);
          const enabled = method.depositEnabled !== false && method.isActive !== false;

          return (
            <form key={method.key} className="agent-method-card" onSubmit={(event) => updateMethod(method.key, event)}>
              <div className="agent-method-top">
                <div>
                  <span className="page-eyebrow">Assigned Payment Channel</span>
                  <h2>{title}</h2>
                  <p className="agent-method-subtitle">
                    Key: {method.key} • Min {formatCurrency(method.minAmount || 0, agent)} / Max {formatCurrency(method.maxAmount || 0, agent)}
                  </p>
                </div>
                <MethodBadge method={method} />
              </div>

              <div className="agent-channel-control-panel single-switch">
                <label className="agent-channel-toggle deposit unified">
                  <input type="checkbox" name="depositEnabled" defaultChecked={enabled} />
                  <span>
                    <strong>Deposit Request Active</strong>
                    <small>
                      Withdraw Request will automatically follow this status. Active = Deposit + Withdraw active. Inactive = both inactive.
                    </small>
                  </span>
                </label>
              </div>

              <label className="agent-field">
                <span>{title} Wallet / Agent Number</span>
                <input name="number" defaultValue={method.number || ''} placeholder={`Enter ${method.title || 'payment'} receiving number`} />
              </label>

              <label className="agent-field">
                <span>Popup Note / Instructions</span>
                <textarea name="note" defaultValue={method.note || ''} placeholder="Example: Send money only. Cash-out is not allowed." />
              </label>

              <button className="agent-save-btn" type="submit"><Save size={18} /> Update {title}</button>
            </form>
          );
        }) : (
          <div className="agent-payment-message">Main Admin has not assigned any payment channel to your account yet.</div>
        )}
      </div>
    </div>
  );
}
