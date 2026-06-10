import { Link } from 'react-router-dom';
import './StaticPromoPages.css';


const tournaments = [
  { title: 'Daily Events', text: 'Join daily events when available and compete for leaderboard rewards.' },
  { title: 'Leaderboard', text: 'Tournament standings and prize status will be shown during active campaigns.' },
  { title: 'Special Prizes', text: 'Prize rules, timing and eligible games will be listed for each tournament.' },
];

export default function TournamentsPage() {
  return (
    <div className="page-stack static-page">
      <section className="static-hero">
        <div>
          <span className="page-eyebrow">Tournaments</span>
          <h1>Tournaments</h1>
          <p>Play selected events, climb the leaderboard and follow active tournament updates.</p>
        </div>
        <div className="static-actions">
          <Link to="/games" className="static-btn primary">Explore games</Link>
          <Link to="/promotions" className="static-btn">Promotions</Link>
        </div>
      </section>

      <section className="static-panel">
        <h2>Tournament Information</h2>
        <div className="static-grid">
          {tournaments.map((item) => (
            <article className="static-card" key={item.title}>
              <div className="static-card-media">🏆</div>
              <div className="static-card-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="static-panel">
        <h2>General Rules</h2>
        <ul className="static-list">
          <li>Each tournament has its own start time, end time and prize rules.</li>
          <li>Only eligible games or activities may count for leaderboard ranking.</li>
          <li>Suspicious play, multiple accounts or unfair activity may remove tournament eligibility.</li>
          <li>Prizes are credited after final review and confirmation.</li>
        </ul>
      </section>
    </div>
  );
}
