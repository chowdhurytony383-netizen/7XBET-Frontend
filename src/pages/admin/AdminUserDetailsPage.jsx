import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, FileCheck2, RefreshCw, Save, ShieldAlert, User, Wallet } from 'lucide-react';
import { AdminAPI } from '../../api/admin.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import BetTable from '../../components/BetTable.jsx';
import TransactionTable from '../../components/TransactionTable.jsx';
import './AdminUserDetailsPage.css';

export default function AdminUserDetailsPage() {
  const { userId } = useParams();
  const [record, setRecord] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await AdminAPI.userDetails(userId);
      const data = response.data?.data || response.data || null;
      setRecord(data);
      setNote(data?.adminNote || data?.user?.adminNote || '');
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

  if (loading) return <div className="page-stack"><div className="card admin-user-loading"><div className="loader" /></div></div>;

  return (
    <div className="page-stack admin-user-details-page">
      <PageHeader eyebrow="Admin panel" title={user?.fullName || user?.name || user?.email || 'User details'} description="Review identity, wallet, bet and transaction information returned by backend." actions={<button className="btn btn-soft" onClick={load}><RefreshCw size={18} /> Refresh</button>} />
      {error && <div className="auth-message">{error}</div>}
      <div className="grid-4">
        <StatCard icon={User} label="Email" value={user?.email || '—'} />
        <StatCard icon={Wallet} label="Wallet" value={formatCurrency(user?.wallet)} />
        <StatCard icon={BadgeCheck} label="Email verified" value={user?.isVerified ? 'Yes' : 'No'} />
        <StatCard icon={FileCheck2} label="Verification" value={verificationStatus} />
      </div>
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
      <section className="page-stack"><PageHeader eyebrow="Records" title="User bets" /><BetTable bets={bets} loading={false} /></section>
      <section className="page-stack"><PageHeader eyebrow="Records" title="User transactions" /><TransactionTable transactions={transactions} loading={false} /></section>
    </div>
  );
}
