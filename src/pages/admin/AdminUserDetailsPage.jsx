import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft,
  BadgeCheck,
  Ban,
  CheckCircle2,
  FileCheck2,
  RefreshCw,
  Save,
  ShieldAlert,
  User,
  Wallet,
} from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate, formatDateTime, gameName } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import TransactionTable from '../../components/TransactionTable.jsx';
import './AdminUserDetailsPage.css';

function isAllowed(value) {
  return value !== false;
}

function PermissionRow({ title, description, enabled, disabled, onChange }) {
  return (
    <div className={`permission-row ${enabled ? 'is-enabled' : 'is-disabled'}`}>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button
        className={`btn ${enabled ? 'btn-primary' : 'btn-danger'}`}
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
      >
        {enabled ? <CheckCircle2 size={17} /> : <Ban size={17} />}
        {enabled ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
}


function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildFallbackGameplaySummary(records = []) {
  return records.reduce((summary, record) => {
    const betAmount = numberValue(record.betAmount ?? record.stake ?? record.amount);
    const winAmount = numberValue(record.winAmount ?? record.payoutAmount);
    const netAmount = numberValue(record.netAmount ?? record.netResult ?? (winAmount - betAmount));
    const result = String(record.result || record.status || '').toUpperCase();

    summary.totalRecords += 1;
    summary.totalBetAmount += betAmount;
    summary.totalWinAmount += winAmount;
    summary.netResult += netAmount;
    if (result.includes('WIN') || result.includes('WON') || netAmount > 0) summary.totalWins += 1;
    if (result.includes('LOSE') || result.includes('LOST') || netAmount < 0) summary.totalLosses += 1;
    return summary;
  }, {
    totalRecords: 0,
    totalBetAmount: 0,
    totalWinAmount: 0,
    netResult: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    ggr: 0,
  });
}

function resolveGameplayRecords(record, userBets = []) {
  const records = record?.gameplayRecords || record?.gameplay?.records || [];
  if (records.length) return records;

  return userBets.map((bet) => {
    const betAmount = numberValue(bet.betAmount);
    const winAmount = numberValue(bet.winAmount);
    return {
      id: bet._id || bet.id,
      source: 'Internal Game',
      gameType: 'Casino/Internal',
      gameTitle: gameName(bet.game) || bet.gameName || 'Game',
      betAmount,
      winAmount,
      netAmount: winAmount - betAmount,
      result: bet.isWin ? 'WIN' : 'LOSS',
      status: bet.status || (bet.isWin ? 'WIN' : 'LOSE'),
      createdAt: bet.createdAt,
    };
  });
}

function resultClass(result, netAmount = 0) {
  const normalized = String(result || '').toUpperCase();
  const net = numberValue(netAmount);
  if (normalized.includes('WIN') || normalized.includes('WON') || net > 0) return 'pill-success';
  if (normalized.includes('LOSS') || normalized.includes('LOSE') || normalized.includes('LOST') || net < 0) return 'pill-danger';
  if (normalized.includes('PENDING') || normalized.includes('OPEN') || normalized.includes('ACTIVE')) return 'pill-warning';
  return '';
}

function compactDetail(record) {
  const parts = [];
  if (record.market) parts.push(record.market);
  if (record.selection) parts.push(`Selection: ${record.selection}`);
  if (record.odds) parts.push(`Odds: ${record.odds}`);
  if (record.multiplier) parts.push(`Multiplier: ${record.multiplier}x`);
  if (record.action) parts.push(`Action: ${record.action}`);
  if (record.roundId) parts.push(`Round: ${record.roundId}`);
  if (record.sessionId) parts.push(`Session: ${record.sessionId}`);
  if (record.betId) parts.push(`Bet/Tx: ${record.betId}`);
  return parts.join(' • ');
}

function GameplayRecordsTable({ records = [], user }) {
  if (!records.length) {
    return (
      <div className="card admin-empty-gameplay">
        <strong>No gameplay records found</strong>
        <span>Casino, sports, crash, JILI and provider-wallet activity will appear here after backend records are available.</span>
      </div>
    );
  }

  return (
    <div className="table-card admin-gameplay-table">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Game / Event</th>
              <th>Bet</th>
              <th>Win / Payout</th>
              <th>Net</th>
              <th>Result</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const betAmount = numberValue(record.betAmount ?? record.stake ?? record.amount);
              const winAmount = numberValue(record.winAmount ?? record.payoutAmount);
              const netAmount = numberValue(record.netAmount ?? record.netResult ?? (winAmount - betAmount));
              const result = record.result || (netAmount > 0 ? 'WIN' : netAmount < 0 ? 'LOSS' : 'DRAW');
              const detail = compactDetail(record);
              return (
                <tr key={record.id || record._id || record.betId || `${record.source || 'game'}-${index}`}>
                  <td>
                    <strong>{record.source || record.gameType || 'Game'}</strong>
                    {record.gameType && <span>{record.gameType}</span>}
                  </td>
                  <td>
                    <strong>{record.gameTitle || record.gameName || gameName(record.game)}</strong>
                    {detail && <span>{detail}</span>}
                  </td>
                  <td>{formatCurrency(betAmount, record.currency || user)}</td>
                  <td>{formatCurrency(winAmount, record.currency || user)}</td>
                  <td className={netAmount >= 0 ? 'net-positive' : 'net-negative'}>{formatCurrency(netAmount, record.currency || user)}</td>
                  <td><span className={`pill ${resultClass(result, netAmount)}`}>{result}</span></td>
                  <td>{record.status || '—'}</td>
                  <td>{formatDateTime(record.createdAt || record.settledAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminUserDetailsPage() {
  const { userId } = useParams();
  const [record, setRecord] = useState(null);
  const [agents, setAgents] = useState([]);
  const [note, setNote] = useState('');
  const [permissionForm, setPermissionForm] = useState({
    gameplayEnabled: true,
    depositEnabled: true,
    withdrawEnabled: true,
    permissionNote: '',
  });
  const [transferForm, setTransferForm] = useState({ agentId: '', amount: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailsResponse, agentsResponse] = await Promise.all([
        AdminAPI.userDetails(userId),
        AdminAPI.agents({ status: 'active' }).catch(() => ({ data: { data: [] } })),
      ]);
      const data = detailsResponse.data?.data || detailsResponse.data || null;
      const nextUser = data?.user || data || {};
      setRecord(data);
      setAgents(agentsResponse.data?.data || agentsResponse.data?.agents || []);
      setNote(nextUser?.adminNote || '');
      setPermissionForm({
        gameplayEnabled: isAllowed(nextUser?.gameplayEnabled) && isAllowed(nextUser?.bettingEnabled),
        depositEnabled: isAllowed(nextUser?.depositEnabled),
        withdrawEnabled: isAllowed(nextUser?.withdrawEnabled),
        permissionNote: nextUser?.permissionNote || '',
      });
    } catch (err) {
      setError(getApiError(err, 'Unable to load user details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const user = record?.user || record || {};
  const verification = user?.verification || user?.kyc || user?.identityVerification || record?.verification || {};
  const bets = record?.bets || user?.bets || [];
  const transactions = record?.transactions || user?.transactions || [];
  const gameplayRecords = resolveGameplayRecords(record, bets);
  const fallbackSummary = buildFallbackGameplaySummary(gameplayRecords);
  const gameplaySummary = record?.gameplaySummary || record?.gameplay?.summary || {
    ...fallbackSummary,
    winRate: fallbackSummary.totalRecords ? Math.round((fallbackSummary.totalWins / fallbackSummary.totalRecords) * 100) : 0,
    ggr: fallbackSummary.totalBetAmount - fallbackSummary.totalWinAmount,
  };
  const verificationStatus = user?.verificationStatus || verification?.status || (user?.isVerified ? 'approved' : 'pending');

  const updateVerification = async (status) => {
    setSaving(true);
    try {
      await AdminAPI.updateUserVerification(userId, { status, note });
      toast.success(`Verification marked ${status}`);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Verification update failed'));
    } finally {
      setSaving(false);
    }
  };

  const updateAccountStatus = async (status) => {
    setSaving(true);
    try {
      await AdminAPI.updateUserStatus(userId, { status, note });
      toast.success(`Account marked ${status}`);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Account update failed'));
    } finally {
      setSaving(false);
    }
  };

  const updatePermissions = async (patch = {}) => {
    const nextForm = { ...permissionForm, ...patch };
    setPermissionForm(nextForm);
    setPermissionSaving(true);
    try {
      await AdminAPI.updateUserPermissions(userId, {
        gameplayEnabled: nextForm.gameplayEnabled,
        bettingEnabled: nextForm.gameplayEnabled,
        depositEnabled: nextForm.depositEnabled,
        withdrawEnabled: nextForm.withdrawEnabled,
        note: nextForm.permissionNote,
      });
      toast.success('User permissions updated');
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Permission update failed'));
      await load();
    } finally {
      setPermissionSaving(false);
    }
  };

  const transferBalance = async (transferAll = false) => {
    if (!transferForm.agentId) {
      toast.error('Select an agent first');
      return;
    }

    const amount = transferAll ? 'all' : Number(transferForm.amount);
    if (!transferAll && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error('Enter a valid transfer amount');
      return;
    }

    setTransferring(true);
    try {
      await AdminAPI.transferUserBalanceToAgent(userId, {
        agentId: transferForm.agentId,
        amount,
        transferAll,
        note: transferForm.note || 'Main admin transferred user balance to agent panel',
      });
      toast.success('User balance transferred to agent panel');
      setTransferForm({ agentId: '', amount: '', note: '' });
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Balance transfer failed'));
    } finally {
      setTransferring(false);
    }
  };

  if (loading) return <div className="page-stack"><div className="card admin-user-loading"><div className="loader" /></div></div>;

  return (
    <div className="page-stack admin-user-details-page">
      <PageHeader
        eyebrow="Admin panel"
        title={user?.fullName || user?.name || user?.email || 'User details'}
        description="Review identity, wallet, bet and transaction information returned by backend."
        actions={<button className="btn btn-soft" onClick={load}><RefreshCw size={18} /> Refresh</button>}
      />

      {error && <div className="auth-message">{error}</div>}

      <div className="grid-4">
        <StatCard icon={User} label="Email" value={user?.email || '—'} />
        <StatCard icon={Wallet} label="Wallet" value={formatCurrency(user?.wallet)} />
        <StatCard icon={BadgeCheck} label="Email verified" value={user?.isVerified ? 'Yes' : 'No'} />
        <StatCard icon={FileCheck2} label="Verification" value={verificationStatus} />
      </div>

      <section className="card admin-permission-card">
        <div className="admin-permission-header">
          <div>
            <span className="page-eyebrow">User permission control</span>
            <h3>Betting, games, deposit and withdraw access</h3>
            <p>These switches block only this selected user. Other users remain unchanged.</p>
          </div>
          <span className="pill">Main Admin only</span>
        </div>

        <div className="permission-grid">
          <PermissionRow
            title="Betting & all games"
            description="Disable to stop casino games, crash, dice, mines and source game betting."
            enabled={permissionForm.gameplayEnabled}
            disabled={permissionSaving}
            onChange={(value) => updatePermissions({ gameplayEnabled: value })}
          />
          <PermissionRow
            title="Deposit option"
            description="Disable to stop manual agent deposit and crypto deposit address access."
            enabled={permissionForm.depositEnabled}
            disabled={permissionSaving}
            onChange={(value) => updatePermissions({ depositEnabled: value })}
          />
          <PermissionRow
            title="Withdraw option"
            description="Disable to stop agent withdraw and crypto auto withdraw requests."
            enabled={permissionForm.withdrawEnabled}
            disabled={permissionSaving}
            onChange={(value) => updatePermissions({ withdrawEnabled: value })}
          />
        </div>

        <div className="input-group">
          <label htmlFor="permissionNote">Permission note optional</label>
          <textarea
            id="permissionNote"
            value={permissionForm.permissionNote}
            onChange={(event) => setPermissionForm({ ...permissionForm, permissionNote: event.target.value })}
            placeholder="Reason for disabling/enabling this user's features"
          />
        </div>
        <button className="btn btn-soft" type="button" disabled={permissionSaving} onClick={() => updatePermissions()}>
          <Save size={18} /> Save permission note
        </button>
      </section>

      <section className="card admin-transfer-card">
        <div className="admin-permission-header">
          <div>
            <span className="page-eyebrow">Balance transfer</span>
            <h3>Transfer this user's account balance to Agent Admin panel</h3>
            <p>The user wallet will be deducted and the selected agent balance will increase instantly.</p>
          </div>
          <strong>{formatCurrency(user?.wallet || 0)}</strong>
        </div>

        <div className="admin-transfer-grid">
          <div className="input-group">
            <label htmlFor="transferAgent">Agent</label>
            <select
              id="transferAgent"
              value={transferForm.agentId}
              onChange={(event) => setTransferForm({ ...transferForm, agentId: event.target.value })}
            >
              <option value="">Select active agent</option>
              {agents.map((agent) => (
                <option key={agent._id || agent.agentId} value={agent.agentId}>
                  {agent.agentId} — {agent.name || 'Agent'} — {formatCurrency(agent.balance || 0)}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="transferAmount">Amount</label>
            <input
              id="transferAmount"
              type="number"
              min="1"
              value={transferForm.amount}
              onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })}
              placeholder="Amount or use Transfer all"
            />
          </div>

          <div className="input-group admin-transfer-note">
            <label htmlFor="transferNote">Transfer note optional</label>
            <input
              id="transferNote"
              value={transferForm.note}
              onChange={(event) => setTransferForm({ ...transferForm, note: event.target.value })}
              placeholder="Reason / reference"
            />
          </div>
        </div>

        <div className="admin-detail-actions">
          <button className="btn btn-primary" type="button" disabled={transferring} onClick={() => transferBalance(false)}>
            <ArrowRightLeft size={18} /> Transfer amount
          </button>
          <button className="btn btn-danger" type="button" disabled={transferring || Number(user?.wallet || 0) <= 0} onClick={() => transferBalance(true)}>
            <ArrowRightLeft size={18} /> Transfer all balance
          </button>
        </div>
      </section>

      <div className="admin-user-grid">
        <section className="card admin-detail-card">
          <h3>Account information</h3>
          <dl>
            <div><dt>Full Name</dt><dd>{user?.fullName || user?.name || '—'}</dd></div>
            <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
            <div><dt>Phone</dt><dd>{user?.phone || '—'}</dd></div>
            <div><dt>Date of birth</dt><dd>{formatDate(user?.dateOfBirth || verification?.dateOfBirth)}</dd></div>
            <div><dt>Address</dt><dd>{verification?.address || user?.address || '—'}</dd></div>
            <div><dt>Street</dt><dd>{verification?.street || user?.street || '—'}</dd></div>
            <div><dt>City</dt><dd>{verification?.city || user?.city || '—'}</dd></div>
            <div><dt>Post code</dt><dd>{verification?.postCode || user?.postCode || '—'}</dd></div>
            <div><dt>Joined</dt><dd>{formatDate(user?.createdAt)}</dd></div>
          </dl>
        </section>
        <section className="card admin-detail-card">
          <h3>Document information</h3>
          <dl>
            <div><dt>Documents Type</dt><dd>{verification?.documentType || user?.documentType || '—'}</dd></div>
            <div><dt>Document-Number</dt><dd>{verification?.documentNumber || user?.documentNumber || '—'}</dd></div>
            <div><dt>Status</dt><dd>{verificationStatus}</dd></div>
          </dl>
          <div className="input-group"><label htmlFor="adminNote">Admin note</label><textarea id="adminNote" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add review note" /></div>
          <div className="admin-detail-actions"><button className="btn btn-primary" disabled={saving} onClick={() => updateVerification('approved')}><Save size={18} /> Approve verification</button><button className="btn btn-danger" disabled={saving} onClick={() => updateVerification('rejected')}><ShieldAlert size={18} /> Reject verification</button></div>
          <div className="admin-detail-actions"><button className="btn btn-soft" disabled={saving} onClick={() => updateAccountStatus('active')}>Activate account</button><button className="btn btn-warning" disabled={saving} onClick={() => updateAccountStatus('suspended')}>Suspend account</button></div>
        </section>
      </div>
      <section className="page-stack admin-gameplay-section">
        <PageHeader
          eyebrow="Records"
          title="User game play, betting win/loss details"
          description="Casino, crash, sports, JILI and provider-wallet gameplay records returned by backend."
        />
        <div className="grid-4 admin-gameplay-summary">
          <StatCard icon={Wallet} label="Total bet" value={formatCurrency(gameplaySummary.totalBetAmount, user)} />
          <StatCard icon={BadgeCheck} label="Total win / payout" value={formatCurrency(gameplaySummary.totalWinAmount, user)} />
          <StatCard icon={ShieldAlert} label="Net win/loss" value={formatCurrency(gameplaySummary.netResult, user)} />
          <StatCard icon={FileCheck2} label="Win / Loss count" value={`${gameplaySummary.totalWins || 0} / ${gameplaySummary.totalLosses || 0}`} />
        </div>
        <GameplayRecordsTable records={gameplayRecords} user={user} />
      </section>

      <section className="page-stack"><PageHeader eyebrow="Records" title="User transactions" /><TransactionTable transactions={transactions} loading={false} /></section>
    </div>
  );
}
