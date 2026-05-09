import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Clock, Radio, ShieldCheck, Ticket, Trophy, Wallet } from 'lucide-react';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import {
  buildSportsSlipItem,
  getMatchId,
  getScore,
  getTeamName,
  normalizeMatchOdds,
  sportMetaFromMatch,
  statusClass,
  teamLogoClass,
  teamLogoText,
} from '../utils/sportsVisuals.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SportsBetSlip from '../components/SportsBetSlip.jsx';
import './SportsPage.css';

function MatchTeam({ team, sportKey, score }) {
  return (
    <div className="sports-team-row">
      <span className={`sports-team-logo ${teamLogoClass(team, sportKey)}`}>{teamLogoText(team)}</span>
      <strong>{getTeamName(team)}</strong>
      <b>{score}</b>
    </div>
  );
}

function MatchCard({ match, onSelect, selectedIds }) {
  const homeTeam = match.homeTeam || match.home;
  const awayTeam = match.awayTeam || match.away;
  const odds = normalizeMatchOdds(match);
  const status = match.status || 'Upcoming';
  const sportMeta = sportMetaFromMatch(match);
  const matchId = getMatchId(match);
  const disabled = match.completed || statusClass(status) === 'finished';

  return (
    <article className="sports-live-card">
      <div className="sports-live-card-top">
        <div className="sports-card-title-block">
          <span className={`sports-competition ${sportMeta.className}`}><span>{sportMeta.icon}</span>{match.sport || match.sportTitle || sportMeta.name}</span>
          <h3>{getTeamName(homeTeam)} <span>vs</span> {getTeamName(awayTeam)}</h3>
          <p>{match.league || match.tournament || sportMeta.name} · {match.startTime || 'Auto sync'}</p>
        </div>
        <span className={`sports-status-pill ${statusClass(status)}`}>{status}</span>
      </div>

      <div className="sports-score-board">
        <MatchTeam team={homeTeam} sportKey={match.sportKey} score={getScore(match, 'home')} />
        <MatchTeam team={awayTeam} sportKey={match.sportKey} score={getScore(match, 'away')} />
      </div>

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
  const [status, setStatus] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');
  const [betSlipItems, setBetSlipItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matchesResponse, statusResponse] = await Promise.all([
        SportsAPI.liveMatches(),
        SportsAPI.syncStatus().catch(() => null),
      ]);
      setMatches(matchesResponse.data?.data || matchesResponse.data?.matches || []);
      setStatus(statusResponse?.data?.data || null);

      if (user) {
        const betResponse = await SportsAPI.myBets().catch(() => null);
        setBets(betResponse?.data?.data || betResponse?.data?.bets || []);
      } else {
        setBets([]);
      }
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load sports data'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const sportFromUrl = searchParams.get('sport') || 'all';
    setSelectedSport(sportFromUrl);
  }, [searchParams]);

  const sports = useMemo(() => {
    const unique = new Map();
    matches.forEach((match) => {
      const meta = sportMetaFromMatch(match);
      unique.set(meta.key, meta);
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  const visibleMatches = useMemo(() => {
    if (selectedSport === 'all') return matches;
    return matches.filter((match) => sportMetaFromMatch(match).key === selectedSport);
  }, [matches, selectedSport]);

  const groupedMatches = useMemo(() => {
    const groups = new Map();
    visibleMatches.forEach((match) => {
      const meta = sportMetaFromMatch(match);
      if (!groups.has(meta.key)) groups.set(meta.key, { meta, items: [] });
      groups.get(meta.key).items.push(match);
    });
    return Array.from(groups.values());
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

      {!status?.enabled ? (
        <div className="sports-warning-panel">
          <ShieldCheck size={20} />
          <div>
            <strong>Provider API key missing</strong>
            <p>Add SPORTS_ODDS_API_KEY in Render Backend Environment to load automatic odds.</p>
          </div>
        </div>
      ) : null}

      <div className="sports-layout-grid">
        <section className="sports-live-list">
          <div className="section-row-title sports-live-title-row">
            <h2><Clock size={20} /> Live Sports / খেলা</h2>
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
                  <MatchCard key={getMatchId(match)} match={match} onSelect={addSelection} selectedIds={selectedIds} />
                ))}
              </div>
            ))
          ) : (
            <div className="sports-empty-panel">No matches from provider. Check API key, sport keys, quota or provider coverage.</div>
          )}
        </section>

        <aside className="sports-side-panel">
          <div className="sports-provider-card">
            <Trophy size={22} />
            <h3>Automatic System</h3>
            <p>Odds and scores sync automatically. Admin does not need to create odds manually.</p>
            <div><span>Provider</span><strong>{status?.provider || 'theoddsapi'}</strong></div>
            <div><span>Auto settlement</span><strong>{status?.autoSettlement ? 'ON' : 'OFF'}</strong></div>
            <div><span>Last odds sync</span><strong>{status?.lastOdds?.finishedAt ? formatDate(status.lastOdds.finishedAt) : '—'}</strong></div>
            <div><span>Last scores sync</span><strong>{status?.lastScores?.finishedAt ? formatDate(status.lastScores.finishedAt) : '—'}</strong></div>
          </div>

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
    </div>
  );
}
