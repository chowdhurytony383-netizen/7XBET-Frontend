import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bomb, Gift, RotateCw, Sparkles } from 'lucide-react';
import { FreeSpinAPI } from '../api/freeSpin.js';
import { getApiError } from '../api/client.js';
import { enableLuckyWheelPushNotifications } from '../utils/pushNotifications.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDateTime } from '../utils/format.js';
import './FreeSpinPage.css';

const FALLBACK_SEGMENTS = [
  { id: 'seg-x2-a', label: '×2', active: true },
  { id: 'seg-50000', label: '50,000', active: false, locked: true },
  { id: 'seg-20', label: '20', active: true },
  { id: 'seg-bomb-a', label: '💣', active: true },
  { id: 'seg-15', label: '15', active: true },
  { id: 'seg-60', label: '60', active: true },
  { id: 'seg-bomb-b', label: '💣', active: true },
  { id: 'seg-30', label: '30', active: true },
  { id: 'seg-5', label: '5', active: true },
  { id: 'seg-0', label: '0', active: true },
  { id: 'seg-25000', label: '25,000', active: false, locked: true },
  { id: 'seg-10', label: '10', active: true },
  { id: 'seg-3', label: '3', active: true },
  { id: 'seg-x2-b', label: '×2', active: true },
  { id: 'seg-5000', label: '5,000', active: false, locked: true },
  { id: 'seg-bomb-c', label: '💣', active: false },
];

function formatCountdown(ms) {
  const safeMs = Math.max(0, Number(ms || 0));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(' : ');
}

function resultTitle(result, user) {
  if (!result) return 'Ready to spin?';
  if (result.resultType === 'BOMB') return 'Bomb blast!';
  if (result.resultType === 'EXTRA_SPINS') return '+2 free spins!';
  if (result.resultType === 'ZERO') return 'No reward this time';
  if (result.amount > 0) return `You won ${formatCurrency(result.amount, user)}!`;
  return result.message || 'Spin complete';
}

function resultMessage(result) {
  if (!result) return 'Every spin result is generated securely by the backend.';
  if (result.resultType === 'BOMB') return 'Bomb landed. No balance reward was added.';
  if (result.resultType === 'EXTRA_SPINS') return 'Two extra free spins were added to your account.';
  if (result.resultType === 'ZERO') return '0 landed. Try again when you have a free spin.';
  if (result.amount > 0) return 'Reward was added to your main wallet balance.';
  return result.message || 'Spin finished.';
}


function getDisplayLabel(rawLabel) {
  const normalized = String(rawLabel ?? '').trim();
  if (!normalized) return normalized;
  if (normalized === '50,000' || normalized === '50000') return '50K';
  if (normalized === '25,000' || normalized === '25000') return '25K';
  if (normalized === '5,000' || normalized === '5000') return '5K';
  if (normalized.toLowerCase() === 'bomb') return '💣';
  return normalized;
}

function getSegmentTone(segment) {
  const label = String(segment?.label ?? '').toLowerCase();
  if (segment?.locked || segment?.active === false) return 'locked';
  if (label.includes('💣') || label.includes('bomb')) return 'bomb';
  if (label.includes('×2') || label.includes('x2')) return 'boost';
  if (label === '0') return 'zero';
  if (label.includes('k') || label.includes(',')) return 'jackpot';
  return 'cash';
}

export default function FreeSpinPage() {
  const { user, refreshUser, setUser } = useAuth();
  const [account, setAccount] = useState(null);
  const [wheel, setWheel] = useState(FALLBACK_SEGMENTS);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [blast, setBlast] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const rotationRef = useRef(0);
  const resultTimerRef = useRef(null);
  const blastTimerRef = useRef(null);

  const segments = wheel?.length ? wheel : FALLBACK_SEGMENTS;
  const slice = 360 / segments.length;
  const canSpin = Number(account?.spinsAvailable || 0) > 0 && !spinning;
  const countdownMs = account?.nextFreeSpinAt ? new Date(account.nextFreeSpinAt).getTime() - now : 0;

  const wheelGradient = useMemo(() => {
    const activeA = '#1a86d4';
    const activeB = '#0c5f9e';
    const locked = '#1a2941';
    const dark = '#12385f';

    return segments.map((segment, index) => {
      const start = index * slice;
      const end = (index + 1) * slice;
      let color = index % 2 === 0 ? activeA : activeB;
      if (segment.locked || segment.active === false) color = locked;
      const labelText = String(segment.label).toLowerCase();
      if (labelText.includes('bomb') || labelText.includes('💣')) color = index % 2 === 0 ? '#113759' : '#0b2a43';
      if (String(segment.label) === '0') color = dark;
      return `${color} ${start}deg ${end}deg`;
    }).join(', ');
  }, [segments, slice]);

  const loadStatus = useCallback(async () => {
    setError('');
    try {
      const response = await FreeSpinAPI.status();
      const payload = response.data?.data || {};
      setAccount(payload.account || null);
      setWheel(payload.wheel?.length ? payload.wheel : FALLBACK_SEGMENTS);
      setRecent(payload.recent || []);
    } catch (err) {
      setError(getApiError(err, 'Free spin status load failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
  
  const enableSpinReadyNotification = async () => {
    try {
      const result = await enableLuckyWheelPushNotifications();
      if (result.enabled) toast.success('Lucky Wheel notification enabled');
      else toast.error('Notification could not be enabled');
    } catch (error) {
      toast.error(error?.message || 'Notification permission failed');
    }
  };

  return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (resultTimerRef.current) window.clearTimeout(resultTimerRef.current);
    if (blastTimerRef.current) window.clearTimeout(blastTimerRef.current);
  }, []);

  const animateToSegment = useCallback((segmentIndex) => {
    const safeIndex = Number.isInteger(segmentIndex) && segmentIndex >= 0 ? segmentIndex : 0;
    const segmentCenter = safeIndex * slice + slice / 2;
    const desiredRemainder = (360 - segmentCenter) % 360;
    const currentRemainder = ((rotationRef.current % 360) + 360) % 360;
    const delta = ((desiredRemainder - currentRemainder + 360) % 360) + 360 * 7;
    const nextRotation = rotationRef.current + delta;

    rotationRef.current = nextRotation;
    setRotation(nextRotation);
  }, [slice]);

  const handleSpin = async () => {
    if (!canSpin) return;

    setSpinning(true);
    setError('');
    setLastResult(null);
    setBlast(false);

    try {
      const response = await FreeSpinAPI.spin();
      const payload = response.data?.data || {};
      const result = payload.result || null;

      if (payload.wheel?.length) setWheel(payload.wheel);
      animateToSegment(result?.segmentIndex || 0);

      resultTimerRef.current = window.setTimeout(() => {
        setLastResult(result);
        setAccount(payload.account || null);
        if (payload.user) setUser(payload.user);
        if (result?.resultType === 'BOMB') {
          setBlast(true);
          blastTimerRef.current = window.setTimeout(() => setBlast(false), 1600);
        }
        refreshUser().catch(() => null);
        loadStatus().catch(() => null);
        setSpinning(false);
      }, 3400);
    } catch (err) {
      const detailsAccount = err?.response?.data?.details?.account;
      if (detailsAccount) setAccount(detailsAccount);
      setError(getApiError(err, 'Spin failed'));
      setSpinning(false);
    }
  };

  return (
    <main className="free-spin-page">
      <section className="free-spin-board">
        <div className="free-spin-headline">
          <div className="free-spin-title-wrap">
            <span className="free-spin-badge"><Gift size={15} /> Lucky Wheel</span>
            <h1>Free Spin</h1>
          </div>
        </div>

        <div className="free-spin-top-row compact">
          <div className="stat-box">
            <span className="free-spin-label">Available spins</span>
            <strong>{account?.spinsAvailable ?? (loading ? '…' : 0)}</strong>
          </div>
          <div className="stat-box">
            <span className="free-spin-label">Next free spin</span>
            <strong>{Number(account?.spinsAvailable || 0) > 0 ? 'Ready' : formatCountdown(countdownMs)}</strong>
          </div>
        </div>

        <div className="lucky-wheel-stage">
          <div className="lucky-wheel-pointer" aria-hidden="true" />
          <div
            className={`lucky-wheel-disc ${spinning ? 'is-spinning' : ''}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(from -90deg, ${wheelGradient})`,
            }}
          >
            {segments.map((segment, index) => {
              const angle = index * slice + slice / 2;
              const displayLabel = getDisplayLabel(segment.label);
              const tone = getSegmentTone(segment);
              return (
                <span
                  key={segment.id || `${segment.label}-${index}`}
                  className={`wheel-segment-text ${segment.locked || !segment.active ? 'is-locked' : ''} tone-${tone}`}
                  style={{ transform: `rotate(${angle}deg) translateY(calc(var(--label-distance) * -1)) rotate(${-angle}deg)` }}
                >
                  <span className="wheel-segment-chip">{displayLabel}</span>
                </span>
              );
            })}
            <div className="wheel-center-gem" aria-hidden="true" />
          </div>
          {blast && <div className="bomb-blast-animation" aria-live="polite">💥</div>}
        </div>

        <div className="free-spin-action-area">
          <button type="button" className="free-spin-button" disabled={!canSpin} onClick={handleSpin}>
            {spinning ? <><RotateCw size={18} className="spin-icon" /> Spinning...</> : 'SPIN FOR FREE'}
          </button>

          {error && <p className="free-spin-error">{error}</p>}
        </div>
      </section>

      {lastResult && (
        <section className="free-spin-result-card">
          <div className="free-spin-result-icon">
            {lastResult?.resultType === 'BOMB' ? <Bomb size={24} /> : <Sparkles size={24} />}
          </div>
          <div>
            <h2>{resultTitle(lastResult, user)}</h2>
            <p>{resultMessage(lastResult)}</p>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="free-spin-info-grid free-spin-info-grid--single">
          <article className="free-spin-info-card compact-card">
            <h3>Recent spins</h3>
            <div className="recent-spin-list">
              {recent.slice(0, 3).map((item) => (
                <div key={item._id || item.createdAt} className="recent-spin-row">
                  <span className="recent-spin-value">{getDisplayLabel(item.label)}</span>
                  <small>{formatDateTime(item.createdAt)}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
