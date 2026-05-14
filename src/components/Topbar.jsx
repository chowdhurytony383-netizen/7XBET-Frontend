import { LogIn, Menu, ShieldCheck, UserPlus, UserRound, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import Logo from './Logo.jsx';
import './Topbar.css';

function getDisplayName(user) {
  if (!user) return 'User';
  if (user.fullName || user.name || user.username) return user.fullName || user.name || user.username;
  const generatedId = user.userId || user.login;
  if (generatedId) return `User ${generatedId}`;
  return user.email || 'User';
}

function getVerificationStatus(user) {
  if (!user) return '';
  return 'No KYC required';
}

function TopbarBrand() {
  return <Logo className="topbar-brand" />;
}

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <header className="topbar">
        <button className="topbar-menu" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={22} />
        </button>

        <TopbarBrand />

        <div className="topbar-spacer" />

        <Link className="btn btn-soft topbar-auth-link" to="/login">
          <LogIn size={17} /> Login
        </Link>

        <Link className="btn btn-primary topbar-auth-link" to="/register">
          <UserPlus size={17} /> Register
        </Link>
      </header>
    );
  }

  const displayName = getDisplayName(user);
  const verificationStatus = getVerificationStatus(user);

  return (
    <header className="topbar topbar-logged-in">
      <button className="topbar-menu" onClick={onMenuClick} aria-label="Open navigation">
        <Menu size={22} />
      </button>

      <TopbarBrand />

      <div className="topbar-spacer" />

      <Link className="topbar-wallet" to="/wallet" aria-label="Main balance">
        <span className="topbar-wallet-icon"><WalletCards size={16} /></span>
        <span className="topbar-wallet-text">
          <small>Main Balance</small>
          <strong>{formatCurrency(user.wallet)}</strong>
        </span>
      </Link>

      <Link className="topbar-user" to="/profile" aria-label="Profile">
        <span className="topbar-avatar"><UserRound size={18} /></span>
        <span className="topbar-user-info">
          <strong>{displayName}</strong>
          <small><ShieldCheck size={13} /> {verificationStatus}</small>
        </span>
      </Link>
    </header>
  );
}
