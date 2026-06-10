import { Link } from 'react-router-dom';
import './StaticPromoPages.css';


const links = [
  { to: '/other/promotions', title: 'Promotions', text: 'View active promotions and campaign information.' },
  { to: '/other/faq', title: 'FAQ', text: 'Find quick answers about account, wallet and rewards.' },
  { to: '/other/rules', title: 'Rules', text: 'Read account, bonus, wallet and platform rules.' },
];

export default function OtherPage() {
  return (
    <div className="page-stack static-page">
      <section className="static-hero">
        <div>
          <span className="page-eyebrow">Other</span>
          <h1>Other</h1>
          <p>Quick access to promotions, FAQ, rules and important platform information.</p>
        </div>
      </section>

      <section className="static-panel">
        <h2>Information Pages</h2>
        <div className="static-grid">
          {links.map((item) => (
            <Link to={item.to} className="static-card" key={item.to}>
              <div className="static-card-media">{item.title.slice(0, 1)}</div>
              <div className="static-card-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
