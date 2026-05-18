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
    return <img className="agent-method-logo" src={method.image} alt={method.displayTitle || method.title} />;
  }

  return <span className={`method-badge ${method.key || 'custom'}`}>{String(method.title || method.key || '?').slice(0, 2)}</span>;
}

function methodTitle(method) {
  return method.displayTitle || (method.channelLabel ? `${method.title} - ${method.channelLabel}` : method.title);
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

  useEffect(() => {
    loadData();
  }, []);

  const updateMethod = async (methodKey, event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('isActive', form.querySelector('[name="isActive"]')?.checked ? 'true' : 'false');
    formData.set('depositEnabled', form.querySelector('[name="depositEnabled"]')?.checked ? 'true' : 'false');
    formData.set('withdrawEnabled', form.querySelector('[name="withdrawEnabled"]')?.checked ? 'true' : 'false');

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
            Main Admin assigns method channels to your account. Update each channel separately,
            for example bKash - Channel 1 and bKash - Channel 2. Each channel can be enabled for Deposit Request and Withdraw Request separately.
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
          return (
            <form
              key={method.key}
              className="agent-method-card"
              onSubmit={(event) => updateMethod(method.key, event)}
            >
              <div className="agent-method-top">
                <div>
                  <span className="page-eyebrow">Assigned Payment Channel</span>
                  <h2>{title}</h2>
                  <p className="agent-method-subtitle">
                    Key: {method.key} • {method.channelLabel || 'Channel 1'} • Min {formatCurrency(method.minAmount || 0, agent)} / Max {formatCurrency(method.maxAmount || 0, agent)}
                  </p>
                </div>
                <MethodBadge method={method} />
              </div>

              <div className="agent-channel-control-panel">
                <label className="agent-check-row master-toggle">
                  <input type="checkbox" name="isActive" defaultChecked={method.isActive !== false} />
                  Channel active
                </label>
                <div className="agent-channel-toggle-grid">
                  <label className="agent-channel-toggle deposit">
                    <input type="checkbox" name="depositEnabled" defaultChecked={method.depositEnabled !== false} />
                    <span>
                      <strong>Deposit Request</strong>
                      <small>Users can send deposit requests to this channel.</small>
                    </span>
                  </label>
                  <label className="agent-channel-toggle withdraw">
                    <input type="checkbox" name="withdrawEnabled" defaultChecked={method.withdrawEnabled !== false} />
                    <span>
                      <strong>Withdraw Request</strong>
                      <small>Users can send withdrawal requests to this channel.</small>
                    </span>
                  </label>
                </div>
              </div>

              <label className="agent-field">
                <span>{title} Wallet / Agent Number</span>
                <input name="number" defaultValue={method.number || ''} placeholder={`Enter ${method.title} receiving number`} />
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
