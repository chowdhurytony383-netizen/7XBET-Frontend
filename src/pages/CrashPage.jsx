import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Clock3, History, Plane, RefreshCw, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { CrashAPI } from '../api/crash.js';
import { getApiError } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import './CrashPage.css';

const GROWTH_SECONDS_PER_X = 1.3;

function asDateMs(value) {
  const time = new Date(value || Date.now()).getTime();
  return Number.isFinite(time) ? time : Date.now();
}

function formatMultiplier(value) {
  const number = Number(value || 1);
  return `${number.toFixed(2)}x`;
}

function getRoundStatusLabel(round) {
  if (!round) return 'Loading';
  if (round.status === 'WAITING') return 'Betting open';
  if (round.status === 'RUNNING') return 'Flying';
  if (round.status === 'CRASHED') return `Crashed at ${formatMultiplier(round.crashMultiplier)}`;
  return round.status;
}

export default function CrashPage() {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState(null);
  const [amount, setAmount] = useState('100');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const round = state?.round;
  const userBet = state?.userBet;
  const recentRounds = state?.recentRounds || [];
  const myBets = state?.myBets || [];

  const loadState = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await CrashAPI.state();
      setState(response.data || null);
    } catch (error) {
      if (!silent) toast.error(getApiError(error, 'Unable to load crash game'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
    const poller = window.setInterval(() => loadState(true), 850);
    const ticker = window.setInterval(() => setNow(Date.now()), 120);
    return () => {
      window.clearInterval(poller);
      window.clearInterval(ticker);
    };
  }, [loadState]);

  const liveMultiplier = useMemo(() => {
    if (!round) return 1;
    if (round.status === 'RUNNING') {
      const elapsedSeconds = Math.max(0, (now - asDateMs(round.startsAt)) / 1000);
      const value = 1 + elapsedSeconds / GROWTH_SECONDS_PER_X;
      if (round.crashMultiplier) return Math.min(value, Number(round.crashMultiplier));
      return Math.max(1, Math.floor(value * 100) / 100);
    }
    if (round.status === 'CRASHED') return Number(round.crashMultiplier || 1);
    return Number(round.currentMultiplier || 1);
  }, [round, now]);

  const countdown = useMemo(() => {
    if (!round || round.status !== 'WAITING') return 0;
    return Math.max(0, Math.ceil((asDateMs(round.startsAt) - now) / 1000));
  }, [round, now]);

  const planeProgress = useMemo(() => {
    if (!round) return 0;
    if (round.status === 'CRASHED') return 100;
    if (round.status === 'WAITING') return Math.max(0, 100 - countdown * 12);
    return Math.min(100, Math.max(12, (liveMultiplier - 1) * 20));
  }, [round, countdown, liveMultiplier]);

  const canBet = Boolean(user && round?.status === 'WAITING' && !userBet);
  const canCashout = Boolean(user && round?.status === 'RUNNING' && userBet?.status === 'ACTIVE');

  const placeBet = async (event) => {
    event.preventDefault();
    if (!user) return toast.error('Please login before placing a bet');
    setSubmitting(true);
    try {
      await CrashAPI.placeBet({ amount: Number(amount), autoCashout: Number(autoCashout || 0) });
      toast.success('Bet placed');
      await Promise.all([loadState(true), refreshUser?.().catch(() => null)]);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to place bet'));
    } finally {
      setSubmitting(false);
    }
  };

  const cashout = async () => {
    setCashoutLoading(true);
    try {
      const response = await CrashAPI.cashout();
      toast.success(response.data?.message || 'Cashout successful');
      await Promise.all([loadState(true), refreshUser?.().catch(() => null)]);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to cash out'));
    } finally {
      setCashoutLoading(false);
    }
  };

  return (
    <div className="page-stack crash-page">
      <PageHeader
        eyebrow="Original 7XBET Game"
        title="7X Crash"
        description="Place a bet before takeoff, watch the multiplier rise, and cash out before the crash."
        actions={<button className="btn btn-soft" type="button" onClick={() => loadState()}><RefreshCw size={18} /> Refresh</button>}
      />

      {loading && !state ? (
        <div className="card center-screen"><div className="loader" /></div>
      ) : (
        <div className="crash-layout">
          <section className="crash-stage-card">
            <div className="crash-stage-top">
              <span className={`crash-status crash-status-${round?.status?.toLowerCase() || 'loading'}`}>
                <Activity size={16} /> {getRoundStatusLabel(round)}
              </span>
              <span className="crash-round-id">{round?.roundId || 'Preparing round'}</span>
            </div>

            <div className={`crash-stage crash-stage-${round?.status?.toLowerCase() || 'loading'}`}>
              <div className="crash-cloud crash-cloud-a" />
              <div className="crash-cloud crash-cloud-b" />
              <div className="crash-flight-line" />
              <div className="crash-plane" style={{ left: `${Math.min(78, 8 + planeProgress * 0.7)}%`, bottom: `${Math.min(70, 16 + planeProgress * 0.45)}%` }}>
                <Plane size={44} />
              </div>

              <div className="crash-multiplier">
                {round?.status === 'WAITING' ? (
                  <>
                    <small>Next round starts in</small>
                    <strong>{countdown}s</strong>
                  </>
                ) : (
                  <>
                    <small>{round?.status === 'CRASHED' ? 'Crash point' : 'Current multiplier'}</small>
                    <strong>{formatMultiplier(liveMultiplier)}</strong>
                  </>
                )}
              </div>
            </div>

            <div className="crash-info-grid">
              <div><Clock3 size={18} /><span>Round status</span><strong>{getRoundStatusLabel(round)}</strong></div>
              <div><Wallet size={18} /><span>Players</span><strong>{state?.activePlayers || 0}</strong></div>
              <div><ShieldCheck size={18} /><span>Seed hash</span><strong title={round?.serverSeedHash}>{round?.serverSeedHash?.slice(0, 12) || '—'}...</strong></div>
            </div>
          </section>

          <aside className="crash-bet-card card">
            <h2>Bet panel</h2>
            {user ? (
              <p className="crash-wallet">Balance: <strong>{formatCurrency(user.wallet)}</strong></p>
            ) : (
              <p className="crash-wallet">Login required to place real bets.</p>
            )}

            <form onSubmit={placeBet} className="crash-bet-form">
              <label>
                Bet amount
                <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" step="1" />
              </label>

              <label>
                Auto cashout
                <input value={autoCashout} onChange={(event) => setAutoCashout(event.target.value)} type="number" min="1.01" step="0.01" placeholder="Optional" />
              </label>

              <div className="crash-quick-buttons">
                {[50, 100, 500, 1000].map((value) => (
                  <button key={value} type="button" onClick={() => setAmount(String(value))}>{value}</button>
                ))}
              </div>

              {userBet ? (
                <div className={`crash-current-bet crash-current-bet-${userBet.status?.toLowerCase()}`}>
                  <span>Your bet</span>
                  <strong>{formatCurrency(userBet.amount)}</strong>
                  <small>Status: {userBet.status}</small>
                  {userBet.payoutAmount ? <small>Payout: {formatCurrency(userBet.payoutAmount)} at {formatMultiplier(userBet.payoutMultiplier)}</small> : null}
                </div>
              ) : null}

              {!user ? (
                <Link className="btn btn-primary btn-full" to="/login">Login to play</Link>
              ) : (
                <button className="btn btn-primary btn-full" type="submit" disabled={!canBet || submitting}>
                  {submitting ? 'Placing...' : round?.status === 'WAITING' ? 'Place bet' : 'Wait for next round'}
                </button>
              )}

              <button className="btn btn-soft btn-full crash-cashout-btn" type="button" onClick={cashout} disabled={!canCashout || cashoutLoading}>
                {cashoutLoading ? 'Cashing out...' : `Cash out ${formatMultiplier(liveMultiplier)}`}
              </button>
            </form>
          </aside>
        </div>
      )}

      <section className="crash-history-card card">
        <div className="crash-section-title"><History size={18} /><h3>Recent crash history</h3></div>
        <div className="crash-round-list">
          {recentRounds.length ? recentRounds.map((item) => (
            <span key={item.roundId} className={Number(item.crashMultiplier) >= 2 ? 'hot' : ''}>{formatMultiplier(item.crashMultiplier)}</span>
          )) : <span>No rounds yet</span>}
        </div>
      </section>

      <section className="crash-history-card card">
        <div className="crash-section-title"><Sparkles size={18} /><h3>My last bets</h3></div>
        {user ? (
          myBets.length ? (
            <div className="crash-bets-table">
              {myBets.map((bet) => (
                <div key={bet._id}>
                  <span>{bet.roundId}</span>
                  <strong>{formatCurrency(bet.amount)}</strong>
                  <em className={`bet-${bet.status?.toLowerCase()}`}>{bet.status}</em>
                  <span>{bet.payoutAmount ? `${formatCurrency(bet.payoutAmount)} / ${formatMultiplier(bet.payoutMultiplier)}` : '—'}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No crash bets yet" message="Place your first 7X Crash bet when the next round opens." />
        ) : <EmptyState title="Login to see your bets" message="Your crash betting history appears here after sign in." />}
      </section>
    </div>
  );
}
