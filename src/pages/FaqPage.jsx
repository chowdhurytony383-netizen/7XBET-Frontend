import { Link } from 'react-router-dom';
import './StaticPromoPages.css';


const faqs = [
  {
    q: 'How do I create an account?',
    a: 'Tap Register, enter your correct information and complete your profile from the account section.',
  },
  {
    q: 'How does the first deposit bonus work?',
    a: 'After profile completion, your first eligible deposit can receive a 100% bonus up to ৳15,000, subject to rules.',
  },
  {
    q: 'How often can I get Lucky Wheel free spin?',
    a: 'Every user can receive 1 free spin every 6 hours. ×2 gives 2 extra spins. Bomb or 0 gives no reward.',
  },
  {
    q: 'Why can withdrawal be restricted?',
    a: 'Withdrawal may be restricted if bonus turnover, verification or payment-method rules are not completed.',
  },
  {
    q: 'Where can I get support?',
    a: 'Use Customer Support or Live Support from the menu for help with account, deposit and withdrawal questions.',
  },
];

export default function FaqPage() {
  return (
    <div className="page-stack static-page">
      <section className="static-hero">
        <div>
          <span className="page-eyebrow">Support</span>
          <h1>FAQ</h1>
          <p>Find quick answers about account, bonuses, free spins, wallet and support.</p>
        </div>
        <div className="static-actions">
          <Link to="/customer-support" className="static-btn primary">Customer Support</Link>
          <Link to="/live-support" className="static-btn">Live Support</Link>
        </div>
      </section>

      <section className="static-panel">
        <h2>Frequently Asked Questions</h2>
        <div className="static-grid two">
          {faqs.map((item) => (
            <article className="static-faq-item" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
