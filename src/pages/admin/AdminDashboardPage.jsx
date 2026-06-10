import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDownToLine, ArrowUpFromLine, Crown, Gamepad2, Handshake, RefreshCw, ShieldCheck, Users, Wallet, Shield } from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import LiveAutoRefreshStatus from '../../components/LiveAutoRefreshStatus.jsx';
import useAutoRefresh from '../../hooks/useAutoRefresh.js';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncingJiliGames, setSyncingJiliGames] = useState(false);
  const [jiliSyncResult, setJiliSyncResult] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await AdminAPI.overview();
      setOverview(response.data?.data || response.data || null);
      setError('');
    } catch (err) {
      if (!silent) setError(getApiError(err, 'Unable to load admin overview'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const syncJiliProviderGames = async () => {
    setSyncingJiliGames(true);
    setJiliSyncResult(null);

    try {
      const response = await AdminAPI.syncJiliGames();
      const data = response.data?.data || {};
      setJiliSyncResult(data);
      toast.success(response.data?.message || 'JILI games synced successfully');
    } catch (err) {
      toast.error(getApiError(err, 'Unable to sync JILI games'));
    } finally {
      setSyncingJiliGames(false);
    }
  };

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, { intervalMs: 1000 });

  const stats = overview?.stats || overview || {};

  return (
    <div className="page-stack admin-page">
      <PageHeader eyebrow="Admin panel" title="Overview" description=" " actions={<LiveAutoRefreshStatus />} />
      {error && <div className="auth-message">{error}</div>}
      <div className="grid-4">
        <StatCard icon={Users} label="Users" value={stats.totalUsers ?? 0} />
        <StatCard icon={Wallet} label="Total wallet" value={formatCurrency(stats.totalWallet)} />
        <StatCard icon={ArrowDownToLine} label="Pending deposits" value={stats.pendingDeposits ?? 0} />
        <StatCard icon={ArrowUpFromLine} label="Pending withdrawals" value={stats.pendingWithdrawals ?? 0} />
        <StatCard icon={Shield} label="Agents" value={stats.totalAgents ?? 0} />
      </div>
      <section className="admin-quick-grid">
        <Link className="card admin-quick-card" to="/admin/users"><Users size={28} /><h3>Manage users</h3><p>View account details, verification status, wallet state and access status.</p></Link>
        <Link className="card admin-quick-card" to="/admin/deposits"><ArrowDownToLine size={28} /><h3>Control deposits</h3><p>Review pending deposit transactions and update backend status.</p></Link>
        <Link className="card admin-quick-card" to="/admin/withdrawals"><ArrowUpFromLine size={28} /><h3>Control withdrawals</h3><p>Approve, reject or mark withdrawal requests after checking user information.</p></Link>
        <Link className="card admin-quick-card" to="/admin/agents"><Shield size={28} /><h3>Agent Admin</h3><p>Create agent accounts, send balance by Agent ID and control agent access.</p></Link>
        <Link className="card admin-quick-card" to="/admin/affiliates"><Handshake size={28} /><h3>Affiliate Partners</h3><p>Approve affiliates, set 30%–40% GGR revenue share, calculate periods and manage carryover.</p></Link>
        <Link className="card admin-quick-card" to="/admin/vip-rewards"><Crown size={28} /><h3>VIP Rewards</h3><p>Calculate monthly VIP cashback, approve rewards and track user claims.</p></Link>
        <button type="button" className="card admin-quick-card admin-sync-card" onClick={syncJiliProviderGames} disabled={syncingJiliGames}>
          {syncingJiliGames ? <RefreshCw size={28} className="admin-spin" /> : <Gamepad2 size={28} />}
          <h3>{syncingJiliGames ? 'Syncing JILI Games...' : 'Sync JILI Games'}</h3>
          <p>
            Fetch latest JILI provider game list and add newly released games to website.
            {jiliSyncResult && (
              <span className="admin-sync-result">
                <b>New Games:</b> {jiliSyncResult.inserted ?? 0}
                <b>Total JILI Games:</b> {jiliSyncResult.totalActiveGames ?? jiliSyncResult.syncedCount ?? 0}
                <b>Updated:</b> {jiliSyncResult.updated ?? 0}
              </span>
            )}
          </p>
        </button>
        <div className="card admin-quick-card"><ShieldCheck size={28} /><h3>Verification review</h3><p>User verification data is available from the user details screen.</p></div>
      </section>
      {loading && <div className="card admin-loading"><div className="loader" /></div>}
    </div>
  );
}
