import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FileCheck2, Save } from 'lucide-react';
import { VerificationAPI } from '../api/verification.js';
import { getApiError } from '../api/client.js';
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
};

export default function VerificationPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState(null);

  const status = useMemo(() => {
    const userStatus = String(user?.verificationStatus || user?.verification?.status || '').toLowerCase();
    const apiStatus = String(verification?.status || '').toLowerCase();
    return userStatus === 'approved' || apiStatus === 'approved' ? 'Verified' : 'Not required';
  }, [user?.verificationStatus, user?.verification?.status, verification?.status]);

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
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
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
        description="Document verification is not required for deposit, bonus, or withdrawal. You may keep your basic profile information updated here."
      />

      <section className={`card verification-status-card ${status === 'Verified' ? 'verified' : ''}`}>
        <FileCheck2 size={26} />
        <div><span>Verification status</span><strong>{status}</strong></div>
      </section>

      <form className="card verification-form" onSubmit={submit}>
        <div className="verification-section-title">
          <h3>Basic profile information</h3>
          <p>These fields are optional for withdrawal. Full name and email are useful for support and account recovery.</p>
        </div>

        <div className="verification-grid">
          <div className="input-group"><label htmlFor="fullName">Full Name</label><input id="fullName" name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" /></div>
          <div className="input-group"><label htmlFor="email">Email</label><input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" /></div>
          <div className="input-group"><label htmlFor="phone">Phone</label><input id="phone" name="phone" value={form.phone} onChange={updateField} autoComplete="tel" /></div>
          <div className="input-group"><label htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} /></div>
        </div>

        <div className="verification-section-title"><h3>Address information</h3><p>Optional. No document upload is required.</p></div>
        <div className="verification-grid">
          <div className="input-group wide"><label htmlFor="address">Address</label><input id="address" name="address" value={form.address} onChange={updateField} autoComplete="street-address" /></div>
          <div className="input-group"><label htmlFor="street">Street</label><input id="street" name="street" value={form.street} onChange={updateField} /></div>
          <div className="input-group"><label htmlFor="city">City</label><input id="city" name="city" value={form.city} onChange={updateField} autoComplete="address-level2" /></div>
          <div className="input-group"><label htmlFor="postCode">Post code</label><input id="postCode" name="postCode" value={form.postCode} onChange={updateField} autoComplete="postal-code" /></div>
        </div>

        <button className="btn btn-primary verification-submit" type="submit" disabled={submitting}>
          <Save size={18} /> {submitting ? 'Saving...' : 'Save profile information'}
        </button>
      </form>
    </div>
  );
}
