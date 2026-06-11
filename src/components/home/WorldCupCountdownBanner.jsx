import { useEffect, useMemo, useState } from 'react';
import './WorldCupCountdownBanner.css';

// First match countdown target.
// Kept in UTC so every visitor sees the same countdown moment.
const FIRST_MATCH_UTC = '2026-06-11T19:00:00Z';

function getCountdownParts(targetTime) {
  const diffMs = Math.max(0, targetTime - Date.now());
  const totalSeconds = Math.floor(diffMs / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isStarted: diffMs <= 0,
  };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export default function WorldCupCountdownBanner() {
  const targetTime = useMemo(() => new Date(FIRST_MATCH_UTC).getTime(), []);
  const [timeLeft, setTimeLeft] = useState(() => getCountdownParts(targetTime));

  useEffect(() => {
    const tick = () => setTimeLeft(getCountdownParts(targetTime));
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  return (
    <section className="wc-countdown-banner" aria-label="FIFA World Cup 2026 countdown">
      <img
        className="wc-countdown-banner-image"
        src="/images/promos/fifa-world-cup-2026-clean-live-countdown-bg.png"
        alt="FIFA World Cup 2026"
        loading="eager"
        decoding="async"
      />

      <div className="wc-countdown-live-panel" aria-live="polite">
        <div className="wc-countdown-label">
          {timeLeft.isStarted ? 'MATCH STARTED' : 'FIRST MATCH STARTS IN'}
        </div>

        {!timeLeft.isStarted ? (
          <div className="wc-countdown-grid">
            <div className="wc-countdown-box">
              <strong>{timeLeft.days}</strong>
              <span>DAYS</span>
            </div>
            <div className="wc-countdown-box">
              <strong>{pad(timeLeft.hours)}</strong>
              <span>HOURS</span>
            </div>
            <div className="wc-countdown-box">
              <strong>{pad(timeLeft.minutes)}</strong>
              <span>MINUTES</span>
            </div>
            <div className="wc-countdown-box">
              <strong>{pad(timeLeft.seconds)}</strong>
              <span>SECONDS</span>
            </div>
          </div>
        ) : (
          <div className="wc-countdown-live">LIVE NOW</div>
        )}
      </div>
    </section>
  );
}
