import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, ImagePlus, LifeBuoy, MessageCircle, Paperclip, Plus, Send, X } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { getApiError } from '../api/client.js';
import { SupportAPI } from '../api/support.js';
import { formatDate } from '../utils/format.js';
import { connectRealtimeSocket } from '../socket/realtimeSocket.js';
import './SupportPage.css';

const categories = [
  ['general', 'General'], ['deposit', 'Deposit'], ['withdraw', 'Withdraw'], ['bonus', 'Bonus'],
  ['game', 'Game'], ['affiliate', 'Affiliate'], ['account', 'Account'], ['technical', 'Technical'], ['other', 'Other'],
];

const acceptTypes = 'image/*,application/pdf,text/plain,.doc,.docx,.xls,.xlsx';

function ticketTitle(ticket) {
  return ticket?.subject || ticket?.ticketNo || 'Support ticket';
}

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

function FilePicker({ files, setFiles, disabled = false, idPrefix }) {
  const inputRef = useRef(null);

  const addFiles = (event) => {
    const next = Array.from(event.target.files || []);
    if (!next.length) return;
    setFiles((current) => [...current, ...next].slice(0, 5));
    event.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="support-file-picker">
      <input ref={inputRef} id={`${idPrefix}-files`} type="file" accept={acceptTypes} multiple hidden onChange={addFiles} disabled={disabled} />
      <button type="button" className="support-attach-btn" onClick={() => inputRef.current?.click()} disabled={disabled}>
        <ImagePlus size={17} /> Photo / file
      </button>
      {files.length > 0 && (
        <div className="support-selected-files">
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
    <div className="support-attachments">
      {attachments.map((attachment, index) => {
        const isImage = attachment.isImage || String(attachment.mimeType || attachment.type || '').startsWith('image/');
        const label = attachment.originalName || attachment.name || `Attachment ${index + 1}`;
        return (
          <a key={`${attachment.url}-${index}`} className={`support-attachment ${isImage ? 'image' : ''}`} href={attachment.url} target="_blank" rel="noreferrer">
            {isImage ? <img src={attachment.url} alt={label} loading="lazy" /> : <FileText size={18} />}
            <span>{label}<small>{formatFileSize(attachment.size)}</small></span>
          </a>
        );
      })}
    </div>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'general', message: '' });
  const [creating, setCreating] = useState(false);
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

  const createTicket = async (event) => {
    event.preventDefault();
    if (!newTicket.subject.trim()) return toast.error('Subject is required');
    if (!newTicket.message.trim() && newFiles.length === 0) return toast.error('Message or attachment is required');

    setCreating(true);
    try {
      const response = await SupportAPI.create(buildFormData(newTicket, newFiles));
      const ticket = response.data?.data;
      toast.success('Support ticket created');
      setNewTicket({ subject: '', category: 'general', message: '' });
      setNewFiles([]);
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
    if (!selectedId) return;
    if (!reply.trim() && replyFiles.length === 0) return;

    setSending(true);
    try {
      const response = await SupportAPI.sendMessage(selectedId, buildFormData({ message: reply }, replyFiles));
      const data = response.data?.data || {};
      setReply('');
      setReplyFiles([]);
      if (data.message) appendMessage(data.message);
      if (data.ticket) upsertTicket(data.ticket);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send message'));
    } finally {
      setSending(false);
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
      <PageHeader eyebrow="Live Support" title="Support Center" description="Chat with the 7XBET support team in real time and send screenshots, photos, PDFs, or documents." />

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

              <div className="support-messages" ref={messagesRef}>
                {messages.map((message) => (
                  <article key={message._id} className={`support-message ${message.senderRole === 'user' ? 'mine' : 'theirs'}`}>
                    <div>
                      <strong>{message.senderRole === 'user' ? 'You' : '7XBET Support'}</strong>
                      <small>{formatDate(message.createdAt)}</small>
                    </div>
                    {message.message && <p>{message.message}</p>}
                    <AttachmentList attachments={message.attachments || []} />
                  </article>
                ))}
              </div>

              <form className="support-reply-form" onSubmit={sendReply}>
                <div className="support-input-stack">
                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write your message..." rows="3" />
                  <FilePicker idPrefix="reply" files={replyFiles} setFiles={setReplyFiles} disabled={sending} />
                </div>
                <button type="submit" disabled={sending || (!reply.trim() && replyFiles.length === 0)}><Send size={17} /> {sending ? 'Sending...' : 'Send'}</button>
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
          <FilePicker idPrefix="new-ticket" files={newFiles} setFiles={setNewFiles} disabled={creating} />
          <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create ticket'}</button>
        </form>
      </section>
    </main>
  );
}
