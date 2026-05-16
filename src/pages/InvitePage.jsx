import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Gift, Share2, Users, WalletCards } from 'lucide-react';
import { ReferralAPI } from '../api/affiliate.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import './InvitePage.css';

export default function InvitePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await ReferralAPI.dashboard();
        if (active) setData(response.data?.data || null);
      } catch (error) {
        toast.error(getApiError(error, 'Unable to load invite dashboard'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const totals = data?.totals || {};
  const rewards = data?.rewards || [];
  const invitedUsers = data?.invitedUsers || [];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data?.inviteLink || '');
      toast.success('Invite link copied');
    } catch (_) {
      toast.error('Copy failed');
    }
  };

  const shareLink = async () => {
    const url = data?.inviteLink || '';
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: '7XBET Invite', text: 'Join 7XBET with my invite link', url });
        return;
      } catch (_) {
        // ignore and fall back to copy
      }
    }
    copyLink();
  };

  const qualifiedCount = useMemo(() => rewards.filter((reward) => ['qualified', 'credited'].includes(reward.status)).length, [rewards]);

  return (
    <main className="invite-page">
      <PageHeader
        eyebrow="Invite & Earn"
        title="My Invite Program"
        description="Share your invite link and track your referral rewards. Designed for clean desktop view and smooth mobile use."
      />

      <section className="invite-hero-card">
        <div className="invite-hero-content">
          <span className="invite-label">Your invite code</span>
          <strong>{loading ? 'Loading...' : data?.inviteCode || 'Not available'}</strong>
          <p>{data?.inviteLink || 'Your invite link will appear here.'}</p>
        </div>
        <div className="invite-hero-actions">
          <button type="button" className="invite-copy-btn" onClick={copyLink} disabled={!data?.inviteLink}>
            <Copy size={18} /> Copy link
          </button>
          <button type="button" className="invite-share-btn" onClick={shareLink} disabled={!data?.inviteLink}>
            <Share2 size={18} /> Share
          </button>
        </div>
      </section>

      <section className="invite-stats-grid">
        <StatCard icon={Users} label="Invited users" value={invitedUsers.length} />
        <StatCard icon={Gift} label="Qualified rewards" value={qualifiedCount} />
        <StatCard icon={WalletCards} label="Pending reward" value={formatCurrency(totals.pending || 0, 'BDT')} />
        <StatCard icon={WalletCards} label="Credited reward" value={formatCurrency(totals.credited || 0, 'BDT')} />
      </section>

      <section className="invite-content-grid">
        <section className="invite-rules-card">
          <h2>Reward rules</h2>
          <ul>
            <li>Referrer reward: 5% of invited user&apos;s first successful deposit.</li>
            <li>Maximum reward: 500 BDT.</li>
            <li>Unlock condition: invited user must complete 50% deposit turnover.</li>
            <li>Self-referral and suspicious accounts can be cancelled by admin.</li>
          </ul>
        </section>

        <section className="invite-summary-card">
          <h2>Quick summary</h2>
          <div className="invite-summary-list">
            <div><span>Total pending</span><strong>{formatCurrency(totals.pending || 0, 'BDT')}</strong></div>
            <div><span>Total credited</span><strong>{formatCurrency(totals.credited || 0, 'BDT')}</strong></div>
            <div><span>Reward entries</span><strong>{rewards.length}</strong></div>
            <div><span>Qualified users</span><strong>{qualifiedCount}</strong></div>
          </div>
        </section>
      </section>

      <section className="invite-table-card">
        <div className="invite-section-head">
          <h2>Reward history</h2>
          <span>{rewards.length} records</span>
        </div>

        <div className="invite-table-wrap desktop-only">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Deposit</th>
                <th>Reward</th>
                <th>Turnover</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => (
                <tr key={reward._id}>
                  <td>{reward.referredUser?.userId || reward.referredUser?.name || 'User'}</td>
                  <td>{formatCurrency(reward.depositAmount || 0, reward.rewardCurrency || 'BDT')}</td>
                  <td>{formatCurrency(reward.rewardAmount || 0, reward.rewardCurrency || 'BDT')}</td>
                  <td>{formatCurrency(reward.completedTurnover || 0, reward.rewardCurrency || 'BDT')} / {formatCurrency(reward.requiredTurnover || 0, reward.rewardCurrency || 'BDT')}</td>
                  <td><span className={`invite-status ${reward.status}`}>{reward.status}</span></td>
                  <td>{formatDate(reward.createdAt)}</td>
                </tr>
              ))}
              {!loading && rewards.length === 0 && (
                <tr><td colSpan="6">No referral reward yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="invite-mobile-list mobile-only">
          {rewards.map((reward) => (
            <article className="invite-mobile-card" key={reward._id}>
              <div className="invite-mobile-top">
                <strong>{reward.referredUser?.userId || reward.referredUser?.name || 'User'}</strong>
                <span className={`invite-status ${reward.status}`}>{reward.status}</span>
              </div>
              <div className="invite-mobile-grid">
                <div><span>Deposit</span><strong>{formatCurrency(reward.depositAmount || 0, reward.rewardCurrency || 'BDT')}</strong></div>
                <div><span>Reward</span><strong>{formatCurrency(reward.rewardAmount || 0, reward.rewardCurrency || 'BDT')}</strong></div>
                <div><span>Turnover</span><strong>{formatCurrency(reward.completedTurnover || 0, reward.rewardCurrency || 'BDT')} / {formatCurrency(reward.requiredTurnover || 0, reward.rewardCurrency || 'BDT')}</strong></div>
                <div><span>Date</span><strong>{formatDate(reward.createdAt)}</strong></div>
              </div>
            </article>
          ))}
          {!loading && rewards.length === 0 && <div className="invite-empty-state">No referral reward yet.</div>}
        </div>
      </section>
    </main>
  );
}
