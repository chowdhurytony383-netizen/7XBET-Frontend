import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, BarChart3, Clock, Info, ListChecks, MapPin, Radio, ShieldCheck, Ticket, Trophy, Users, Wallet, X } from 'lucide-react';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import {
  buildSportsSlipItem,
  getMatchId,
  getScore,
  getStrictMatchStatus,
  getTeamLogoUrl,
  getTeamName,
  normalizeMatchOdds,
  sortMatchesBySportPriority,
  sortSportMetas,
  sportMetaFrom,
  sportMetaFromMatch,
  statusClass,
  teamLogoClass,
  teamLogoText,
} from '../utils/sportsVisuals.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SportsBetSlip from '../components/SportsBetSlip.jsx';
import './SportsPage.css';


function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function textValue(value, fallback = '—') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value.name || value.description || value.short_code || fallback;
  return String(value);
}

function isEmptyDetailValue(value) {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    if (value.name || value.description || value.short_code || value.value || value.display) return false;
    return Object.keys(value).length === 0;
  }
  return false;
}

function DetailsItem({ label, value }) {
  if (isEmptyDetailValue(value)) return null;
  return (
    <div className="sports-detail-item">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </div>
  );
}

function DetailsSection({ icon, title, children }) {
  return (
    <section className="sports-detail-section">
      <h4>{icon}{title}</h4>
      {children}
    </section>
  );
}

function MiniTeam({ team }) {
  const logo = getTeamLogoUrl(team);
  return (
    <div className="sports-detail-team">
      {logo ? <img src={logo} alt={team?.name || team?.raw?.name || 'Team'} /> : <span>{teamLogoText(team?.name || team?.raw?.name || 'TM')}</span>}
      <strong>{team?.name || team?.raw?.name || 'Team'}</strong>
    </div>
  );
}

function EventList({ items = [] }) {
  const limited = asArray(items).slice(0, 14);
  if (!limited.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-list">
      {limited.map((item, index) => (
        <div className="sports-detail-list-row" key={item.id || `${item.type_id || 'event'}-${index}`}>
          <span>{item.minute ?? item.sort_order ?? item.period_id ?? index + 1}</span>
          <strong>{textValue(item.type || item.type_id || item.name || item.description, 'Event')}</strong>
          <small>{textValue(item.player_name || item.player?.name || item.participant_name || item.result || item.info || item.addition, '')}</small>
        </div>
      ))}
    </div>
  );
}

function StatisticsList({ items = [] }) {
  const limited = asArray(items).slice(0, 18);
  if (!limited.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-stat-grid">
      {limited.map((item, index) => (
        <div className="sports-detail-stat" key={item.id || `${item.type_id || 'stat'}-${index}`}>
          <span>{textValue(item.type || item.type_id || item.name || item.code, 'Statistic')}</span>
          <strong>{textValue(item.data?.value ?? item.value ?? item.amount ?? item.percentage ?? item.data, '—')}</strong>
        </div>
      ))}
    </div>
  );
}

function LineupsList({ items = [] }) {
  const limited = asArray(items).slice(0, 16);
  if (!limited.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-lineups">
      {limited.map((item, index) => (
        <div className="sports-detail-lineup" key={item.id || `${item.player_id || 'player'}-${index}`}>
          <span>{item.jersey_number || item.number || index + 1}</span>
          <strong>{textValue(item.player?.display_name || item.player?.name || item.player_name || item.name, 'Player')}</strong>
          <small>{textValue(item.position?.name || item.position_id || item.type || item.formation_position, '')}</small>
        </div>
      ))}
    </div>
  );
}

function compactJson(value) {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return '—';
  }
}

function GenericDataList({ items = [], empty = 'Not available yet' }) {
  const limited = asArray(items).slice(0, 18);
  if (!limited.length) return <p className="sports-detail-muted">{empty}</p>;

  return (
    <div className="sports-detail-list">
      {limited.map((item, index) => (
        <div className="sports-detail-list-row" key={item.id || item.player_id || item.team_id || `${item.name || 'row'}-${index}`}>
          <span>{item.minute ?? item.time ?? item.position ?? item.rank ?? index + 1}</span>
          <strong>{textValue(item.name || item.player?.name || item.team?.name || item.type?.name || item.type || item.description || item.group || item.league?.name, 'Item')}</strong>
          <small>{textValue(item.value ?? item.total ?? item.points ?? item.score ?? item.result ?? item.country?.name ?? item.info ?? compactJson(item.data), '')}</small>
        </div>
      ))}
    </div>
  );
}

function formatCricketScoreItem(score = {}) {
  if (score.display) return score.display;
  if (score.value && typeof score.value !== 'object') return score.value;
  const rawScore = score.score ?? score.runs ?? score.total;
  if (rawScore === undefined || rawScore === null || rawScore === '') return '';
  const wickets = score.wickets !== undefined && score.wickets !== null && score.wickets !== '' ? `/${score.wickets}` : '';
  const overs = score.overs ? ` (${score.overs} ov)` : '';
  return `${rawScore}${wickets}${overs}`;
}

function ScoresPanel({ scores }) {
  if (!scores) return <p className="sports-detail-muted">Not available yet</p>;

  const normalized = (() => {
    if (Array.isArray(scores)) {
      return scores.map((score, index) => {
        const cricketValue = formatCricketScoreItem(score);
        if (cricketValue) {
          return {
            label: textValue(score.label || score.team || score.name || score.description || score.id || `Innings ${index + 1}`),
            value: cricketValue,
          };
        }
        return {
          label: textValue(score.period || score.type || score.name || score.description || score.id || `Period ${index + 1}`),
          home: score.home ?? score.localteam_score ?? score.home_score ?? score.score?.home ?? score.scores?.home,
          away: score.away ?? score.visitorteam_score ?? score.away_score ?? score.score?.away ?? score.scores?.away,
        };
      });
    }

    if (typeof scores === 'object') {
      const home = scores.home ?? scores.localteam_score ?? scores.home_score ?? scores.score?.home ?? scores.scores?.home;
      const away = scores.away ?? scores.visitorteam_score ?? scores.away_score ?? scores.score?.away ?? scores.scores?.away;
      if (home !== undefined || away !== undefined) {
        return [{ label: 'Current score', home, away }];
      }

      return Object.entries(scores).map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' ? value.display || value.value : value,
        home: typeof value === 'object' ? value.home ?? value.localteam_score ?? value.home_score : undefined,
        away: typeof value === 'object' ? value.away ?? value.visitorteam_score ?? value.away_score : undefined,
      }));
    }

    return [];
  })().filter((item) => item.value !== undefined || item.home !== undefined || item.away !== undefined);

  if (!normalized.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-stat-grid">
      {normalized.map((item, index) => (
        <div className="sports-detail-stat" key={`${item.label}-${index}`}>
          <span>{textValue(item.label, `Score ${index + 1}`)}</span>
          <strong>{item.value !== undefined ? textValue(item.value) : `${textValue(item.home)}${item.away !== undefined ? ` - ${textValue(item.away)}` : ''}`}</strong>
        </div>
      ))}
    </div>
  );
}

function OddsList({ market }) {
  const selections = asArray(market?.selections);
  if (!selections.length) return <p className="sports-detail-muted">No betting market available</p>;
  return (
    <div className="sports-detail-odds-row">
      {selections.map((selection) => (
        <div key={selection.selectionId || selection.name}>
          <span>{selection.name}</span>
          <strong>{Number(selection.price || 0).toFixed(2)}</strong>
        </div>
      ))}
    </div>
  );
}

function MatchDetailsModal({ data, loading, onClose }) {
  if (!data && !loading) return null;

  const event = data?.event || data?.data?.event;
  const market = data?.market || data?.data?.market;
  const details = data?.details || data?.data?.details;

  return (
    <div className="sports-detail-backdrop" role="dialog" aria-modal="true">
      <div className="sports-detail-modal">
        <button type="button" className="sports-detail-close" onClick={onClose} aria-label="Close details"><X size={20} /></button>
        <div className="sports-detail-header">
          <span className="page-eyebrow">Full Match Details</span>
          <h3>{event ? `${getTeamName(event.homeTeam)} vs ${getTeamName(event.awayTeam)}` : 'Loading match details...'}</h3>
          
        </div>

        {loading ? <div className="sports-empty-panel">Loading full details...</div> : null}

        {!loading && details && !details.available ? (
          <div className="sports-warning-panel">
            <Info size={20} />
            <div>
              <strong>Details not available</strong>
              <p>{details.message || 'Provider did not return full details for this match yet.'}</p>
            </div>
          </div>
        ) : null}

        {!loading && event ? (
          <div className="sports-detail-body">
            <DetailsSection icon={<Info size={18} />} title="Basic information">
              <div className="sports-detail-grid">
                <DetailsItem label="Sport" value={event.sportTitle || event.sport} />
                <DetailsItem label="League" value={details?.league?.name || event.league} />
                <DetailsItem label="Status" value={getStrictMatchStatus(event)} />
                <DetailsItem label="Start time" value={details?.startingAt || event.startTime} />
                <DetailsItem label="Result" value={details?.resultInfo} />
                <DetailsItem label="Round" value={details?.round?.name || details?.round?.id} />
              </div>
            </DetailsSection>

            <DetailsSection icon={<Users size={18} />} title="Teams">
              <div className="sports-detail-teams">
                <MiniTeam team={details?.homeTeam || event.homeTeam} />
                <span>VS</span>
                <MiniTeam team={details?.awayTeam || event.awayTeam} />
              </div>
            </DetailsSection>

            <DetailsSection icon={<MapPin size={18} />} title="Venue / tournament">
              <div className="sports-detail-grid">
                <DetailsItem label="Venue" value={details?.venue?.name} />
                <DetailsItem label="City" value={details?.venue?.city_name || details?.venue?.city} />
                <DetailsItem label="Season" value={details?.season?.name} />
                <DetailsItem label="Stage" value={details?.stage?.name} />
                <DetailsItem label="Referee" value={asArray(details?.referees).map((referee) => referee.name).filter(Boolean).join(', ')} />
                <DetailsItem label="Length" value={details?.length ? `${details.length} minutes` : ''} />
              </div>
            </DetailsSection>

            <DetailsSection icon={<Ticket size={18} />} title="Betting odds">
              <OddsList market={market} />
            </DetailsSection>

            <DetailsSection icon={<ListChecks size={18} />} title="Match events / commentary">
              <EventList items={details?.events} />
            </DetailsSection>

            <DetailsSection icon={<BarChart3 size={18} />} title="Statistics">
              <StatisticsList items={details?.statistics} />
            </DetailsSection>

            <DetailsSection icon={<Users size={18} />} title="Lineups / players">
              <LineupsList items={details?.lineups} />
            </DetailsSection>

            <DetailsSection icon={<BarChart3 size={18} />} title="Scores / periods">
              <ScoresPanel scores={details?.scores} />
            </DetailsSection>

            <DetailsSection icon={<Users size={18} />} title="Player statistics">
              <GenericDataList items={details?.players} />
            </DetailsSection>

            <DetailsSection icon={<Trophy size={18} />} title="Standings / table">
              <GenericDataList items={details?.standings} />
            </DetailsSection>

          </div>
        ) : null}
      </div>
    </div>
  );
}

function MatchTeam({ team, sportKey, score }) {
  const logo = getTeamLogoUrl(team);
  return (
    <div className="sports-team-row">
      <span className={`sports-team-logo ${teamLogoClass(team, sportKey)}`}>
        {logo ? <img src={logo} alt={getTeamName(team)} loading="lazy" /> : teamLogoText(team)}
      </span>
      <strong>{getTeamName(team)}</strong>
      <b>{score}</b>
    </div>
  );
}

function MatchCard({ match, onSelect, selectedIds, onDetails }) {
  const homeTeam = match.homeTeam || match.home;
  const awayTeam = match.awayTeam || match.away;
  const odds = normalizeMatchOdds(match);
  const status = getStrictMatchStatus(match);
  const sportMeta = sportMetaFromMatch(match);
  const matchId = getMatchId(match);
  const disabled = match.completed || statusClass(status) === 'finished';

  return (
    <article className="sports-live-card">
      <div
        className="sports-live-card-top sports-live-card-top-clickable"
        role="button"
        tabIndex={0}
        onClick={() => onDetails(match)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onDetails(match);
          }
        }}
      >
        <div className="sports-card-title-block">
          <span className={`sports-competition ${sportMeta.className}`}><span>{sportMeta.icon}</span>{match.sport || match.sportTitle || sportMeta.name}</span>
          <h3>{getTeamName(homeTeam)} <span>vs</span> {getTeamName(awayTeam)}</h3>
          <p>{match.league || match.tournament || sportMeta.name} · {match.startTime || 'Auto sync'}</p>
        </div>
        <div className="sports-card-actions">
          <span className={`sports-status-pill ${statusClass(status)}`}>{status}</span>
          <button type="button" className="sports-details-button" onClick={(event) => { event.stopPropagation(); onDetails(match); }}>
            <Info size={15} /> Details
          </button>
        </div>
      </div>

      <div className="sports-score-board">
        <MatchTeam team={homeTeam} sportKey={match.sportKey} score={getScore(match, 'home')} />
        <MatchTeam team={awayTeam} sportKey={match.sportKey} score={getScore(match, 'away')} />
      </div>

      <div className="sports-market-label">1X2</div>

      <div className="sports-odds-grid">
        {odds.length ? odds.map((odd) => {
          const selected = selectedIds.has(`${matchId}:${odd.selectionId}`);
          return (
            <button
              type="button"
              className={`sports-odd-button ${selected ? 'selected' : ''}`}
              key={odd.selectionId}
              disabled={disabled}
              onClick={() => onSelect(match, odd)}
            >
              <small>{odd.label}</small>
              <strong>{odd.price.toFixed(2)}</strong>
            </button>
          );
        }) : (
          <span className="sports-no-odds">Odds unavailable from provider</span>
        )}
      </div>
    </article>
  );
}

function BetHistory({ bets = [] }) {
  if (!bets.length) {
    return <div className="sports-empty-panel">No sports bets yet.</div>;
  }

  return (
    <div className="sports-bets-list">
      {bets.map((bet) => (
        <article className="sports-bet-row" key={bet._id || bet.betId}>
          <div>
            <strong>{bet.homeTeam} vs {bet.awayTeam}</strong>
            <span>{bet.marketName} · {bet.selectionName}</span>
            <small>{formatDate(bet.createdAt)}</small>
          </div>
          <div>
            <span className={`sports-bet-status ${String(bet.status).toLowerCase()}`}>{bet.status}</span>
            <strong>{formatCurrency(bet.stake)} @ {Number(bet.odds || 0).toFixed(2)}</strong>
            <small>{String(bet.status).toUpperCase() === 'WON' ? 'Won' : 'Return'}: {formatCurrency(bet.payoutAmount || bet.potentialReturn)}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function SportsPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');
  const [betSlipItems, setBetSlipItems] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const [categoriesResponse, matchesResponse, statusResponse, betResponse] = await Promise.all([
        SportsAPI.categories().catch(() => null),
        SportsAPI.liveMatches(),
        SportsAPI.syncStatus().catch(() => null),
        user ? SportsAPI.myBets().catch(() => null) : Promise.resolve(null),
      ]);

      setCategories(categoriesResponse?.data?.data || categoriesResponse?.data?.categories || []);
      setMatches(matchesResponse.data?.data || matchesResponse.data?.matches || []);
      setStatus(statusResponse?.data?.data || null);
      setBets(user ? (betResponse?.data?.data || betResponse?.data?.bets || []) : []);
    } catch (error) {
      if (!silent) toast.error(getApiError(error, 'Unable to load sports data'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const refreshMs = Math.max(10000, Number(import.meta.env.VITE_SPORTS_REFRESH_MS || 15000));

    const runLoad = async (options = {}) => {
      if (!active) return;
      await load(options);
    };

    runLoad({ silent: false });
    const timer = window.setInterval(() => runLoad({ silent: true }), refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    const sportFromUrl = searchParams.get('sport') || 'all';
    setSelectedSport(sportFromUrl);
  }, [searchParams]);

  const sports = useMemo(() => {
    const unique = new Map();
    categories.forEach((category) => {
      const meta = category?.key
        ? sportMetaFrom(`${category.key} ${category.name || category.title || category.slug || ''}`)
        : sportMetaFrom(category?.name || category?.title || category?.slug || '');
      unique.set(meta.key, {
        ...meta,
        name: category?.name || category?.title || meta.name,
      });
    });
    matches.forEach((match) => {
      const meta = sportMetaFromMatch(match);
      unique.set(meta.key, meta);
    });
    return sortSportMetas(Array.from(unique.values()));
  }, [categories, matches]);

  const visibleMatches = useMemo(() => {
    const sorted = sortMatchesBySportPriority(matches);
    if (selectedSport === 'all') return sorted;
    return sorted.filter((match) => sportMetaFromMatch(match).key === selectedSport);
  }, [matches, selectedSport]);

  const groupedMatches = useMemo(() => {
    const groups = new Map();
    visibleMatches.forEach((match) => {
      const meta = sportMetaFromMatch(match);
      if (!groups.has(meta.key)) groups.set(meta.key, { meta, items: [] });
      groups.get(meta.key).items.push(match);
    });
    return Array.from(groups.values()).sort((a, b) => sortSportMetas([a.meta, b.meta])[0]?.key === a.meta.key ? -1 : 1);
  }, [visibleMatches]);

  const selectedIds = useMemo(() => new Set(betSlipItems.map((item) => item.id)), [betSlipItems]);

  const changeSport = (key) => {
    setSelectedSport(key);
    if (key === 'all') setSearchParams({});
    else setSearchParams({ sport: key });
  };

  const addSelection = (match, odd) => {
    const item = buildSportsSlipItem(match, odd, 1);
    if (!item.eventId || !item.selectionId) {
      toast.error('This selection is not ready for betting');
      return;
    }

    setBetSlipItems((current) => {
      if (current.some((existing) => existing.id === item.id)) {
        toast('Already added to bet slip');
        return current;
      }
      return [...current, item];
    });
  };

  const updateStake = (id, stake) => {
    setBetSlipItems((current) => current.map((item) => (
      item.id === id ? { ...item, stake } : item
    )));
  };

  const removeSlipItem = (id) => {
    setBetSlipItems((current) => current.filter((item) => item.id !== id));
  };

  const openDetails = async (match) => {
    const eventId = getMatchId(match);
    if (!eventId) {
      toast.error('Match details are not available yet');
      return;
    }

    setDetailsOpen(true);
    setDetailsLoading(true);
    setMatchDetails({ event: match, market: null, details: null });

    try {
      const response = await SportsAPI.eventDetails(eventId);
      setMatchDetails(response.data?.data || response.data || null);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load match details'));
      setMatchDetails({ event: match, details: { available: false, message: getApiError(error, 'Unable to load match details') } });
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const matchIdFromUrl = searchParams.get('match');
    if (!matchIdFromUrl || detailsOpen || !matches.length) return;

    const match = matches.find((item) => String(getMatchId(item)) === String(matchIdFromUrl));
    if (match) openDetails(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, matches, detailsOpen]);

  const submitBets = async () => {
    if (!user) {
      toast.error('Please login to place a sports bet');
      return;
    }

    const selections = betSlipItems.map((item) => ({
      eventId: item.eventId,
      marketKey: item.marketKey,
      selectionId: item.selectionId,
      stake: Number(item.stake),
    })).filter((item) => item.eventId && item.selectionId && Number.isFinite(item.stake) && item.stake > 0);

    if (!selections.length) {
      toast.error('Enter a valid stake amount');
      return;
    }

    setPlacing(true);
    try {
      await SportsAPI.placeMultipleBets({ selections });
      setBetSlipItems([]);
      toast.success(`${selections.length} sports bet${selections.length === 1 ? '' : 's'} placed successfully`);
      await Promise.all([load(), refreshUser?.()]);
    } catch (error) {
      toast.error(getApiError(error, 'Sports bet failed'));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="page-stack sports-page">
      <PageHeader
        eyebrow="Sportsbook"
        title="Live Sports Betting"
        description="Live and upcoming matches are grouped by sports category. Select one or many odds, then place them from the bet slip."
      />

      <section className="sports-hero-panel">
        <div>
          <span className="page-eyebrow">Automatic live mode</span>
          <h2>Category based sports with live odds</h2>
          <p>Football, cricket, basketball, tennis and other available provider sports appear with colorful sports and team logos. Win/loss settlement updates the wallet automatically.</p>
        </div>
        <div className="sports-hero-stats">
          <div><Activity size={18} /><span>Events</span><strong>{status?.events ?? matches.length}</strong></div>
          <div><Ticket size={18} /><span>Open bets</span><strong>{status?.openBets ?? 0}</strong></div>
          <div><Wallet size={18} /><span>Balance</span><strong>{formatCurrency(user?.wallet, user)}</strong></div>
        </div>
      </section>

      <div className="sports-toolbar">
        <div className="sports-tabs">
          <button type="button" className={selectedSport === 'all' ? 'active' : ''} onClick={() => changeSport('all')}>All</button>
          {sports.map((sport) => (
            <button type="button" key={sport.key} className={selectedSport === sport.key ? `active ${sport.className}` : ''} onClick={() => changeSport(sport.key)}>
              <span>{sport.icon}</span> {sport.name}
            </button>
          ))}
        </div>
        <span className="sports-live-sync-pill"><Radio size={16} /> Auto update</span>
      </div>


      <div className="sports-layout-grid">
        <section className="sports-live-list">
          <div className="section-row-title sports-live-title-row">
            <h2><Clock size={20} /> Live Sports </h2>
            <span>{visibleMatches.length} matches</span>
          </div>

          {loading && !visibleMatches.length ? (
            <div className="sports-empty-panel">Loading automatic sports feed...</div>
          ) : groupedMatches.length ? (
            groupedMatches.map((group) => (
              <div className="sports-category-block" key={group.meta.key}>
                <div className="sports-category-heading">
                  <span className={`sports-category-icon ${group.meta.className}`}>{group.meta.icon}</span>
                  <div>
                    <h3>{group.meta.name}</h3>
                    <small>{group.items.length} event{group.items.length === 1 ? '' : 's'}</small>
                  </div>
                </div>
                {group.items.map((match) => (
                  <MatchCard key={getMatchId(match)} match={match} onSelect={addSelection} selectedIds={selectedIds} onDetails={openDetails} />
                ))}
              </div>
            ))
          ) : (
            <div className="sports-empty-panel">No matches from provider. Check API key, sport keys, quota or provider coverage.</div>
          )}
        </section>

        <aside className="sports-side-panel">
          <div className="sports-provider-card">
            <h3>My Sports Bets</h3>
            <BetHistory bets={bets} />
            {!user ? <Link className="btn btn-primary btn-full" to="/login">Login to bet</Link> : null}
          </div>
        </aside>
      </div>

      <SportsBetSlip
        items={betSlipItems}
        user={user}
        placing={placing}
        onStakeChange={updateStake}
        onRemove={removeSlipItem}
        onClear={() => setBetSlipItems([])}
        onPlaceAll={submitBets}
      />

      {detailsOpen ? (
        <MatchDetailsModal
          data={matchDetails}
          loading={detailsLoading}
          onClose={() => {
            setDetailsOpen(false);
            setMatchDetails(null);
            if (searchParams.has('match')) {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('match');
              setSearchParams(nextParams, { replace: true });
            }
          }}
        />
      ) : null}
    </div>
  );
}
