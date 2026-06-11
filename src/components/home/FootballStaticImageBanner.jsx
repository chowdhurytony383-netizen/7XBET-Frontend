import './FootballStaticImageBanner.css';

export default function FootballStaticImageBanner() {
  return (
    <section className="football-static-image-banner" aria-label="Football banner">
      <img
        src="/images/promos/football-static-premium-banner.png"
        alt="Football banner"
        loading="lazy"
      />
    </section>
  );
}
