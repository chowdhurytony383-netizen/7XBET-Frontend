import { Link } from 'react-router-dom';
import EmptyState from './EmptyState.jsx';
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

function scoreText(value) {
  if (value === undefined || value === null || value === '') return '0';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return value.display || value.formatted || value.value || value.score || value.runs || value.points || value.goals || '0';
  }
  return String(value);
}

function compactTime(match) {
  const raw = match.startTime || match.dateTime || match.kickoffTime || match.commenceTime || '';
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return raw || 'Auto update';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(time));
}

function TeamLogo({ team, sportKey }) {
  const logo = getTeamLogoUrl(team);
  return (
    <span className={`home-team-logo ${teamLogoClass(team, sportKey)}`}>
      {logo ? <img src={logo} alt={getTeamName(team)} loading="lazy" /> : teamLogoText(team)}
    </span>
  );
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

function marketLabelFromOdds(odds = []) {
  const first = odds.find((odd) => odd?.marketDisplayName || odd?.marketName || odd?.marketKey);
  const label = first?.marketDisplayName || first?.marketName || first?.marketKey || 'Main market';
  return String(label).replace(/_/g, ' ');
}

function LiveMatchCard({ match, onSelectBet }) {
  const homeTeam = match.homeTeam || match.home || match.teamA;
  const awayTeam = match.awayTeam || match.away || match.teamB;
  const home = getTeamName(homeTeam);
  const away = getTeamName(awayTeam);
  const odds = normalizeMatchOdds(match).slice(0, 4);
  const marketLabel = marketLabelFromOdds(odds);
  const status = getStrictMatchStatus(match);
  const league = getLeague(match);
  const sportMeta = sportMetaFromMatch(match);
  const disabled = match.completed || statusClass(status) === 'finished';

  return (
    <article className="seven-sports-card">
      <Link className="seven-sports-card-head" to={matchDetailsLink(match)} aria-label={`Open ${home} vs ${away}`}>
        <span className={`seven-sport-icon ${sportMeta.className}`}>{sportMeta.icon}</span>
        <span>{league || sportMeta.name}</span>
        <b className={statusClass(status)}>{statusClass(status) === 'live' ? 'LIVE' : compactTime(match)}</b>
      </Link>

      <div className="seven-match-score-row">
        <div>
          <TeamLogo team={homeTeam} sportKey={match.sportKey} />
          <strong>{home}</strong>
        </div>
        <span>{scoreText(getScore(match, 'home'))}</span>
      </div>
      <div className="seven-match-score-row">
        <div>
          <TeamLogo team={awayTeam} sportKey={match.sportKey} />
          <strong>{away}</strong>
        </div>
        <span>{scoreText(getScore(match, 'away'))}</span>
      </div>

      <div className="seven-market-title">{marketLabel}</div>
      <div className="seven-home-odds-grid">
        {odds.length ? odds.map((odd) => (
          <button type="button" className="seven-odd-button" key={odd.selectionId} disabled={disabled} onClick={() => onSelectBet?.(match, odd)}>
            <small>{odd.label}</small>
            <strong>{odd.price.toFixed(2)}</strong>
          </button>
        )) : <span className="seven-no-odds">Markets opening soon</span>}
      </div>
    </article>
  );
}

function splitMatches(matches = []) {
  const sorted = sortMatchesBySportPriority(matches);
  const live = [];
  const prematch = [];
  sorted.forEach((match) => {
    if (statusClass(getStrictMatchStatus(match)) === 'live') live.push(match);
    else prematch.push(match);
  });
  return { live, prematch };
}

function HorizontalMatchRail({ title, items, onSelectBet, linkLabel = 'All' }) {
  if (!items.length) return null;
  return (
    <div className="seven-sports-rail-block">
      <div className="section-row-title seven-rail-title">
        <h2>{title}</h2>
        <Link className="view-all-link" to={`/sports?mode=${title.toLowerCase().includes('pre') ? 'prematch' : 'live'}`}>{linkLabel} ›</Link>
      </div>
      <div className="seven-sports-rail">
        {items.slice(0, 8).map((match) => <LiveMatchCard key={getMatchKey(match)} match={match} onSelectBet={onSelectBet} />)}
      </div>
    </div>
  );
}

export default function LiveSportsSection({ matches = [], onSelectBet }) {
  const { live, prematch } = splitMatches(matches);
  const fallback = sortMatchesBySportPriority(matches).slice(0, 8);

  return (
    <section className="live-sports-section seven-home-sports" id="live">
      {live.length || prematch.length ? (
        <>
          <HorizontalMatchRail title="Live Sports" items={live.length ? live : fallback} onSelectBet={onSelectBet} />
          <HorizontalMatchRail title="Pre-match" items={prematch} onSelectBet={onSelectBet} />
        </>
      ) : (
        <EmptyState title="Sports feed loading" message="7XBET live and pre-match markets will appear here automatically." />
      )}
    </section>
  );
}
