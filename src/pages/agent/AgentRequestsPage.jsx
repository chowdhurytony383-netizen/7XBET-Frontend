import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { AgentAPI } from '../../api/agent.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import LiveAutoRefreshStatus from '../../components/LiveAutoRefreshStatus.jsx';
import useAutoRefresh from '../../hooks/useAutoRefresh.js';
import '../AgentPaymentMethods.css';

function RequestCard({ request, onAction, agentCurrency }) {
  return (
    <div className="agent-request-card">
      <div>
        <span className="page-eyebrow">{request.type} Request</span>
        <h2>{request.userName || request.user?.fullName || request.user?.name || 'User'}</h2>
        <div className="agent-request-meta">
          <span>User ID: {request.userId || request.user?.userId || '—'}</span>
          <span>Amount: {formatCurrency(request.amount, agentCurrency)}</span>
          <span>Method: {request.methodTitle || request.methodKey || 'Manual'}</span>
          <span>Channel key: {request.methodKey || '—'}</span>
          <span>Date: {formatDate(request.createdAt)}</span>
        </div>
        <div className="agent-request-note-box">
          {request.payerNumber && <span><strong>Sender Number:</strong> {request.payerNumber}</span>}
          {request.transactionRef && <span><strong>Transaction ID:</strong> {request.transactionRef}</span>}
          {(request.receiverNumber || request.accountNumber) && <span><strong>Receiving Account:</strong> {request.receiverNumber || request.accountNumber}</span>}
          {request.accountHolderName && <span><strong>Account Holder:</strong> {request.accountHolderName}</span>}
          {request.methodNumber && <span><strong>Agent Number:</strong> {request.methodNumber}</span>}
          {request.userNote && <p>{request.userNote}</p>}
        </div>
      </div>

      <div className="agent-request-actions">
        <button className="btn btn-primary" onClick={() => onAction(request._id, 'confirm')}>
          <CheckCircle2 size={18} /> Confirm
        </button>
        <button className="btn btn-danger" onClick={() => onAction(request._id, 'reject')}>
          <XCircle size={18} /> Reject
        </button>
      </div>
    </div>
  );
}

export default function AgentRequestsPage() {
  const { type = 'deposits' } = useParams();
  const [searchParams] = useSearchParams();
  const requestType = type === 'withdrawals' ? 'WITHDRAW' : 'DEPOSIT';
  const methodKey = String(searchParams.get('methodKey') || '').trim().toLowerCase();
  const channelTitle = searchParams.get('channelTitle') || '';
  const title = useMemo(() => {
    const base = requestType === 'DEPOSIT' ? 'Deposit Requests' : 'Withdraw Requests';
    return channelTitle ? `${channelTitle} · ${base}` : base;
  }, [channelTitle, requestType]);

  const [agent, setAgent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setMessage('');
    }

    try {
      const params = { type: requestType, status: 'PENDING' };
      if (methodKey) params.methodKey = methodKey;

      const [meResponse, requestResponse] = await Promise.all([
        AgentAPI.me(),
        AgentAPI.requests(params),
      ]);
      setAgent(meResponse.data?.data?.agent || meResponse.data?.agent || null);
      setRequests(requestResponse.data?.data || requestResponse.data?.requests || []);
      setMessage('');
    } catch (error) {
      if (!silent) setMessage(getApiError(error, 'Unable to load requests'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [requestType, methodKey]);

  useEffect(() => { loadData(); }, [loadData]);
  useAutoRefresh(loadData, { intervalMs: 1000 });

  const handleAction = async (requestId, action) => {
    try {
      if (action === 'confirm') {
        await AgentAPI.confirmRequest(requestId);
        toast.success(`${requestType === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} confirmed`);
      } else {
        await AgentAPI.rejectRequest(requestId);
        toast.success(`${requestType === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} rejected`);
      }
      await loadData();
    } catch (error) {
      toast.error(getApiError(error, 'Request update failed'));
    }
  };

  return (
    <div className="agent-payment-page page-stack">
      <div className="agent-payment-header">
        <div>
          <span className="page-eyebrow">Agent Admin Panel</span>
          <h1>{title}</h1>
          <p>
            {methodKey ? `Showing only requests for channel key: ${methodKey}. ` : ''}
            {requestType === 'DEPOSIT'
              ? 'Confirming a deposit credits the user wallet and deducts the amount from agent balance.'
              : 'Confirming a withdrawal marks the held user balance as paid and adds the amount to agent balance. Rejecting refunds the held balance.'}
          </p>
        </div>

        <div className="agent-header-actions">
          <Link className="btn btn-soft" to="/agent/dashboard"><ArrowLeft size={18} /> Dashboard</Link>
          <LiveAutoRefreshStatus />
        </div>
      </div>

      {agent && (
        <div className="agent-summary-card">
          <div>
            <span className="page-eyebrow">Logged Agent</span>
            <h2>{agent.agentId} — {agent.name}</h2>
          </div>
          <div className="agent-summary-balances">
            <strong>Balance {formatCurrency(agent.balance || 0, agent)}</strong>
            <strong>Commission {formatCurrency(agent.commissionBalance || 0, agent)}</strong>
          </div>
        </div>
      )}

      {message && <div className="agent-payment-message">{message}</div>}

      <div className="agent-request-list">
        {loading ? (
          <div className="agent-payment-message">Loading requests...</div>
        ) : requests.length ? (
          requests.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              onAction={handleAction}
              agentCurrency={agent}
            />
          ))
        ) : (
          <div className="agent-payment-message">No pending {requestType.toLowerCase()} requests{channelTitle ? ` for ${channelTitle}` : ''}.</div>
        )}
      </div>
    </div>
  );
}
