import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Clock3, History, Plane, ShieldCheck, Sparkles, Wallet, Wifi, WifiOff } from 'lucide-react';
import { CrashAPI } from '../api/crash.js';
import { getApiError } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import { getCrashSocket } from '../socket/crashSocket.js';
import './CrashPage.css';

function formatMultiplier(value) {
  const number = Number(value || 1);
  return `${number.toFixed(2)}x`;
}

function getRoundStatusLabel(round, status, multiplier) {
  if (!round) return 'Loading';
  if (status === 'WAITING') return 'Betting open';
  if (status === 'RUNNING') return 'Flying';
  if (status === 'CRASHED') return `Crashed at ${formatMultiplier(round.crashMultiplier || multiplier)}`;
  return status || 'Loading';
}

function asDateMs(value) {
  const time = new Date(value || Date.now()).getTime();
  return Number.isFinite(time) ? time : Date.now();
}

export default function CrashPage() {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState(null);
  const [amount, setAmount] = useState('100');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [lastTick, setLastTick] = useState(null);
  const [now, setNow] = useState(Date.now());

  const round = state?.round;
  const userBet = state?.userBet;
  const recentRounds = state?.recentRounds || [];
  const myBets = state?.myBets || [];
  const effectiveStatus = lastTick?.roundId === round?.roundId ? lastTick.status : round?.status;
  const liveMultiplier = Number(lastTick?.roundId === round?.roundId ? lastTick.currentMultiplier : round?.currentMultiplier || 1);
  const statusLabel = getRoundStatusLabel(round, effectiveStatus, liveMultiplier);

  const countdown = useMemo(() => {
    if (!round || effectiveStatus !== 'WAITING') return 0;
    return Math.max(0, Math.ceil((asDateMs(round.startsAt) - now) / 1000));
  }, [round, effectiveStatus, now]);

  const planeProgress = useMemo(() => {
    if (!round) return 0;
    if (effectiveStatus === 'WAITING') return Math.max(0, Math.min(100, (4 - countdown) * 18));
    if (effectiveStatus === 'CRASHED') return 100;
    return Math.min(100, Math.max(8, (liveMultiplier - 1) * 34));
  }, [round, countdown, liveMultiplier, effectiveStatus]);

  const canBet = Boolean(user && effectiveStatus === 'WAITING' && !userBet);
  const canCashout = Boolean(user && effectiveStatus === 'RUNNING' && userBet?.status === 'ACTIVE');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const socket = getCrashSocket();

    const applyState = (payload) => {
      if (!active || !payload?.round) return;
      setState((current) => ({ ...(current || {}), ...payload }));
      setLastTick(null);
      setLoading(false);
      setSocketError('');
    };

    const applyTick = (payload) => {
      if (!active || !payload) return;
      setLastTick(payload);
      setLoading(false);
    };

    const onConnect = () => {
      setConnected(true);
      setSocketError('');
      socket.emit('crash:join', {}, (payload) => applyState(payload));
    };

    const onDisconnect = () => setConnected(false);

    const onError = (payload) => {
      const message = payload?.message || 'Crash game error';
      setSocketError(message);
      toast.error(message);
    };

    const onBetPlaced = async (payload) => {
      toast.success(payload?.message || 'Bet placed');
      await refreshUser?.().catch(() => null);
      socket.emit('crash:join', {}, (nextState) => applyState(nextState));
    };

    const onCashout = async (payload) => {
      toast.success(payload?.message || 'Cashout successful');
      await refreshUser?.().catch(() => null);
      socket.emit('crash:join', {}, (nextState) => applyState(nextState));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', (error) => {
      setConnected(false);
      setSocketError(error?.message || 'Realtime connection failed');
    });
    socket.on('crash:state', applyState);
    socket.on('crash:tick', applyTick);
    socket.on('crash:crashed', () => socket.emit('crash:join', {}, (payload) => applyState(payload)));
    socket.on('crash:error', onError);
    socket.on('crash:bet:placed', onBetPlaced);
    socket.on('crash:cashout:success', onCashout);

    socket.connect();

    CrashAPI.state()
      .then((response) => applyState(response.data))
      .catch((error) => setSocketError(getApiError(error, 'Unable to load crash game')))
      .finally(() => setLoading(false));

    return () => {
      active = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error');
      socket.off('crash:state', applyState);
      socket.off('crash:tick', applyTick);
      socket.off('crash:crashed');
      socket.off('crash:error', onError);
      socket.off('crash:bet:placed', onBetPlaced);
      socket.off('crash:cashout:success', onCashout);
    };
  }, [refreshUser]);

  const emitWithAck = (event, payload) => new Promise((resolve, reject) => {
    const socket = getCrashSocket();
    if (!socket.connected) {
      reject(new Error('Realtime connection is not connected yet'));
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
      await emitWithAck('crash:placeBet', { amount: Number(amount), autoCashout: Number(autoCashout || 0) });
    } catch (error) {
      toast.error(error.message || 'Unable to place bet');
    } finally {
      setSubmitting(false);
    }
  };

  const cashout = async () => {
    setCashoutLoading(true);
    try {
      await emitWithAck('crash:cashout', {});
    } catch (error) {
      toast.error(error.message || 'Unable to cash out');
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
          {connected ? 'Realtime' : 'Connecting'}
        </span>
      </div>

      {socketError ? <div className="crash-error-line">{socketError}</div> : null}

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
                  <p className="crash-wallet">Balance: <strong>{formatCurrency(user.wallet)}</strong></p>
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
                  <strong>{formatCurrency(userBet.amount)}</strong>
                  <small>Status: {userBet.status}</small>
                  {userBet.payoutAmount ? <small>Payout: {formatCurrency(userBet.payoutAmount)} at {formatMultiplier(userBet.payoutMultiplier)}</small> : null}
                </div>
              ) : null}

              <div className="crash-bet-actions compact-bet-actions">
                {!user ? (
                  <Link className="btn btn-primary btn-full" to="/login">Login to play</Link>
                ) : (
                  <button className="btn btn-primary btn-full" type="submit" disabled={!canBet || submitting || !connected}>
                    {submitting ? 'Placing...' : effectiveStatus === 'WAITING' ? 'Place bet' : 'Wait for next round'}
                  </button>
                )}

                <button className="btn btn-soft btn-full crash-cashout-btn" type="button" onClick={cashout} disabled={!canCashout || cashoutLoading || !connected}>
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
