import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Clock3, History, Plane, ShieldCheck, Sparkles, Wallet, Wifi, WifiOff } from 'lucide-react';
import { API_ORIGIN } from '../api/client.js';
import { CrashAPI } from '../api/crash.js';
import { getApiError } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import './CrashPage.css';

const GROWTH_BASE_SECONDS = 4.5;
const GROWTH_POWER = 1.45;

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

function safeCurrency(value, user) {
  try {
    return formatCurrency(value, user);
  } catch (_) {
    const amount = Number(value);
    return Number.isFinite(amount) ? String(amount) : '0';
  }
}

function getEffectiveStatus(round, currentTime, tick) {
  if (tick?.roundId && tick?.roundId === round?.roundId && tick?.status) return tick.status;
  if (!round) return 'LOADING';
  if (round.status === 'CRASHED') return 'CRASHED';
  if (round.status === 'WAITING' && currentTime >= asDateMs(round.startsAt)) return 'RUNNING';
  if (round.status === 'RUNNING' && currentTime >= asDateMs(round.crashAt)) return 'CRASHED';
  return round.status || 'LOADING';
}

function getRoundStatusLabel(round, status, multiplier) {
  if (!round) return 'Loading';
  if (status === 'WAITING') return 'Betting open';
  if (status === 'RUNNING') return 'Flying';
  if (status === 'CRASHED') return `Crashed at ${formatMultiplier(round.crashMultiplier || multiplier)}`;
  return status || 'Loading';
}

function normalizeState(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload;
}

export default function CrashPage() {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState(null);
  const [amount, setAmount] = useState('100');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('Connecting realtime...');
  const [lastTick, setLastTick] = useState(null);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef(null);
  const pollerRef = useRef(null);

  const round = state?.round || null;
  const userBet = state?.userBet || null;
  const recentRounds = Array.isArray(state?.recentRounds) ? state.recentRounds : [];
  const myBets = Array.isArray(state?.myBets) ? state.myBets : [];

  const displayNow = now;
  const effectiveStatus = useMemo(() => getEffectiveStatus(round, displayNow, lastTick), [round, displayNow, lastTick]);

  const liveMultiplier = useMemo(() => {
    if (!round) return 1;

    if (lastTick?.roundId === round.roundId && Number(lastTick.currentMultiplier) > 0) {
      return Number(lastTick.currentMultiplier);
    }

    if (effectiveStatus === 'WAITING') return 1;

    const start = asDateMs(round.startsAt);
    const end = asDateMs(round.crashAt);
    const targetTime = effectiveStatus === 'CRASHED' ? Math.min(displayNow, end) : displayNow;
    const elapsedSeconds = Math.max(0, (targetTime - start) / 1000);
    const smoothValue = multiplierAtElapsedSeconds(elapsedSeconds);
    const serverCurrent = Number(round.currentMultiplier || 1);
    const revealedCrash = Number(round.crashMultiplier || 0);
    const maxValue = revealedCrash > 1 ? revealedCrash : Infinity;

    return Math.max(1, Math.min(maxValue, Math.max(smoothValue, serverCurrent)));
  }, [round, displayNow, effectiveStatus, lastTick]);

  const countdown = useMemo(() => {
    if (!round || effectiveStatus !== 'WAITING') return 0;
    return Math.max(0, Math.ceil((asDateMs(round.startsAt) - displayNow) / 1000));
  }, [round, effectiveStatus, displayNow]);

  const planeProgress = useMemo(() => {
    if (!round) return 0;
    if (effectiveStatus === 'WAITING') return Math.max(0, Math.min(100, (4 - countdown) * 18));
    if (effectiveStatus === 'CRASHED') return 100;
    return Math.min(100, Math.max(8, (liveMultiplier - 1) * 34));
  }, [round, countdown, liveMultiplier, effectiveStatus]);

  const statusLabel = getRoundStatusLabel(round, effectiveStatus, liveMultiplier);
  const canBet = Boolean(user && effectiveStatus === 'WAITING' && !userBet);
  const canCashout = Boolean(user && effectiveStatus === 'RUNNING' && userBet?.status === 'ACTIVE');

  const applyState = useCallback((payload) => {
    const next = normalizeState(payload);
    if (!next || !next.round) return;
    setState((current) => ({ ...(current || {}), ...next }));
    setLoading(false);
  }, []);

  const loadState = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await CrashAPI.state();
      applyState(response.data);
      if (!connected) setConnectionMessage('Realtime fallback active');
    } catch (error) {
      if (!silent) setConnectionMessage(getApiError(error, 'Unable to load crash game'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyState, connected]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const startPollingFallback = () => {
      window.clearInterval(pollerRef.current);
      loadState(true);
      pollerRef.current = window.setInterval(() => loadState(true), 900);
    };

    loadState();

    import('socket.io-client')
      .then(({ io }) => {
        if (!mounted) return;

        const socketUrl = import.meta.env.VITE_SOCKET_URL || API_ORIGIN;
        const socket = io(socketUrl, {
          path: '/socket.io',
          withCredentials: true,
          transports: ['websocket', 'polling'],
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (!mounted) return;
          setConnected(true);
          setConnectionMessage('Realtime connected');
          window.clearInterval(pollerRef.current);
          socket.emit('crash:join', {}, (payload) => applyState(payload));
        });

        socket.on('disconnect', () => {
          if (!mounted) return;
          setConnected(false);
          setConnectionMessage('Realtime disconnected, using fallback');
          startPollingFallback();
        });

        socket.on('connect_error', (error) => {
          if (!mounted) return;
          setConnected(false);
          setConnectionMessage(error?.message || 'Realtime connection failed, using fallback');
          startPollingFallback();
        });

        socket.on('crash:state', applyState);
        socket.on('crash:tick', (payload) => {
          if (!mounted || !payload) return;
          setLastTick(payload);
          setLoading(false);
        });
        socket.on('crash:crashed', () => socket.emit('crash:join', {}, (payload) => applyState(payload)));
        socket.on('crash:bet:placed', async (payload) => {
          toast.success(payload?.message || 'Bet placed');
          await refreshUser?.().catch(() => null);
          socket.emit('crash:join', {}, (nextState) => applyState(nextState));
        });
        socket.on('crash:cashout:success', async (payload) => {
          toast.success(payload?.message || 'Cashout successful');
          await refreshUser?.().catch(() => null);
          socket.emit('crash:join', {}, (nextState) => applyState(nextState));
        });
        socket.on('crash:error', (payload) => toast.error(payload?.message || 'Crash game error'));

        socket.connect();
      })
      .catch(() => {
        if (!mounted) return;
        setConnected(false);
        setConnectionMessage('Realtime client unavailable, using fallback');
        startPollingFallback();
      });

    return () => {
      mounted = false;
      window.clearInterval(pollerRef.current);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [applyState, loadState, refreshUser]);

  const emitWithAck = (event, payload) => new Promise((resolve, reject) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      reject(new Error('Realtime connection is not ready'));
      return;
    }

    socket.timeout(5000).emit(event, payload, (error, response) => {
      if (error) reject(new Error('Request timed out'));
      else if (!response?.success) reject(new Error(response?.message || 'Request failed'));
      else resolve(response);
    });
  });

  const placeBet = async (event) => {
    event.preventDefault();
    if (!user) return toast.error('Please login before placing a bet');
    setSubmitting(true);
    try {
      if (socketRef.current?.connected) {
        await emitWithAck('crash:placeBet', { amount: Number(amount), autoCashout: Number(autoCashout || 0) });
      } else {
        await CrashAPI.placeBet({ amount: Number(amount), autoCashout: Number(autoCashout || 0) });
        toast.success('Bet placed');
      }
      await Promise.all([loadState(true), refreshUser?.().catch(() => null)]);
    } catch (error) {
      toast.error(error?.message || getApiError(error, 'Unable to place bet'));
    } finally {
      setSubmitting(false);
    }
  };

  const cashout = async () => {
    setCashoutLoading(true);
    try {
      if (socketRef.current?.connected) {
        await emitWithAck('crash:cashout', {});
      } else {
        await CrashAPI.cashout();
        toast.success('Cashout successful');
      }
      await Promise.all([loadState(true), refreshUser?.().catch(() => null)]);
    } catch (error) {
      toast.error(error?.message || getApiError(error, 'Unable to cash out'));
    } finally {
      setCashoutLoading(false);
    }
  };

  return (
    <div className="page-stack crash-page crash-page-compact">
      <div className="crash-page-titlebar">
        <h1>7X Crash</h1>
        <span className={`crash-connection ${connected ? 'online' : 'offline'}`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? 'Realtime' : 'Fallback'}
        </span>
      </div>

      {connectionMessage ? <div className="crash-error-line">{connectionMessage}</div> : null}

      {loading && !state ? (
        <div className="card center-screen"><div className="loader" /></div>
      ) : (
        <div className="crash-layout crash-layout-stacked compact-order-layout">
          <section className="crash-stage-card compact-stage-card">
            <div className="crash-stage-top compact-stage-top">
              <span className={`crash-status crash-status-${String(effectiveStatus).toLowerCase()}`}>
                <Activity size={14} /> {statusLabel}
              </span>
              <span className="crash-round-id">{round?.roundId || 'Preparing round'}</span>
            </div>

            <div className={`crash-stage crash-stage-${String(effectiveStatus).toLowerCase()} compact-stage`}>
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
                <Plane size={36} />
              </div>

              <div className="crash-multiplier">
                {effectiveStatus === 'WAITING' ? (
                  <>
                    <small>Next round in</small>
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
          </section>

          <section className="crash-bet-card card compact-bet-card">
            <div className="crash-bet-header compact-bet-header">
              <div>
                <h2>Bet panel</h2>
                {user ? (
                  <p className="crash-wallet">Balance: <strong>{safeCurrency(user.wallet, user)}</strong></p>
                ) : (
                  <p className="crash-wallet">Login required to place real bets.</p>
                )}
              </div>
              <span className={`crash-mini-status crash-mini-status-${String(effectiveStatus).toLowerCase()}`}>{statusLabel}</span>
            </div>

            <form onSubmit={placeBet} className="crash-bet-form compact-bet-form">
              <label>
                Bet amount
                <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" step="1" />
              </label>

              <label>
                Auto cashout
                <input value={autoCashout} onChange={(event) => setAutoCashout(event.target.value)} type="number" min="1.01" step="0.01" placeholder="Optional" />
              </label>

              <div className="crash-quick-buttons compact-quick-buttons">
                {[50, 100, 500, 1000].map((quickAmount) => (
                  <button key={quickAmount} type="button" onClick={() => setAmount(String(quickAmount))}>{quickAmount}</button>
                ))}
              </div>

              {userBet ? (
                <div className={`crash-current-bet crash-current-bet-${String(userBet.status || '').toLowerCase()}`}>
                  <span>Your current bet</span>
                  <strong>{safeCurrency(userBet.amount, user)}</strong>
                  <small>Status: {userBet.status}</small>
                  {userBet.payoutAmount ? <small>Payout: {safeCurrency(userBet.payoutAmount, user)} at {formatMultiplier(userBet.payoutMultiplier)}</small> : null}
                </div>
              ) : null}

              <div className="crash-bet-actions compact-bet-actions">
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

          <section className="crash-info-card card compact-info-card">
            <div className="crash-info-grid compact-info-grid">
              <div><Clock3 size={16} /><span>Round</span><strong>{statusLabel}</strong></div>
              <div><Wallet size={16} /><span>Players</span><strong>{state?.activePlayers || 0}</strong></div>
              <div><ShieldCheck size={16} /><span>Seed</span><strong title={round?.serverSeedHash}>{round?.serverSeedHash?.slice(0, 10) || '—'}...</strong></div>
            </div>
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
              <div key={bet._id || `${bet.roundId}-${bet.createdAt}`}>
                <span>{bet.roundId}</span>
                <em className={`bet-${String(bet.status || '').toLowerCase()}`}>{bet.status}</em>
                <span>{safeCurrency(bet.amount, user)}</span>
                <span>{bet.payoutAmount ? `${safeCurrency(bet.payoutAmount, user)} @ ${formatMultiplier(bet.payoutMultiplier)}` : '—'}</span>
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
