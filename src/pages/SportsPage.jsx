import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Clock, Radio, ShieldCheck, Ticket, Trophy, Wallet } from 'lucide-react';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import './SportsPage.css';

function getTeamName(team) {
  if (!team) return 'Team';
  if (typeof team === 'string') return team;
  return team.name || team.displayName || 'Team';
}

function getScore(match, side) {
  const score = match?.score || {};
  return score?.[side] ?? score?.[side === 'home' ? 'homeScore' : 'awayScore'] ?? 0;
}

function normalizeOdds(match) {
  const odds = match?.mainOdds || match?.odds || match?.markets || [];
  if (!Array.isArray(odds)) return [];
  return odds.map((odd) => ({
    selectionId: odd.selectionId || odd.key || odd.id,
    marketKey: odd.marketKey || 'h2h',
    marketName: odd.marketName || 'Match Winner',
    label: odd.label || odd.name || 'Selection',
    price: Number(odd.price || odd.odds || odd.value || 0),
  })).filter((odd) => odd.selectionId && odd.price > 1);
}

function sportIcon(sport = '') {
  const clean = String(sport).toLowerCase();
  if (clean.includes('cricket')) return '🏏';
  if (clean.includes('basket')) return '🏀';
  if (clean.includes('tennis')) return '🎾';
  if (clean.includes('football') || clean.includes('soccer')) return '⚽';
  return '🏆';
}

function statusClass(status = '') {
  const clean = String(status).toLowerCase();
  if (clean.includes('live')) return 'live';
  if (clean.includes('finish')) return 'finished';
  return 'upcoming';
}

function SportsBetModal({ betSlip, onClose, onSubmit, placing }) {
  const [stake, setStake] = useState('');

  if (!betSlip) return null;

  const amount = Number(stake || 0);
  const possibleReturn = Number.isFinite(amount) ? amount * betSlip.selection.price : 0;

  return (
    <div className="sports-modal-backdrop" role="dialog" aria-modal="true">
      <div className="sports-bet-modal">
        <button type="button" className="sports-modal-close" onClick={onClose}>×</button>
        <span className="page-eyebrow">Bet Slip</span>
        <h3>{betSlip.match.home} vs {betSlip.match.away}</h3>
        <div className="sports-slip-lines">
          <div><span>Market</span><strong>{betSlip.selection.marketName}</strong></div>
          <div><span>Selection</span><strong>{betSlip.selection.label}</strong></div>
          <div><span>Odds</span><strong>{betSlip.selection.price.toFixed(2)}</strong></div>
        </div>

        <label className="sports-stake-field">
          Stake amount
          <input
            type="number"
            min="1"
            step="1"
            value={stake}
            placeholder="Enter stake"
            onChange={(event) => setStake(event.target.value)}
          />
        </label>

        <div className="sports-return-box">
          <span>Potential return</span>
          <strong>{formatCurrency(possibleReturn)}</strong>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-full"
          disabled={placing || !amount || amount <= 0}
          onClick={() => onSubmit({ ...betSlip, stake: amount })}
        >
          <Ticket size={18} /> {placing ? 'Placing bet...' : 'Place bet'}
        </button>
      </div>
    </div>
  );
}

function MatchCard({ match, onSelect }) {
  const home = getTeamName(match.homeTeam || match.home);
  const away = getTeamName(match.awayTeam || match.away);
  const odds = normalizeOdds(match);
  const status = match.status || 'Upcoming';
  const sport = match.sport || match.sportTitle || 'Sports';

  return (
    <article className="sports-live-card">
      <div className="sports-live-card-top">
        <div>
          <span className="sports-competition"><span>{sportIcon(sport)}</span>{sport}</span>
          <h3>{home} <span>vs</span> {away}</h3>
          <p>{match.league || match.tournament || 'Live market'} · {match.startTime || 'Auto sync'}</p>
        </div>
        <span className={`sports-status-pill ${statusClass(status)}`}>{status}</span>
      </div>

      <div className="sports-score-row">
        <div><span>{home}</span><strong>{getScore(match, 'home')}</strong></div>
        <div><span>{away}</span><strong>{getScore(match, 'away')}</strong></div>
      </div>

      <div className="sports-odds-grid">
        {odds.length ? odds.map((odd) => (
          <button
            type="button"
            className="sports-odd-button"
            key={odd.selectionId}
            disabled={match.completed || statusClass(status) === 'finished'}
            onClick={() => onSelect({
              match: { id: match._id || match.id, home, away },
              selection: odd,
            })}
          >
            <small>{odd.label}</small>
            <strong>{odd.price.toFixed(2)}</strong>
          </button>
        )) : (
          <span className="sports-no-odds">Odds unavailable from free provider</span>
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
            <small>Return: {formatCurrency(bet.potentialReturn)}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function SportsPage() {
  const { user, refreshUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [selectedSport, setSelectedSport] = useState('all');
  const [betSlip, setBetSlip] = useState(null);

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

  const sports = useMemo(() => {
    const unique = new Map();
    matches.forEach((match) => {
      const key = String(match.sportKey || match.sport || 'sports').toLowerCase();
      unique.set(key, match.sport || match.sportTitle || key);
    });
    return Array.from(unique.entries()).map(([key, label]) => ({ key, label }));
  }, [matches]);

  const visibleMatches = useMemo(() => {
    if (selectedSport === 'all') return matches;
    return matches.filter((match) => String(match.sportKey || match.sport || '').toLowerCase() === selectedSport);
  }, [matches, selectedSport]);

  const submitBet = async (slip) => {
    if (!user) {
      toast.error('Please login to place a sports bet');
      return;
    }

    setPlacing(true);
    try {
      await SportsAPI.placeBet({
        eventId: slip.match.id,
        marketKey: slip.selection.marketKey,
        selectionId: slip.selection.selectionId,
        stake: slip.stake,
      });
      setBetSlip(null);
      toast.success('Sports bet placed successfully');
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
        title="Automatic Live Sports"
        description="Live matches, odds and settlement are synced automatically from the configured sports odds provider."
      />

      <section className="sports-hero-panel">
        <div>
          <span className="page-eyebrow">Realtime automatic mode</span>
          <h2>All available sports with automatic odds</h2>
          <p>All available free-provider sports, live matches and h2h match winner odds update automatically. Winning bets settle when final scores arrive.</p>
        </div>
        <div className="sports-hero-stats">
          <div><Activity size={18} /><span>Events</span><strong>{status?.events ?? matches.length}</strong></div>
          <div><Ticket size={18} /><span>Open bets</span><strong>{status?.openBets ?? 0}</strong></div>
          <div><Wallet size={18} /><span>Balance</span><strong>{formatCurrency(user?.wallet)}</strong></div>
        </div>
      </section>

      <div className="sports-toolbar">
        <div className="sports-tabs">
          <button type="button" className={selectedSport === 'all' ? 'active' : ''} onClick={() => setSelectedSport('all')}>All</button>
          {sports.map((sport) => (
            <button type="button" key={sport.key} className={selectedSport === sport.key ? 'active' : ''} onClick={() => setSelectedSport(sport.key)}>
              {sportIcon(sport.label)} {sport.label}
            </button>
          ))}
        </div>
        <span className="sports-live-sync-pill">
          <Radio size={16} /> Realtime auto update
        </span>
      </div>

      {!status?.enabled ? (
        <div className="sports-warning-panel">
          <ShieldCheck size={20} />
          <div>
            <strong>Provider API key missing</strong>
            <p>Add SPORTS_ODDS_API_KEY in Render Backend Environment to load real automatic odds.</p>
          </div>
        </div>
      ) : null}

      <div className="sports-layout-grid">
        <section className="sports-live-list">
          <div className="section-row-title">
            <h2><Clock size={20} /> Live & Upcoming</h2>
            <span>{visibleMatches.length} matches</span>
          </div>

          {loading && !visibleMatches.length ? (
            <div className="sports-empty-panel">Loading automatic sports feed...</div>
          ) : visibleMatches.length ? (
            visibleMatches.map((match) => <MatchCard key={match._id || match.id} match={match} onSelect={setBetSlip} />)
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

      <SportsBetModal betSlip={betSlip} onClose={() => setBetSlip(null)} onSubmit={submitBet} placing={placing} />
    </div>
  );
}
