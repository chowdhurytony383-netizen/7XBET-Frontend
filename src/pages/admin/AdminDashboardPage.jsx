import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, ShieldCheck, Users, Wallet, Shield } from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await AdminAPI.overview();
      setOverview(response.data?.data || response.data || null);
    } catch (err) {
      setError(getApiError(err, 'Unable to load admin overview'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = overview?.stats || overview || {};

  return (
    <div className="page-stack admin-page">
      <PageHeader eyebrow="Admin panel" title="Overview" description=" " actions={<button className="btn btn-soft" onClick={load}><RefreshCw size={18} /> Refresh</button>} />
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
        <div className="card admin-quick-card"><ShieldCheck size={28} /><h3>Verification review</h3><p>User verification data is available from the user details screen.</p></div>
      </section>
      {loading && <div className="card admin-loading"><div className="loader" /></div>}
    </div>
  );
}
