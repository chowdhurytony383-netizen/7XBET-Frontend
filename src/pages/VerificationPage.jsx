import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FileCheck2, Save, UploadCloud } from 'lucide-react';
import { VerificationAPI } from '../api/verification.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import './VerificationPage.css';

const documentTypes = [
  { value: 'NID', label: 'NID' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'PASSPORT', label: 'Passport' },
];

const initialForm = {
  fullName: '', email: '', phone: '', dateOfBirth: '', address: '', street: '', city: '', postCode: '', documentType: 'NID', documentNumber: '',
};

export default function VerificationPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [documentFront, setDocumentFront] = useState(null);
  const [documentBack, setDocumentBack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const status = useMemo(() => user?.verificationStatus || user?.kyc?.status || user?.identityVerification?.status || 'Not submitted', [user]);

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
        documentType: user?.documentType || user?.kyc?.documentType || 'NID',
        documentNumber: user?.documentNumber || user?.kyc?.documentNumber || '',
      };
      try {
        const response = await VerificationAPI.getMine();
        const data = response.data?.data || response.data?.verification || response.data || {};
        if (!active) return;
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
          documentType: data.documentType || profileValues.documentType,
          documentNumber: data.documentNumber || profileValues.documentNumber,
        });
      } catch (_) {
        if (active) setForm(profileValues);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (documentFront) payload.append('documentFront', documentFront);
      if (documentBack) payload.append('documentBack', documentBack);
      await VerificationAPI.submit(payload);
      await refreshUser().catch(() => null);
      toast.success('Verification information submitted');
    } catch (error) {
      toast.error(getApiError(error, 'Verification submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-stack"><div className="card center-card"><div className="loader" /></div></div>;

  return (
    <div className="page-stack verification-page">
      <PageHeader eyebrow="Profile" title="Verification" description="Submit identity and address information." />
      <section className="card verification-status-card">
        <FileCheck2 size={26} />
        <div><span>Current status</span><strong>{status}</strong></div>
      </section>
      <form className="card verification-form" onSubmit={submit}>
        <div className="verification-section-title"><h3>Personal information</h3><p>Use the same details that match the submitted document.</p></div>
        <div className="verification-grid">
          <div className="input-group"><label htmlFor="fullName">Full Name</label><input id="fullName" name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" required /></div>
          <div className="input-group"><label htmlFor="email">Email</label><input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /></div>
          <div className="input-group"><label htmlFor="phone">Phone</label><input id="phone" name="phone" value={form.phone} onChange={updateField} autoComplete="tel" required /></div>
          <div className="input-group"><label htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} required /></div>
        </div>
        <div className="verification-section-title"><h3>Address</h3></div>
        <div className="verification-grid">
          <div className="input-group wide"><label htmlFor="address">Address</label><input id="address" name="address" value={form.address} onChange={updateField} autoComplete="street-address" required /></div>
          <div className="input-group"><label htmlFor="street">Street</label><input id="street" name="street" value={form.street} onChange={updateField} required /></div>
          <div className="input-group"><label htmlFor="city">City</label><input id="city" name="city" value={form.city} onChange={updateField} autoComplete="address-level2" required /></div>
          <div className="input-group"><label htmlFor="postCode">Post code</label><input id="postCode" name="postCode" value={form.postCode} onChange={updateField} autoComplete="postal-code" required /></div>
        </div>
        <div className="verification-section-title"><h3>Document</h3></div>
        <div className="verification-grid">
          <div className="input-group"><label htmlFor="documentType">Documents Type</label><select id="documentType" name="documentType" value={form.documentType} onChange={updateField} required>{documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
          <div className="input-group"><label htmlFor="documentNumber">Document-Number</label><input id="documentNumber" name="documentNumber" value={form.documentNumber} onChange={updateField} required /></div>
          <label className="upload-box" htmlFor="documentFront"><UploadCloud size={20} /><span>Document front</span><input id="documentFront" type="file" accept="image/*,.pdf" onChange={(event) => setDocumentFront(event.target.files?.[0] || null)} /><small>{documentFront?.name || 'Choose file'}</small></label>
          <label className="upload-box" htmlFor="documentBack"><UploadCloud size={20} /><span>Document back</span><input id="documentBack" type="file" accept="image/*,.pdf" onChange={(event) => setDocumentBack(event.target.files?.[0] || null)} /><small>{documentBack?.name || 'Choose file'}</small></label>
        </div>
        <button className="btn btn-primary verification-submit" type="submit" disabled={submitting}><Save size={18} /> {submitting ? 'Submitting...' : 'Submit verification'}</button>
      </form>
    </div>
  );
}
