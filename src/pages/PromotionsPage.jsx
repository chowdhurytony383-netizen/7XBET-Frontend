import { Link } from 'react-router-dom';
import './StaticPromoPages.css';


const promotions = [
  {
    title: 'First Deposit Bonus',
    icon: '🎁',
    text: 'Complete your profile information and receive a 100% first-deposit bonus up to ৳15,000.',
  },
  {
    title: 'Lucky Wheel Free Spin',
    icon: '🎡',
    text: 'Get 1 free spin every 6 hours. ×2 gives 2 extra free spins. Bomb or 0 gives no reward.',
  },
  {
    title: 'Cashback Offers',
    icon: '💎',
    text: 'Regular cashback campaigns may be available based on activity, campaign period and admin rules.',
  },
];

export default function PromotionsPage() {
  return (
    <div className="page-stack static-page">
      <section className="static-hero">
        <div>
          <span className="page-eyebrow">Other</span>
          <h1>Promotions</h1>
          <p>Explore active 7XBET offers, rewards and campaign information in one place.</p>
        </div>
        <div className="static-actions">
          <Link to="/register" className="static-btn primary">Join now</Link>
          <Link to="/bonuses" className="static-btn">View bonuses</Link>
        </div>
      </section>

      <section className="static-panel">
        <h2>Active Promotions</h2>
        <div className="static-grid">
          {promotions.map((item) => (
            <article className="static-card" key={item.title}>
              <div className="static-card-media">{item.icon}</div>
              <div className="static-card-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="static-panel">
        <h2>Important Notes</h2>
        <ul className="static-list">
          <li>All offers are subject to eligibility, verification and campaign rules.</li>
          <li>One user may not claim the same welcome promotion multiple times.</li>
          <li>Suspicious or duplicate account activity may result in bonus cancellation.</li>
          <li>18+ only. Please play responsibly.</li>
        </ul>
      </section>
    </div>
  );
}
