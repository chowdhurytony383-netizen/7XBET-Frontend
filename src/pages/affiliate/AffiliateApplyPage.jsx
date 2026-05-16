import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeDollarSign, Crown, ShieldCheck, TrendingUp } from 'lucide-react';
import { AffiliateAPI } from '../../api/affiliate.js';
import { getApiError } from '../../api/client.js';
import PageHeader from '../../components/PageHeader.jsx';
import './AffiliatePages.css';

export default function AffiliateApplyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    companyName: '',
    website: '',
    preferredCode: '',
    applyNote: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await AffiliateAPI.apply({
        ...form,
        trafficSources: form.applyNote.split('\n').map((item) => item.trim()).filter(Boolean),
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
    <main className="affiliate-page affiliate-apply-page">
      <PageHeader
        eyebrow="Approved Partner Program"
        title="Apply for 7XBET Affiliate"
        description="Approved partners earn GGR-based revenue share. Default commission is 30%; VIP affiliates can receive 30%–40%. Negative carryover is enabled."
      />

      <section className="affiliate-apply-hero">
        <div>
          <span className="affiliate-kicker">Partner business model</span>
          <h2>Grow traffic. Earn revenue share.</h2>
          <p>
            Use your affiliate link to bring players to 7XBET. Admin approval gives access to tracking, GGR periods, carryover, and payout reports.
          </p>
        </div>
        <div className="affiliate-hero-badge">
          <strong>30%</strong>
          <span>Default Revenue Share</span>
        </div>
      </section>

      <section className="affiliate-policy-grid">
        <article>
          <BadgeDollarSign size={22} />
          <strong>Commission type</strong>
          <span>Revenue Share based on Net GGR</span>
        </article>
        <article>
          <TrendingUp size={22} />
          <strong>Default rate</strong>
          <span>30%</span>
        </article>
        <article>
          <Crown size={22} />
          <strong>VIP rate</strong>
          <span>30%–40%</span>
        </article>
        <article>
          <ShieldCheck size={22} />
          <strong>Carryover</strong>
          <span>Negative carryover enabled</span>
        </article>
      </section>

      <section className="affiliate-apply-layout">
        <form className="affiliate-form-card" onSubmit={submit}>
          <div className="affiliate-form-grid">
            <label>
              Display name
              <input name="displayName" value={form.displayName} onChange={updateField} placeholder="Your brand/name" autoComplete="name" />
            </label>
            <label>
              Company name
              <input name="companyName" value={form.companyName} onChange={updateField} placeholder="Optional" autoComplete="organization" />
            </label>
            <label>
              Website / social link
              <input name="website" value={form.website} onChange={updateField} placeholder="https://..." inputMode="url" />
            </label>
            <label>
              Preferred affiliate code
              <input name="preferredCode" value={form.preferredCode} onChange={updateField} placeholder="Example: AFFJONY" autoCapitalize="characters" />
            </label>
          </div>

          <label className="affiliate-full-field">
            Traffic plan / countries / notes
            <textarea name="applyNote" value={form.applyNote} onChange={updateField} rows="7" placeholder="Example: Facebook traffic, Telegram communities, Bangladesh/India market, paid ads, influencer pages..." />
          </label>

          <div className="affiliate-actions">
            <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit application'}</button>
            <Link to="/affiliate/dashboard">Already applied?</Link>
          </div>
        </form>

        <aside className="affiliate-help-card">
          <h3>Before applying</h3>
          <p>Use clean traffic sources and avoid spam, self-referrals, bonus abuse, or misleading promotions.</p>
          <ul>
            <li>Tell admin your main traffic country.</li>
            <li>Add your website, Facebook page, Telegram, or other social link.</li>
            <li>VIP rate is approved manually after review.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
