import { Link } from 'react-router-dom';
import './StaticPromoPages.css';


const cashbackItems = [
  { title: 'Regular Cashback', text: 'Cashback campaigns may be available during selected periods.' },
  { title: 'Calculated by activity', text: 'Cashback can be calculated from eligible activity and campaign conditions.' },
  { title: 'Credited to wallet', text: 'Approved cashback rewards may be added to your account wallet.' },
];

export default function CashbackPage() {
  return (
    <div className="page-stack static-page">
      <section className="static-hero">
        <div>
          <span className="page-eyebrow">Promotions</span>
          <h1>Cashback</h1>
          <p>Cashback offers, eligibility and reward periods will be shown here when active.</p>
        </div>
        <div className="static-actions">
          <Link to="/promotions" className="static-btn primary">Promotions</Link>
          <Link to="/wallet" className="static-btn">Wallet</Link>
        </div>
      </section>

      <section className="static-panel">
        <h2>How Cashback Works</h2>
        <div className="static-grid">
          {cashbackItems.map((item) => (
            <article className="static-card" key={item.title}>
              <div className="static-card-media">C</div>
              <div className="static-card-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="static-panel">
        <h2>Cashback Terms</h2>
        <ul className="static-list">
          <li>Cashback availability depends on active campaign rules.</li>
          <li>Only eligible activity during the campaign period may count.</li>
          <li>Abusive, duplicate or suspicious activity may be excluded.</li>
          <li>Final cashback approval is subject to account review.</li>
        </ul>
      </section>
    </div>
  );
}
