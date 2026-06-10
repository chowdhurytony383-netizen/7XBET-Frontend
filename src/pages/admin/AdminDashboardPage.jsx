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
import { connectRealtimeSocket } from '../../socket/realtimeSocket.js';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [presence, setPresence] = useState(null);
  const [presenceError, setPresenceError] = useState('');
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

  const loadPresence = useCallback(async () => {
    try {
      const response = await AdminAPI.presence();
      setPresence(response.data?.data || response.data || null);
      setPresenceError('');
    } catch (err) {
      setPresenceError(getApiError(err, 'Unable to load realtime presence'));
    }
  }, []);

  useEffect(() => {
    loadPresence();

    const socket = connectRealtimeSocket();
    const handlePresenceUpdate = (payload) => {
      if (payload) {
        setPresence(payload);
        setPresenceError('');
      }
    };

    socket.emit('presence:subscribe');
    socket.on('presence:update', handlePresenceUpdate);

    const timer = window.setInterval(() => {
      socket.emit('presence:subscribe');
      loadPresence();
    }, 10000);

    return () => {
      window.clearInterval(timer);
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [loadPresence]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, { intervalMs: 1000 });

  const stats = overview?.stats || overview || {};
  const onlineUsers = presence?.onlineUsers || [];
  const onlineAgents = presence?.onlineAgents || [];
  const offlineAgents = presence?.offlineAgents || [];
  const presenceCounts = presence?.counts || {};

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
        <StatCard icon={UserCheck} label="Online users" value={presenceCounts.onlineUsers ?? onlineUsers.length ?? 0} />
        <StatCard icon={Wifi} label="Online agents" value={presenceCounts.onlineAgents ?? onlineAgents.length ?? 0} />
        <StatCard icon={WifiOff} label="Offline agents" value={presenceCounts.offlineAgents ?? offlineAgents.length ?? 0} />
      </div>
      <section className="admin-presence-grid">
        <div className="card admin-presence-card">
          <div className="admin-presence-head">
            <div>
              <span className="page-eyebrow">Realtime</span>
              <h3>Online Users</h3>
            </div>
            <strong>{presenceCounts.onlineUsers ?? onlineUsers.length ?? 0}</strong>
          </div>
          {presenceError && <p className="admin-presence-error">{presenceError}</p>}
          <div className="admin-presence-list">
            {onlineUsers.length ? onlineUsers.slice(0, 12).map((user) => (
              <div className="admin-presence-row" key={user.id}>
                <span className="presence-dot online" />
                <div>
                  <b>{user.name || user.email || user.userId || 'User'}</b>
                  <small>{user.email || user.userId || user.id} · {user.connections || 1} connection</small>
                </div>
              </div>
            )) : (
              <p className="admin-presence-empty">No online users right now.</p>
            )}
          </div>
        </div>

        <div className="card admin-presence-card">
          <div className="admin-presence-head">
            <div>
              <span className="page-eyebrow">Realtime</span>
              <h3>Online Agents</h3>
            </div>
            <strong>{presenceCounts.onlineAgents ?? onlineAgents.length ?? 0}</strong>
          </div>
          <div className="admin-presence-list">
            {onlineAgents.length ? onlineAgents.map((agent) => (
              <div className="admin-presence-row" key={agent.id}>
                <span className="presence-dot online" />
                <div>
                  <b>{agent.name || agent.agentId}</b>
                  <small>{agent.agentId} · {agent.currency || 'BDT'} {agent.balance ?? 0}</small>
                </div>
              </div>
            )) : (
              <p className="admin-presence-empty">No online agents right now.</p>
            )}
          </div>
        </div>

        <div className="card admin-presence-card">
          <div className="admin-presence-head">
            <div>
              <span className="page-eyebrow">Realtime</span>
              <h3>Offline Agents</h3>
            </div>
            <strong>{presenceCounts.offlineAgents ?? offlineAgents.length ?? 0}</strong>
          </div>
          <div className="admin-presence-list">
            {offlineAgents.length ? offlineAgents.slice(0, 20).map((agent) => (
              <div className="admin-presence-row" key={agent.id}>
                <span className={`presence-dot ${agent.status === 'blocked' ? 'blocked' : 'offline'}`} />
                <div>
                  <b>{agent.name || agent.agentId}</b>
                  <small>{agent.agentId} · {agent.status || 'offline'}</small>
                </div>
              </div>
            )) : (
              <p className="admin-presence-empty">All agents are online.</p>
            )}
          </div>
        </div>
      </section>
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
