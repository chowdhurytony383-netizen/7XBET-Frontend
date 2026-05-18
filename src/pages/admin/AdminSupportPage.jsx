import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, ImagePlus, LifeBuoy, Paperclip, Send, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { AdminSupportAPI } from '../../api/support.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { connectRealtimeSocket } from '../../socket/realtimeSocket.js';
import './AdminSupportPage.css';

const statuses = [['', 'All'], ['open', 'Open'], ['pending', 'Pending'], ['resolved', 'Resolved'], ['closed', 'Closed']];
const acceptTypes = 'image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx';

function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFormData(fields = {}, files = []) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value ?? ''));
  files.forEach((file) => form.append('attachments', file));
  return form;
}

function FilePicker({ files, setFiles, disabled = false }) {
  const inputRef = useRef(null);

  const addFiles = (event) => {
    const next = Array.from(event.target.files || []);
    if (!next.length) return;
    setFiles((current) => [...current, ...next].slice(0, 5));
    event.target.value = '';
  };

  const removeFile = (index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div className="admin-support-file-picker">
      <input ref={inputRef} type="file" accept={acceptTypes} multiple hidden onChange={addFiles} disabled={disabled} />
      <button type="button" className="admin-support-attach-btn" onClick={() => inputRef.current?.click()} disabled={disabled}>
        <ImagePlus size={17} /> Photo / file
      </button>
      {files.length > 0 && (
        <div className="admin-support-selected-files">
          {files.map((file, index) => (
            <span key={`${file.name}-${index}`}>
              <Paperclip size={13} /> {file.name} <small>{formatFileSize(file.size)}</small>
              <button type="button" onClick={() => removeFile(index)} aria-label="Remove file"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentList({ attachments = [] }) {
  if (!attachments.length) return null;

  return (
    <div className="admin-support-attachments">
      {attachments.map((attachment, index) => {
        const isImage = attachment.isImage || String(attachment.mimeType || attachment.type || '').startsWith('image/');
        const label = attachment.originalName || attachment.name || `Attachment ${index + 1}`;
        return (
          <a key={`${attachment.url}-${index}`} className={`admin-support-attachment ${isImage ? 'image' : ''}`} href={attachment.url} target="_blank" rel="noreferrer">
            {isImage ? <img src={attachment.url} alt={label} loading="lazy" /> : <FileText size={18} />}
            <span>{label}<small>{formatFileSize(attachment.size)}</small></span>
          </a>
        );
      })}
    </div>
  );
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [filter, setFilter] = useState({ status: '', q: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);

  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket._id === selectedId), [tickets, selectedId]);

  const appendMessage = (nextMessage) => {
    if (!nextMessage?._id) return;
    setMessages((current) => current.some((msg) => msg._id === nextMessage._id) ? current : [...current, nextMessage]);
  };

  const upsertTicket = (nextTicket) => {
    if (!nextTicket?._id) return;
    setTickets((current) => {
      const exists = current.some((ticket) => ticket._id === nextTicket._id);
      const next = exists ? current.map((ticket) => ticket._id === nextTicket._id ? { ...ticket, ...nextTicket } : ticket) : [nextTicket, ...current];
      return next.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0));
    });
  };

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
    const socket = connectRealtimeSocket();
    const onMessage = (payload = {}) => {
      const ticket = payload.ticket;
      if (ticket?._id) upsertTicket(ticket);
      if (ticket?._id === selectedId && payload.message) appendMessage(payload.message);
    };

    socket.on('support:message', onMessage);
    socket.emit('support:join');

    return () => socket.off('support:message', onMessage);
  }, [selectedId]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, selectedId]);

  const search = (event) => {
    event.preventDefault();
    loadTickets();
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedId) return;
    if (!reply.trim() && replyFiles.length === 0) return;

    setSending(true);
    try {
      const response = await AdminSupportAPI.sendMessage(selectedId, buildFormData({ message: reply }, replyFiles));
      const data = response.data?.data || {};
      setReply('');
      setReplyFiles([]);
      if (data.message) appendMessage(data.message);
      if (data.ticket) upsertTicket(data.ticket);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send reply'));
    } finally {
      setSending(false);
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
      <PageHeader eyebrow="Admin" title="Live Support Inbox" description="Manage user support tickets, send photo/file attachments, and receive real-time messages without refresh." />

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

              <div className="admin-support-messages" ref={messagesRef}>
                {messages.map((message) => (
                  <article key={message._id} className={`admin-support-message ${message.senderRole === 'admin' ? 'mine' : 'theirs'}`}>
                    <div><strong>{message.senderRole === 'admin' ? 'Admin' : 'User'}</strong><small>{formatDate(message.createdAt)}</small></div>
                    {message.message && <p>{message.message}</p>}
                    <AttachmentList attachments={message.attachments || []} />
                  </article>
                ))}
              </div>

              <form className="admin-support-reply" onSubmit={sendReply}>
                <div className="admin-support-input-stack">
                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows="3" placeholder="Write support reply..." />
                  <FilePicker files={replyFiles} setFiles={setReplyFiles} disabled={sending} />
                </div>
                <button type="submit" disabled={sending || (!reply.trim() && replyFiles.length === 0)}><Send size={17} /> {sending ? 'Sending...' : 'Reply'}</button>
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
