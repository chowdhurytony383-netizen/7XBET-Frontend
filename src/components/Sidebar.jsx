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
  Gift,
  Grid2X2,
  Home,
  LayoutDashboard,
  Handshake,
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
  Share2,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { applySiteLanguage, initGoogleTranslate, reapplySavedSiteLanguage } from '../utils/googleTranslate.js';
import { DEFAULT_SITE_LANGUAGE, SITE_LANGUAGES, getSavedSiteLanguage } from '../utils/languages.js';
import Logo from './Logo.jsx';
import './Sidebar.css';

const TIMEZONE_STORAGE_KEY = '7xbet_selected_timezone';

const DEFAULT_TIMEZONE = 'UTC';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC / GMT +00:00' },
  { value: 'Asia/Dhaka', label: 'Bangladesh — GMT +06:00' },
  { value: 'Asia/Kolkata', label: 'India — GMT +05:30' },
  { value: 'Asia/Karachi', label: 'Pakistan — GMT +05:00' },
  { value: 'Asia/Kathmandu', label: 'Nepal — GMT +05:45' },
  { value: 'Asia/Colombo', label: 'Sri Lanka — GMT +05:30' },
  { value: 'Asia/Manila', label: 'Philippines — GMT +08:00' },
  { value: 'Asia/Bangkok', label: 'Thailand — GMT +07:00' },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia — GMT +08:00' },
  { value: 'Asia/Jakarta', label: 'Indonesia — GMT +07:00' },
  { value: 'Asia/Dubai', label: 'UAE — GMT +04:00' },
  { value: 'Europe/London', label: 'United Kingdom — GMT/BST' },
  { value: 'Europe/Paris', label: 'Europe Central — GMT +01:00/+02:00' },
  { value: 'America/New_York', label: 'New York — GMT -05:00/-04:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles — GMT -08:00/-07:00' },
];

const getSavedTimezone = () => {
  try {
    return localStorage.getItem(TIMEZONE_STORAGE_KEY) || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const getTimezoneLabel = (timezone) => {
  const found = TIMEZONE_OPTIONS.find((item) => item.value === timezone);
  return found?.label || 'UTC / GMT +00:00';
};

const formatTimeInTimezone = (date, timezone) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
};

const formatDateInTimezone = (date, timezone) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }
};

const mainNavItems = [
  { to: '/', label: 'Main page', icon: Home, end: true },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/esports', label: 'Esports', icon: Gamepad2 },
  { to: '/bet-slip', label: 'Bet slip', icon: Ticket },
  { to: '/crash', label: 'Crash', icon: Rocket },
  { to: '/crash-native', label: 'Crush Rock', icon: Rocket },
  { to: '/jili-games?category=casino', label: 'Live Casino', icon: Dice5 },
  { to: '/jili-games?category=slots', label: 'Slots', icon: Cherry },
  { to: '/jili-games', label: 'JILI Games', icon: Cherry },
  { to: '/pgsoft-games', label: 'PG SOFT', icon: Sparkles },
  { to: '/tournaments', label: 'Tournaments', icon: Medal },
  { to: '/customer-support', label: 'Customer Support', icon: MessageCircle },
  { to: '/live-support', label: 'Live Support', icon: MessageCircle },
];

const guestNavItems = [
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register', icon: UserPlus },
];

const userOnlyNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/free-spin', label: 'Lucky Wheel', icon: Gift },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/profile/invite', label: 'My Invite', icon: Share2 },
  { to: '/affiliate/dashboard', label: 'Affiliate', icon: Handshake },
];

const adminNavItems = [
  { to: '/admin', label: 'Admin overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: User },
  { to: '/admin/deposits', label: 'Deposits', icon: Wallet },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: Shield },
  { to: '/admin/agents', label: 'Agent Admin', icon: Shield },
  { to: '/admin/agent-payments', label: 'Deposit Methods', icon: Wallet },
  { to: '/admin/agent-requests', label: 'Agent Requests', icon: Ticket },
  { to: '/admin/affiliates', label: 'Affiliates', icon: Handshake },
  { to: '/live-support', label: 'Live Support', icon: MessageCircle },
];

const bonusChildren = [
  { to: '/bonuses', label: 'All bonuses' },
  { to: '/bonuses/cashback', label: 'Cashback' },
  { to: '/bonuses/vip', label: 'VIP rewards' },
  { to: '/bonuses/free-spin', label: 'Free spin' },
];

const otherChildren = [
  { to: '/other', label: 'All other' },
  { to: '/other/promotions', label: 'Promotions' },
  { to: '/other/faq', label: 'FAQ' },
  { to: '/other/rules', label: 'Rules' },
];

function SidebarLink({ item, onClose }) {
  const Icon = item.icon;
  const location = useLocation();
  const itemUrl = typeof item.to === 'string' ? item.to : '';
  const currentUrl = `${location.pathname}${location.search}`;
  const hasSearchTarget = itemUrl.includes('?');

  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) => {
        const linkIsActive = hasSearchTarget ? currentUrl === itemUrl : isActive;
        return `sidebar-link ${linkIsActive ? 'active' : ''}`;
      }}
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
  const location = useLocation();

  const canAccessAdmin = Boolean(
    user?.role === 'admin' ||
      user?.isAdmin ||
      user?.permissions?.includes?.('admin')
  );

  const [openMenus, setOpenMenus] = useState({
    bonuses: false,
    other: false,
    settings: true,
  });

  const [now, setNow] = useState(() => new Date());
  const [selectedLanguage, setSelectedLanguage] = useState(() => getSavedSiteLanguage());
  const [selectedTimezone, setSelectedTimezone] = useState(() => getSavedTimezone());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    initGoogleTranslate().then(() => reapplySavedSiteLanguage());
  }, []);

  useEffect(() => {
    reapplySavedSiteLanguage();
  }, [location.pathname]);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLanguageChange = async (event) => {
    const nextLanguage = event.target.value || DEFAULT_SITE_LANGUAGE;
    setSelectedLanguage(nextLanguage);
    await applySiteLanguage(nextLanguage, { reloadIfNeeded: true });
  };

  const handleTimezoneChange = (event) => {
    const nextTimezone = event.target.value || DEFAULT_TIMEZONE;
    setSelectedTimezone(nextTimezone);

    try {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, nextTimezone);
    } catch {
      // Ignore localStorage write errors.
    }
  };

  const timeText = useMemo(
    () => formatTimeInTimezone(now, selectedTimezone),
    [now, selectedTimezone]
  );

  const dateText = useMemo(
    () => formatDateInTimezone(now, selectedTimezone),
    [now, selectedTimezone]
  );

  const timezoneLabel = getTimezoneLabel(selectedTimezone);

  return (
    <>
      <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <Logo />
        </div>

        <nav className="sidebar-nav">
          {canAccessAdmin ? (
            <>
              <div className="sidebar-section-label">Main Admin Panel</div>

              {adminNavItems.map((item) => (
                <SidebarLink key={item.to} item={item} onClose={onClose} />
              ))}

              <button
                type="button"
                className="sidebar-link sidebar-toggle"
                onClick={() => toggleMenu('settings')}
              >
                <span className="sidebar-link-left">
                  <Settings size={20} />
                  <span>Settings</span>
                </span>
                {openMenus.settings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openMenus.settings && (
                <div className="sidebar-submenu settings-block">
                  <label className="sidebar-setting-control">
                    <span className="sidebar-setting-control-label">Time zone</span>
                    <select
                      className="language-select"
                      value={selectedTimezone}
                      onChange={handleTimezoneChange}
                    >
                      {TIMEZONE_OPTIONS.map((timezone) => (
                        <option key={timezone.value} value={timezone.value}>
                          {timezone.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label
                    className="language-select-label"
                    htmlFor="site-language-select-admin"
                  >
                    Language
                  </label>

                  <select
                    id="site-language-select-admin"
                    className="language-select"
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                  >
                    {SITE_LANGUAGES.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <>
              {mainNavItems.map((item) => (
                <SidebarLink key={item.to} item={item} onClose={onClose} />
              ))}

              <button
                type="button"
                className="sidebar-link sidebar-toggle"
                onClick={() => toggleMenu('bonuses')}
              >
                <span className="sidebar-link-left">
                  <Crown size={20} />
                  <span>Bonuses</span>
                </span>
                {openMenus.bonuses ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openMenus.bonuses && (
                <div className="sidebar-submenu">
                  {bonusChildren.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="sidebar-sublink"
                      onClick={onClose}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="sidebar-link sidebar-toggle"
                onClick={() => toggleMenu('other')}
              >
                <span className="sidebar-link-left">
                  <Grid2X2 size={20} />
                  <span>Other</span>
                </span>
                {openMenus.other ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openMenus.other && (
                <div className="sidebar-submenu">
                  {otherChildren.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="sidebar-sublink"
                      onClick={onClose}
                    >
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

              <button
                type="button"
                className="sidebar-link sidebar-toggle"
                onClick={() => toggleMenu('settings')}
              >
                <span className="sidebar-link-left">
                  <Settings size={20} />
                  <span>Settings</span>
                </span>
                {openMenus.settings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openMenus.settings && (
                <div className="sidebar-submenu settings-block">
                  <label className="sidebar-setting-control">
                    <span className="sidebar-setting-control-label">Time zone</span>
                    <select
                      className="language-select"
                      value={selectedTimezone}
                      onChange={handleTimezoneChange}
                    >
                      {TIMEZONE_OPTIONS.map((timezone) => (
                        <option key={timezone.value} value={timezone.value}>
                          {timezone.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="language-select-label" htmlFor="site-language-select">
                    Language
                  </label>

                  <select
                    id="site-language-select"
                    className="language-select"
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                  >
                    {SITE_LANGUAGES.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer-info">
          <div className="sidebar-time-row">
            <Clock3 size={18} />
            <span>
              {timeText} ({timezoneLabel})
            </span>
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

      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
    </>
  );
}