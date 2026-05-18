import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LifeBuoy, MessageCircle, Plus, Send } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { getApiError } from '../api/client.js';
import { SupportAPI } from '../api/support.js';
import { formatDate } from '../utils/format.js';
import { getRealtimeSocket } from '../socket/realtimeSocket.js';
import './SupportPage.css';

const categories = [
  ['general', 'General'], ['deposit', 'Deposit'], ['withdraw', 'Withdraw'], ['bonus', 'Bonus'],
  ['game', 'Game'], ['affiliate', 'Affiliate'], ['account', 'Account'], ['technical', 'Technical'], ['other', 'Other'],
];

function ticketTitle(ticket) {
  return ticket?.subject || ticket?.ticketNo || 'Support ticket';
}

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'general', message: '' });
  const [creating, setCreating] = useState(false);

  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket._id === selectedId), [tickets, selectedId]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await SupportAPI.list();
      const list = response.data?.data || [];
      setTickets(list);
      if (!selectedId && list[0]?._id) setSelectedId(list[0]._id);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load support tickets'));
    } finally {
      setLoading(false);
    }
  };

  const loadTicket = async (ticketId) => {
    if (!ticketId) return;
    try {
      const response = await SupportAPI.get(ticketId);
      const data = response.data?.data || {};
      setMessages(data.messages || []);
      setTickets((current) => current.map((ticket) => ticket._id === ticketId ? { ...ticket, ...data.ticket, unreadForUser: 0 } : ticket));
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load support conversation'));
    }
  };

  useEffect(() => { loadTickets(); }, []);
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

  const createTicket = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await SupportAPI.create(newTicket);
      const ticket = response.data?.data;
      toast.success('Support ticket created');
      setNewTicket({ subject: '', category: 'general', message: '' });
      await loadTickets();
      if (ticket?._id) setSelectedId(ticket._id);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to create support ticket'));
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    try {
      const response = await SupportAPI.sendMessage(selectedId, { message: reply });
      const data = response.data?.data || {};
      setReply('');
      if (data.message) setMessages((current) => [...current, data.message]);
      if (data.ticket) setTickets((current) => current.map((ticket) => ticket._id === selectedId ? { ...ticket, ...data.ticket } : ticket));
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send message'));
    }
  };

  const closeTicket = async () => {
    if (!selectedId) return;
    try {
      const response = await SupportAPI.updateStatus(selectedId, { status: 'resolved' });
      const ticket = response.data?.data;
      setTickets((current) => current.map((item) => item._id === selectedId ? { ...item, ...ticket } : item));
      toast.success('Ticket marked as resolved');
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update ticket'));
    }
  };

  return (
    <main className="support-page">
      <PageHeader eyebrow="Live Support" title="Support Center" description="Chat with the 7XBET support team, track ticket status, and receive real-time replies." />

      <section className="support-layout">
        <aside className="support-sidebar-panel">
          <div className="support-panel-head">
            <strong>My tickets</strong>
            <span>{tickets.length}</span>
          </div>
          <div className="support-ticket-list">
            {tickets.map((ticket) => (
              <button key={ticket._id} type="button" className={`support-ticket-item ${ticket._id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(ticket._id)}>
                <span className={`support-status ${ticket.status}`}>{ticket.status}</span>
                <strong>{ticketTitle(ticket)}</strong>
                <small>{ticket.ticketNo} · {formatDate(ticket.lastMessageAt)}</small>
                <p>{ticket.lastMessage}</p>
                {ticket.unreadForUser > 0 && <em>{ticket.unreadForUser}</em>}
              </button>
            ))}
            {!loading && tickets.length === 0 && <div className="support-empty"><LifeBuoy size={22} /> No tickets yet.</div>}
          </div>
        </aside>

        <section className="support-chat-panel">
          {selectedTicket ? (
            <>
              <div className="support-chat-head">
                <div>
                  <span className={`support-status ${selectedTicket.status}`}>{selectedTicket.status}</span>
                  <h2>{ticketTitle(selectedTicket)}</h2>
                  <p>{selectedTicket.ticketNo} · {selectedTicket.category}</p>
                </div>
                <button type="button" onClick={closeTicket}>Mark resolved</button>
              </div>

              <div className="support-messages">
                {messages.map((message) => (
                  <article key={message._id} className={`support-message ${message.senderRole === 'user' ? 'mine' : 'theirs'}`}>
                    <div>
                      <strong>{message.senderRole === 'user' ? 'You' : '7XBET Support'}</strong>
                      <small>{formatDate(message.createdAt)}</small>
                    </div>
                    <p>{message.message}</p>
                  </article>
                ))}
              </div>

              <form className="support-reply-form" onSubmit={sendReply}>
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write your message..." rows="3" />
                <button type="submit"><Send size={17} /> Send</button>
              </form>
            </>
          ) : (
            <div className="support-empty large"><MessageCircle size={36} /> Select a ticket or create a new one.</div>
          )}
        </section>
      </section>

      <section className="support-create-card">
        <div className="support-panel-head"><strong><Plus size={18} /> Create new ticket</strong></div>
        <form onSubmit={createTicket}>
          <div className="support-form-grid">
            <label>Subject<input value={newTicket.subject} onChange={(event) => setNewTicket((current) => ({ ...current, subject: event.target.value }))} placeholder="Example: Deposit not credited" /></label>
            <label>Category<select value={newTicket.category} onChange={(event) => setNewTicket((current) => ({ ...current, category: event.target.value }))}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <label>Message<textarea value={newTicket.message} onChange={(event) => setNewTicket((current) => ({ ...current, message: event.target.value }))} rows="5" placeholder="Describe your issue clearly..." /></label>
          <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create ticket'}</button>
        </form>
      </section>
    </main>
  );
}
