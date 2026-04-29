import {
  LogIn,
  Menu,
  ShieldCheck,
  UserPlus,
  UserRound,
  Wallet,
} from 'lucide-react';
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
          <Menu size={20} />
        </button>

        <Link className="topbar-brand" to="/">
          <span>7XBET</span>
        </Link>

        <div className="topbar-spacer" />

        <Link className="btn btn-soft topbar-auth-link" to="/login">
          <LogIn size={16} />
          <span>Login</span>
        </Link>

        <Link className="btn btn-primary topbar-auth-link" to="/register">
          <UserPlus size={16} />
          <span>Register</span>
        </Link>
      </header>
    );
  }

  const displayName =
    user.userId ||
    user.login ||
    user.fullName ||
    user.name ||
    user.username ||
    user.email ||
    'Account';

  const verificationStatus =
    user.verificationStatus ||
    user.kyc?.status ||
    (user.isVerified ? 'Verified' : 'Pending');

  return (
    <header className="topbar">
      <button
        className="topbar-menu"
        onClick={onMenuClick}
        aria-label="Open navigation"
        type="button"
      >
        <Menu size={20} />
      </button>

      <Link className="topbar-brand" to="/">
        <span>7XBET</span>
      </Link>

      <div className="topbar-spacer" />

      <Link className="topbar-balance-card" to="/wallet">
        <span className="topbar-balance-icon">
          <Wallet size={15} />
        </span>

        <span className="topbar-balance-copy">
          <small>Main Balance</small>
          <strong>{formatCurrency(user.wallet ?? 0)}</strong>
        </span>
      </Link>

      <Link className="topbar-user-card" to="/profile">
        <span className="topbar-avatar">
          <UserRound size={17} />
        </span>

        <span className="topbar-user-copy">
          <strong>User {displayName}</strong>
          <small>
            <ShieldCheck size={12} />
            {verificationStatus}
          </small>
        </span>
      </Link>
    </header>
  );
}
