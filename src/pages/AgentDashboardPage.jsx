import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDownToLine, ArrowUpFromLine, CreditCard, Globe2, LogOut, Shield, Wallet } from 'lucide-react';
import { AgentAPI } from '../api/agent.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import LiveAutoRefreshStatus from '../components/LiveAutoRefreshStatus.jsx';
import useAutoRefresh from '../hooks/useAutoRefresh.js';
import StatCard from '../components/StatCard.jsx';
import './AgentDashboardPage.css';

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const [meResponse, txResponse, depositResponse, withdrawResponse] = await Promise.all([
        AgentAPI.me(),
        AgentAPI.transactions(),
        AgentAPI.requests({ type: 'DEPOSIT', status: 'PENDING' }),
        AgentAPI.requests({ type: 'WITHDRAW', status: 'PENDING' }),
      ]);
      setAgent(meResponse.data?.data?.agent || meResponse.data?.agent || null);
      setTransactions(txResponse.data?.data || txResponse.data?.transactions || []);
      setDepositRequests(depositResponse.data?.data || depositResponse.data?.requests || []);
      setWithdrawRequests(withdrawResponse.data?.data || withdrawResponse.data?.requests || []);
      setError('');
    } catch (err) {
      if (!silent) setError(getApiError(err, 'Agent session expired'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, { intervalMs: 1000 });

  const logout = async () => {
    await AgentAPI.logout().catch(() => null);
    toast.success('Logged out');
    navigate('/agent/login', { replace: true });
  };

  return (
    <div className="agent-panel-page page-stack">
      <PageHeader
        eyebrow="Agent admin panel"
        title={agent?.agentId || 'Agent dashboard'}
        description="Manage payment methods and confirm/reject user deposit and withdrawal requests."
        actions={<><LiveAutoRefreshStatus /><button className="btn btn-danger" onClick={logout}><LogOut size={18} /> Logout</button></>}
      />

      {error && <div className="auth-message">{error}</div>}

      <div className="grid-4">
        <StatCard icon={Shield} label="Agent ID" value={agent?.agentId || '—'} />
        <StatCard icon={Wallet} label="Balance" value={formatCurrency(agent?.balance || 0, agent)} />
        <StatCard icon={Globe2} label="Country / Currency" value={`${agent?.country || 'Bangladesh'} / ${agent?.currency || 'BDT'}`} />
        <StatCard icon={ArrowDownToLine} label="Pending deposits" value={depositRequests.length} />
        <StatCard icon={ArrowUpFromLine} label="Pending withdrawals" value={withdrawRequests.length} />
      </div>

      <section className="card agent-dashboard-action-card">
        <h3>Agent actions</h3>
        <div className="agent-dashboard-actions">
          <Link className="btn btn-primary" to="/agent/payment-methods"><CreditCard size={18} /> Payment Settings</Link>
          <Link className="btn btn-soft" to="/agent/requests/deposits"><ArrowDownToLine size={18} /> Deposit Requests</Link>
          <Link className="btn btn-soft" to="/agent/requests/withdrawals"><ArrowUpFromLine size={18} /> Withdraw Requests</Link>
        </div>
      </section>

      <section className="card admin-table-card">
        <h3>Agent balance history</h3>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Before</th>
                <th>After</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><div className="table-loader"><div className="loader" /></div></td></tr>
              ) : transactions.length ? transactions.map((item) => (
                <tr key={item._id}>
                  <td><span className="pill">{item.type}</span></td>
                  <td>{formatCurrency(item.amount, agent)}</td>
                  <td>{formatCurrency(item.balanceBefore, agent)}</td>
                  <td>{formatCurrency(item.balanceAfter, agent)}</td>
                  <td>{item.note || '—'}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="empty-row">No balance history yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
