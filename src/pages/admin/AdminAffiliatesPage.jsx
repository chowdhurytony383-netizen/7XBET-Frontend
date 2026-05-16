import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, ShieldAlert } from 'lucide-react';
import { AdminAffiliateAPI } from '../../api/affiliate.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import './AdminAffiliatesPage.css';

function todayMinus(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ periodStart: todayMinus(7), periodEnd: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    setLoading(true);
    try {
      const [affiliateResponse, flagsResponse] = await Promise.all([
        AdminAffiliateAPI.list(),
        AdminAffiliateAPI.fraudFlags({ status: 'open' }),
      ]);
      setAffiliates(affiliateResponse.data?.data || affiliateResponse.data?.affiliates || []);
      setFlags(flagsResponse.data?.data || flagsResponse.data?.flags || []);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load affiliates'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (affiliateId, status) => {
    try {
      await AdminAffiliateAPI.updateStatus(affiliateId, { status });
      toast.success(`Affiliate ${status}`);
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Status update failed'));
    }
  };

  const calculate = async (affiliateId) => {
    try {
      await AdminAffiliateAPI.calculatePeriod(affiliateId, { ...period, overwrite: true });
      toast.success('Commission calculated');
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Commission calculation failed'));
    }
  };

  const scanFraud = async (affiliateId) => {
    try {
      await AdminAffiliateAPI.scanFraud(affiliateId, period);
      toast.success('Fraud scan completed');
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Fraud scan failed'));
    }
  };

  const setVipRate = async (affiliateId, rate) => {
    try {
      await AdminAffiliateAPI.updateCommission(affiliateId, { tier: 'vip', commissionRate: Number(rate) / 100, negativeCarryover: true, minimumPayoutUsd: 30, autoPayoutEnabled: true });
      toast.success('VIP rate updated');
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Commission update failed'));
    }
  };

  const runAutomation = async () => {
    try {
      const response = await AdminAffiliateAPI.runAutomation({ force: true });
      toast.success(`Automation done. Paid ${response.data?.data?.payoutsPaid || 0} affiliates.`);
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Automation failed'));
    }
  };

  const updateFlag = async (flagId, status) => {
    try {
      await AdminAffiliateAPI.updateFraudFlag(flagId, { status });
      toast.success(`Flag ${status}`);
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Flag update failed'));
    }
  };

  return (
    <main className="admin-affiliates-page">
      <PageHeader
        eyebrow="Admin"
        title="Affiliate Partners"
        description="Desktop and mobile optimized management view for affiliate applications, fraud flags, and Tuesday weekly automation."
      />

      <section className="admin-affiliate-period-card">
        <label>Period start<input type="date" value={period.periodStart} onChange={(event) => setPeriod((current) => ({ ...current, periodStart: event.target.value }))} /></label>
        <label>Period end<input type="date" value={period.periodEnd} onChange={(event) => setPeriod((current) => ({ ...current, periodEnd: event.target.value }))} /></label>
        <button onClick={runAutomation}>Run Tuesday automation now</button>
        <small>Automation calculates the weekly period, scans fraud, approves clear periods, and credits eligible payouts to affiliate main wallet.</small>
      </section>

      <section className="admin-affiliate-table-card">
        <div className="admin-affiliate-head"><h2>Open fraud flags</h2><span>{flags.length} open</span></div>

        <div className="admin-affiliate-table-wrap desktop-only">
          <table>
            <thead><tr><th>Partner</th><th>Severity</th><th>Type</th><th>Message</th><th>Actions</th></tr></thead>
            <tbody>
              {flags.slice(0, 20).map((flag) => (
                <tr key={flag._id}>
                  <td>{flag.affiliate?.displayName || flag.affiliate?.affiliateCode}</td>
                  <td><span className={`admin-affiliate-status ${flag.severity}`}>{flag.severity}</span></td>
                  <td>{flag.type}</td>
                  <td>{flag.message}</td>
                  <td className="admin-affiliate-actions">
                    <button onClick={() => updateFlag(flag._id, 'reviewed')}>Reviewed</button>
                    <button onClick={() => updateFlag(flag._id, 'cleared')}>Clear</button>
                    <button onClick={() => updateFlag(flag._id, 'confirmed')}>Confirm</button>
                  </td>
                </tr>
              ))}
              {!loading && flags.length === 0 && <tr><td colSpan="5">No open fraud flags.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="admin-affiliate-mobile-list mobile-only">
          {flags.slice(0, 20).map((flag) => (
            <article className="admin-affiliate-mobile-card" key={flag._id}>
              <div className="admin-affiliate-mobile-top">
                <strong>{flag.affiliate?.displayName || flag.affiliate?.affiliateCode}</strong>
                <span className={`admin-affiliate-status ${flag.severity}`}>{flag.severity}</span>
              </div>
              <div className="admin-affiliate-mobile-grid">
                <div><span>Type</span><strong>{flag.type}</strong></div>
                <div><span>Message</span><strong>{flag.message}</strong></div>
              </div>
              <div className="admin-affiliate-actions stacked">
                <button onClick={() => updateFlag(flag._id, 'reviewed')}>Reviewed</button>
                <button onClick={() => updateFlag(flag._id, 'cleared')}>Clear</button>
                <button onClick={() => updateFlag(flag._id, 'confirmed')}>Confirm</button>
              </div>
            </article>
          ))}
          {!loading && flags.length === 0 && <div className="admin-affiliate-empty-state">No open fraud flags.</div>}
        </div>
      </section>

      <section className="admin-affiliate-table-card">
        <div className="admin-affiliate-head"><h2>Affiliate list</h2><span>{affiliates.length} partners</span></div>

        <div className="admin-affiliate-table-wrap desktop-only">
          <table>
            <thead>
              <tr>
                <th>Partner</th><th>Code</th><th>Status</th><th>Tier</th><th>Rate</th><th>Risk</th><th>Carryover</th><th>Pending</th><th>Min payout</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate._id}>
                  <td>{affiliate.displayName || affiliate.user?.fullName || affiliate.user?.userId}</td>
                  <td>{affiliate.affiliateCode}</td>
                  <td><span className={`admin-affiliate-status ${affiliate.status}`}>{affiliate.status}</span></td>
                  <td>{affiliate.tier}</td>
                  <td>{Math.round(Number(affiliate.commissionRate || 0) * 100)}%</td>
                  <td>{affiliate.payoutHold ? <span className="admin-affiliate-status critical"><ShieldAlert size={14} /> Hold</span> : affiliate.fraud?.lastRiskLevel || 'low'}</td>
                  <td>{formatCurrency(affiliate.carryoverBalance || 0, affiliate.user?.currency || 'BDT')}</td>
                  <td>{formatCurrency(affiliate.stats?.pendingCommission || 0, affiliate.user?.currency || 'BDT')}</td>
                  <td>$ {affiliate.minimumPayoutUsd || 30}</td>
                  <td className="admin-affiliate-actions">
                    {affiliate.status !== 'approved' && <button onClick={() => updateStatus(affiliate._id, 'approved')}>Approve</button>}
                    {affiliate.status !== 'suspended' && <button onClick={() => updateStatus(affiliate._id, 'suspended')}>Suspend</button>}
                    <button onClick={() => scanFraud(affiliate._id)}>Scan fraud</button>
                    <button onClick={() => calculate(affiliate._id)}>Calculate</button>
                    <a href={AdminAffiliateAPI.exportUsersCsvUrl(affiliate._id, period)} target="_blank" rel="noreferrer"><Download size={14} /> CSV</a>
                    <select defaultValue="" onChange={(event) => event.target.value && setVipRate(affiliate._id, event.target.value)}>
                      <option value="">VIP rate</option>
                      <option value="30">30%</option>
                      <option value="35">35%</option>
                      <option value="40">40%</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && affiliates.length === 0 && <tr><td colSpan="10">No affiliate applications yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="admin-affiliate-mobile-list mobile-only">
          {affiliates.map((affiliate) => (
            <article className="admin-affiliate-mobile-card" key={affiliate._id}>
              <div className="admin-affiliate-mobile-top">
                <strong>{affiliate.displayName || affiliate.user?.fullName || affiliate.user?.userId}</strong>
                <span className={`admin-affiliate-status ${affiliate.status}`}>{affiliate.status}</span>
              </div>
              <div className="admin-affiliate-mobile-grid">
                <div><span>Code</span><strong>{affiliate.affiliateCode}</strong></div>
                <div><span>Tier</span><strong>{affiliate.tier}</strong></div>
                <div><span>Rate</span><strong>{Math.round(Number(affiliate.commissionRate || 0) * 100)}%</strong></div>
                <div><span>Risk</span><strong>{affiliate.payoutHold ? 'Hold' : affiliate.fraud?.lastRiskLevel || 'low'}</strong></div>
                <div><span>Carryover</span><strong>{formatCurrency(affiliate.carryoverBalance || 0, affiliate.user?.currency || 'BDT')}</strong></div>
                <div><span>Pending</span><strong>{formatCurrency(affiliate.stats?.pendingCommission || 0, affiliate.user?.currency || 'BDT')}</strong></div>
                <div><span>Min payout</span><strong>$ {affiliate.minimumPayoutUsd || 30}</strong></div>
              </div>
              <div className="admin-affiliate-actions stacked">
                {affiliate.status !== 'approved' && <button onClick={() => updateStatus(affiliate._id, 'approved')}>Approve</button>}
                {affiliate.status !== 'suspended' && <button onClick={() => updateStatus(affiliate._id, 'suspended')}>Suspend</button>}
                <button onClick={() => scanFraud(affiliate._id)}>Scan fraud</button>
                <button onClick={() => calculate(affiliate._id)}>Calculate</button>
                <a href={AdminAffiliateAPI.exportUsersCsvUrl(affiliate._id, period)} target="_blank" rel="noreferrer"><Download size={14} /> CSV</a>
                <select defaultValue="" onChange={(event) => event.target.value && setVipRate(affiliate._id, event.target.value)}>
                  <option value="">VIP rate</option>
                  <option value="30">30%</option>
                  <option value="35">35%</option>
                  <option value="40">40%</option>
                </select>
              </div>
            </article>
          ))}
          {!loading && affiliates.length === 0 && <div className="admin-affiliate-empty-state">No affiliate applications yet.</div>}
        </div>
      </section>
    </main>
  );
}
