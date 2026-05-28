import { Link } from 'react-router-dom';
import EmptyState from './EmptyState.jsx';
import MatchOfDayCard from './MatchOfDayCard.jsx';
import {
  getMatchId,
  getScore,
  getStrictMatchStatus,
  getTeamLogoUrl,
  getTeamName,
  normalizeMatchOdds,
  sortMatchesBySportPriority,
  sportMetaFromMatch,
  statusClass,
  teamLogoClass,
  teamLogoText,
} from '../utils/sportsVisuals.js';
import './LiveSportsSection.css';

function getMatchKey(match) {
  return getMatchId(match) || `${match?.league || ''}-${getTeamName(match?.homeTeam || match?.home)}-${getTeamName(match?.awayTeam || match?.away)}`;
}

function getLeague(match) {
  const country = match.country?.name || match.country || '';
  const league = match.league?.name || match.league || match.tournament || '';
  return [country, league].filter(Boolean).join(' · ');
}

function getMatchMeta(match) {
  const round = match.round || match.stage || match.matchRound;
  const venue = match.venue?.name || match.venue;
  const start = match.startTime || match.dateTime || match.kickoffTime;
  return [round, venue, start].filter(Boolean).join(' · ');
}

function TeamLogo({ team, sportKey }) {
  const logo = getTeamLogoUrl(team);
  return (
    <span className={`home-team-logo ${teamLogoClass(team, sportKey)}`}>
      {logo ? <img src={logo} alt={getTeamName(team)} loading="lazy" /> : teamLogoText(team)}
    </span>
  );
}

function MobileTeamScoreRow({ team, sportKey, score }) {
  return (
    <div className="live-mobile-team-row">
      <TeamLogo team={team} sportKey={sportKey} />
      <span>{getTeamName(team)}</span>
      <strong>{String(score ?? '0')}</strong>
    </div>
  );
}

function marketLabelFromOdds(odds = []) {
  const first = odds.find((odd) => odd?.marketDisplayName || odd?.marketName || odd?.marketKey);
  const label = first?.marketDisplayName || first?.marketName || first?.marketKey || 'Main market';
  return String(label).replace(/_/g, ' ');
}

function matchDetailsLink(match) {
  const meta = sportMetaFromMatch(match);
  const params = new URLSearchParams();
  if (meta?.key) params.set('sport', meta.key);
  const id = getMatchId(match);
  if (id) params.set('match', id);
  const query = params.toString();
  return `/sports${query ? `?${query}` : ''}`;
}

function LiveMatchRow({ match, onSelectBet }) {
  const homeTeam = match.homeTeam || match.home || match.teamA;
  const awayTeam = match.awayTeam || match.away || match.teamB;
  const home = getTeamName(homeTeam);
  const away = getTeamName(awayTeam);
  const odds = normalizeMatchOdds(match);
  const marketLabel = marketLabelFromOdds(odds);
  const status = getStrictMatchStatus(match);
  const league = getLeague(match);
  const meta = getMatchMeta(match);
  const sportMeta = sportMetaFromMatch(match);
  const homeScore = getScore(match, 'home');
  const awayScore = getScore(match, 'away');
  const disabled = match.completed || statusClass(status) === 'finished';

  return (
    <article className="live-match-row">
      <Link className="live-match-header live-match-header-link" to={matchDetailsLink(match)} aria-label={`Open details for ${home} vs ${away}`}>
        <div className="live-competition-line">
          <span className={`sport-ball ${sportMeta.className}`} aria-hidden="true">{sportMeta.icon}</span>
          <span className="live-competition-name">{sportMeta.name}{league ? ` · ${league}` : ''}</span>
        </div>
        <span className="live-header-actions">
          <span className={`live-header-status ${statusClass(status)}`}>{status}</span>
          <span className="live-card-chevron" aria-hidden="true">»</span>
        </span>
      </Link>

      <div className="live-match-content">
        <div className="live-match-info">
          <div className="live-league-line">
            <span className={`sport-ball ${sportMeta.className}`} aria-hidden="true">{sportMeta.icon}</span>
            <strong>{league || sportMeta.name}</strong>
          </div>

          <div className="live-mobile-details">
            <TeamLogo team={homeTeam} sportKey={match.sportKey} />
            <div className="live-mobile-copy">
              <div className="live-match-title">{home} - {away}</div>
              {meta ? <div className="live-match-meta">{meta}</div> : null}
            </div>
          </div>

          <div className="live-mobile-scorecard" aria-label={`${home} vs ${away} score`}>
            <MobileTeamScoreRow team={homeTeam} sportKey={match.sportKey} score={homeScore} />
            <MobileTeamScoreRow team={awayTeam} sportKey={match.sportKey} score={awayScore} />
          </div>

          <div className="live-teams">
            <span><TeamLogo team={homeTeam} sportKey={match.sportKey} /> {home}</span>
            <span><TeamLogo team={awayTeam} sportKey={match.sportKey} /> {away}</span>
          </div>
        </div>

        <div className="live-score-box">
          <span className={`live-pill ${statusClass(status)}`}>{status}</span>
          <div className="live-score-values"><span>{homeScore}</span><span>{awayScore}</span></div>
        </div>

        <div className="live-market-label">{marketLabel}</div>

        <div className="live-odds-grid">
          {odds.length ? odds.map((odd) => (
            <button type="button" className="odd-cell" key={odd.selectionId} disabled={disabled} onClick={() => onSelectBet?.(match, odd)}>
              <small>{odd.label}</small>
              <strong>{odd.price.toFixed(2)}</strong>
            </button>
          )) : (
            <span className="no-odds">Odds unavailable</span>
          )}
        </div>

        {match.moreMarkets ? <span className="more-markets">+{match.moreMarkets}</span> : null}
      </div>
    </article>
  );
}

export default function LiveSportsSection({ matches = [], matchOfTheDay, onSelectBet }) {
  const sortedMatches = sortMatchesBySportPriority(matches);
  const selectedMatch = matchOfTheDay || sortedMatches[0] || null;

  return (
    <section className="live-sports-section" id="live">
      <div className="section-row-title">
        <h2>Live Sports</h2>
        <a href="/sports" className="view-all-link">
          <span className="view-label-desktop">View all</span>
          <span className="view-label-mobile">All</span>
          <span aria-hidden="true"> ›</span>
        </a>
      </div>

      <div className="live-sports-grid">
        <div className="live-match-list">
          {sortedMatches.length ? (
            sortedMatches.slice(0, 8).map((match) => <LiveMatchRow key={getMatchKey(match)} match={match} onSelectBet={onSelectBet} />)
          ) : (
            <EmptyState title="Live matches unavailable" message="Sports odds will appear here when the provider sends live/upcoming events." />
          )}
        </div>

        <MatchOfDayCard match={selectedMatch} />
      </div>
    </section>
  );
}
