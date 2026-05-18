import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, RefreshCw, Save, ShieldCheck, Users, XCircle } from 'lucide-react';
import { DepositMethodAPI } from '../../api/depositMethods.js';
import { AdminAPI } from '../../api/admin.js';
import { AdminAgentPaymentAPI } from '../../api/adminAgentPayments.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import '../AgentPaymentMethods.css';

const categoryOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'e-wallets', label: 'E-wallets' },
  { value: 'bank', label: 'Bank' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
];

const emptyNewMethod = {
  key: '',
  title: '',
  category: 'e-wallets',
  minAmount: 100,
  maxAmount: 25000,
  displayOrder: 100,
  isActive: true,
  image: '',
};

function appendFormValues(formData, method, elements) {
  formData.set('key', method.key || elements.key?.value || '');
  formData.set('title', elements.title?.value || method.title || '');
  formData.set('category', elements.category?.value || method.category || 'e-wallets');
  formData.set('displayOrder', elements.displayOrder?.value || method.displayOrder || 100);
  formData.set('minAmount', elements.minAmount?.value || method.minAmount || 100);
  formData.set('maxAmount', elements.maxAmount?.value || method.maxAmount || 25000);
  formData.set('isActive', elements.isActive?.checked ? 'true' : 'false');
}

function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*(?:no|number|num|serial|sr)?\s*[#:_-]*\s*\d+$/i, '')
    .trim();
}

function decorateMethods(methods = []) {
  const groups = new Map();
  const sorted = [...methods].sort((a, b) => {
    const av = Number(a.displayOrder || 100);
    const bv = Number(b.displayOrder || 100);
    if (av !== bv) return av - bv;
    return String(a.key || '').localeCompare(String(b.key || ''));
  });

  for (const method of sorted) {
    const groupKey = normalizeTitle(method.title) || normalizeTitle(method.key) || method.key;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(method);
  }

  const channelByKey = new Map();
  for (const [groupKey, items] of groups.entries()) {
    const hasMultiple = items.length > 1;
    items.forEach((method, index) => {
      const channelNumber = index + 1;
      const channelLabel = hasMultiple ? `Channel ${channelNumber}` : 'Channel 1';
      channelByKey.set(method.key, {
        channelNumber,
        channelLabel,
        groupKey,
        groupSize: items.length,
        displayTitle: hasMultiple ? `${method.title} - ${channelLabel}` : method.title,
      });
    });
  }

  return methods.map((method) => ({
    ...method,
    ...(channelByKey.get(method.key) || {}),
  }));
}

function getDisplayTitle(method = {}) {
  return method.displayTitle || (method.channelLabel ? `${method.title} - ${method.channelLabel}` : method.title);
}

function MethodBadge({ method }) {
  if (method.image) {
    return <img className="agent-method-logo" src={method.image} alt={getDisplayTitle(method) || method.key} />;
  }

  return <span className={`method-badge ${method.key || 'custom'}`}>{String(method.title || method.key || '?').slice(0, 2)}</span>;
}

function MethodForm({ method, mode = 'edit', onSubmit, onDisable }) {
  const isCreate = mode === 'create';
  const [preview, setPreview] = useState(method.image || '');

  useEffect(() => {
    setPreview(method.image || '');
  }, [method.image]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  return (
    <form className="agent-method-card" onSubmit={(event) => onSubmit(method, event)}>
      <div className="agent-method-top">
        <div>
          <span className="page-eyebrow">{isCreate ? 'Create New Method Channel' : 'Global Method Channel'}</span>
          <h2>{isCreate ? 'Add Deposit/Withdraw Channel' : getDisplayTitle(method)}</h2>
          {!isCreate && (
            <p className="agent-method-subtitle">
              Key: {method.key} {method.channelLabel ? `• ${method.channelLabel}` : ''}
            </p>
          )}
        </div>
        {!isCreate && <MethodBadge method={method} />}
      </div>

      <label className="agent-check-row">
        <input type="checkbox" name="isActive" defaultChecked={method.isActive !== false} />
        Active on website
      </label>

      <div className="agent-payment-hint">
        To create separate channels, use unique keys with the same display name. Example: key <b>bkash1</b> title <b>bKash</b>, key <b>bkash2</b> title <b>bKash</b>.
      </div>

      <div className="admin-method-two-col">
        <label className="agent-field">
          <span>Method Key</span>
          <input
            name="key"
            defaultValue={method.key || ''}
            placeholder="bkash1 / bkash2 / nagad1"
            readOnly={!isCreate}
            required
          />
        </label>

        <label className="agent-field">
          <span>Display Name</span>
          <input name="title" defaultValue={method.title || ''} placeholder="bKash" required />
        </label>
      </div>

      <div className="admin-method-two-col">
        <label className="agent-field">
          <span>Category</span>
          <select name="category" defaultValue={method.category || 'e-wallets'}>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="agent-field">
          <span>Display Order</span>
          <input name="displayOrder" type="number" defaultValue={method.displayOrder || 100} />
        </label>
      </div>

      <div className="admin-method-two-col">
        <label className="agent-field">
          <span>Minimum Amount</span>
          <input name="minAmount" type="number" min="1" defaultValue={method.minAmount || 100} />
        </label>

        <label className="agent-field">
          <span>Maximum Amount</span>
          <input name="maxAmount" type="number" min="1" defaultValue={method.maxAmount || 25000} />
        </label>
      </div>

      <label className="agent-field">
        <span>Logo / Image</span>
        <div className="agent-image-preview admin-method-preview">
          {preview ? <img src={preview} alt={method.title || 'Payment method'} /> : <small>No image uploaded</small>}
        </div>
        <input type="file" name="image" accept="image/*" onChange={handleImageChange} />
      </label>

      <div className="admin-method-actions">
        <button type="submit" className="agent-save-btn"><Save size={18} /> {isCreate ? 'Create Channel' : 'Save Changes'}</button>
        {!isCreate && (
          <button type="button" className="agent-disable-btn" onClick={() => onDisable(method.key)}>
            <XCircle size={18} /> Disable
          </button>
        )}
      </div>
    </form>
  );
}

function AgentMethodAccessManager({ methods }) {
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [access, setAccess] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const accessMethods = access?.depositMethods?.length ? access.depositMethods : methods;
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await AdminAPI.agents({});
      setAgents(response.data?.data || response.data?.agents || []);
    } catch (error) {
      setMessage(getApiError(error, 'Unable to load agents'));
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadAccess = async (nextAgentId = agentId) => {
    const cleanAgentId = String(nextAgentId || '').trim().toUpperCase();
    if (!cleanAgentId) {
      setMessage('Agent ID required');
      return;
    }

    setLoadingAccess(true);
    setMessage('');

    try {
      const response = await AdminAgentPaymentAPI.getAccess(cleanAgentId);
      const data = response.data?.data;
      setAccess(data);
      setAgentId(data?.agentId || cleanAgentId);
      setSelectedKeys(data?.allowedPaymentMethodKeys || []);
    } catch (error) {
      setAccess(null);
      setSelectedKeys([]);
      setMessage(getApiError(error, 'Agent not found'));
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const toggleKey = (methodKey) => {
    setSelectedKeys((current) => {
      const exists = current.includes(methodKey);
      return exists ? current.filter((key) => key !== methodKey) : [...current, methodKey];
    });
  };

  const selectAll = () => {
    setSelectedKeys(accessMethods.map((method) => method.key).filter(Boolean));
  };

  const clearAll = () => {
    setSelectedKeys([]);
  };

  const saveAccess = async () => {
    if (!access?.agentId) {
      setMessage('Load an agent first');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await AdminAgentPaymentAPI.updateAccess(access.agentId, {
        allowedPaymentMethodKeys: selectedKeys,
      });
      const data = response.data?.data;
      setAccess(data);
      setSelectedKeys(data?.allowedPaymentMethodKeys || []);
      toast.success('Agent payment method access updated');
    } catch (error) {
      toast.error(getApiError(error, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="agent-access-panel">
      <div className="agent-access-header">
        <div>
          <span className="page-eyebrow">Main Admin Control</span>
          <h2>Agent Payment Channel Access</h2>
          <p>
            Assign separate method channels to agents. Example: bKash - Channel 1 and bKash - Channel 2 can be assigned separately.
            Inside Agent Admin Panel, each channel has separate Deposit Request and Withdraw Request toggles.
          </p>
        </div>
        <ShieldCheck size={34} />
      </div>

      <div className="agent-access-search">
        <label className="agent-field">
          <span>Select Agent</span>
          <select
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            disabled={loadingAgents}
          >
            <option value="">{loadingAgents ? 'Loading agents...' : 'Select agent'}</option>
            {agents.map((agent) => (
              <option key={agent._id || agent.agentId} value={agent.agentId}>
                {agent.agentId} — {agent.name || 'Agent'} ({agent.status})
              </option>
            ))}
          </select>
        </label>

        <label className="agent-field">
          <span>Or Type Agent ID</span>
          <input
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            placeholder="Example: AG1001"
          />
        </label>

        <button type="button" className="agent-save-btn" onClick={() => loadAccess()} disabled={loadingAccess}>
          <Users size={18} /> {loadingAccess ? 'Loading...' : 'Load Agent'}
        </button>
      </div>

      {message && <div className="agent-payment-message">{message}</div>}

      {access && (
        <div className="agent-access-body">
          <div className="agent-summary-card">
            <div>
              <span className="page-eyebrow">Selected Agent</span>
              <h2>{access.agentId} — {access.name || 'Agent'}</h2>
            </div>
            <div className="agent-access-summary-actions">
              <strong>Balance {formatCurrency(access.balance || 0)}</strong>
              <strong>{selectedKeys.length}/{accessMethods.length} Assigned</strong>
            </div>
          </div>

          <div className="agent-access-toolbar">
            <button type="button" className="btn btn-soft" onClick={selectAll}>Select All</button>
            <button type="button" className="btn btn-soft" onClick={clearAll}>Clear All</button>
            <button type="button" className="agent-save-btn" onClick={saveAccess} disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Access'}
            </button>
          </div>

          <div className="agent-access-method-grid">
            {accessMethods.map((method) => {
              const checked = selectedSet.has(method.key);
              const payment = method.agentPayment || {};
              return (
                <label
                  key={method.key}
                  className={`agent-access-method ${checked ? 'is-selected' : ''} ${method.isActive === false ? 'is-disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleKey(method.key)}
                  />
                  <MethodBadge method={method} />
                  <span className="agent-access-method-info">
                    <strong>{getDisplayTitle(method)}</strong>
                    <small>Key: {method.key}</small>
                    <small>{method.category || 'e-wallets'} • {method.isActive === false ? 'Global disabled' : 'Global active'}</small>
                    {payment.number && <small>Agent number: {payment.number}</small>}
                    <small className="agent-channel-flags">
                      Deposit: {payment.depositEnabled === false ? 'Off' : 'On'} • Withdraw: {payment.withdrawEnabled === false ? 'Off' : 'On'}
                    </small>
                  </span>
                  <span className="agent-access-status">
                    {checked ? <><CheckCircle2 size={16} /> Assigned</> : 'Hidden'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default function AdminAgentPaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const decoratedMethods = useMemo(() => decorateMethods(methods), [methods]);

  const loadMethods = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await DepositMethodAPI.list();
      setMethods(response.data?.data || response.data?.methods || []);
    } catch (error) {
      setMessage(getApiError(error, 'Unable to load deposit methods'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const createMethod = async (method, event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    appendFormValues(formData, method, form.elements);

    try {
      await DepositMethodAPI.create(formData);
      toast.success('Payment channel created');
      form.reset();
      await loadMethods();
    } catch (error) {
      toast.error(getApiError(error, 'Create failed'));
    }
  };

  const updateMethod = async (method, event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    appendFormValues(formData, method, form.elements);

    try {
      await DepositMethodAPI.update(method.key, formData);
      toast.success('Payment channel updated');
      await loadMethods();
    } catch (error) {
      toast.error(getApiError(error, 'Update failed'));
    }
  };

  const disableMethod = async (methodKey) => {
    try {
      await DepositMethodAPI.disable(methodKey);
      toast.success('Payment channel disabled');
      await loadMethods();
    } catch (error) {
      toast.error(getApiError(error, 'Disable failed'));
    }
  };

  return (
    <div className="agent-payment-page page-stack">
      <div className="agent-payment-header admin-method-header">
        <div>
          <span className="page-eyebrow">Main Admin Panel</span>
          <h1>Website Payment Channels</h1>
          <p>
            Create separate channels under the same payment method. Example: bKash - Channel 1, bKash - Channel 2.
            Users can still see one bKash option, while agents manage each channel separately.
          </p>
        </div>

        <button className="btn btn-soft" type="button" onClick={loadMethods} disabled={loading}>
          <RefreshCw size={18} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {message && <div className="agent-payment-message">{message}</div>}

      <AgentMethodAccessManager methods={decoratedMethods} />

      <div className="agent-payment-grid admin-method-grid">
        <MethodForm method={emptyNewMethod} mode="create" onSubmit={createMethod} />

        {loading ? (
          <div className="agent-payment-message">Loading payment channels...</div>
        ) : decoratedMethods.length ? (
          decoratedMethods.map((method) => (
            <MethodForm key={method.key} method={method} onSubmit={updateMethod} onDisable={disableMethod} />
          ))
        ) : (
          <div className="agent-payment-message">No payment channel found.</div>
        )}
      </div>
    </div>
  );
}
