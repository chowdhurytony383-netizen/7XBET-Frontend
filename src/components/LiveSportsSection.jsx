import EmptyState from './EmptyState.jsx';
import MatchOfDayCard from './MatchOfDayCard.jsx';
import './LiveSportsSection.css';

function getMatchKey(match) {
  return (
    match?._id ||
    match?.id ||
    `${match?.league || ''}-${match?.homeTeam?.name || match?.home || ''}-${match?.awayTeam?.name || match?.away || ''}`
  );
}

function teamName(team) {
  if (!team) return 'Team';
  if (typeof team === 'string') return team;
  return team.name || team.displayName || 'Team';
}

function getSport(match) {
  const sport = match.sport?.name || match.sport || match.category?.name || match.category;
  return sport || 'Football';
}

function getLeague(match) {
  const country = match.country?.name || match.country || '';
  const league = match.league?.name || match.league || match.tournament || '';
  return [country, league].filter(Boolean).join('. ');
}

function flagFromCode(code) {
  if (!code || typeof code !== 'string' || code.length !== 2) return '';
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

function getCountryFlag(match) {
  const country = match.country;

  if (country && typeof country === 'object') {
    return (
      country.flag ||
      country.emoji ||
      flagFromCode(country.code || country.iso2 || country.shortCode)
    );
  }

  const countryCode = match.countryCode || match.country_code || match.iso2;
  if (countryCode) return flagFromCode(countryCode);

  const countryName = typeof country === 'string' ? country.toLowerCase() : '';

  const flags = {
    spain: '🇪🇸',
    france: '🇫🇷',
    thailand: '🇹🇭',
    england: '🏴',
    germany: '🇩🇪',
    italy: '🇮🇹',
    portugal: '🇵🇹',
    europe: '🇪🇺',
  };

  if (countryName.includes('spain')) return flags.spain;
  if (countryName.includes('france')) return flags.france;
  if (countryName.includes('thailand')) return flags.thailand;
  if (countryName.includes('england')) return flags.england;
  if (countryName.includes('germany')) return flags.germany;
  if (countryName.includes('italy')) return flags.italy;
  if (countryName.includes('portugal')) return flags.portugal;
  if (countryName.includes('uefa') || countryName.includes('europe')) return flags.europe;

  return '';
}

function normalizeOdds(match) {
  const markets = match.markets || match.odds || match.mainOdds || [];

  if (Array.isArray(markets)) {
    return markets.slice(0, 9).map((item, index) => ({
      key: item.key || item.code || item.label || index,
      label: item.label || item.name || item.key || item.code || String(index + 1),
      value: item.value || item.odds || item.price || item.rate || '-',
    }));
  }

  if (markets && typeof markets === 'object') {
    return Object.entries(markets)
      .slice(0, 9)
      .map(([label, value]) => ({
        key: label,
        label,
        value,
      }));
  }

  return [];
}

function scoreValue(match, side) {
  const score = match.score || match.scores || {};
  return (
    score?.[side] ??
    score?.[side === 'home' ? 'homeScore' : 'awayScore'] ??
    0
  );
}

function getMatchMeta(match) {
  const round = match.round || match.stage || match.matchRound;
  const venue = match.venue?.name || match.venue;
  const weather = match.weather || match.temperature;

  return [round, venue, weather].filter(Boolean).join('. ');
}

function LiveMatchRow({ match }) {
  const homeTeam = match.homeTeam || match.home || match.teamA;
  const awayTeam = match.awayTeam || match.away || match.teamB;

  const home = teamName(homeTeam);
  const away = teamName(awayTeam);

  const odds = normalizeOdds(match);
  const status = match.status || match.matchStatus || 'Live';
  const league = getLeague(match);
  const sport = getSport(match);
  const flag = getCountryFlag(match);
  const meta = getMatchMeta(match);

  const homeScore = scoreValue(match, 'home');
  const awayScore = scoreValue(match, 'away');

  const headerTitle = [sport, league].filter(Boolean).join('. ');

  return (
    <article className="live-match-row">
      <div className="live-match-header">
        <div className="live-competition-line">
          <span className="sport-ball" aria-hidden="true">⚽</span>
          {flag ? <span className="country-flag" aria-hidden="true">{flag}</span> : null}
          <span className="live-competition-name">
            {headerTitle || 'Football'}
          </span>
        </div>

        <span className="live-card-chevron" aria-hidden="true">»</span>
      </div>

      <div className="live-match-content">
        <div className="live-match-info">
          <div className="live-league-line">
            <span className="ball-dot">●</span>
            <strong>{league || sport || 'Football'}</strong>
          </div>

          <div className="live-mobile-details">
            <span className="match-star" aria-hidden="true">☆</span>

            <div className="live-mobile-copy">
              <div className="live-match-title">
                {home} - {away}
              </div>

              {meta ? (
                <div className="live-match-meta">
                  {meta}
                </div>
              ) : null}
            </div>
          </div>

          <div className="live-teams">
            <span>{home}</span>
            <span>{away}</span>
          </div>
        </div>

        <div className="live-score-box">
          <span className="live-pill">{status}</span>

          <div className="live-score-values">
            <span>{homeScore}</span>
            <span>{awayScore}</span>
          </div>
        </div>

        <div className="live-odds-grid">
          {odds.length ? (
            odds.map((odd) => (
              <button type="button" className="odd-cell" key={odd.key}>
                <small>{odd.label}</small>
                <strong>{odd.value}</strong>
              </button>
            ))
          ) : (
            <span className="no-odds">Odds unavailable</span>
          )}
        </div>

        {match.moreMarkets ? (
          <span className="more-markets">+{match.moreMarkets}</span>
        ) : null}
      </div>
    </article>
  );
}

export default function LiveSportsSection({ matches = [], matchOfTheDay }) {
  const selectedMatch = matchOfTheDay || matches[0] || null;

  return (
    <section className="live-sports-section" id="live">
      <div className="section-row-title">
        <h2>Live</h2>

        <a href="#live" className="view-all-link">
          <span className="view-label-desktop">View all</span>
          <span className="view-label-mobile">All</span>
          <span aria-hidden="true"> ›</span>
        </a>
      </div>

      <div className="live-sports-grid">
        <div className="live-match-list">
          {matches.length ? (
            matches
              .slice(0, 5)
              .map((match) => (
                <LiveMatchRow key={getMatchKey(match)} match={match} />
              ))
          ) : (
            <EmptyState
              title="Live matches unavailable"
              message="Add live sports data in  to show this section."
            />
          )}
        </div>

        <MatchOfDayCard match={selectedMatch} />
      </div>
    </section>
  );
}