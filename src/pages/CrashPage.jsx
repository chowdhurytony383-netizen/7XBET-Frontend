import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Maximize2, RefreshCw, Rocket } from 'lucide-react';

import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

import './CrashPage.css';

export default function CrashPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [launchUrl, setLaunchUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const launchGame = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/games/7x-crush/launch');
      const payload = response.data?.data || response.data || {};
      const url = payload.launchUrl || payload.url || payload.gameUrl || '';

      if (!url) {
        throw new Error('Crush provider did not return a launch URL.');
      }

      setLaunchUrl(url);
      setSessionId(payload.sessionId || '');
      setGameCode(payload.gameCode || '7x-crush');
    } catch (err) {
      const message = getApiError(err, 'Unable to launch Crush Game.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      launchGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const openFullScreen = () => {
    const frame = document.querySelector('.crush-provider-frame');
    if (frame?.requestFullscreen) frame.requestFullscreen();
  };

  if (authLoading) {
    return (
      <div className="crush-provider-page">
        <div className="crush-provider-card">
          <div className="crush-provider-loader" />
          <h1>Loading Crush Game...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="crush-provider-page">
        <div className="crush-provider-card">
          <Rocket size={42} />
          <h1>7X Crush Game</h1>
          <p>Please login to launch the secure Crush Game session.</p>
          <div className="crush-provider-actions">
            <Link className="crush-provider-btn secondary" to="/">
              <ArrowLeft size={18} />
              Back home
            </Link>
            <Link className="crush-provider-btn primary" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crush-provider-page">
      <div className="crush-provider-topbar">
        <Link className="crush-provider-btn secondary" to="/">
          <ArrowLeft size={18} />
          Back
        </Link>

        <div className="crush-provider-title">
          <span>Provider Game</span>
          <h1>7X Crush Game</h1>
          {sessionId ? <small>Session: {sessionId}</small> : null}
          {gameCode ? <small>Game: {gameCode}</small> : null}
        </div>

        <div className="crush-provider-actions">
          <button className="crush-provider-btn secondary" type="button" onClick={launchGame} disabled={loading}>
            <RefreshCw size={16} />
            Reload
          </button>
          <button className="crush-provider-btn primary" type="button" onClick={openFullScreen} disabled={!launchUrl}>
            <Maximize2 size={16} />
            Full
          </button>
        </div>
      </div>

      {error ? (
        <div className="crush-provider-error">
          <strong>Game launch failed.</strong>
          <span>{error}</span>
          <button className="crush-provider-btn primary" type="button" onClick={launchGame} disabled={loading}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="crush-provider-shell">
        {loading && !launchUrl ? (
          <div className="crush-provider-card">
            <div className="crush-provider-loader" />
            <h2>Launching secure session...</h2>
            <p>Please wait while we connect to the Crush provider.</p>
          </div>
        ) : launchUrl ? (
          <iframe
            className="crush-provider-frame"
            src={launchUrl}
            title="7X Crush Game"
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
          />
        ) : (
          <div className="crush-provider-card">
            <Rocket size={42} />
            <h2>Ready to play</h2>
            <p>Tap launch to open the Crush Game.</p>
            <button className="crush-provider-btn primary" type="button" onClick={launchGame} disabled={loading}>
              Launch game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
