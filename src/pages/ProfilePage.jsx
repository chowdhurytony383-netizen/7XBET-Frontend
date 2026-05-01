import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, Camera, FileCheck2, Mail, Phone, Save, User, Wallet } from 'lucide-react';
import { AuthAPI } from '../api/auth.js';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';
import { getDisplayEmail } from '../utils/userDisplay.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import BetTable from '../components/BetTable.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import './ProfilePage.css';

const DEFAULT_PROFILE_PICTURE = '/images/brand/7xbet-icon.svg';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState('');
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('bets');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || user?.fullName || '',
      email: getDisplayEmail(user?.email),
      phone: user?.phone || '',
    });
  }, [user]);

  useEffect(() => {
    if (!pictureFile) {
      setPicturePreview('');
      return undefined;
    }

    const nextPreview = URL.createObjectURL(pictureFile);
    setPicturePreview(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [pictureFile]);

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
      await AuthAPI.updateProfile({
        name: form.name,
        fullName: form.name,
        email: form.email,
        phone: form.phone,
      });

      if (pictureFile) {
        const formData = new FormData();
        formData.append('picture', pictureFile);
        await AuthAPI.uploadProfilePicture(formData);
        setPictureFile(null);
      }

      await refreshUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getApiError(error, 'Profile update failed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG or WEBP profile pictures are allowed');
      event.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Profile picture must be under 3MB');
      event.target.value = '';
      return;
    }

    setPictureFile(file);
  };

  const displayName = user?.fullName || user?.name || user?.username || 'Account';
  const displayEmail = getDisplayEmail(user?.email);
  const emailStatus = displayEmail ? (user?.isVerified ? 'Verified' : 'Not verified') : 'Not added';
  const verificationStatus = user?.verificationStatus || user?.kyc?.status || (user?.isVerified ? 'Verified' : 'Pending');
  const profilePicture = picturePreview || user?.picture || DEFAULT_PROFILE_PICTURE;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Account" title="Profile" description="Profile, wallet, bet and transaction details are loaded from backend routes." />
      <div className="profile-grid">
        <aside className="card profile-card">
          <img
            className="profile-avatar"
            src={profilePicture}
            alt="Account"
            onError={(event) => {
              if (event.currentTarget.src !== window.location.origin + DEFAULT_PROFILE_PICTURE) {
                event.currentTarget.src = DEFAULT_PROFILE_PICTURE;
              }
            }}
          />
          <div><h2>{displayName}</h2><p className="profile-email-text">{displayEmail || 'Email not added'}</p></div>
          <div className="profile-list">
            <div><span>Email status</span><strong>{emailStatus}</strong></div>
            <div><span>Verification</span><strong>{verificationStatus}</strong></div>
            <div><span>Wallet</span><strong>{formatCurrency(user?.wallet)}</strong></div>
            <div><span>Joined</span><strong>{formatDate(user?.createdAt)}</strong></div>
          </div>
          <Link className="btn btn-soft btn-full" to="/profile/verification"><FileCheck2 size={18} /> Verification page</Link>
          <form className="form-grid" onSubmit={updateProfile}>
            <div className="input-group"><label htmlFor="name">Full Name</label><input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="input-group"><label htmlFor="email">Email</label><input id="email" type="email" value={form.email} placeholder="Enter email address" onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="input-group"><label htmlFor="phone">Phone</label><input id="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            <div className="input-group profile-picture-field">
              <label htmlFor="profilePicture">Profile picture</label>
              <input id="profilePicture" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePictureChange} />
              <span className="profile-picture-help">
                <Camera size={16} /> {pictureFile ? pictureFile.name : 'Upload JPG, PNG or WEBP image'}
              </span>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}><Save size={18} /> {saving ? 'Saving...' : 'Save profile'}</button>
          </form>
        </aside>
        <section className="page-stack">
          <div className="grid-4">
            <StatCard icon={User} label="Name" value={displayName} />
            <StatCard icon={Mail} label="Email" value={displayEmail ? <span className="profile-email-value">{displayEmail}</span> : 'Not added'} />
            <StatCard icon={Phone} label="Phone" value={user?.phone || '—'} />
            <StatCard icon={Wallet} label="Balance" value={formatCurrency(user?.wallet)} />
          </div>
          <div className="grid-2">
            <StatCard icon={BadgeCheck} label="Email verified" value={displayEmail ? (user?.isVerified ? 'Yes' : 'No') : 'Not added'} />
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
