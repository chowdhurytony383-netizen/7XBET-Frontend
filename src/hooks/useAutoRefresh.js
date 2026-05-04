import { useEffect, useRef } from 'react';

export default function useAutoRefresh(callback, options = {}) {
  const {
    enabled = true,
    intervalMs = 1000,
    runWhenHidden = false,
    runOnFocus = true,
  } = options;

  const callbackRef = useRef(callback);
  const runningRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || typeof callbackRef.current !== 'function') return undefined;

    const tick = async () => {
      if (!mountedRef.current || runningRef.current) return;
      if (!runWhenHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      runningRef.current = true;
      try {
        await callbackRef.current({ silent: true, source: 'auto-refresh' });
      } catch (_) {
        // Keep the panel stable during temporary network errors.
      } finally {
        runningRef.current = false;
      }
    };

    const timer = window.setInterval(tick, intervalMs);

    const handleFocus = () => {
      if (runOnFocus) tick();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, intervalMs, runOnFocus, runWhenHidden]);

  return null;
}
