import { useState } from 'react';
import { formatCurrency } from '../../utils/format.js';
import { AdminAgentPaymentAPI } from '../../api/adminAgentPayments.js';
import '../AgentPaymentMethods.css';

const methodLabels = {
  bkash: 'bKash Agent',
  nagad: 'Nagad Agent',
  rocket: 'Rocket Agent',
};

export default function AdminAgentPaymentMethodsPage() {
  const [agentId, setAgentId] = useState('');
  const [agent, setAgent] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAgent = async () => {
    if (!agentId.trim()) {
      setMessage('Agent ID required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await AdminAgentPaymentAPI.getMethods(agentId.trim());
      setAgent(response.data?.data);
    } catch (error) {
      setAgent(null);
      setMessage(error.response?.data?.message || 'Agent not found');
    } finally {
      setLoading(false);
    }
  };

  const updateMethod = async (methodKey, event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('isActive', form.querySelector('[name="isActive"]').checked ? 'true' : 'false');

    setMessage('');

    try {
      await AdminAgentPaymentAPI.updateMethod(agent.agentId, methodKey, formData);
      setMessage(`${methodLabels[methodKey]} updated`);
      await loadAgent();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="agent-payment-page">
      <div className="agent-payment-header">
        <div>
          <span className="page-eyebrow">Main Admin</span>
          <h1>Agent Payment Methods</h1>
          <p>Main admin can set bKash, Nagad and Rocket numbers, images and notes for every agent.</p>
        </div>
      </div>

      <div className="agent-search-card">
        <label>Agent ID</label>
        <div className="agent-search-row">
          <input
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            placeholder="Example: AG1001"
          />
          <button type="button" onClick={loadAgent} disabled={loading}>
            {loading ? 'Loading...' : 'Load Agent'}
          </button>
        </div>
      </div>

      {message && <div className="agent-payment-message">{message}</div>}

      {agent && (
        <>
          <div className="agent-summary-card">
            <div>
              <span className="page-eyebrow">Selected Agent</span>
              <h2>{agent.agentId} — {agent.name}</h2>
            </div>

            <strong>Balance {formatCurrency(agent.balance || 0)}</strong>
          </div>

          <div className="agent-payment-grid">
            {agent.paymentMethods.map((method) => (
              <form
                key={method.key}
                className="agent-method-card"
                onSubmit={(event) => updateMethod(method.key, event)}
              >
                <div className="agent-method-top">
                  <div>
                    <span className="page-eyebrow">Payment Method</span>
                    <h2>{method.title}</h2>
                  </div>
                  <span className={`method-badge ${method.key}`}>
                    {method.key === 'bkash' ? 'bK' : method.key === 'nagad' ? 'N' : 'R'}
                  </span>
                </div>

                <label className="agent-check-row">
                  <input type="checkbox" name="isActive" defaultChecked={method.isActive} />
                  Active for deposits
                </label>

                <label className="agent-field">
                  <span>{method.title} Number</span>
                  <input
                    name="number"
                    defaultValue={method.number || ''}
                    placeholder={`Enter ${method.title} number`}
                  />
                </label>

                <label className="agent-field">
                  <span>Image / QR / Screenshot</span>
                  <div className="agent-image-preview">
                    {method.image ? <img src={method.image} alt={method.title} /> : <small>No image uploaded</small>}
                  </div>
                  <input type="file" name="image" accept="image/*" />
                </label>

                <label className="agent-field">
                  <span>Note</span>
                  <textarea
                    name="note"
                    defaultValue={method.note || ''}
                    placeholder="Write payment instructions for this agent"
                  />
                </label>

                <button type="submit" className="agent-save-btn">
                  Save {method.title}
                </button>
              </form>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
