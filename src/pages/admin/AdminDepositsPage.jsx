import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import LiveAutoRefreshStatus from '../../components/LiveAutoRefreshStatus.jsx';
import useAutoRefresh from '../../hooks/useAutoRefresh.js';
import './AdminTransactionsPage.css';

export default function AdminDepositsPage() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: 'PENDING', search: '' });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await AdminAPI.deposits(filters);
      setItems(response.data?.data || response.data?.deposits || []);
      setError('');
    } catch (err) {
      if (!silent) setError(getApiError(err, 'Unable to load deposits'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, { intervalMs: 1000 });

  const updateStatus = async (transactionId, status) => {
    setUpdatingId(transactionId);
    try {
      await AdminAPI.updateDepositStatus(transactionId, { status });
      toast.success(`Deposit marked ${status}`);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Deposit update failed'));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="page-stack admin-transactions-page">
      <PageHeader eyebrow="Admin panel" title="Deposits" description="Approve or reject deposit records after backend payment verification." actions={<LiveAutoRefreshStatus />} />
      <form className="card admin-transaction-filter" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <div className="input-group"><label htmlFor="depositSearch">Search</label><input id="depositSearch" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Transaction ID, email or payment ID" /></div>
        <div className="input-group"><label htmlFor="depositStatus">Status</label><select id="depositStatus" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All</option><option value="PENDING">Pending</option><option value="SUCCESS">Success</option><option value="FAILED">Failed</option><option value="REJECTED">Rejected</option></select></div>
        <button className="btn btn-primary" type="submit"><Search size={18} /> Search</button>
      </form>
      {error && <div className="auth-message">{error}</div>}
      <section className="card admin-table-card"><div className="table-scroll"><table className="admin-table admin-transaction-table"><thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Payment</th><th>Created</th><th>Actions</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="6"><div className="table-loader"><div className="loader" /></div></td></tr> : items.length ? items.map((item) => {
          const id = item._id || item.id;
          const user = item.user || item.userId || {};
          return <tr key={id}><td><strong>{user.name || user.fullName || item.userName || 'Account'}</strong><span>{user.email || item.email || '—'}</span></td><td>{formatCurrency(item.amount)}</td><td><span className="pill">{item.status || 'PENDING'}</span></td><td><span>{item.razorpayPaymentId || item.paymentId || item.transactionId || '—'}</span></td><td>{formatDate(item.createdAt)}</td><td className="admin-actions"><button className="btn btn-primary" disabled={updatingId === id} onClick={() => updateStatus(id, 'SUCCESS')}><CheckCircle2 size={16} /> Approve</button><button className="btn btn-danger" disabled={updatingId === id} onClick={() => updateStatus(id, 'REJECTED')}><XCircle size={16} /> Reject</button></td></tr>;
        }) : <tr><td colSpan="6" className="empty-row">No records found.</td></tr>}
      </tbody></table></div></section>
    </div>
  );
}
