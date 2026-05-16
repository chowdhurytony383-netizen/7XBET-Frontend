import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, Share2, TrendingUp, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AffiliateAPI } from '../../api/affiliate.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import './AffiliatePages.css';

async function copyText(value, successMessage = 'Copied') {
  if (!value) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    toast.success(successMessage);
  } catch (_) {
    toast.error('Copy failed');
  }
}

function statusClass(status = '') {
  return String(status || 'pending').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

export default function AffiliateDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await AffiliateAPI.dashboard();
        if (active) setData(response.data?.data || null);
      } catch (error) {
        if (error?.response?.status !== 404) {
          toast.error(getApiError(error, 'Unable to load affiliate dashboard'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const affiliate = data?.affiliate || {};
  const stats = data?.stats || affiliate.stats || {};
  const periods = useMemo(() => data?.periods || [], [data?.periods]);
  const referredUsers = data?.referredUsers || [];
  const commissionRate = Number(affiliate.commissionRate || 0);
  const rateLabel = commissionRate ? `${Math.round(commissionRate * 100)}%` : 'Pending';
  const periodCommission = useMemo(
    () => periods.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
    [periods]
  );
  const trackingLink = data?.trackingLink || '';

  const shareAffiliate = async () => {
    if (!trackingLink) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join 7XBET',
          text: 'Register on 7XBET using my affiliate link.',
          url: trackingLink,
        });
      } else {
        await copyText(trackingLink, 'Affiliate link copied');
      }
    } catch (_) {
      // User cancelled share sheet.
    }
  };

  if (!loading && !data) {
    return (
      <main className="affiliate-page">
        <PageHeader eyebrow="Affiliate" title="No affiliate account yet" description="Apply to become an approved 7XBET partner." />
        <section className="affiliate-empty-card">
          <h2>Become a 7XBET partner</h2>
          <p>Submit your affiliate application to get a tracking code, dashboard, and GGR revenue-share reports.</p>
          <Link className="affiliate-main-link" to="/affiliate/apply">Apply now</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="affiliate-page">
      <PageHeader
        eyebrow="Affiliate Dashboard"
        title="Approved Partner Revenue Share"
        description="GGR-based revenue share with negative carryover. Default rate 30%; VIP rate 30%–40%."
      />

      <section className="affiliate-dashboard-hero">
        <div className="affiliate-hero-main">
          <span className="affiliate-kicker">Affiliate code</span>
          <strong>{loading ? 'Loading...' : affiliate.affiliateCode || 'Pending'}</strong>
          <p>{trackingLink || 'Affiliate link will appear after application/approval.'}</p>
          <div className="affiliate-meta-row">
            <span>Status: {affiliate.status || 'pending'}</span>
            <span>Tier: {affiliate.tier || 'standard'}</span>
            <span>Rate: {rateLabel}</span>
          </div>
        </div>

        <div className="affiliate-hero-actions-panel">
          <button type="button" onClick={() => copyText(trackingLink, 'Affiliate link copied')} disabled={!trackingLink}>
            <Copy size={18} /> Copy link
          </button>
          <button type="button" className="affiliate-soft-btn" onClick={shareAffiliate} disabled={!trackingLink}>
            <Share2 size={18} /> Share
          </button>
          {trackingLink && (
            <a href={trackingLink} target="_blank" rel="noreferrer" className="affiliate-soft-link">
              <ExternalLink size={18} /> Open
            </a>
          )}
        </div>
      </section>

      <section className="affiliate-stats-grid">
        <StatCard icon={Users} label="Registrations" value={stats.registrations || referredUsers.length || 0} />
        <StatCard icon={TrendingUp} label="Total GGR" value={formatCurrency(stats.totalGgr || 0, 'BDT')} />
        <StatCard icon={WalletCards} label="Pending commission" value={formatCurrency(stats.pendingCommission || periodCommission || 0, 'BDT')} />
        <StatCard icon={WalletCards} label="Carryover" value={formatCurrency(affiliate.carryoverBalance || 0, 'BDT')} />
      </section>

      <section className="affiliate-info-grid">
        <article>
          <span>Commission</span>
          <strong>Net GGR × {rateLabel}</strong>
          <p>Commission is calculated after negative carryover is applied.</p>
        </article>
        <article>
          <span>Negative carryover</span>
          <strong>{formatCurrency(affiliate.carryoverBalance || 0, 'BDT')}</strong>
          <p>Negative GGR is deducted from future positive GGR before payout.</p>
        </article>
        <article>
          <span>Payout</span>
          <strong>Admin approval</strong>
          <p>Pending commission is reviewed and paid by admin according to policy.</p>
        </article>
      </section>

      <section className="affiliate-table-card">
        <div className="affiliate-section-head">
          <div>
            <h2>Commission periods</h2>
            <p>Desktop shows the full table. Mobile shows card view for clean reading.</p>
          </div>
        </div>

        <div className="affiliate-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Bets</th>
                <th>Wins</th>
                <th>GGR</th>
                <th>Carryover</th>
                <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period._id}>
                  <td>{formatDate(period.periodStart)} - {formatDate(period.periodEnd)}</td>
                  <td>{formatCurrency(period.totalBets || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.totalWins || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.grossGgr || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.previousCarryover || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.commissionAmount || 0, period.currency || 'BDT')}</td>
                  <td><span className={`affiliate-status ${statusClass(period.status)}`}>{period.status || 'pending'}</span></td>
                </tr>
              ))}
              {!loading && periods.length === 0 && <tr><td colSpan="7">No commission period calculated yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="affiliate-mobile-list">
          {periods.map((period) => (
            <article key={period._id} className="affiliate-mobile-card">
              <div className="affiliate-mobile-card-head">
                <strong>{formatDate(period.periodStart)} - {formatDate(period.periodEnd)}</strong>
                <span className={`affiliate-status ${statusClass(period.status)}`}>{period.status || 'pending'}</span>
              </div>
              <dl>
                <div><dt>Bets</dt><dd>{formatCurrency(period.totalBets || 0, period.currency || 'BDT')}</dd></div>
                <div><dt>Wins</dt><dd>{formatCurrency(period.totalWins || 0, period.currency || 'BDT')}</dd></div>
                <div><dt>GGR</dt><dd>{formatCurrency(period.grossGgr || 0, period.currency || 'BDT')}</dd></div>
                <div><dt>Carryover</dt><dd>{formatCurrency(period.previousCarryover || 0, period.currency || 'BDT')}</dd></div>
                <div><dt>Commission</dt><dd>{formatCurrency(period.commissionAmount || 0, period.currency || 'BDT')}</dd></div>
              </dl>
            </article>
          ))}
          {!loading && periods.length === 0 && <p className="affiliate-empty-state">No commission period calculated yet.</p>}
        </div>
      </section>
    </main>
  );
}
