import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Cherry,
  Clock3,
  Crown,
  Dice5,
  Gamepad2,
  Globe,
  Grid2X2,
  Home,
  LayoutDashboard,
  Layers3,
  LogIn,
  LogOut,
  Medal,
  MessageCircle,
  Rocket,
  Settings,
  Shield,
  Ticket,
  Trophy,
  User,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import './Sidebar.css';

const mainNavItems = [
  { to: '/', label: 'Main page', icon: Home, end: true },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/esports', label: 'Esports', icon: Gamepad2 },
  { to: '/bet-slip', label: 'Bet slip', icon: Ticket },
  { to: '/crash', label: 'Crash', icon: Rocket },
  { to: '/live-casino', label: 'Live Casino', icon: Dice5 },
  { to: '/slots', label: 'Slots', icon: Cherry },
  { to: '/tournaments', label: 'Tournaments', icon: Medal },
  { to: '/customer-support', label: 'Customer Support', icon: MessageCircle },
];

const guestNavItems = [
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register', icon: UserPlus },
  { to: '/agent/login', label: 'Agent Login', icon: Shield },
];

const userOnlyNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { to: '/admin', label: 'Admin overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: User },
  { to: '/admin/deposits', label: 'Deposits', icon: Wallet },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: Shield },
  { to: '/admin/agents', label: 'Agent Admin', icon: Shield },
  { to: '/admin/agent-payments', label: 'Deposit Methods', icon: Wallet },
  { to: '/admin/agent-requests', label: 'Agent Requests', icon: Ticket },
];

const bonusChildren = [
  { to: '/bonuses', label: 'All bonuses' },
  { to: '/bonuses/welcome-bonus', label: 'Welcome bonus' },
  { to: '/bonuses/cashback', label: 'Cashback' },
  { to: '/bonuses/vip', label: 'VIP rewards' },
];

const otherChildren = [
  { to: '/other', label: 'All other' },
  { to: '/other/promotions', label: 'Promotions' },
  { to: '/other/faq', label: 'FAQ' },
  { to: '/other/rules', label: 'Rules' },
];

function SidebarLink({ item, onClose }) {
  const Icon = item.icon;

  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      onClick={onClose}
    >
      <span className="sidebar-link-left">
        <Icon size={20} />
        <span>{item.label}</span>
      </span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose, onLogout }) {
  const { user } = useAuth();
  const canAccessAdmin = Boolean(user?.role === 'admin' || user?.isAdmin || user?.permissions?.includes?.('admin'));
  const [openMenus, setOpenMenus] = useState({
    bonuses: false,
    other: false,
    settings: true,
    language: false,
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateText = now.toLocaleDateString('en-GB');

  return (
    <>
      <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <Logo />
        </div>

        <nav className="sidebar-nav">
          {mainNavItems.map((item) => (
            <SidebarLink key={item.to} item={item} onClose={onClose} />
          ))}

          <button type="button" className="sidebar-link sidebar-toggle" onClick={() => toggleMenu('bonuses')}>
            <span className="sidebar-link-left">
              <Crown size={20} />
              <span>Bonuses</span>
            </span>
            {openMenus.bonuses ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {openMenus.bonuses && (
            <div className="sidebar-submenu">
              {bonusChildren.map((item) => (
                <NavLink key={item.to} to={item.to} className="sidebar-sublink" onClick={onClose}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}

          <button type="button" className="sidebar-link sidebar-toggle" onClick={() => toggleMenu('other')}>
            <span className="sidebar-link-left">
              <Grid2X2 size={20} />
              <span>Other</span>
            </span>
            {openMenus.other ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {openMenus.other && (
            <div className="sidebar-submenu">
              {otherChildren.map((item) => (
                <NavLink key={item.to} to={item.to} className="sidebar-sublink" onClick={onClose}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}

          {!user && (
            <>
              <div className="sidebar-section-label">Account</div>
              {guestNavItems.map((item) => (
                <SidebarLink key={item.to} item={item} onClose={onClose} />
              ))}
            </>
          )}

          {user && (
            <>
              <div className="sidebar-section-label">Account</div>
              {userOnlyNavItems.map((item) => (
                <SidebarLink key={item.to} item={item} onClose={onClose} />
              ))}
            </>
          )}

          {canAccessAdmin && (
            <>
              <div className="sidebar-section-label">Admin</div>
              {adminNavItems.map((item) => (
                <SidebarLink key={item.to} item={item} onClose={onClose} />
              ))}
            </>
          )}

          <button type="button" className="sidebar-link sidebar-toggle" onClick={() => toggleMenu('settings')}>
            <span className="sidebar-link-left">
              <Settings size={20} />
              <span>Settings</span>
            </span>
            {openMenus.settings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {openMenus.settings && (
            <div className="sidebar-submenu settings-block">
              <div className="sidebar-setting-row">
                <span>Time zone</span>
                <span>GMT +06:00</span>
              </div>
              <label className="sidebar-setting-row">
                <span>Show bet slip at the bottom</span>
                <input type="checkbox" />
              </label>
              <div className="sidebar-setting-row">
                <span>Select odds format</span>
                <span>Decimal</span>
              </div>
              <label className="sidebar-setting-row">
                <span>Light version</span>
                <input type="checkbox" />
              </label>
              <label className="sidebar-setting-row">
                <span>Quick bet slip</span>
                <input type="checkbox" />
              </label>
              <label className="sidebar-setting-row">
                <span>Dark theme</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="sidebar-setting-row">
                <span>European view</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="sidebar-setting-row">
                <span>Asian view</span>
                <input type="checkbox" />
              </label>
            </div>
          )}

          <button type="button" className="sidebar-link sidebar-toggle" onClick={() => toggleMenu('language')}>
            <span className="sidebar-link-left">
              <Globe size={20} />
              <span>Language</span>
            </span>
            {openMenus.language ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {openMenus.language && (
            <div className="sidebar-submenu">
              <button type="button" className="sidebar-sublink sidebar-button">English</button>
              <button type="button" className="sidebar-sublink sidebar-button">বাংলা</button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer-info">
          <div className="sidebar-time-row">
            <Clock3 size={18} />
            <span>{timeText} (GMT +06:00)</span>
          </div>
          <div className="sidebar-date-text">{dateText}</div>
        </div>

        {user && (
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        )}
      </aside>

      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
    </>
  );
}