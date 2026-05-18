import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FileCheck2, Save } from 'lucide-react';
import { VerificationAPI } from '../api/verification.js';
import { getApiError } from '../api/client.js';
import { getWithdrawProfileMissingFields, isWithdrawProfileComplete } from '../utils/withdrawProfile.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import './VerificationPage.css';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  street: '',
  city: '',
  postCode: '',
  documentType: '',
  documentNumber: '',
};

const documentTypeOptions = [
  { value: '', label: 'Select document type', numberLabel: 'Document Number', placeholder: 'Select a document type first' },
  { value: 'NID', label: 'NID', numberLabel: 'NID Number', placeholder: 'Enter NID number' },
  { value: 'Driving', label: 'Driving Licence', numberLabel: 'Driving Licence Number', placeholder: 'Enter driving licence number' },
  { value: 'Passport', label: 'Passport', numberLabel: 'Passport Number', placeholder: 'Enter passport number' },
];

function getDocumentOption(type) {
  return documentTypeOptions.find((option) => option.value === type) || documentTypeOptions[0];
}

export default function VerificationPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState(null);

  const missingWithdrawFields = useMemo(() => getWithdrawProfileMissingFields({ ...user, ...form }), [user, form]);
  const withdrawProfileComplete = useMemo(() => isWithdrawProfileComplete({ ...user, ...form }), [user, form]);
  const status = withdrawProfileComplete ? 'Profile complete' : 'Required info missing';
  const selectedDocumentOption = useMemo(() => getDocumentOption(form.documentType), [form.documentType]);

  const userId = user?._id || user?.id || '';

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const profileValues = {
        fullName: user?.fullName || user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
        address: user?.address || user?.kyc?.address || '',
        street: user?.street || user?.kyc?.street || '',
        city: user?.city || user?.kyc?.city || '',
        postCode: user?.postCode || user?.postalCode || user?.kyc?.postCode || '',
        documentType: user?.documentType || user?.kyc?.documentType || '',
        documentNumber: user?.documentNumber || user?.kyc?.documentNumber || '',
      };

      try {
        const response = await VerificationAPI.getMine();
        const data = response.data?.data || response.data?.verification || {};

        if (!active) return;

        setVerification(data || null);
        setForm({
          ...profileValues,
          fullName: data.fullName || profileValues.fullName,
          email: data.email || profileValues.email,
          phone: data.phone || profileValues.phone,
          dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : profileValues.dateOfBirth,
          address: data.address || profileValues.address,
          street: data.street || profileValues.street,
          city: data.city || profileValues.city,
          postCode: data.postCode || data.postalCode || profileValues.postCode,
          documentType: data.documentType && data.documentType !== 'NONE' ? data.documentType : profileValues.documentType,
          documentNumber: data.documentNumber || profileValues.documentNumber,
        });
      } catch (_) {
        if (active) {
          setVerification(null);
          setForm(profileValues);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'documentType' && !value ? { documentNumber: '' } : {}),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const missingFields = getWithdrawProfileMissingFields({ ...user, ...form });
    if (missingFields.length) {
      toast.error(`Please enter ${missingFields.join(' and ')} before withdrawal.`);
      return;
    }

    if (form.documentType && !String(form.documentNumber || '').trim()) {
      toast.error(`Please enter ${selectedDocumentOption.numberLabel}.`);
      return;
    }

    if (!form.documentType && String(form.documentNumber || '').trim()) {
      toast.error('Please select a document type for the document number.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value || ''));

      const response = await VerificationAPI.submit(payload);
      await refreshUser().catch(() => null);
      toast.success(response.data?.message || 'Profile information saved');
    } catch (error) {
      toast.error(getApiError(error, 'Profile update failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-stack"><div className="card center-card"><div className="loader" /></div></div>;

  return (
    <div className="page-stack verification-page">
      <PageHeader
        eyebrow="Profile"
        title="Account information"
        description="Full Name and Address are required before withdrawal. You can also save NID, Driving Licence, or Passport number here."
      />

      <section className={`card verification-status-card ${withdrawProfileComplete ? 'verified' : ''}`}>
        <FileCheck2 size={26} />
        <div>
          <span>Withdrawal profile status</span>
          <strong>{status}</strong>
          {!withdrawProfileComplete && <small>Missing: {missingWithdrawFields.join(', ')}</small>}
        </div>
      </section>

      <form className="card verification-form" onSubmit={submit}>
        <div className="verification-section-title">
          <h3>Basic profile information</h3>
          <p>Full Name is required for withdrawal. Email and phone are useful for support and account recovery.</p>
        </div>

        <div className="verification-grid">
          <div className="input-group"><label htmlFor="fullName">Full Name *</label><input id="fullName" name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" required /></div>
          <div className="input-group"><label htmlFor="email">Email</label><input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" /></div>
          <div className="input-group"><label htmlFor="phone">Phone</label><input id="phone" name="phone" value={form.phone} onChange={updateField} autoComplete="tel" /></div>
          <div className="input-group"><label htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} /></div>
        </div>

        <div className="verification-section-title"><h3>Address information</h3><p>Address is required for withdrawal. Document upload is not required.</p></div>
        <div className="verification-grid">
          <div className="input-group wide"><label htmlFor="address">Address *</label><input id="address" name="address" value={form.address} onChange={updateField} autoComplete="street-address" required /></div>
          <div className="input-group"><label htmlFor="street">Street</label><input id="street" name="street" value={form.street} onChange={updateField} /></div>
          <div className="input-group"><label htmlFor="city">City</label><input id="city" name="city" value={form.city} onChange={updateField} autoComplete="address-level2" /></div>
          <div className="input-group"><label htmlFor="postCode">Post code</label><input id="postCode" name="postCode" value={form.postCode} onChange={updateField} autoComplete="postal-code" /></div>
        </div>


        <div className="verification-section-title">
          <h3>Document information</h3>
          <p>Select NID, Driving Licence, or Passport and enter the matching document number. Document image upload is not required.</p>
        </div>
        <div className="verification-grid">
          <div className="input-group">
            <label htmlFor="documentType">Document Type</label>
            <select id="documentType" name="documentType" value={form.documentType} onChange={updateField}>
              {documentTypeOptions.map((option) => (
                <option key={option.value || 'none'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="documentNumber">{selectedDocumentOption.numberLabel}</label>
            <input
              id="documentNumber"
              name="documentNumber"
              value={form.documentNumber}
              onChange={updateField}
              placeholder={selectedDocumentOption.placeholder}
              disabled={!form.documentType}
              required={Boolean(form.documentType)}
            />
          </div>
        </div>

        <button className="btn btn-primary verification-submit" type="submit" disabled={submitting}>
          <Save size={18} /> {submitting ? 'Saving...' : 'Save profile information'}
        </button>
      </form>
    </div>
  );
}
