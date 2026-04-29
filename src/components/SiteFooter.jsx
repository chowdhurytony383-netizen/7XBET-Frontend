import { Link } from 'react-router-dom';
import './SiteFooter.css';

const footerColumns = [
  {
    title: '7XBET',
    links: [
      ['Careers', '/other/careers'],
      ['About us', '/other/about'],
      ['Terms and Conditions', '/other/terms'],
      ['Contacts', '/customer-support'],
      ['Affiliate Program', '/other/affiliate'],
      ['Terms of Service', '/other/terms-of-service'],
      ['Bet Acceptance Rules', '/other/bet-rules'],
      ['Self-Exclusion', '/other/self-exclusion'],
      ['Dispute resolution', '/other/dispute'],
      ['Accounts, Payouts & Bonuses', '/other/accounts-payouts-bonuses'],
      ['Privacy & Management of Personal Data', '/other/privacy'],
      ['Anti-Money Laundering', '/other/aml'],
      ['KYC Policies', '/other/kyc'],
      ['Responsible Gambling', '/other/responsible-gambling'],
    ],
  },
  {
    title: 'Products',
    links: [
      ['Sports', '/sports'],
      ['Esports', '/esports'],
      ['Live Casino', '/live-casino'],
      ['Slots', '/slots'],

    ],
  },
  {
    title: 'Live',
    links: [
      ['Live', '/sports/live'],
      ['Multi-LIVE', '/sports/multi-live'],
      ['Toto', '/other/toto'],
      ['Results', '/sports/results'],
      ['Statistics', '/sports/statistics'],
    ],
  },
  {
    title: 'Useful links',
    links: [
      ['Mobile version', '/mobile'],
      ['Bet slip check', '/bet-slip'],
      ['Blog', '/blog'],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <Link to="/" className="footer-logo" aria-label="7XBET home">
            <span>7</span>
            <strong>XBET</strong>
          </Link>

          <p>
            For questions or suggestions, please Contact us{' '}
            <a href="mailto:support-en@7xbet.asia">support-en@7xbet.asia</a>
          </p>
        </div>

        <div className="site-footer-grid">
          {footerColumns.map((column) => (
            <div className="footer-column" key={column.title}>
              <h3>{column.title}</h3>

              <ul>
                {column.links.map(([label, path]) => (
                  <li key={label}>
                    <Link to={path}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-column">
            <h3>SOCIALS</h3>

            <ul>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noreferrer">
                  <span className="footer-social-icon">f</span>
                  Facebook
                </a>
              </li>

              <li>
                <a href="https://t.me" target="_blank" rel="noreferrer">
                  <span className="footer-social-icon">↗</span>
                  Telegram
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-column footer-apps">
            <h3>Apps</h3>

            <Link to="/mobile/android" className="app-download-card">
              <span className="footer-app-icon">▣</span>
              <span>
                Download for
                <strong>Android</strong>
              </span>
            </Link>

            <Link to="/mobile/ios" className="app-download-card">
              <span className="footer-app-icon">●</span>
              <span>
                Download for
                <strong>iOS</strong>
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="site-footer-info">
        <h2>7XBET Official Betting Site & Online Casino</h2>

        <div className="site-footer-line" />

        <p>
          7XBET is an online gaming platform with sports, esports, casino, slots,
          live games and agent-supported deposit and withdrawal services.
          Players can register, verify their profile, manage wallet activity and
          access game features through a secure account system.
        </p>

        <p>
          New users can explore public games before login. Wallet balance,
          profile details, deposit history, withdraw history and verification
          information are available after signing in. Agent deposit and withdraw
          requests are processed from the Agent Admin Panel.
        </p>

        <button type="button" className="more-info-btn">
          More Info <span>⌄</span>
        </button>
      </div>
    </footer>
  );
}
