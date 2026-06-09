import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { CrashNativeAPI as CrashAPI } from '../api/crashNative.js';
import { getApiError } from '../api/client.js';
import { getCrashSocket, closeCrashSocket } from '../socket/crashSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import './CrashNativePage.css';

const SEATS = ['A', 'B'];
const DEFAULT_FORM = {
  A: { amount: 10, autoCashout: 2, autoEnabled: true, placing: false, cashing: false },
  B: { amount: 10, autoCashout: 2, autoEnabled: false, placing: false, cashing: false },
};

function money(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

function multiplier(value) {
  const number = Number(value || 1);
  return `${Number.isFinite(number) ? number.toFixed(2) : '1.00'}x`;
}

function normalizeRound(round) {
  if (!round) return null;
  return {
    ...round,
    status: String(round.status || 'WAITING').toUpperCase(),
    currentMultiplier: Number(round.currentMultiplier || round.multiplier || round.crashMultiplier || 1),
  };
}

function normalizeState(payload = {}) {
  const round = normalizeRound(payload.round);
  const userBets = payload.userBets || {
    A: payload.userBet || null,
    B: null,
  };

  return {
    ...payload,
    round,
    userBets: {
      A: userBets.A || null,
      B: userBets.B || null,
    },
    recentRounds: Array.isArray(payload.recentRounds) ? payload.recentRounds : [],
    myBets: Array.isArray(payload.myBets) ? payload.myBets : [],
  };
}

function pointAtProgress(p, box) {
  const drawP = Math.max(0.02, Math.min(0.97, p));
  const x = box.left + drawP * (box.width - box.left - box.right);
  const base = box.height - box.bottom;
  const top = box.top + 18;
  const y = base - 8 - Math.pow(drawP, 2.4) * (base - top) + Math.sin(drawP * Math.PI) * 12;
  return { x, y };
}

function drawCrashCanvas(canvas, state) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  const box = {
    width: w,
    height: h,
    left: Math.max(38, Math.min(62, w * 0.08)),
    right: Math.max(18, Math.min(38, w * 0.04)),
    top: 28,
    bottom: Math.max(34, Math.min(48, h * 0.13)),
  };

  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#030408');
  bg.addColorStop(0.55, '#08090e');
  bg.addColorStop(1, '#020203');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.82, h * 0.18, 0, w * 0.82, h * 0.18, w * 0.72);
  glow.addColorStop(0, 'rgba(255, 177, 35, 0.18)');
  glow.addColorStop(0.52, 'rgba(255, 130, 0, 0.045)');
  glow.addColorStop(1, 'rgba(255, 130, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const plotW = w - box.left - box.right;
  const plotH = h - box.top - box.bottom;

  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = box.left + (plotW * i) / 10;
    ctx.beginPath();
    ctx.moveTo(x, box.top);
    ctx.lineTo(x, h - box.bottom);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 178, 28, .12)' : 'rgba(255, 178, 28, .06)';
    ctx.stroke();
  }

  [1, 2, 3, 4, 5, 10].forEach((value, index) => {
    const y = h - box.bottom - (plotH * index) / 5;
    ctx.beginPath();
    ctx.moveTo(box.left, y);
    ctx.lineTo(w - box.right, y);
    ctx.strokeStyle = 'rgba(255, 178, 28, .12)';
    ctx.stroke();
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(245, 248, 255, .76)';
    ctx.fillText(`${value}.0x`, box.left - 8, y);
  });

  ctx.beginPath();
  ctx.moveTo(box.left, box.top);
  ctx.lineTo(box.left, h - box.bottom);
  ctx.lineTo(w - box.right, h - box.bottom);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 207, 77, .78)';
  ctx.shadowColor = 'rgba(255, 178, 28, .25)';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const round = state?.round;
  const status = round?.status || 'WAITING';
  const current = Number(round?.currentMultiplier || 1);
  const started = round?.startsAt ? new Date(round.startsAt).getTime() : Date.now();
  const elapsed = status === 'RUNNING' ? Math.max(0, Date.now() - started) : 0;
  const progress = status === 'RUNNING'
    ? Math.min(0.96, 0.04 + elapsed / 8500)
    : status === 'CRASHED'
      ? 0.96
      : 0.04;

  if (status !== 'WAITING') {
    const points = [];
    for (let i = 0; i <= 120; i += 1) {
      points.push(pointAtProgress((progress * i) / 120, box));
    }

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 111, 0, .28)';
    ctx.shadowColor = 'rgba(255, 111, 0, .4)';
    ctx.shadowBlur = 22;
    ctx.stroke();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffb21c';
    ctx.shadowColor = '#ffb21c';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const rocket = points[points.length - 1];
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(-0.48);
    ctx.font = `${Math.max(24, Math.min(50, w * 0.08))}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff8a00';
    ctx.shadowBlur = 18;
    ctx.fillText(status === 'CRASHED' ? '💥' : '🚀', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

export default function CrashNativePage() {
  const { user, refreshUser } = useAuth();
  const canvasRef = useRef(null);
  const stateRef = useRef({ round: null });
  const [gameState, setGameState] = useState(() => normalizeState({}));
  const [forms, setForms] = useState(DEFAULT_FORM);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currency = gameState.wallet?.currency || user?.currency || 'BDT';
  const walletBalance = gameState.wallet?.balance ?? user?.wallet ?? 0;
  const round = gameState.round;
  const roundStatus = round?.status || 'WAITING';
  const currentMultiplier = round?.currentMultiplier || 1;
  const recentMultipliers = useMemo(() => {
    const fromRounds = (gameState.recentRounds || []).map((item) => item.crashMultiplier || item.crashPoint).filter(Boolean);
    const fromRecent = Array.isArray(gameState.recent) ? gameState.recent : [];
    return (fromRounds.length ? fromRounds : fromRecent).slice(0, 12);
  }, [gameState.recentRounds, gameState.recent]);

  const applyState = useCallback((payload) => {
    setGameState((previous) => {
      const merged = normalizeState({ ...previous, ...payload });
      stateRef.current = merged;
      return merged;
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const response = await CrashAPI.state();
        if (!active) return;
        applyState(response.data || {});
      } catch (err) {
        if (active) setError(getApiError(err, 'Unable to load Crash Game'));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [applyState]);

  useEffect(() => {
    const socket = getCrashSocket();

    function onConnect() {
      setConnected(true);
      socket.emit('realtime:auth', {}, () => {
        socket.emit('crash:join', {}, (payload) => {
          if (payload) applyState(payload);
        });
      });
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onState(payload) {
      applyState(payload || {});
    }

    function onTick(payload = {}) {
      setGameState((previous) => {
        const nextRound = previous.round
          ? normalizeRound({ ...previous.round, ...payload, currentMultiplier: payload.currentMultiplier || payload.multiplier || previous.round.currentMultiplier })
          : null;
        const next = { ...previous, round: nextRound };
        stateRef.current = next;
        return next;
      });
    }

    function onBetPlaced(payload = {}) {
      if (payload.success) {
        toast.success(payload.message || 'Crash bet placed');
        refreshUser?.().catch(() => null);
      }
      if (payload.bet) {
        setGameState((previous) => {
          const userBets = { ...(previous.userBets || {}) };
          userBets[payload.bet.seat || 'A'] = payload.bet;
          const next = { ...previous, userBets, wallet: payload.wallet !== undefined ? { ...(previous.wallet || {}), balance: payload.wallet, currency } : previous.wallet };
          stateRef.current = next;
          return next;
        });
      }
    }

    function onCashout(payload = {}) {
      if (payload.success) {
        toast.success(payload.message || 'Cashout successful');
        refreshUser?.().catch(() => null);
      }
      if (payload.bet) {
        setGameState((previous) => {
          const userBets = { ...(previous.userBets || {}) };
          userBets[payload.bet.seat || 'A'] = payload.bet;
          const next = { ...previous, userBets, wallet: payload.wallet !== undefined ? { ...(previous.wallet || {}), balance: payload.wallet, currency } : previous.wallet };
          stateRef.current = next;
          return next;
        });
      }
    }

    function onErrorMessage(payload = {}) {
      toast.error(payload.message || 'Crash game error');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('crash:state', onState);
    socket.on('crash:tick', onTick);
    socket.on('crash:crashed', onState);
    socket.on('crash:bet:placed', onBetPlaced);
    socket.on('crash:cashout:success', onCashout);
    socket.on('crash:error', onErrorMessage);

    if (!socket.connected) socket.connect();
    else onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('crash:state', onState);
      socket.off('crash:tick', onTick);
      socket.off('crash:crashed', onState);
      socket.off('crash:bet:placed', onBetPlaced);
      socket.off('crash:cashout:success', onCashout);
      socket.off('crash:error', onErrorMessage);
      closeCrashSocket();
    };
  }, [applyState, currency, refreshUser]);

  useEffect(() => {
    let frame;
    const loop = () => {
      if (canvasRef.current) drawCrashCanvas(canvasRef.current, stateRef.current);
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const updateForm = (seat, patch) => {
    setForms((current) => ({
      ...current,
      [seat]: { ...current[seat], ...patch },
    }));
  };

  const adjustAmount = (seat, delta) => {
    updateForm(seat, { amount: Math.max(1, Number(forms[seat].amount || 0) + delta) });
  };

  const placeBet = async (seat) => {
    if (!user) {
      toast.error('Please login to play Crush Game');
      return;
    }

    if (roundStatus !== 'WAITING') {
      toast.error('Betting is closed for this round. Wait for the next round.');
      return;
    }

    const form = forms[seat];
    const payload = {
      seat,
      amount: Number(form.amount || 0),
      autoCashout: form.autoEnabled ? Number(form.autoCashout || 0) : 0,
    };

    updateForm(seat, { placing: true });
    try {
      const response = await CrashAPI.placeBet(payload);
      applyState(await CrashAPI.state().then((item) => item.data).catch(() => ({})));
      if (response.data?.message) toast.success(response.data.message);
      await refreshUser?.();
    } catch (err) {
      toast.error(getApiError(err, 'Unable to place crash bet'));
    } finally {
      updateForm(seat, { placing: false });
    }
  };

  const cashout = async (seat) => {
    if (!user) {
      toast.error('Please login to cash out');
      return;
    }

    updateForm(seat, { cashing: true });
    try {
      const response = await CrashAPI.cashout({ seat });
      if (response.data?.message) toast.success(response.data.message);
      applyState(await CrashAPI.state().then((item) => item.data).catch(() => ({})));
      await refreshUser?.();
    } catch (err) {
      toast.error(getApiError(err, 'Unable to cash out'));
    } finally {
      updateForm(seat, { cashing: false });
    }
  };

  const getSeatAction = (seat) => {
    const bet = gameState.userBets?.[seat];
    if (roundStatus === 'RUNNING' && bet?.status === 'ACTIVE') {
      return { label: 'CASH OUT', sub: `${multiplier(currentMultiplier)} now`, mode: 'cashout', disabled: forms[seat].cashing };
    }
    if (bet?.status === 'ACTIVE') {
      return { label: 'BET PLACED', sub: 'Waiting for round start', mode: 'none', disabled: true };
    }
    if (roundStatus !== 'WAITING') {
      return { label: 'BET NEXT', sub: 'Wait for next round', mode: 'none', disabled: true };
    }
    return { label: 'PLACE BET', sub: 'Bet before round starts', mode: 'bet', disabled: forms[seat].placing };
  };

  const roundMessage = useMemo(() => {
    if (!round) return 'Connecting to game engine...';
    if (roundStatus === 'WAITING') return `Next round in ${Math.max(0, Number(round.waitMsLeft || 0) / 1000).toFixed(1)}s`;
    if (roundStatus === 'RUNNING') return 'Cash out before crash';
    return `Crashed at ${multiplier(round.crashMultiplier || round.crashPoint || currentMultiplier)}`;
  }, [round, roundStatus, currentMultiplier]);

  if (loading) {
    return (
      <main className="crush-page-shell">
        <section className="crush-loading-card">
          <strong>7X Crush</strong>
          <p>Loading real wallet crash engine...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="crush-page-shell">
        <section className="crush-loading-card crush-error-card">
          <strong>7X Crush</strong>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
          <Link to="/">Go Home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="crush-page-shell">
      <section className="crush-machine panel-frame">
        <div className="crush-chart-card">
          <canvas ref={canvasRef} className="crush-canvas" aria-label="7X Crush graph" />
          <div className="crush-chart-overlay">
            <div className="crush-live-pill"><i /> <span>LIVE</span></div>
            <div className="crush-status-chip">{roundStatus}</div>
            <div className={`crush-multiplier ${roundStatus === 'CRASHED' ? 'crashed' : ''}`}>
              {roundStatus === 'CRASHED'
                ? `CRASHED ${multiplier(round?.crashMultiplier || round?.crashPoint || currentMultiplier)}`
                : multiplier(currentMultiplier)}
            </div>
            <div className="crush-countdown">{roundMessage}</div>
            <div className="crush-fair-card">
              <span>Hash</span>
              <strong>{round?.serverSeedHash ? `${round.serverSeedHash.slice(0, 18)}...${round.serverSeedHash.slice(-8)}` : 'Preparing...'}</strong>
            </div>
          </div>
        </div>

        <div className="crush-recent-row">
          <strong>RECENT</strong>
          <div>
            {recentMultipliers.length ? recentMultipliers.map((value, index) => (
              <span key={`${value}-${index}`} className={Number(value) >= 2 ? 'good' : 'bad'}>{multiplier(value)}</span>
            )) : <em>No recent rounds yet</em>}
          </div>
        </div>

        <div className="crush-bet-grid">
          {SEATS.map((seat) => {
            const form = forms[seat];
            const bet = gameState.userBets?.[seat];
            const action = getSeatAction(seat);
            return (
              <section className="crush-bet-card" key={seat}>
                <div className="crush-seat-title">
                  <span>Seat {seat}</span>
                  <em>{bet?.status === 'ACTIVE' ? 'ACTIVE' : 'READY'}</em>
                </div>

                <div className="crush-control-block">
                  <div className="crush-control-label">
                    <span>Bet Amount</span>
                    <small>{currency}</small>
                  </div>
                  <div className="crush-amount-control">
                    <button type="button" aria-label="Decrease bet amount" onClick={() => adjustAmount(seat, -1)} disabled={Boolean(bet?.status === 'ACTIVE')}>−</button>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.amount}
                      disabled={Boolean(bet?.status === 'ACTIVE')}
                      onChange={(event) => updateForm(seat, { amount: event.target.value })}
                    />
                    <button type="button" aria-label="Increase bet amount" onClick={() => adjustAmount(seat, 1)} disabled={Boolean(bet?.status === 'ACTIVE')}>+</button>
                    <b>{currency}</b>
                  </div>
                </div>

                <div className="crush-control-block">
                  <div className="crush-control-label">
                    <span>Auto Cashout</span>
                    <small>{form.autoEnabled ? 'Enabled' : 'Disabled'}</small>
                  </div>
                  <div className="crush-auto-control">
                    <input
                      type="number"
                      min="1.01"
                      step="0.01"
                      value={form.autoCashout}
                      disabled={!form.autoEnabled || Boolean(bet?.status === 'ACTIVE')}
                      onChange={(event) => updateForm(seat, { autoCashout: event.target.value })}
                    />
                    <button
                      type="button"
                      className={form.autoEnabled ? 'toggle-on' : ''}
                      disabled={Boolean(bet?.status === 'ACTIVE')}
                      onClick={() => updateForm(seat, { autoEnabled: !form.autoEnabled })}
                    >
                      {form.autoEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div className="crush-seat-meta">
                  {bet?.status === 'ACTIVE'
                    ? `Active bet: ${currency} ${money(bet.amount)}${bet.autoCashout ? ` · Auto ${multiplier(bet.autoCashout)}` : ''}`
                    : bet?.status === 'CASHED_OUT'
                      ? `Cashed out: ${currency} ${money(bet.payoutAmount)}`
                      : bet?.status === 'LOST'
                        ? `Lost at ${multiplier(bet.crashMultiplier)}`
                        : 'Ready for next round'}
                </div>
                <button
                  type="button"
                  className={`crush-action-btn ${action.mode === 'cashout' ? 'cashout' : ''}`}
                  disabled={action.disabled}
                  onClick={() => action.mode === 'cashout' ? cashout(seat) : action.mode === 'bet' ? placeBet(seat) : null}
                >
                  <span>{action.label}</span>
                  <small>{action.sub}</small>
                </button>
              </section>
            );
          })}
        </div>
      </section>

      <section className="crush-bottom-grid">
        <div className="crush-info-panel panel-frame">
          <h3>Round Information</h3>
          <div className="crush-stats-grid">
            <div><span>Active Bets</span><strong>{gameState.activeBets || 0}</strong></div>
            <div><span>Players</span><strong>{gameState.activePlayers || 0}</strong></div>
            <div><span>Total Stake</span><strong>{currency} {money(round?.totalBetAmount || 0)}</strong></div>
            <div><span>Total Payout</span><strong>{currency} {money(round?.totalPayoutAmount || 0)}</strong></div>
          </div>
        </div>

        <div className="crush-info-panel panel-frame">
          <h3>My Bets</h3>
          <div className="crush-history-list">
            {gameState.myBets?.length ? gameState.myBets.slice(0, 10).map((bet) => (
              <div key={bet._id || bet.id} className={`crush-history-item ${String(bet.status).toLowerCase()}`}>
                <div>
                  <strong>Seat {bet.seat || 'A'} · {currency} {money(bet.amount)}</strong>
                  <span>{bet.roundId}</span>
                </div>
                <div>
                  <b>{bet.status}</b>
                  <em>{bet.status === 'CASHED_OUT' ? `${currency} ${money(bet.payoutAmount)} @ ${multiplier(bet.payoutMultiplier)}` : bet.status === 'LOST' ? multiplier(bet.crashMultiplier) : '-'}</em>
                </div>
              </div>
            )) : <p className="crush-empty">No crash bets yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
