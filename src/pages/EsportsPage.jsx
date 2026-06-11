import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Radio, Trophy } from 'lucide-react';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
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
import './EsportsPage.css';

const ESPORTS_KEYWORDS = [
  'esport', 'e-sport', 'dota', 'dota 2', 'league of legends', ' lol ', 'counter strike', 'counter-strike',
  'counterstrike', 'cs2', 'csgo', 'valorant', 'rainbow six', 'rainbowsix', ' r6 ', 'overwatch', 'starcraft',
  'call of duty', 'pubg', 'mobile legends', 'wild rift', 'arena of valor', 'king of glory', 'rocket league',
];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.matches)) return value.matches;
  return [];
}

function readPayload(response) {
  return response?.data?.data || response?.data || {};
}

function textBundle(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textBundle).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return [
      value.key,
      value.slug,
      value.name,
      value.displayName,
      value.title,
      value.shortName,
      value.description,
      value.categoryName,
      value.sport,
      value.sportKey,
      value.sportTitle,
      value.league,
      value.tournament,
      value.country,
      textBundle(value.category),
      textBundle(value.homeTeam || value.home || value.teamA),
      textBundle(value.awayTeam || value.away || value.teamB),
      textBundle(value.raw),
    ].filter(Boolean).join(' ');
  }
  return '';
}

function isEsportsMatch(match) {
  if (!match) return false;
  if (sportMetaFromMatch(match).key === 'esports') return true;
  const clean = ` ${textBundle(match).toLowerCase().replace(/[^a-z0-9+]+/g, ' ')} `;
  return ESPORTS_KEYWORDS.some((keyword) => clean.includes(keyword));
}

function uniqueMatches(matches = []) {
  const unique = new Map();
  matches.forEach((match, index) => {
    if (!match || !isEsportsMatch(match)) return;
    const home = getTeamName(match.homeTeam || match.home || match.teamA);
    const away = getTeamName(match.awayTeam || match.away || match.teamB);
    const key = getMatchId(match) || match.providerEventId || match.eventId || match.id || match._id || `${home}-${away}-${match.startTime || match.dateTime || index}`;
    unique.set(String(key), match);
  });
  return sortMatchesBySportPriority(Array.from(unique.values()));
}

function splitEsportsMatches(matches = []) {
  const live = [];
  const prematch = [];
  matches.forEach((match) => {
    if (statusClass(getStrictMatchStatus(match)) === 'live') live.push(match);
    else prematch.push(match);
  });
  return { live, prematch };
}

function compactTime(match) {
  const raw = match.startTime || match.dateTime || match.kickoffTime || match.commenceTime || '';
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return raw || 'Upcoming';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(time));
}

function getLeague(match) {
  const country = match.country?.name || match.country || '';
  const league = match.league?.name || match.league || match.tournament || match.categoryName || match.sportTitle || match.sport || 'Esports';
  return [country, league].filter(Boolean).join(' · ');
}

function scoreText(value) {
  if (value === undefined || value === null || value === '') return '0';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') return value.display || value.formatted || value.value || value.score || value.points || value.goals || '0';
  return String(value);
}

function TeamLogo({ team, sportKey }) {
  const logo = getTeamLogoUrl(team);
  return (
    <span className={`esports-team-logo ${teamLogoClass(team, sportKey)}`}>
      {logo ? <img src={logo} alt={getTeamName(team)} loading="lazy" /> : teamLogoText(team)}
    </span>
  );
}

function marketLabelFromOdds(odds = []) {
  const first = odds.find((odd) => odd?.marketDisplayName || odd?.marketName || odd?.marketKey);
  const label = first?.marketDisplayName || first?.marketName || first?.marketKey || 'Main market';
  return String(label).replace(/_/g, ' ');
}

function selectPrimaryOdds(match) {
  const allOdds = normalizeMatchOdds(match);
  if (!allOdds.length) return [];

  const grouped = new Map();
  allOdds.forEach((odd) => {
    const key = `${odd.marketKey || ''}:${odd.marketName || odd.marketDisplayName || ''}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(odd);
  });

  const groups = Array.from(grouped.values());
  const preferred = groups.find((items) => items.length >= 2 && /moneyline|winner|match winner|1x2|3-way|3 way/i.test(`${items[0]?.marketName || ''} ${items[0]?.marketKey || ''}`))
    || groups.find((items) => items.length >= 2)
    || allOdds;

  return preferred.slice(0, 3);
}

function matchLink(match) {
  const params = new URLSearchParams();
  const id = getMatchId(match);
  params.set('mode', statusClass(getStrictMatchStatus(match)) === 'live' ? 'live' : 'prematch');
  params.set('sport', 'esports');
  if (id) params.set('match', id);
  return `/sports?${params.toString()}`;
}

function EsportsMatchCard({ match }) {
  const homeTeam = match.homeTeam || match.home || match.teamA;
  const awayTeam = match.awayTeam || match.away || match.teamB;
  const home = getTeamName(homeTeam);
  const away = getTeamName(awayTeam);
  const odds = selectPrimaryOdds(match);
  const marketLabel = marketLabelFromOdds(odds);
  const status = getStrictMatchStatus(match);
  const isLive = statusClass(status) === 'live';
  const league = getLeague(match);

  return (
    <article className="esports-match-card">
      <Link className="esports-match-head" to={matchLink(match)} aria-label={`Open ${home} vs ${away}`}>
        <span className="esports-game-icon">🎮</span>
        <span>{league}</span>
        <b className={isLive ? 'live' : ''}>{isLive ? 'LIVE' : compactTime(match)}</b>
      </Link>

      <div className="esports-score-row">
        <div>
          <TeamLogo team={homeTeam} sportKey="esports" />
          <strong>{home}</strong>
        </div>
        <span>{scoreText(getScore(match, 'home'))}</span>
      </div>

      <div className="esports-score-row">
        <div>
          <TeamLogo team={awayTeam} sportKey="esports" />
          <strong>{away}</strong>
        </div>
        <span>{scoreText(getScore(match, 'away'))}</span>
      </div>

      <div className="esports-market-title">{marketLabel}</div>
      <div className="esports-odds-grid">
        {odds.length ? odds.map((odd) => (
          <Link className="esports-odd-button" to={matchLink(match)} key={odd.selectionId || `${odd.label}-${odd.price}`}>
            <small>{odd.label}</small>
            <strong>{Number(odd.price).toFixed(2)}</strong>
          </Link>
        )) : <Link className="esports-open-link" to={matchLink(match)}>Open match</Link>}
      </div>
    </article>
  );
}

function EsportsRail({ title, matches }) {
  if (!matches.length) return null;
  return (
    <section className="esports-rail-block">
      <div className="section-row-title esports-rail-title">
        <h2>{title}</h2>
        <span>{matches.length} event{matches.length === 1 ? '' : 's'}</span>
      </div>
      <div className="esports-match-rail">
        {matches.map((match) => <EsportsMatchCard key={getMatchId(match) || `${getTeamName(match.homeTeam || match.home)}-${getTeamName(match.awayTeam || match.away)}-${match.startTime || ''}`} match={match} />)}
      </div>
    </section>
  );
}

export default function EsportsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadEsports = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const [overviewResult, liveResult, prematchResult] = await Promise.allSettled([
        SportsAPI.overview({ limit: 80 }),
        SportsAPI.liveMatches({ status: 'live', limit: 80 }),
        SportsAPI.liveMatches({ status: 'prematch', limit: 80 }),
      ]);

      const found = [];
      if (overviewResult.status === 'fulfilled') {
        const overview = readPayload(overviewResult.value);
        found.push(...asArray(overview.topLive), ...asArray(overview.topPrematch), ...asArray(overview.matches), ...asArray(overview.events), ...asArray(overview.data));
      }
      if (liveResult.status === 'fulfilled') {
        const livePayload = readPayload(liveResult.value);
        found.push(...asArray(livePayload), ...asArray(livePayload.matches), ...asArray(livePayload.data));
      }
      if (prematchResult.status === 'fulfilled') {
        const prematchPayload = readPayload(prematchResult.value);
        found.push(...asArray(prematchPayload), ...asArray(prematchPayload.matches), ...asArray(prematchPayload.data));
      }

      const esports = uniqueMatches(found);
      setMatches(esports);
      setLastUpdatedAt(new Date());

      if (!esports.length && [overviewResult, liveResult, prematchResult].every((result) => result.status === 'rejected')) {
        throw overviewResult.reason || liveResult.reason || prematchResult.reason;
      }
    } catch (err) {
      setError(getApiError(err, 'Unable to load esports feed'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const refreshMs = Math.max(12000, Number(import.meta.env.VITE_ESPORTS_REFRESH_MS || 20000));

    const run = async (options = {}) => {
      if (!active) return;
      await loadEsports(options);
    };

    run({ silent: false });
    const timer = window.setInterval(() => run({ silent: true }), refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadEsports]);

  const { live, prematch } = useMemo(() => splitEsportsMatches(matches), [matches]);
  const updatedText = lastUpdatedAt ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastUpdatedAt) : 'Loading';

  return (
    <div className="page-stack esports-page">
      <section className="esports-hero-panel">
        <div>
          <span className="page-eyebrow">Esports</span>
          <h1>Esports</h1>
          <p>Dota 2, Rainbow Six Siege, Counter-Strike, Valorant, League of Legends and other esports matches from the sports backend will appear here automatically.</p>
          <div className="esports-hero-actions">
            <Link className="btn btn-primary" to="/">Main page →</Link>
            <button type="button" className="btn btn-ghost" onClick={() => loadEsports({ silent: false })} disabled={loading}>
              <RefreshCcw size={17} /> Refresh
            </button>
          </div>
        </div>
        <div className="esports-hero-stats">
          <span><Trophy size={17} /> {matches.length} events</span>
          <span><Radio size={17} /> {live.length} live</span>
          <span>Updated {updatedText}</span>
        </div>
      </section>

      <section className="esports-feed-panel">
        <div className="section-row-title esports-main-title">
          <div>
            <span className="page-eyebrow">Live feed</span>
            <h2>Esports matches</h2>
          </div>
          <Link className="view-all-link" to="/sports?sport=esports">Open in Sports ›</Link>
        </div>

        {error ? <div className="auth-message error">{error}</div> : null}

        {loading && !matches.length ? (
          <div className="esports-loading-card">Loading esports from backend...</div>
        ) : live.length || prematch.length ? (
          <>
            <EsportsRail title="Live Esports" matches={live} />
            <EsportsRail title="Pre-match Esports" matches={prematch} />
          </>
        ) : (
          <EmptyState title="No esports available" message="When Dota 2, Rainbow Six Siege, Counter-Strike, Valorant or other esports events are available in the sports backend, they will show here automatically." />
        )}
      </section>
    </div>
  );
}
