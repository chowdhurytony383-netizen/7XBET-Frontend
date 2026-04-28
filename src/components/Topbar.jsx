import { LogIn, Menu, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import './Topbar.css';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <header className="topbar">
        <button className="topbar-menu" onClick={onMenuClick} aria-label="Open navigation"><Menu size={22} /></button>
        <div className="topbar-spacer" />
        <Link className="btn btn-soft topbar-auth-link" to="/login"><LogIn size={17} /> Login</Link>
        <Link className="btn btn-primary topbar-auth-link" to="/register"><UserPlus size={17} /> Register</Link>
      </header>
    );
  }

  const displayName = user.fullName || user.name || user.username || user.email || 'Account';
  const verificationStatus = user.verificationStatus || user.kyc?.status || (user.isVerified ? 'Verified' : 'Pending');

  return (
    <header className="topbar">
      <button className="topbar-menu" onClick={onMenuClick} aria-label="Open navigation"><Menu size={22} /></button>
      <div className="topbar-spacer" />
      <Link className="topbar-wallet" to="/wallet">
        <span>Balance</span>
        <strong>{formatCurrency(user.wallet)}</strong>
      </Link>
      <Link className="topbar-user" to="/profile">
        <span className="topbar-avatar"><UserRound size={18} /></span>
        <span>
          <strong>{displayName}</strong>
          <small><ShieldCheck size={13} /> {verificationStatus}</small>
        </span>
      </Link>
    </header>
  );
}
