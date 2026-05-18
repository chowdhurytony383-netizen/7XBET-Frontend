import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  ChevronRight,
  CreditCard,
  Globe2,
  LogOut,
  Shield,
  Wallet,
} from 'lucide-react';
import { AgentAPI } from '../api/agent.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import LiveAutoRefreshStatus from '../components/LiveAutoRefreshStatus.jsx';
import useAutoRefresh from '../hooks/useAutoRefresh.js';
import StatCard from '../components/StatCard.jsx';
import './AgentDashboardPage.css';

function cleanTitle(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function canonicalTitle(value) {
  return cleanTitle(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ')
    .replace(/\s*(?:channel|ch|no|number|num)?\s*[#:_-]*\s*\d+$/i, '')
    .replace(/\d+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractChannelNumber(method, fallbackIndex) {
  const combined = `${method?.channel || ''} ${method?.title || ''} ${method?.key || ''}`;
  const explicit = String(combined).match(/(?:channel|ch|no|number|num)?\s*[#:_-]*\s*(\d+)\s*$/i);
  if (explicit?.[1]) return Number(explicit[1]);
  const keyNumber = String(method?.key || '').match(/(\d+)$/);
  if (keyNumber?.[1]) return Number(keyNumber[1]);
  return fallbackIndex;
}

function buildChannelList(methods = []) {
  const normalized = (methods || [])
    .filter(Boolean)
    .map((method, originalIndex) => ({
      ...method,
      key: String(method.key || '').toLowerCase(),
      title: cleanTitle(method.displayTitle || method.title || method.key || 'Payment Method'),
      originalIndex,
      displayOrder: Number.isFinite(Number(method.displayOrder)) ? Number(method.displayOrder) : 100,
    }))
    .filter((method) => method.key);

  const groups = new Map();
  for (const method of normalized) {
    const groupKey = canonicalTitle(method.title) || canonicalTitle(method.key) || method.key;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(method);
  }

  const output = [];
  for (const [, group] of groups) {
    group.sort((a, b) => (a.displayOrder - b.displayOrder) || a.key.localeCompare(b.key));
    group.forEach((method, index) => {
      const channelNumber = method.channelNumber || extractChannelNumber(method, index + 1);
      const titleWithoutSuffix = method.title.replace(/\s*(?:channel|ch|no|number|num)?\s*[#:_-]*\s*\d+$/i, '').trim() || method.title;
      output.push({
        ...method,
        channelNumber,
        channelLabel: method.displayTitle || `${titleWithoutSuffix} - Channel ${channelNumber}`,
      });
    });
  }

  return output.sort((a, b) => (a.displayOrder - b.displayOrder) || String(a.channelLabel).localeCompare(String(b.channelLabel)));
}

function countByMethod(requests = []) {
  return requests.reduce((map, request) => {
    const key = String(request.methodKey || '').toLowerCase();
    if (!key) return map;
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
}

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const [meResponse, txResponse, depositResponse, withdrawResponse, paymentResponse] = await Promise.all([
        AgentAPI.me(),
        AgentAPI.transactions(),
        AgentAPI.requests({ type: 'DEPOSIT', status: 'PENDING' }),
        AgentAPI.requests({ type: 'WITHDRAW', status: 'PENDING' }),
        AgentAPI.paymentMethods().catch(() => null),
      ]);
      const nextAgent = meResponse.data?.data?.agent || meResponse.data?.agent || null;
      const paymentData = paymentResponse?.data?.data || paymentResponse?.data || null;
      const methods = paymentData?.paymentMethods || nextAgent?.paymentMethods || [];

      setAgent(nextAgent);
      setTransactions(txResponse.data?.data || txResponse.data?.transactions || []);
      setDepositRequests(depositResponse.data?.data || depositResponse.data?.requests || []);
      setWithdrawRequests(withdrawResponse.data?.data || withdrawResponse.data?.requests || []);
      setPaymentMethods(methods);
      setError('');
    } catch (err) {
      if (!silent) setError(getApiError(err, 'Agent session expired'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, { intervalMs: 1000 });

  const channels = useMemo(() => buildChannelList(paymentMethods), [paymentMethods]);
  const activeChannels = useMemo(() => channels.filter((method) => method.isGlobalActive !== false && method.isAssigned !== false), [channels]);
  const depositCounts = useMemo(() => countByMethod(depositRequests), [depositRequests]);
  const withdrawCounts = useMemo(() => countByMethod(withdrawRequests), [withdrawRequests]);

  const channelUrl = (channel) => {
    const params = new URLSearchParams({
      methodKey: channel.key,
      channelTitle: channel.channelLabel,
    });
    return `/agent/requests/channel?${params.toString()}`;
  };

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
        description="Work by channel. Click any channel to open its own Deposit Request and Withdraw Request page."
        actions={<><LiveAutoRefreshStatus /><button className="btn btn-danger" onClick={logout}><LogOut size={18} /> Logout</button></>}
      />

      {error && <div className="auth-message">{error}</div>}

      <div className="grid-4">
        <StatCard icon={Shield} label="Agent ID" value={agent?.agentId || '—'} />
        <StatCard icon={Wallet} label="Balance" value={formatCurrency(agent?.balance || 0, agent)} />
        <StatCard icon={BadgeDollarSign} label="Commission Balance" value={formatCurrency(agent?.commissionBalance || 0, agent)} />
        <StatCard icon={Globe2} label="Country / Currency" value={`${agent?.country || 'Bangladesh'} / ${agent?.currency || 'BDT'}`} />
        <StatCard icon={ArrowDownToLine} label="Pending deposits" value={depositRequests.length} />
        <StatCard icon={ArrowUpFromLine} label="Pending withdrawals" value={withdrawRequests.length} />
      </div>

      <section className="card agent-dashboard-action-card agent-channel-workspace">
        <div className="agent-channel-header-row">
          <div>
            <h3>Agent payment channels</h3>
            <p>
              Every payment method assigned from Payment Settings appears as a separate channel here.
              Example: bKash - Channel 1, bKash - Channel 2, Nagad - Channel 1.
            </p>
          </div>
          <Link className="btn btn-primary" to="/agent/payment-methods"><CreditCard size={18} /> Payment Settings</Link>
        </div>

        {loading ? (
          <div className="agent-channel-empty">Loading channels...</div>
        ) : activeChannels.length ? (
          <div className="agent-channel-grid">
            {activeChannels.map((channel) => {
              const deposits = depositCounts[channel.key] || 0;
              const withdrawals = withdrawCounts[channel.key] || 0;

              return (
                <Link
                  key={channel.key}
                  className={`agent-channel-card ${channel.isActive === false ? 'inactive' : ''}`}
                  to={channelUrl(channel)}
                >
                  <span className="agent-channel-icon">
                    {channel.image ? <img src={channel.image} alt={channel.channelLabel} /> : <CreditCard size={20} />}
                  </span>
                  <span className="agent-channel-copy">
                    <strong>{channel.channelLabel}</strong>
                    <small>Key: {channel.key}{channel.isActive === false ? ' · Inactive' : ''}</small>
                  </span>
                  <span className="agent-channel-counts">
                    <span><ArrowDownToLine size={14} /> {deposits}</span>
                    <span><ArrowUpFromLine size={14} /> {withdrawals}</span>
                  </span>
                  <ChevronRight size={18} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="agent-channel-empty">
            No channel is assigned yet. Main Admin must assign channels, then the agent can update numbers from Payment Settings.
          </div>
        )}
      </section>

      <section className="card admin-table-card">
        <h3>Agent balance history</h3>
        <p className="agent-dashboard-commission-note">
          Deposit commission: 6%. Withdraw commission: 2%. It is calculated in this agent's own currency
          (for example BDT 100 → BDT 6, USD 1 → USD 0.06). Commission Balance moves to main Balance automatically on the 3rd day of every month.
        </p>
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
