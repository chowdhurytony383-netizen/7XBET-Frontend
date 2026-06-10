import { Link } from 'react-router-dom';
import './StaticPromoPages.css';


const bonusSteps = [
  { title: 'Register', text: 'Create a 7XBET account with your correct details.' },
  { title: 'Submit profile info', text: 'Complete your account information before making your first deposit.' },
  { title: 'First deposit', text: 'Your first eligible deposit can receive a 100% bonus up to ৳15,000.' },
];

export default function BonusesPage() {
  return (
    <div className="page-stack static-page">
      <section className="static-hero">
        <div>
          <span className="page-eyebrow">Promotions</span>
          <h1>Bonuses</h1>
          <p>Submit your account information first. Your first eligible deposit can receive a 100% bonus up to ৳15,000 with 2x bonus turnover.</p>
        </div>
        <div className="static-actions">
          <Link to="/register" className="static-btn primary">Create account</Link>
          <Link to="/bonuses/free-spin" className="static-btn">Lucky Wheel</Link>
        </div>
      </section>

      <section className="static-panel">
        <h2>First Deposit Bonus</h2>
        <div className="static-grid">
          {bonusSteps.map((item, index) => (
            <article className="static-card" key={item.title}>
              <div className="static-card-media">0{index + 1}</div>
              <div className="static-card-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="static-panel">
        <h2>Bonus Rules</h2>
        <ul className="static-list">
          <li>Welcome bonus is available only for new users after account information submission.</li>
          <li>Bonus amount is equal to the first eligible deposit amount, maximum ৳15,000.</li>
          <li>Bonus turnover requirement: 2x bonus turnover before withdrawal.</li>
          <li>Multiple accounts, same device, same payment account or suspicious activity may cancel the bonus.</li>
          <li>7XBET reserves the right to change, pause or cancel bonus campaigns if abuse is detected.</li>
        </ul>
      </section>
    </div>
  );
}
