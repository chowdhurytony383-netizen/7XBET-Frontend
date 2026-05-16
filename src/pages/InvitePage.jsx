import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Gift, Link2, Share2, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { ReferralAPI } from '../api/affiliate.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import './InvitePage.css';

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
    return () => {
      active = false;
    };
  }, []);

  const totals = data?.totals || {};
  const rewards = useMemo(() => data?.rewards || [], [data?.rewards]);
  const invitedUsers = data?.invitedUsers || [];
  const inviteCode = data?.inviteCode || '';
  const inviteLink = data?.inviteLink || '';

  const qualifiedCount = useMemo(
    () => rewards.filter((reward) => ['qualified', 'credited'].includes(reward.status)).length,
    [rewards]
  );

  const shareInvite = async () => {
    if (!inviteLink) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join 7XBET',
          text: 'Create your 7XBET account using my invite link.',
          url: inviteLink,
        });
      } else {
        await copyText(inviteLink, 'Invite link copied');
      }
    } catch (_) {
      // User cancelled native share sheet. No error toast needed.
    }
  };

  return (
    <main className="invite-page">
      <PageHeader
        eyebrow="Invite & earn"
        title="My Invite Program"
        description="Share your invite link with friends. Rewards are tracked automatically after their first deposit and required turnover."
      />

      <section className="invite-hero-card">
        <div className="invite-hero-content">
          <span className="invite-kicker">Your invite code</span>
          <div className="invite-code-row">
            <strong>{loading ? 'Loading...' : inviteCode || 'Not available'}</strong>
            <button type="button" onClick={() => copyText(inviteCode, 'Invite code copied')} disabled={!inviteCode}>
              <Copy size={17} /> Copy code
            </button>
          </div>
          <p className="invite-hero-text">
            Use this link for user-to-user invites. One clean acquisition source is easier to audit and prevents commission conflict.
          </p>

          <div className="invite-link-box">
            <Link2 size={18} />
            <span>{inviteLink || 'Your invite link will appear here.'}</span>
          </div>

          <div className="invite-hero-actions">
            <button type="button" className="invite-primary-btn" onClick={() => copyText(inviteLink, 'Invite link copied')} disabled={!inviteLink}>
              <Copy size={18} /> Copy link
            </button>
            <button type="button" className="invite-secondary-btn" onClick={shareInvite} disabled={!inviteLink}>
              <Share2 size={18} /> Share
            </button>
          </div>
        </div>

        <aside className="invite-summary-panel">
          <div className="invite-summary-icon"><Gift size={28} /></div>
          <h2>Referral reward</h2>
          <p>Invite users and earn after their qualifying activity is completed.</p>
          <ul>
            <li><ShieldCheck size={16} /> Self-referral is blocked</li>
            <li><ShieldCheck size={16} /> Fraud review supported</li>
            <li><ShieldCheck size={16} /> Admin can hold/cancel suspicious rewards</li>
          </ul>
        </aside>
      </section>

      <section className="invite-stats-grid">
        <StatCard icon={Users} label="Invited users" value={invitedUsers.length} />
        <StatCard icon={Gift} label="Qualified rewards" value={qualifiedCount} />
        <StatCard icon={WalletCards} label="Pending reward" value={formatCurrency(totals.pending || 0, 'BDT')} />
        <StatCard icon={WalletCards} label="Credited reward" value={formatCurrency(totals.credited || 0, 'BDT')} />
      </section>

      <section className="invite-rules-grid">
        <article>
          <span>Reward</span>
          <strong>5% of first deposit</strong>
          <p>Calculated from the invited user’s first successful deposit.</p>
        </article>
        <article>
          <span>Maximum</span>
          <strong>500 BDT</strong>
          <p>Admin can adjust this rule later for campaigns or special markets.</p>
        </article>
        <article>
          <span>Unlock</span>
          <strong>50% turnover</strong>
          <p>Reward unlocks only after the invited user completes the required turnover.</p>
        </article>
      </section>

      <section className="invite-table-card">
        <div className="invite-section-head">
          <div>
            <h2>Reward history</h2>
            <p>Desktop shows a table. Mobile shows compact cards for easier reading.</p>
          </div>
        </div>

        <div className="invite-table-wrap">
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
                  <td>
                    {formatCurrency(reward.completedTurnover || 0, reward.rewardCurrency || 'BDT')} /{' '}
                    {formatCurrency(reward.requiredTurnover || 0, reward.rewardCurrency || 'BDT')}
                  </td>
                  <td><span className={`invite-status ${statusClass(reward.status)}`}>{reward.status || 'pending'}</span></td>
                  <td>{formatDate(reward.createdAt)}</td>
                </tr>
              ))}
              {!loading && rewards.length === 0 && (
                <tr><td colSpan="6">No referral reward yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="invite-mobile-list">
          {rewards.map((reward) => (
            <article key={reward._id} className="invite-mobile-card">
              <div className="invite-mobile-card-head">
                <strong>{reward.referredUser?.userId || reward.referredUser?.name || 'User'}</strong>
                <span className={`invite-status ${statusClass(reward.status)}`}>{reward.status || 'pending'}</span>
              </div>
              <dl>
                <div><dt>Deposit</dt><dd>{formatCurrency(reward.depositAmount || 0, reward.rewardCurrency || 'BDT')}</dd></div>
                <div><dt>Reward</dt><dd>{formatCurrency(reward.rewardAmount || 0, reward.rewardCurrency || 'BDT')}</dd></div>
                <div><dt>Turnover</dt><dd>{formatCurrency(reward.completedTurnover || 0, reward.rewardCurrency || 'BDT')} / {formatCurrency(reward.requiredTurnover || 0, reward.rewardCurrency || 'BDT')}</dd></div>
                <div><dt>Date</dt><dd>{formatDate(reward.createdAt)}</dd></div>
              </dl>
            </article>
          ))}
          {!loading && rewards.length === 0 && <p className="invite-empty-state">No referral reward yet.</p>}
        </div>
      </section>
    </main>
  );
}
