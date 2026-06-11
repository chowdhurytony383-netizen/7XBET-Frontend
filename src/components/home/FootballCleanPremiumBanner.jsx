import './FootballCleanPremiumBanner.css';

export default function FootballCleanPremiumBanner() {
  return (
    <section className="football-clean-premium-banner" aria-label="Football World Fever banner">
      <img
        className="football-clean-premium-bg"
        src="/images/promos/football-world-fever-clean-premium.png"
        alt="Football World Fever"
        loading="lazy"
      />
      <div className="football-clean-premium-shade" />
      <div className="football-clean-premium-trail trail-a" />
      <div className="football-clean-premium-trail trail-b" />
      <div className="football-clean-premium-ball" aria-hidden="true">⚽</div>
      <div className="football-clean-premium-spark spark-1" />
      <div className="football-clean-premium-spark spark-2" />
      <div className="football-clean-premium-spark spark-3" />
    </section>
  );
}
