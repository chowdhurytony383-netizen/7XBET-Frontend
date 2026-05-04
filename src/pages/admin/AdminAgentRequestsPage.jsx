import { useCallback, useEffect, useState } from 'react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import LiveAutoRefreshStatus from '../../components/LiveAutoRefreshStatus.jsx';
import useAutoRefresh from '../../hooks/useAutoRefresh.js';
import './AdminTransactionsPage.css';

export default function AdminAgentRequestsPage() {
  const [filters, setFilters] = useState({ type: '', status: '' });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await AdminAPI.agentPaymentRequests(filters);
      setRequests(response.data?.data || response.data?.requests || []);
      setError('');
    } catch (err) {
      if (!silent) setError(getApiError(err, 'Unable to load agent requests'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, { intervalMs: 1000 });

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin panel"
        title="Agent deposit/withdraw requests"
        description="Monitor all user deposit and withdrawal requests handled by agents."
        actions={<LiveAutoRefreshStatus />}
      />

      <section className="card admin-table-card">
        <div className="admin-filter-row">
          <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="">All types</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAW">Withdrawals</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button className="btn btn-primary" onClick={load}>Apply</button>
        </div>

        {error && <div className="auth-message">{error}</div>}

        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>User</th>
                <th>Agent</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8"><div className="table-loader"><div className="loader" /></div></td></tr>
              ) : requests.length ? requests.map((item) => (
                <tr key={item._id}>
                  <td><span className="pill">{item.type}</span></td>
                  <td><span className={`status-pill status-${String(item.status).toLowerCase()}`}>{item.status}</span></td>
                  <td>{item.userName || item.user?.fullName || item.user?.name || '—'}<br /><small>{item.userId || item.user?.userId || ''}</small></td>
                  <td>{item.agentId}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.methodTitle || item.methodKey || '—'}</td>
                  <td>{item.userNote || item.agentNote || '—'}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="empty-row">No agent requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
