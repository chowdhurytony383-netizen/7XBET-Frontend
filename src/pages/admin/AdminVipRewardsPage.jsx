import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Crown, RefreshCcw, XCircle } from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import './AdminVipRewardsPage.css';

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function statusText(value) {
  return String(value || '').replace(/_/g, ' ');
}

export default function AdminVipRewardsPage() {
  const [levels, setLevels] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [status, setStatus] = useState('PENDING_APPROVAL');
  const [periodKey, setPeriodKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [levelsResponse, rewardsResponse] = await Promise.all([
        AdminAPI.vipLevels(),
        AdminAPI.vipRewards({ status: status || undefined, periodKey: periodKey || undefined }),
      ]);
      setLevels(levelsResponse.data?.data || levelsResponse.data?.levels || []);
      setRewards(rewardsResponse.data?.data || rewardsResponse.data?.rewards || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load VIP rewards'));
    } finally {
      setLoading(false);
    }
  }, [status, periodKey]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => rewards.reduce((acc, item) => {
    acc.count += 1;
    acc.amount += Number(item.rewardAmount || 0);
    if (item.status === 'PENDING_APPROVAL') acc.pending += 1;
    if (item.status === 'APPROVED') acc.approved += 1;
    return acc;
  }, { count: 0, amount: 0, pending: 0, approved: 0 }), [rewards]);

  async function calculateRewards() {
    setProcessing('calculate');
    setError('');
    setMessage('');
    try {
      const response = await AdminAPI.calculateVipRewards({ periodKey: periodKey || undefined, offsetMonths: periodKey ? undefined : -1 });
      const data = response.data?.data || {};
      setMessage(`VIP calculated: ${data.created || 0} created, ${data.updated || 0} updated, ${data.checked || 0} users checked.`);
      await load();
    } catch (err) {
      setError(getApiError(err, 'VIP calculation failed'));
    } finally {
      setProcessing('');
    }
  }

  async function approve(rewardId) {
    setProcessing(rewardId);
    setError('');
    setMessage('');
    try {
      await AdminAPI.approveVipReward(rewardId, { note: 'Approved by admin' });
      setMessage('VIP reward approved. User can claim after KYC verification.');
      await load();
    } catch (err) {
      setError(getApiError(err, 'Approval failed'));
    } finally {
      setProcessing('');
    }
  }

  async function reject(rewardId) {
    const reason = window.prompt('Reject reason?', 'Rejected by admin') || 'Rejected by admin';
    setProcessing(rewardId);
    setError('');
    setMessage('');
    try {
      await AdminAPI.rejectVipReward(rewardId, { reason });
      setMessage('VIP reward rejected.');
      await load();
    } catch (err) {
      setError(getApiError(err, 'Reject failed'));
    } finally {
      setProcessing('');
    }
  }

  return (
    <div className="page-stack admin-page admin-vip-page">
      <PageHeader
        eyebrow="Admin panel"
        title="VIP rewards"
        description="Monthly VIP cashback approval. Rewards are credited to bonus balance only after user KYC and claim."
      />

      {error && <div className="auth-message">{error}</div>}
      {message && <div className="auth-message success">{message}</div>}

      <section className="card admin-vip-controls">
        <div>
          <label>Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="APPROVED">Approved</option>
            <option value="CLAIMED">Claimed</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
        <div>
          <label>Period</label>
          <input value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} placeholder="YYYY-MM, optional" />
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}><RefreshCcw size={16} /> Refresh</button>
        <button type="button" className="btn btn-primary" onClick={calculateRewards} disabled={Boolean(processing)}><Crown size={16} /> {processing === 'calculate' ? 'Calculating...' : 'Calculate last month'}</button>
      </section>

      <section className="admin-vip-stats">
        <article className="card"><span>Rewards</span><strong>{totals.count}</strong></article>
        <article className="card"><span>Total amount</span><strong>{formatCurrency(totals.amount)}</strong></article>
        <article className="card"><span>Pending</span><strong>{totals.pending}</strong></article>
        <article className="card"><span>Approved</span><strong>{totals.approved}</strong></article>
      </section>

      <section className="card admin-vip-levels">
        <h2>VIP levels</h2>
        <div className="admin-vip-level-grid">
          {levels.map((level) => (
            <article key={level.key}>
              <strong>{level.name}</strong>
              <span>{formatCurrency(level.minMonthlyTurnover)} turnover</span>
              <b>{percent(level.cashbackRate)} cashback</b>
            </article>
          ))}
        </div>
      </section>

      <section className="card admin-vip-table-card">
        <h2>Reward approvals</h2>
        {loading ? <div className="admin-loading"><div className="loader" /></div> : null}
        {!loading && !rewards.length ? <p className="admin-vip-empty">No rewards found.</p> : null}
        <div className="admin-vip-list">
          {rewards.map((reward) => {
            const id = reward._id || reward.id;
            const user = reward.user || {};
            const verified = user.isVerified || user.verificationStatus === 'approved';
            return (
              <article key={id} className="admin-vip-reward-row">
                <div className="admin-vip-user">
                  <strong>{user.fullName || user.name || user.username || user.email || 'User'}</strong>
                  <span>{user.email || user.phone || user.userId || ''}</span>
                  <small className={verified ? 'ok' : 'warn'}>{verified ? 'KYC approved' : `KYC ${user.verificationStatus || 'not submitted'}`}</small>
                </div>
                <div>
                  <span>Period / level</span>
                  <strong>{reward.periodKey} · {reward.levelName}</strong>
                  <small>{statusText(reward.status)}</small>
                </div>
                <div>
                  <span>Turnover / net loss</span>
                  <strong>{formatCurrency(reward.monthlyTurnover, reward.currency)}</strong>
                  <small>Loss: {formatCurrency(reward.monthlyNetLoss, reward.currency)}</small>
                </div>
                <div>
                  <span>Reward</span>
                  <strong>{formatCurrency(reward.rewardAmount, reward.currency)}</strong>
                  <small>1x turnover: {formatCurrency(reward.requiredTurnover, reward.currency)}</small>
                </div>
                <div className="admin-vip-actions">
                  {reward.status === 'PENDING_APPROVAL' ? (
                    <>
                      <button type="button" className="btn btn-primary" disabled={processing === id} onClick={() => approve(id)}><CheckCircle2 size={16} /> Approve</button>
                      <button type="button" className="btn btn-secondary" disabled={processing === id} onClick={() => reject(id)}><XCircle size={16} /> Reject</button>
                    </>
                  ) : (
                    <small>{reward.claimedAt ? `Claimed ${formatDateTime(reward.claimedAt)}` : statusText(reward.status)}</small>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
