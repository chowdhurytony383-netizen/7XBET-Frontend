import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Plus, RefreshCw, Save, XCircle } from 'lucide-react';
import { DepositMethodAPI } from '../../api/depositMethods.js';
import { getApiError } from '../../api/client.js';
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
};

function appendFormValues(formData, method, form) {
  formData.set('key', method.key || form?.key?.value || '');
  formData.set('title', form?.title?.value || method.title || '');
  formData.set('category', form?.category?.value || method.category || 'e-wallets');
  formData.set('minAmount', form?.minAmount?.value || method.minAmount || 100);
  formData.set('maxAmount', form?.maxAmount?.value || method.maxAmount || 25000);
  formData.set('displayOrder', form?.displayOrder?.value || method.displayOrder || 100);
  formData.set('isActive', form?.isActive?.checked ? 'true' : 'false');
}

function MethodForm({ method, mode = 'edit', onSubmit, onDisable }) {
  const isCreate = mode === 'create';
  const [preview, setPreview] = useState(method.image || '');

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(method.image || '');
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  return (
    <form className="agent-method-card" onSubmit={(event) => onSubmit(method, event)}>
      <div className="agent-method-top">
        <div>
          <span className="page-eyebrow">{isCreate ? 'New Payment Option' : 'Payment Option'}</span>
          <h2>{method.title || 'New method'}</h2>
        </div>
        <span className="method-badge custom"><ImagePlus size={24} /></span>
      </div>

      <label className="agent-check-row">
        <input type="checkbox" name="isActive" defaultChecked={method.isActive !== false} />
        Show on website deposit page
      </label>

      <div className="admin-method-two-col">
        <label className="agent-field">
          <span>Method Key</span>
          <input
            name="key"
            defaultValue={method.key || ''}
            placeholder="bkash / nagad / upay"
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
        <button type="submit" className="agent-save-btn"><Save size={18} /> {isCreate ? 'Create Method' : 'Save Changes'}</button>
        {!isCreate && (
          <button type="button" className="agent-disable-btn" onClick={() => onDisable(method.key)}>
            <XCircle size={18} /> Disable
          </button>
        )}
      </div>
    </form>
  );
}

export default function AdminAgentPaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
      toast.success('Deposit method created');
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
      toast.success('Deposit method updated');
      await loadMethods();
    } catch (error) {
      toast.error(getApiError(error, 'Update failed'));
    }
  };

  const disableMethod = async (methodKey) => {
    try {
      await DepositMethodAPI.disable(methodKey);
      toast.success('Deposit method disabled');
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
          <h1>Website Deposit Options</h1>
          <p>Upload bKash, Nagad, Upay, Rocket etc. logo/image here. Agent Admin will only add the payment number and note for each option.</p>
        </div>

        <button className="btn btn-soft" type="button" onClick={loadMethods} disabled={loading}>
          <RefreshCw size={18} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {message && <div className="agent-payment-message">{message}</div>}

      <div className="agent-payment-grid admin-method-grid">
        <MethodForm method={emptyNewMethod} mode="create" onSubmit={createMethod} />

        {loading ? (
          <div className="agent-payment-message">Loading deposit methods...</div>
        ) : methods.length ? (
          methods.map((method) => (
            <MethodForm key={method.key} method={method} onSubmit={updateMethod} onDisable={disableMethod} />
          ))
        ) : (
          <div className="agent-payment-message">No deposit method found.</div>
        )}
      </div>
    </div>
  );
}
