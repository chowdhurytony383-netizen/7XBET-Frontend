import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Crown, Gift, Lock, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VipAPI } from '../api/vip.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import './VipRewardsPage.css';

function percent(value) {
  const number = Number(value || 0) * 100;
  return `${number.toFixed(number >= 1 ? 1 : 2)}%`;
}

function safeCurrency(value, currency) {
  return formatCurrency(value || 0, currency || 'BDT');
}

function statusLabel(status) {
  const value = String(status || '').replace(/_/g, ' ').toLowerCase();
  return value ? value.replace(/^\w/, (c) => c.toUpperCase()) : '—';
}

export default function VipRewardsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await VipAPI.summary();
      setSummary(response.data?.data || response.data || null);
    } catch (err) {
      setError(getApiError(err, 'Unable to load VIP rewards. Please login to view your VIP status.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const currency = summary?.user?.currency || 'BDT';
  const rewards = summary?.rewards || [];
  const approvedRewards = rewards.filter((item) => item.status === 'APPROVED');
  const currentLevel = summary?.currentLevel;
  const nextLevel = summary?.nextLevel;
  const currentMetrics = summary?.currentMetrics || {};
  const progress = Number(summary?.progress || 0);

  const claimableAmount = useMemo(() => approvedRewards.reduce((sum, item) => sum + Number(item.rewardAmount || 0), 0), [approvedRewards]);

  async function claimReward(rewardId) {
    setClaiming(rewardId);
    setError('');
    setMessage('');
    try {
      await VipAPI.claimReward(rewardId);
      setMessage('VIP reward claimed. Bonus turnover requirement has been created.');
      await load();
    } catch (err) {
      setError(getApiError(err, 'Unable to claim VIP reward'));
    } finally {
      setClaiming('');
    }
  }

  return (
    <div className="page-stack vip-page">
      <section className="vip-hero card">
        <div>
          <span className="page-eyebrow">Promotions</span>
          <h1>VIP rewards</h1>
          <p>Sports + casino settled turnover counts. Cashback is based only on monthly net loss. Approved rewards go to bonus balance with 1x turnover before withdrawal.</p>
          <div className="vip-hero-actions">
            <Link to="/" className="btn btn-secondary">Main page</Link>
            <Link to="/profile/verification" className="btn btn-ghost">KYC verification</Link>
          </div>
        </div>
        <div className="vip-hero-medal"><Crown size={46} /></div>
      </section>

      {error && <div className="auth-message">{error}</div>}
      {message && <div className="auth-message success">{message}</div>}
      {loading && <div className="card vip-loading"><div className="loader" /></div>}

      {!loading && summary && (
        <>
          <section className="vip-status-grid">
            <article className="card vip-status-card vip-level-card">
              <span className="vip-card-label">Current level</span>
              <strong>{currentLevel?.name || 'No VIP yet'}</strong>
              <p>{currentLevel ? `${percent(currentLevel.cashbackRate)} cashback on monthly net loss` : 'Start betting to unlock VIP rewards.'}</p>
            </article>
            <article className="card vip-status-card">
              <span className="vip-card-label">Monthly turnover</span>
              <strong>{safeCurrency(currentMetrics.monthlyTurnover, currency)}</strong>
              <p>Sports + casino settled bets only.</p>
            </article>
            <article className="card vip-status-card">
              <span className="vip-card-label">Monthly net loss</span>
              <strong>{safeCurrency(currentMetrics.monthlyNetLoss, currency)}</strong>
              <p>Cashback applies only when net loss is positive.</p>
            </article>
            <article className="card vip-status-card">
              <span className="vip-card-label">Approved reward</span>
              <strong>{safeCurrency(claimableAmount, currency)}</strong>
              <p>{summary.user?.isVerified ? 'Ready to claim after admin approval.' : 'KYC required before claim.'}</p>
            </article>
          </section>

          <section className="card vip-progress-card">
            <div className="vip-progress-head">
              <div>
                <span className="page-eyebrow">Next level</span>
                <h2>{nextLevel?.name || 'Top VIP level reached'}</h2>
              </div>
              <strong>{progress}%</strong>
            </div>
            <div className="vip-progress-track"><span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
            <p>{nextLevel ? `${safeCurrency(Math.max(0, Number(nextLevel.minMonthlyTurnover || 0) - Number(currentMetrics.monthlyTurnover || 0)), currency)} more settled turnover needed.` : 'You have reached the highest available VIP tier.'}</p>
          </section>

          <section className="card vip-rules-card">
            <h2>VIP rules</h2>
            <div className="vip-rules-grid">
              <div><TrendingUp size={20} /><span>Sports + casino settled turnover counts.</span></div>
              <div><Gift size={20} /><span>Cashback is calculated only on net loss.</span></div>
              <div><ShieldCheck size={20} /><span>KYC is required before claiming rewards.</span></div>
              <div><Lock size={20} /><span>Reward goes to bonus balance with 1x turnover.</span></div>
            </div>
          </section>

          <section className="card vip-levels-card">
            <h2>VIP levels</h2>
            <div className="vip-levels-list">
              {(summary.levels || []).map((level) => (
                <article key={level.key} className={`vip-level-row ${currentLevel?.key === level.key ? 'active' : ''}`}>
                  <div className="vip-level-icon" style={{ borderColor: level.color || undefined }}><Crown size={18} /></div>
                  <div>
                    <strong>{level.name}</strong>
                    <span>{safeCurrency(level.minMonthlyTurnover, currency)} monthly turnover</span>
                  </div>
                  <b>{percent(level.cashbackRate)}</b>
                </article>
              ))}
            </div>
          </section>

          <section className="card vip-rewards-card">
            <h2>Reward history</h2>
            {!rewards.length && <p className="vip-empty">No VIP rewards yet. Monthly rewards will appear here after calculation and admin approval.</p>}
            <div className="vip-rewards-list">
              {rewards.map((reward) => (
                <article key={reward._id || reward.id} className="vip-reward-row">
                  <div>
                    <strong>{reward.levelName || 'VIP reward'} · {reward.periodKey}</strong>
                    <span>{safeCurrency(reward.rewardAmount, reward.currency || currency)} reward · {safeCurrency(reward.requiredTurnover, reward.currency || currency)} turnover required</span>
                    <small>{statusLabel(reward.status)} {reward.claimedAt ? `· Claimed ${formatDate(reward.claimedAt)}` : ''}</small>
                  </div>
                  {reward.status === 'APPROVED' ? (
                    <button type="button" className="btn btn-primary" disabled={Boolean(claiming)} onClick={() => claimReward(reward._id || reward.id)}>
                      {claiming === (reward._id || reward.id) ? 'Claiming...' : 'Claim'}
                    </button>
                  ) : (
                    <span className={`vip-status-pill ${String(reward.status || '').toLowerCase()}`}>{reward.status === 'CLAIMED' ? <CheckCircle2 size={15} /> : null}{statusLabel(reward.status)}</span>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
