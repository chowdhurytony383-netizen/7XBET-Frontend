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

const GROWTH_BASE_SECONDS = 4.5;
const GROWTH_POWER = 1.45;
const FRAME_THROTTLE_MS = 33;

function asDateMs(value) {
  const time = new Date(value || Date.now()).getTime();
  return Number.isFinite(time) ? time : Date.now();
}

function multiplierAtElapsedSeconds(seconds = 0) {
  const elapsed = Math.max(0, Number(seconds) || 0);
  return 1 + Math.pow(elapsed / GROWTH_BASE_SECONDS, GROWTH_POWER);
}

function formatMultiplier(value) {
  const number = Number(value || 1);
  return `${number.toFixed(2)}x`;
}

function getEffectiveStatus(round, currentTime) {
  if (!round) return 'LOADING';
  if (round.status === 'CRASHED') return 'CRASHED';
  if (round.status === 'WAITING' && currentTime >= asDateMs(round.startsAt)) return 'RUNNING';
  if (round.status === 'RUNNING' && currentTime >= asDateMs(round.crashAt)) return 'CRASHED';
  return round.status || 'LOADING';
}

function getRoundStatusLabel(round, effectiveStatus, liveMultiplier) {
  if (!round) return 'Loading';
  if (effectiveStatus === 'WAITING') return 'Betting open';
  if (effectiveStatus === 'RUNNING') return 'Flying';
  if (effectiveStatus === 'CRASHED') return `Crashed at ${formatMultiplier(round.crashMultiplier || liveMultiplier)}`;
  return effectiveStatus;
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

  const serverTimeOffset = useMemo(() => {
    if (!state?.serverTime || !state?.receivedAt) return 0;
    return asDateMs(state.serverTime) - asDateMs(state.receivedAt);
  }, [state?.serverTime, state?.receivedAt]);

  const displayNow = now + serverTimeOffset;

  const loadState = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await CrashAPI.state();
      setState({ ...(response.data || {}), receivedAt: Date.now() });
    } catch (error) {
      if (!silent) toast.error(getApiError(error, 'Unable to load crash game'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
    const poller = window.setInterval(() => loadState(true), 650);
    return () => window.clearInterval(poller);
  }, [loadState]);

  useEffect(() => {
    let frameId = 0;
    let lastFrame = 0;

    const tick = (frameTime) => {
      if (frameTime - lastFrame >= FRAME_THROTTLE_MS) {
        setNow(Date.now());
        lastFrame = frameTime;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const effectiveStatus = useMemo(() => getEffectiveStatus(round, displayNow), [round, displayNow]);

  const liveMultiplier = useMemo(() => {
    if (!round) return 1;

    if (effectiveStatus === 'WAITING') return 1;

    const start = asDateMs(round.startsAt);
    const end = asDateMs(round.crashAt);
    const targetTime = effectiveStatus === 'CRASHED' ? Math.min(displayNow, end) : displayNow;
    const elapsedSeconds = Math.max(0, (targetTime - start) / 1000);
    const smoothValue = multiplierAtElapsedSeconds(elapsedSeconds);

    const serverCurrent = Number(round.currentMultiplier || 1);
    const revealedCrash = Number(round.crashMultiplier || 0);
    const maxValue = revealedCrash > 1 ? revealedCrash : Infinity;

    return Math.max(1, Math.min(maxValue, Math.max(smoothValue, serverCurrent > 1 && effectiveStatus !== 'RUNNING' ? serverCurrent : 1)));
  }, [round, displayNow, effectiveStatus]);

  const countdown = useMemo(() => {
    if (!round || effectiveStatus !== 'WAITING') return 0;
    return Math.max(0, Math.ceil((asDateMs(round.startsAt) - displayNow) / 1000));
  }, [round, displayNow, effectiveStatus]);

  const planeProgress = useMemo(() => {
    if (!round) return 0;
    if (effectiveStatus === 'WAITING') return Math.max(0, Math.min(100, (4 - countdown) * 18));
    if (effectiveStatus === 'CRASHED') return 100;
    return Math.min(100, Math.max(8, (liveMultiplier - 1) * 34));
  }, [round, countdown, liveMultiplier, effectiveStatus]);

  const canBet = Boolean(user && effectiveStatus === 'WAITING' && !userBet);
  const canCashout = Boolean(user && effectiveStatus === 'RUNNING' && userBet?.status === 'ACTIVE');
  const statusLabel = getRoundStatusLabel(round, effectiveStatus, liveMultiplier);

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
        description="Place a bet before takeoff, watch the multiplier rise smoothly, and cash out before the crash."
        actions={<button className="btn btn-soft" type="button" onClick={() => loadState()}><RefreshCw size={18} /> Refresh</button>}
      />

      {loading && !state ? (
        <div className="card center-screen"><div className="loader" /></div>
      ) : (
        <div className="crash-layout crash-layout-stacked">
          <section className="crash-stage-card">
            <div className="crash-stage-top">
              <span className={`crash-status crash-status-${String(effectiveStatus).toLowerCase()}`}>
                <Activity size={16} /> {statusLabel}
              </span>
              <span className="crash-round-id">{round?.roundId || 'Preparing round'}</span>
            </div>

            <div className={`crash-stage crash-stage-${String(effectiveStatus).toLowerCase()}`}>
              <div className="crash-cloud crash-cloud-a" />
              <div className="crash-cloud crash-cloud-b" />
              <div className="crash-flight-line" />
              <div
                className="crash-plane"
                style={{
                  left: `${Math.min(80, 8 + planeProgress * 0.72)}%`,
                  bottom: `${Math.min(72, 14 + planeProgress * 0.48)}%`,
                }}
              >
                <Plane size={44} />
              </div>

              <div className="crash-multiplier">
                {effectiveStatus === 'WAITING' ? (
                  <>
                    <small>Next round starts in</small>
                    <strong className="crash-countdown-number">{countdown}s</strong>
                  </>
                ) : (
                  <>
                    <small>{effectiveStatus === 'CRASHED' ? 'Crash point' : 'Current multiplier'}</small>
                    <strong>{formatMultiplier(liveMultiplier)}</strong>
                  </>
                )}
              </div>
            </div>

            <div className="crash-info-grid">
              <div><Clock3 size={18} /><span>Round status</span><strong>{statusLabel}</strong></div>
              <div><Wallet size={18} /><span>Players</span><strong>{state?.activePlayers || 0}</strong></div>
              <div><ShieldCheck size={18} /><span>Seed hash</span><strong title={round?.serverSeedHash}>{round?.serverSeedHash?.slice(0, 12) || '—'}...</strong></div>
            </div>
          </section>

          <section className="crash-bet-card card">
            <div className="crash-bet-header">
              <div>
                <h2>Bet panel</h2>
                {user ? (
                  <p className="crash-wallet">Balance: <strong>{formatCurrency(user.wallet)}</strong></p>
                ) : (
                  <p className="crash-wallet">Login required to place real bets.</p>
                )}
              </div>
              <span className={`crash-mini-status crash-mini-status-${String(effectiveStatus).toLowerCase()}`}>{statusLabel}</span>
            </div>

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

              <div className="crash-bet-actions">
                {!user ? (
                  <Link className="btn btn-primary btn-full" to="/login">Login to play</Link>
                ) : (
                  <button className="btn btn-primary btn-full" type="submit" disabled={!canBet || submitting}>
                    {submitting ? 'Placing...' : effectiveStatus === 'WAITING' ? 'Place bet' : 'Wait for next round'}
                  </button>
                )}

                <button className="btn btn-soft btn-full crash-cashout-btn" type="button" onClick={cashout} disabled={!canCashout || cashoutLoading}>
                  {cashoutLoading ? 'Cashing out...' : `Cash out ${formatMultiplier(liveMultiplier)}`}
                </button>
              </div>
            </form>
          </section>
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
        {myBets.length ? (
          <div className="crash-bets-table">
            {myBets.map((bet) => (
              <div key={bet._id}>
                <span>{bet.roundId}</span>
                <em className={`bet-${bet.status?.toLowerCase()}`}>{bet.status}</em>
                <span>{formatCurrency(bet.amount)}</span>
                <span>{bet.payoutAmount ? `${formatCurrency(bet.payoutAmount)} @ ${formatMultiplier(bet.payoutMultiplier)}` : '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No crash bets yet" message="Place your first crash bet to see history here." />
        )}
      </section>
    </div>
  );
}
