import { LogIn, Menu, ShieldCheck, UserPlus, UserRound, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import './Topbar.css';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <header className="topbar">
        <button
          className="topbar-menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
          type="button"
        >
          <Menu size={22} />
        </button>

        <Link className="topbar-brand" to="/" aria-label="7XBET home">
          <span>7XBET</span>
        </Link>

        <div className="topbar-spacer" />

        <Link className="btn btn-soft topbar-auth-link" to="/login">
          <LogIn size={17} />
          Login
        </Link>

        <Link className="btn btn-primary topbar-auth-link" to="/register">
          <UserPlus size={17} />
          Register
        </Link>
      </header>
    );
  }

  const displayName =
    user.fullName || user.name || user.username || user.email || 'Account';

  const verificationStatus =
    user.verificationStatus ||
    user.kyc?.status ||
    (user.isVerified ? 'Verified' : 'Pending');

  return (
    <header className="topbar topbar-logged-in">
      <button
        className="topbar-menu"
        onClick={onMenuClick}
        aria-label="Open navigation"
        type="button"
      >
        <Menu size={22} />
      </button>

      <Link className="topbar-brand" to="/" aria-label="7XBET home">
        <span>7XBET</span>
      </Link>

      <div className="topbar-spacer" />

      <Link className="topbar-wallet" to="/wallet" aria-label="Main balance">
        <span className="topbar-wallet-icon">
          <Wallet size={16} />
        </span>

        <span className="topbar-wallet-text">
          <small>Main Balance</small>
          <strong>{formatCurrency(user.wallet)}</strong>
        </span>
      </Link>

      <Link className="topbar-user" to="/profile" aria-label="Profile">
        <span className="topbar-avatar">
          <UserRound size={18} />
        </span>

        <span className="topbar-user-meta">
          <strong>{displayName}</strong>
          <small>
            <ShieldCheck size={13} />
            {verificationStatus}
          </small>
        </span>
      </Link>
    </header>
  );
}
