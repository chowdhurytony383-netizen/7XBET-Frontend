import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminAffiliateAPI } from '../../api/affiliate.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import './AdminAffiliatesPage.css';

function todayMinus(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ periodStart: todayMinus(7), periodEnd: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    setLoading(true);
    try {
      const response = await AdminAffiliateAPI.list();
      setAffiliates(response.data?.data || response.data?.affiliates || []);
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
      const response = await AdminAffiliateAPI.calculatePeriod(affiliateId, { ...period, overwrite: true });
      toast.success(`Commission calculated: ${formatCurrency(response.data?.data?.commissionAmount || 0, 'BDT')}`);
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Commission calculation failed'));
    }
  };

  const setVipRate = async (affiliateId, rate) => {
    try {
      await AdminAffiliateAPI.updateCommission(affiliateId, { tier: 'vip', commissionRate: Number(rate) / 100, negativeCarryover: true });
      toast.success('VIP rate updated');
      await load();
    } catch (error) {
      toast.error(getApiError(error, 'Commission update failed'));
    }
  };

  return (
    <main className="admin-affiliates-page">
      <PageHeader
        eyebrow="Admin"
        title="Affiliate Partners"
        description="Approve partners, set 30% default or 30%–40% VIP rate, calculate GGR revenue share with negative carryover."
      />

      <section className="admin-affiliate-period-card">
        <label>Period start<input type="date" value={period.periodStart} onChange={(event) => setPeriod((current) => ({ ...current, periodStart: event.target.value }))} /></label>
        <label>Period end<input type="date" value={period.periodEnd} onChange={(event) => setPeriod((current) => ({ ...current, periodEnd: event.target.value }))} /></label>
        <small>Use this date range before pressing Calculate on any affiliate.</small>
      </section>

      <section className="admin-affiliate-table-card">
        <div className="admin-affiliate-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Partner</th><th>Code</th><th>Status</th><th>Tier</th><th>Rate</th><th>Carryover</th><th>Pending</th><th>Created</th><th>Actions</th>
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
                  <td>{formatCurrency(affiliate.carryoverBalance || 0, 'BDT')}</td>
                  <td>{formatCurrency(affiliate.stats?.pendingCommission || 0, 'BDT')}</td>
                  <td>{formatDate(affiliate.createdAt)}</td>
                  <td className="admin-affiliate-actions">
                    {affiliate.status !== 'approved' && <button onClick={() => updateStatus(affiliate._id, 'approved')}>Approve</button>}
                    {affiliate.status !== 'suspended' && <button onClick={() => updateStatus(affiliate._id, 'suspended')}>Suspend</button>}
                    <button onClick={() => calculate(affiliate._id)}>Calculate</button>
                    <select defaultValue="" onChange={(event) => event.target.value && setVipRate(affiliate._id, event.target.value)}>
                      <option value="">VIP rate</option>
                      <option value="30">30%</option>
                      <option value="35">35%</option>
                      <option value="40">40%</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && affiliates.length === 0 && <tr><td colSpan="9">No affiliate applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
