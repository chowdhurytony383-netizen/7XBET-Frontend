import { Link } from 'react-router-dom';
import './StaticPromoPages.css';


const ruleSections = [
  {
    title: 'Account Rules',
    items: [
      'Users must provide correct account and profile information.',
      'Only one account is allowed per user, device, payment account or identity.',
      'Account verification may be required before withdrawal.',
    ],
  },
  {
    title: 'Deposit & Withdrawal Rules',
    items: [
      'Deposits and withdrawals must follow available payment-method rules.',
      'Withdrawal may require the same payment method used for the highest deposit amount.',
      'Suspicious transactions may be delayed or rejected for security review.',
    ],
  },
  {
    title: 'Bonus Rules',
    items: [
      'First deposit bonus is available after profile information submission.',
      'Maximum first deposit bonus is ৳15,000 with 2x bonus turnover.',
      'Bonus abuse, duplicate accounts or suspicious activity may cancel rewards.',
    ],
  },
  {
    title: 'Lucky Wheel Rules',
    items: [
      'Every user can receive 1 free spin every 6 hours.',
      '×2 gives 2 extra free spins.',
      'Bomb or 0 gives no reward.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="page-stack static-page">
      <section className="static-hero">
        <div>
          <span className="page-eyebrow">Rules</span>
          <h1>Rules</h1>
          <p>Please read the general rules before using 7XBET services, wallet, bonuses and promotions.</p>
        </div>
        <div className="static-actions">
          <Link to="/other/faq" className="static-btn primary">FAQ</Link>
          <Link to="/customer-support" className="static-btn">Support</Link>
        </div>
      </section>

      <section className="static-panel">
        <h2>General Platform Rules</h2>
        <div className="static-grid two">
          {ruleSections.map((section) => (
            <article className="static-rule-card" key={section.title}>
              <h3>{section.title}</h3>
              <ul className="static-list">
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="static-panel">
        <div className="static-note">
          18+ only. Terms apply. 7XBET may update rules, promotions and eligibility conditions at any time for security, compliance and abuse prevention.
        </div>
      </section>
    </div>
  );
}
