import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, TrendingUp, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AffiliateAPI } from '../../api/affiliate.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import './AffiliatePages.css';

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
    return () => { active = false; };
  }, []);

  const affiliate = data?.affiliate || {};
  const stats = data?.stats || affiliate.stats || {};
  const periods = useMemo(() => data?.periods || [], [data?.periods]);
  const referredUsers = data?.referredUsers || [];
  const rateLabel = `${Math.round(Number(affiliate.commissionRate || 0) * 100)}%`;
  const periodCommission = useMemo(
    () => periods.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0),
    [periods]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data?.trackingLink || '');
      toast.success('Affiliate link copied');
    } catch (_) {
      toast.error('Copy failed');
    }
  };

  if (!loading && !data) {
    return (
      <main className="affiliate-page">
        <PageHeader eyebrow="Affiliate" title="No affiliate account yet" description="Apply to become an approved 7XBET partner." />
        <Link className="affiliate-main-link" to="/affiliate/apply">Apply now</Link>
      </main>
    );
  }

  return (
    <main className="affiliate-page">
      <PageHeader
        eyebrow="Affiliate Dashboard"
        title="Approved Partner Revenue Share"
        description="GGR based revenue share with negative carryover. Default rate 30%; VIP rate 30%–40%."
      />

      <section className="affiliate-hero-card">
        <div>
          <span>Affiliate code</span>
          <strong>{loading ? 'Loading...' : affiliate.affiliateCode || 'Pending'}</strong>
          <p>{data?.trackingLink || 'Affiliate link will appear after application/approval.'}</p>
          <small>Status: {affiliate.status || 'pending'} · Tier: {affiliate.tier || 'standard'} · Rate: {rateLabel}</small>
        </div>
        <button type="button" onClick={copyLink} disabled={!data?.trackingLink}><Copy size={18} /> Copy link</button>
      </section>

      <section className="affiliate-stats-grid">
        <StatCard icon={Users} label="Registrations" value={stats.registrations || referredUsers.length || 0} />
        <StatCard icon={TrendingUp} label="Total GGR" value={formatCurrency(stats.totalGgr || 0, 'BDT')} />
        <StatCard icon={WalletCards} label="Pending commission" value={formatCurrency(stats.pendingCommission || periodCommission || 0, 'BDT')} />
        <StatCard icon={WalletCards} label="Carryover" value={formatCurrency(affiliate.carryoverBalance || 0, 'BDT')} />
      </section>

      <section className="affiliate-table-card">
        <h2>Commission periods</h2>
        <div className="affiliate-table-wrap">
          <table>
            <thead><tr><th>Period</th><th>Bets</th><th>Wins</th><th>GGR</th><th>Carryover</th><th>Commission</th><th>Status</th></tr></thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period._id}>
                  <td>{formatDate(period.periodStart)} - {formatDate(period.periodEnd)}</td>
                  <td>{formatCurrency(period.totalBets || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.totalWins || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.grossGgr || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.previousCarryover || 0, period.currency || 'BDT')}</td>
                  <td>{formatCurrency(period.commissionAmount || 0, period.currency || 'BDT')}</td>
                  <td><span className={`affiliate-status ${period.status}`}>{period.status}</span></td>
                </tr>
              ))}
              {!loading && periods.length === 0 && <tr><td colSpan="7">No commission period calculated yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
