import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { AffiliateAPI } from '../../api/affiliate.js';
import { getApiError } from '../../api/client.js';
import PageHeader from '../../components/PageHeader.jsx';
import './AffiliatePages.css';

export default function AffiliateApplyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', companyName: '', website: '', preferredCode: '', applyNote: '' });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await AffiliateAPI.apply({
        ...form,
        trafficSources: form.applyNote.split('\n').filter(Boolean),
      });
      toast.success('Affiliate application submitted');
      navigate('/affiliate/dashboard');
    } catch (error) {
      toast.error(getApiError(error, 'Affiliate application failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="affiliate-page">
      <PageHeader
        eyebrow="Approved Partner Program"
        title="Apply for 7XBET Affiliate"
        description="Responsive layout optimized for desktop and mobile. Approved partners earn GGR-based revenue share with a 30% default commission rate."
      />

      <section className="affiliate-policy-grid">
        <article><strong>Commission type</strong><span>Revenue Share based on Net GGR</span></article>
        <article><strong>Default rate</strong><span>30%</span></article>
        <article><strong>VIP rate</strong><span>30%–40%</span></article>
        <article><strong>Carryover</strong><span>Negative carryover enabled</span></article>
      </section>

      <form className="affiliate-form-card" onSubmit={submit}>
        <div className="affiliate-form-grid">
          <label>
            Display name
            <input name="displayName" value={form.displayName} onChange={updateField} placeholder="Your brand/name" />
          </label>
          <label>
            Company name
            <input name="companyName" value={form.companyName} onChange={updateField} placeholder="Optional" />
          </label>
          <label>
            Website / social link
            <input name="website" value={form.website} onChange={updateField} placeholder="https://..." />
          </label>
          <label>
            Preferred affiliate code
            <input name="preferredCode" value={form.preferredCode} onChange={updateField} placeholder="Example: AFFJONY" />
          </label>
        </div>

        <label className="affiliate-textarea-field">
          Traffic plan / countries / notes
          <textarea name="applyNote" value={form.applyNote} onChange={updateField} rows="6" placeholder="Tell admin how you will promote 7XBET..." />
        </label>

        <div className="affiliate-actions">
          <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit application'}</button>
          <Link to="/affiliate/dashboard">Already applied?</Link>
        </div>
      </form>
    </main>
  );
}
