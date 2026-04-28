import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, FileCheck2, Mail, Phone, Save, User, Wallet } from 'lucide-react';
import { AuthAPI } from '../api/auth.js';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import BetTable from '../components/BetTable.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', picture: '' });
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('bets');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: user?.name || user?.fullName || '', phone: user?.phone || '', picture: user?.picture || '' });
  }, [user]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [betsResponse, transactionsResponse] = await Promise.all([AccountAPI.bets(), AccountAPI.transactions()]);
        if (!active) return;
        setBets(betsResponse.data?.data || betsResponse.data?.bets || []);
        setTransactions(transactionsResponse.data?.data || transactionsResponse.data?.transactions || []);
      } catch (error) {
        toast.error(getApiError(error, 'Unable to load profile records'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const updateProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await AuthAPI.updateProfile(form);
      await refreshUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getApiError(error, 'Profile update failed'));
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.fullName || user?.name || user?.username || 'Account';
  const verificationStatus = user?.verificationStatus || user?.kyc?.status || (user?.isVerified ? 'Verified' : 'Pending');

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Account" title="Profile" description="Profile, wallet, bet and transaction details are loaded from backend routes." />
      <div className="profile-grid">
        <aside className="card profile-card">
          <img className="profile-avatar" src={user?.picture || '/images/others/logo.svg'} alt="Account" />
          <div><h2>{displayName}</h2><p>{user?.email || '—'}</p></div>
          <div className="profile-list">
            <div><span>Email status</span><strong>{user?.isVerified ? 'Verified' : 'Not verified'}</strong></div>
            <div><span>Verification</span><strong>{verificationStatus}</strong></div>
            <div><span>Wallet</span><strong>{formatCurrency(user?.wallet)}</strong></div>
            <div><span>Joined</span><strong>{formatDate(user?.createdAt)}</strong></div>
          </div>
          <Link className="btn btn-soft btn-full" to="/profile/verification"><FileCheck2 size={18} /> Verification page</Link>
          <form className="form-grid" onSubmit={updateProfile}>
            <div className="input-group"><label htmlFor="name">Full Name</label><input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="input-group"><label htmlFor="phone">Phone</label><input id="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            <div className="input-group"><label htmlFor="picture">Picture URL</label><input id="picture" value={form.picture} onChange={(event) => setForm({ ...form, picture: event.target.value })} /></div>
            <button className="btn btn-primary" type="submit" disabled={saving}><Save size={18} /> {saving ? 'Saving...' : 'Save profile'}</button>
          </form>
        </aside>
        <section className="page-stack">
          <div className="grid-4">
            <StatCard icon={User} label="Name" value={displayName} />
            <StatCard icon={Mail} label="Email" value={user?.email || '—'} />
            <StatCard icon={Phone} label="Phone" value={user?.phone || '—'} />
            <StatCard icon={Wallet} label="Balance" value={formatCurrency(user?.wallet)} />
          </div>
          <div className="grid-2">
            <StatCard icon={BadgeCheck} label="Email verified" value={user?.isVerified ? 'Yes' : 'No'} />
            <StatCard icon={FileCheck2} label="Identity verification" value={verificationStatus} />
          </div>
          <div className="profile-tabs">
            <button className={`btn ${tab === 'bets' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setTab('bets')}>Bets</button>
            <button className={`btn ${tab === 'transactions' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setTab('transactions')}>Transactions</button>
          </div>
          {tab === 'bets' ? <BetTable bets={bets} loading={loading} /> : <TransactionTable transactions={transactions} loading={loading} />}
        </section>
      </div>
    </div>
  );
}
