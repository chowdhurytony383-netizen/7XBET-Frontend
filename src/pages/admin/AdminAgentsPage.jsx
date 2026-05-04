import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Plus, Search, Shield, Wallet } from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import LiveAutoRefreshStatus from '../../components/LiveAutoRefreshStatus.jsx';
import useAutoRefresh from '../../hooks/useAutoRefresh.js';
import './AdminAgentsPage.css';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [createForm, setCreateForm] = useState({ name: '', agentId: '', password: '' });
  const [topUpForm, setTopUpForm] = useState({ agentId: '', amount: '', note: '' });
  const [createdAgent, setCreatedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await AdminAPI.agents(filters);
      setAgents(response.data?.data || response.data?.agents || []);
      setError('');
    } catch (err) {
      if (!silent) setError(getApiError(err, 'Unable to load agents'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, { intervalMs: 1000 });

  const createAgent = async (event) => {
    event.preventDefault();
    setCreating(true);

    try {
      const response = await AdminAPI.createAgent(createForm);
      const data = response.data?.data || {};
      setCreatedAgent({ agentId: data.agentId, password: data.password });
      setCreateForm({ name: '', agentId: '', password: '' });
      toast.success('Agent created');
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Agent creation failed'));
    } finally {
      setCreating(false);
    }
  };

  const topUpAgent = async (event) => {
    event.preventDefault();
    setToppingUp(true);

    try {
      await AdminAPI.topUpAgent({
        agentId: topUpForm.agentId,
        amount: Number(topUpForm.amount),
        note: topUpForm.note,
      });
      setTopUpForm({ agentId: '', amount: '', note: '' });
      toast.success('Agent balance updated');
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Agent top-up failed'));
    } finally {
      setToppingUp(false);
    }
  };

  const updateStatus = async (agentId, status) => {
    try {
      await AdminAPI.updateAgentStatus(agentId, { status });
      toast.success(`Agent ${status}`);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Agent status update failed'));
    }
  };

  const copyCreatedAgent = async () => {
    if (!createdAgent) return;
    await navigator.clipboard.writeText(`Agent ID: ${createdAgent.agentId}\nPassword: ${createdAgent.password}`);
    toast.success('Agent credentials copied');
  };

  return (
    <div className="page-stack admin-agents-page">
      <PageHeader
        eyebrow="Admin panel"
        title="Agent Admin"
        description="Create agent accounts, send balance by Agent ID and control separate agent panel access."
        actions={<LiveAutoRefreshStatus />}
      />

      {error && <div className="auth-message">{error}</div>}

      <section className="admin-agent-grid">
        <form className="card admin-agent-card" onSubmit={createAgent}>
          <h3><Shield size={20} /> Create Agent</h3>
          <div className="input-group">
            <label>Agent name</label>
            <input value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} placeholder="Agent name" />
          </div>
          <div className="input-group">
            <label>Custom Agent ID optional</label>
            <input value={createForm.agentId} onChange={(event) => setCreateForm({ ...createForm, agentId: event.target.value })} placeholder="Auto if blank" />
          </div>
          <div className="input-group">
            <label>Password optional</label>
            <input value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} placeholder="Auto if blank" />
          </div>
          <button className="btn btn-primary btn-full" disabled={creating} type="submit">
            <Plus size={18} /> {creating ? 'Creating...' : 'Create Agent'}
          </button>

          {createdAgent && (
            <div className="agent-credential-box">
              <strong>Agent created</strong>
              <span>Agent ID: {createdAgent.agentId}</span>
              <span>Password: {createdAgent.password}</span>
              <button className="btn btn-soft" type="button" onClick={copyCreatedAgent}><Copy size={17} /> Copy</button>
            </div>
          )}
        </form>

        <form className="card admin-agent-card" onSubmit={topUpAgent}>
          <h3><Wallet size={20} /> Agent Top-up</h3>
          <div className="input-group">
            <label>Agent ID</label>
            <input value={topUpForm.agentId} onChange={(event) => setTopUpForm({ ...topUpForm, agentId: event.target.value })} required placeholder="AG12345678" />
          </div>
          <div className="input-group">
            <label>Amount</label>
            <input value={topUpForm.amount} onChange={(event) => setTopUpForm({ ...topUpForm, amount: event.target.value })} required type="number" min="1" placeholder="Amount" />
          </div>
          <div className="input-group">
            <label>Note optional</label>
            <input value={topUpForm.note} onChange={(event) => setTopUpForm({ ...topUpForm, note: event.target.value })} placeholder="Top-up note" />
          </div>
          <button className="btn btn-primary btn-full" disabled={toppingUp} type="submit">
            {toppingUp ? 'Sending...' : 'Confirm Top-up'}
          </button>
        </form>
      </section>

      <form className="card admin-filter-bar" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <div className="input-group">
          <label>Search</label>
          <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Agent ID or name" />
        </div>
        <div className="input-group">
          <label>Status</label>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit"><Search size={18} /> Search</button>
      </form>

      <section className="card admin-table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><div className="table-loader"><div className="loader" /></div></td></tr>
              ) : agents.length ? agents.map((agent) => (
                <tr key={agent._id}>
                  <td><strong>{agent.agentId}</strong><span>{agent.name || 'Agent'}</span></td>
                  <td>{formatCurrency(agent.balance)}</td>
                  <td><span className="pill">{agent.status}</span></td>
                  <td>{formatDate(agent.createdAt)}</td>
                  <td className="admin-actions">
                    <button className="btn btn-primary" type="button" onClick={() => updateStatus(agent._id, 'active')}>Active</button>
                    <button className="btn btn-danger" type="button" onClick={() => updateStatus(agent._id, 'blocked')}>Block</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="empty-row">No agents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
