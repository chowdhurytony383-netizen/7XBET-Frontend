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
    formData.set('isActive', form.querySelector('[name="isActive"]').checked ? 'true' : 'false');

    try {
      await AgentAPI.updatePaymentMethod(methodKey, formData);
      toast.success('Payment number and note updated');
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
          <h1>Payment Number Settings</h1>
          <p>Main Admin controls which method slots are available for your account. Here you only add your receiving number and popup note for assigned methods.</p>
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
          <strong>Balance {formatCurrency(agent.balance || 0)}</strong>
        </div>
      )}

      <div className="agent-payment-grid">
        {loading ? (
          <div className="agent-payment-message">Loading payment methods...</div>
        ) : methods.length ? methods.map((method) => (
          <form
            key={method.key}
            className="agent-method-card"
            onSubmit={(event) => updateMethod(method.key, event)}
          >
            <div className="agent-method-top">
              <div>
                <span className="page-eyebrow">Assigned Payment Method</span>
                <h2>{method.title}</h2>
                <p className="agent-method-subtitle">
                  Key: {method.key} • Min {formatCurrency(method.minAmount || 0)} / Max {formatCurrency(method.maxAmount || 0)}
                </p>
              </div>
              <MethodBadge method={method} />
            </div>

            <label className="agent-check-row">
              <input type="checkbox" name="isActive" defaultChecked={method.isActive} />
              Active for website deposits
            </label>

            <label className="agent-field">
              <span>{method.title} Wallet / Agent Number</span>
              <input name="number" defaultValue={method.number || ''} placeholder={`Enter ${method.title} receiving number`} />
            </label>

            <label className="agent-field">
              <span>Popup Note / Instructions</span>
              <textarea name="note" defaultValue={method.note || ''} placeholder="Example: Send money only. Cash-out is not allowed." />
            </label>

            <button className="agent-save-btn" type="submit"><Save size={18} /> Update {method.title}</button>
          </form>
        )) : (
          <div className="agent-payment-message">Main Admin has not assigned any payment method to your account yet.</div>
        )}
      </div>
    </div>
  );
}
