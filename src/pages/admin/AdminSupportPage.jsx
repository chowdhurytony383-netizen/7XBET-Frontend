import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LifeBuoy, Send } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { AdminSupportAPI } from '../../api/support.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { getRealtimeSocket } from '../../socket/realtimeSocket.js';
import './AdminSupportPage.css';

const statuses = [['', 'All'], ['open', 'Open'], ['pending', 'Pending'], ['resolved', 'Resolved'], ['closed', 'Closed']];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState({ status: '', q: '' });
  const [loading, setLoading] = useState(true);

  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket._id === selectedId), [tickets, selectedId]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = { ...filter };
      if (!params.status) delete params.status;
      if (!params.q) delete params.q;
      const response = await AdminSupportAPI.list(params);
      const list = response.data?.data || [];
      setTickets(list);
      if (!selectedId && list[0]?._id) setSelectedId(list[0]._id);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load support inbox'));
    } finally {
      setLoading(false);
    }
  };

  const loadTicket = async (ticketId) => {
    if (!ticketId) return;
    try {
      const response = await AdminSupportAPI.get(ticketId);
      const data = response.data?.data || {};
      setMessages(data.messages || []);
      setTickets((current) => current.map((ticket) => ticket._id === ticketId ? { ...ticket, ...data.ticket, unreadForAdmin: 0 } : ticket));
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load ticket'));
    }
  };

  useEffect(() => { loadTickets(); }, [filter.status]);
  useEffect(() => { loadTicket(selectedId); }, [selectedId]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onMessage = (payload = {}) => {
      const ticket = payload.ticket;
      if (ticket?._id) {
        setTickets((current) => {
          const exists = current.some((item) => item._id === ticket._id);
          const next = exists ? current.map((item) => item._id === ticket._id ? { ...item, ...ticket } : item) : [ticket, ...current];
          return next.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));
        });
      }
      if (ticket?._id === selectedId && payload.message) {
        setMessages((current) => current.some((msg) => msg._id === payload.message._id) ? current : [...current, payload.message]);
      }
    };
    socket.on('support:message', onMessage);
    if (!socket.connected) socket.connect();
    return () => socket.off('support:message', onMessage);
  }, [selectedId]);

  const search = (event) => {
    event.preventDefault();
    loadTickets();
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    try {
      const response = await AdminSupportAPI.sendMessage(selectedId, { message: reply });
      const data = response.data?.data || {};
      setReply('');
      if (data.message) setMessages((current) => [...current, data.message]);
      if (data.ticket) setTickets((current) => current.map((ticket) => ticket._id === selectedId ? { ...ticket, ...data.ticket } : ticket));
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send reply'));
    }
  };

  const updateStatus = async (status) => {
    if (!selectedId) return;
    try {
      const response = await AdminSupportAPI.updateStatus(selectedId, { status, assignToMe: true });
      const ticket = response.data?.data;
      setTickets((current) => current.map((item) => item._id === selectedId ? { ...item, ...ticket } : item));
      toast.success(`Ticket ${status}`);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update ticket'));
    }
  };

  return (
    <main className="admin-support-page">
      <PageHeader eyebrow="Admin" title="Live Support Inbox" description="Manage user support tickets, reply in real time, and track unread conversations." />

      <form className="admin-support-filter" onSubmit={search}>
        <label>Status<select value={filter.status} onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value }))}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Search<input value={filter.q} onChange={(event) => setFilter((current) => ({ ...current, q: event.target.value }))} placeholder="Ticket no, subject, message" /></label>
        <button type="submit">Search</button>
      </form>

      <section className="admin-support-layout">
        <aside className="admin-support-list-panel">
          <div className="admin-support-panel-head"><strong>Tickets</strong><span>{tickets.length}</span></div>
          <div className="admin-support-ticket-list">
            {tickets.map((ticket) => (
              <button key={ticket._id} type="button" className={`admin-support-ticket ${ticket._id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(ticket._id)}>
                <div><span className={`admin-support-status ${ticket.status}`}>{ticket.status}</span>{ticket.unreadForAdmin > 0 && <em>{ticket.unreadForAdmin}</em>}</div>
                <strong>{ticket.subject}</strong>
                <small>{ticket.ticketNo} · {ticket.user?.userId || ticket.user?.email || 'User'} · {formatDate(ticket.lastMessageAt)}</small>
                <p>{ticket.lastMessage}</p>
              </button>
            ))}
            {!loading && tickets.length === 0 && <div className="admin-support-empty"><LifeBuoy size={24} /> No tickets found.</div>}
          </div>
        </aside>

        <section className="admin-support-chat-panel">
          {selectedTicket ? (
            <>
              <div className="admin-support-chat-head">
                <div>
                  <span className={`admin-support-status ${selectedTicket.status}`}>{selectedTicket.status}</span>
                  <h2>{selectedTicket.subject}</h2>
                  <p>{selectedTicket.ticketNo} · {selectedTicket.category} · {selectedTicket.user?.email}</p>
                  <small>Wallet: {formatCurrency(selectedTicket.user?.wallet || 0, selectedTicket.user?.currency || 'BDT')} · User ID: {selectedTicket.user?.userId || 'N/A'}</small>
                </div>
                <div className="admin-support-actions">
                  <button type="button" onClick={() => updateStatus('open')}>Open</button>
                  <button type="button" onClick={() => updateStatus('pending')}>Pending</button>
                  <button type="button" onClick={() => updateStatus('resolved')}>Resolve</button>
                  <button type="button" onClick={() => updateStatus('closed')}>Close</button>
                </div>
              </div>

              <div className="admin-support-messages">
                {messages.map((message) => (
                  <article key={message._id} className={`admin-support-message ${message.senderRole === 'admin' ? 'mine' : 'theirs'}`}>
                    <div><strong>{message.senderRole === 'admin' ? 'Admin' : 'User'}</strong><small>{formatDate(message.createdAt)}</small></div>
                    <p>{message.message}</p>
                  </article>
                ))}
              </div>

              <form className="admin-support-reply" onSubmit={sendReply}>
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows="3" placeholder="Write support reply..." />
                <button type="submit"><Send size={17} /> Reply</button>
              </form>
            </>
          ) : (
            <div className="admin-support-empty large"><LifeBuoy size={36} /> Select a ticket.</div>
          )}
        </section>
      </section>
    </main>
  );
}
