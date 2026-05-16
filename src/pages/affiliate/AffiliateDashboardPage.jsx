import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Download, ShieldAlert, TrendingUp, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AffiliateAPI } from '../../api/affiliate.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import './AffiliatePages.css';

function todayMinus(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function AffiliateDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ periodStart: todayMinus(7), periodEnd: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await AffiliateAPI.dashboard(range);
        if (active) setData(response.data?.data || null);
      } catch (error) {
        if (error?.response?.status !== 404) toast.error(getApiError(error, 'Unable to load affiliate dashboard'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [range.periodStart, range.periodEnd]);

  const affiliate = data?.affiliate || {};
  const stats = data?.stats || affiliate.stats || {};
  const periods = useMemo(() => data?.periods || [], [data?.periods]);
  const userPerformance = data?.userPerformance || [];
  const dailyBreakdown = data?.dailyBreakdown || [];
  const weeklyBreakdown = data?.weeklyBreakdown || [];
  const min = data?.minimumPayout || {};
  const rules = data?.payoutRules || {};
  const rateLabel = `${Math.round(Number(affiliate.commissionRate || 0) * 100)}%`;
  const pendingCommission = Number(stats.pendingCommission || 0);
  const currency = min.currency || 'BDT';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data?.trackingLink || '');
      toast.success('Affiliate link copied');
    } catch (_) {
      toast.error('Copy failed');
    }
  };

  const requestPayout = async () => {
    try {
      await AffiliateAPI.requestPayout({ amount: pendingCommission, payoutMethod: { method: 'internal_wallet' } });
      toast.success('Payout request submitted');
    } catch (error) {
      toast.error(getApiError(error, 'Payout request failed'));
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
        description="Clean responsive view for desktop and mobile. Track users, GGR, carryover, payout rules, and reports in one place."
      />

      <section className="affiliate-hero-card">
        <div className="affiliate-hero-copy">
          <span>Affiliate code</span>
          <strong>{loading ? 'Loading...' : affiliate.affiliateCode || 'Pending'}</strong>
          <p>{data?.trackingLink || 'Affiliate link will appear after application/approval.'}</p>
          <small>Status: {affiliate.status || 'pending'} · Tier: {affiliate.tier || 'standard'} · Rate: {rateLabel}</small>
        </div>
        <button type="button" onClick={copyLink} disabled={!data?.trackingLink}><Copy size={18} /> Copy link</button>
      </section>

      <section className="affiliate-policy-grid">
        <article><strong>Minimum payout</strong><span>{min.minimumPayoutUsd || 30} USD ≈ {formatCurrency(min.minimumPayoutLocal || 0, currency)}</span></article>
        <article><strong>Payout day</strong><span>Every Tuesday</span></article>
        <article><strong>Auto transfer</strong><span>{rules.autoPayoutEnabled ? 'Main wallet' : 'Disabled'}</span></article>
        <article><strong>Fraud status</strong><span>{affiliate.payoutHold ? 'On hold' : (affiliate.fraud?.lastRiskLevel || 'Low')}</span></article>
      </section>

      {affiliate.payoutHold && (
        <section className="affiliate-alert-card">
          <ShieldAlert size={20} />
          <div><strong>Payout hold</strong><p>{affiliate.payoutHoldReason || 'This affiliate account is under review.'}</p></div>
        </section>
      )}

      <section className="affiliate-stats-grid">
        <StatCard icon={Users} label="Registrations" value={stats.registrations || 0} />
        <StatCard icon={TrendingUp} label="Total GGR" value={formatCurrency(stats.totalGgr || 0, currency)} />
        <StatCard icon={WalletCards} label="Available commission" value={formatCurrency(pendingCommission, currency)} />
        <StatCard icon={WalletCards} label="Carryover" value={formatCurrency(affiliate.carryoverBalance || 0, currency)} />
      </section>

      <section className="affiliate-filter-card">
        <label>Start<input type="date" value={range.periodStart} onChange={(event) => setRange((current) => ({ ...current, periodStart: event.target.value }))} /></label>
        <label>End<input type="date" value={range.periodEnd} onChange={(event) => setRange((current) => ({ ...current, periodEnd: event.target.value }))} /></label>
        <a className="affiliate-main-link" href={AffiliateAPI.exportUsersCsvUrl(range)} target="_blank" rel="noreferrer"><Download size={16} /> Export users CSV</a>
        <a className="affiliate-main-link" href={AffiliateAPI.exportPeriodsCsvUrl()} target="_blank" rel="noreferrer"><Download size={16} /> Export periods CSV</a>
        <button type="button" onClick={requestPayout} disabled={!rules.canRequestToday || pendingCommission <= 0}>Request payout</button>
      </section>

      <section className="affiliate-table-card">
        <div className="affiliate-section-head">
          <h2>Referred user performance</h2>
          <span>{userPerformance.length} users</span>
        </div>

        <div className="affiliate-table-wrap desktop-only">
          <table>
            <thead><tr><th>User</th><th>Registered</th><th>Deposits</th><th>Bets</th><th>Wins</th><th>Loss</th><th>GGR</th><th>Commission</th></tr></thead>
            <tbody>
              {userPerformance.map((row) => (
                <tr key={row.user?._id || row.user?.userId}>
                  <td>{row.user?.userId}<br /><small>{row.user?.email}</small></td>
                  <td>{formatDate(row.user?.createdAt)}</td>
                  <td>{formatCurrency(row.deposits || 0, row.user?.currency || currency)}</td>
                  <td>{formatCurrency(row.bets || 0, row.user?.currency || currency)}</td>
                  <td>{formatCurrency(row.wins || 0, row.user?.currency || currency)}</td>
                  <td>{formatCurrency(row.loss || 0, row.user?.currency || currency)}</td>
                  <td>{formatCurrency(row.ggr || 0, row.user?.currency || currency)}</td>
                  <td>{formatCurrency(row.estimatedCommission || 0, row.user?.currency || currency)}</td>
                </tr>
              ))}
              {!loading && userPerformance.length === 0 && <tr><td colSpan="8">No referred user activity in this range.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="affiliate-mobile-list mobile-only">
          {userPerformance.map((row) => (
            <article className="affiliate-mobile-card" key={row.user?._id || row.user?.userId}>
              <div className="affiliate-mobile-top">
                <div>
                  <strong>{row.user?.userId || 'User'}</strong>
                  <small>{row.user?.email}</small>
                </div>
                <span>{formatDate(row.user?.createdAt)}</span>
              </div>
              <div className="affiliate-mobile-grid">
                <div><span>Deposit</span><strong>{formatCurrency(row.deposits || 0, row.user?.currency || currency)}</strong></div>
                <div><span>Bets</span><strong>{formatCurrency(row.bets || 0, row.user?.currency || currency)}</strong></div>
                <div><span>Wins</span><strong>{formatCurrency(row.wins || 0, row.user?.currency || currency)}</strong></div>
                <div><span>Loss</span><strong>{formatCurrency(row.loss || 0, row.user?.currency || currency)}</strong></div>
                <div><span>GGR</span><strong>{formatCurrency(row.ggr || 0, row.user?.currency || currency)}</strong></div>
                <div><span>Commission</span><strong>{formatCurrency(row.estimatedCommission || 0, row.user?.currency || currency)}</strong></div>
              </div>
            </article>
          ))}
          {!loading && userPerformance.length === 0 && <div className="affiliate-empty-state">No referred user activity in this range.</div>}
        </div>
      </section>

      <section className="affiliate-table-card">
        <div className="affiliate-section-head">
          <h2>Commission periods</h2>
          <span>{periods.length} periods</span>
        </div>

        <div className="affiliate-table-wrap desktop-only">
          <table>
            <thead><tr><th>Period</th><th>Bets</th><th>Wins</th><th>GGR</th><th>Carryover</th><th>Commission</th><th>Risk</th><th>Status</th></tr></thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period._id}>
                  <td>{formatDate(period.periodStart)} - {formatDate(period.periodEnd)}</td>
                  <td>{formatCurrency(period.totalBets || 0, period.currency || currency)}</td>
                  <td>{formatCurrency(period.totalWins || 0, period.currency || currency)}</td>
                  <td>{formatCurrency(period.grossGgr || 0, period.currency || currency)}</td>
                  <td>{formatCurrency(period.previousCarryover || 0, period.currency || currency)}</td>
                  <td>{formatCurrency(period.commissionAmount || 0, period.currency || currency)}</td>
                  <td><span className={`affiliate-status ${period.riskStatus || 'clear'}`}>{period.riskStatus || 'clear'}</span></td>
                  <td><span className={`affiliate-status ${period.status}`}>{period.status}</span></td>
                </tr>
              ))}
              {!loading && periods.length === 0 && <tr><td colSpan="8">No commission period calculated yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="affiliate-mobile-list mobile-only">
          {periods.map((period) => (
            <article className="affiliate-mobile-card" key={period._id}>
              <div className="affiliate-mobile-top">
                <strong>{formatDate(period.periodStart)} - {formatDate(period.periodEnd)}</strong>
                <span className={`affiliate-status ${period.status}`}>{period.status}</span>
              </div>
              <div className="affiliate-mobile-grid">
                <div><span>Bets</span><strong>{formatCurrency(period.totalBets || 0, period.currency || currency)}</strong></div>
                <div><span>Wins</span><strong>{formatCurrency(period.totalWins || 0, period.currency || currency)}</strong></div>
                <div><span>GGR</span><strong>{formatCurrency(period.grossGgr || 0, period.currency || currency)}</strong></div>
                <div><span>Carryover</span><strong>{formatCurrency(period.previousCarryover || 0, period.currency || currency)}</strong></div>
                <div><span>Commission</span><strong>{formatCurrency(period.commissionAmount || 0, period.currency || currency)}</strong></div>
                <div><span>Risk</span><strong><span className={`affiliate-status ${period.riskStatus || 'clear'}`}>{period.riskStatus || 'clear'}</span></strong></div>
              </div>
            </article>
          ))}
          {!loading && periods.length === 0 && <div className="affiliate-empty-state">No commission period calculated yet.</div>}
        </div>
      </section>

      <section className="affiliate-breakdown-grid">
        <div className="affiliate-table-card">
          <h2>Daily overview</h2>
          <div className="affiliate-breakdown-list">
            {dailyBreakdown.slice(-7).map((row) => (
              <p key={row.key}><strong>{row.key}</strong> <span>Bets {formatCurrency(row.bets, currency)}</span> <span>GGR {formatCurrency(row.ggr, currency)}</span> <span>Commission {formatCurrency(row.commission, currency)}</span></p>
            ))}
            {!loading && dailyBreakdown.length === 0 && <div className="affiliate-empty-state">No daily data available.</div>}
          </div>
        </div>
        <div className="affiliate-table-card">
          <h2>Weekly overview</h2>
          <div className="affiliate-breakdown-list">
            {weeklyBreakdown.slice(-8).map((row) => (
              <p key={row.key}><strong>Week {row.key}</strong> <span>Bets {formatCurrency(row.bets, currency)}</span> <span>GGR {formatCurrency(row.ggr, currency)}</span> <span>Commission {formatCurrency(row.commission, currency)}</span></p>
            ))}
            {!loading && weeklyBreakdown.length === 0 && <div className="affiliate-empty-state">No weekly data available.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
