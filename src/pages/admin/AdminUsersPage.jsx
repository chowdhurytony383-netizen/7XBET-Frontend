import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import './AdminUsersPage.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', verificationStatus: '' });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await AdminAPI.users(filters);
      setUsers(response.data?.data || response.data?.users || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load users'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (userId, status) => {
    setUpdatingId(userId);
    try {
      await AdminAPI.updateUserStatus(userId, { status });
      toast.success(`User status changed to ${status}`);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'User status update failed'));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="page-stack admin-users-page">
      <PageHeader eyebrow="Admin panel" title="Users" description="Search users, open account details and control account status from backend admin endpoints." actions={<button className="btn btn-soft" onClick={load}><RefreshCw size={18} /> Refresh</button>} />
      <form className="card admin-filter-bar" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <div className="input-group"><label htmlFor="search">Search</label><input id="search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Name, email or phone" /></div>
        <div className="input-group"><label htmlFor="status">Account status</label><select id="status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="blocked">Blocked</option></select></div>
        <div className="input-group"><label htmlFor="verificationStatus">Verification</label><select id="verificationStatus" value={filters.verificationStatus} onChange={(event) => setFilters({ ...filters, verificationStatus: event.target.value })}><option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        <button className="btn btn-primary" type="submit"><Search size={18} /> Search</button>
      </form>
      {error && <div className="auth-message">{error}</div>}
      <section className="card admin-table-card"><div className="table-scroll"><table className="admin-table"><thead><tr><th>User</th><th>Phone</th><th>Balance</th><th>Verification</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="7"><div className="table-loader"><div className="loader" /></div></td></tr> : users.length ? users.map((item) => {
          const id = item._id || item.id;
          const userStatus = item.status || (item.isBlocked ? 'blocked' : 'active');
          const verificationStatus = item.verificationStatus || item.kyc?.status || (item.isVerified ? 'approved' : 'pending');
          return <tr key={id}><td><strong>{item.fullName || item.name || item.username || 'Account'}</strong><span>{item.email || '—'}</span></td><td>{item.phone || '—'}</td><td>{formatCurrency(item.wallet)}</td><td><span className="pill">{verificationStatus}</span></td><td><span className="pill">{userStatus}</span></td><td>{formatDate(item.createdAt)}</td><td className="admin-actions"><Link className="btn btn-soft" to={`/admin/users/${id}`}>Open</Link><button className="btn btn-primary" disabled={updatingId === id} onClick={() => updateStatus(id, 'active')}><UserCheck size={16} /> Active</button><button className="btn btn-danger" disabled={updatingId === id} onClick={() => updateStatus(id, 'suspended')}><UserX size={16} /> Suspend</button></td></tr>;
        }) : <tr><td colSpan="7" className="empty-row">No users found.</td></tr>}
      </tbody></table></div></section>
    </div>
  );
}
