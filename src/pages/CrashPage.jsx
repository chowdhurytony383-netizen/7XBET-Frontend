import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Rocket } from 'lucide-react';

import api, { getApiError, getStoredRefreshToken, saveAuthTokens } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

import './CrashPage.css';

export default function CrashPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [launchUrl, setLaunchUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestLaunch = async () => {
    const response = await api.post('/games/7x-crush/launch');
    const payload = response.data?.data || response.data || {};
    const url = payload.launchUrl || payload.url || payload.gameUrl || '';

    if (!url) {
      throw new Error('Crush provider did not return a launch URL.');
    }

    return { payload, url };
  };

  const refreshSession = async () => {
    const refreshToken = getStoredRefreshToken();
    const response = await api.post(
      '/user/refresh-token',
      refreshToken ? { refreshToken } : {},
      { __skipAuthRefresh: true }
    );
    saveAuthTokens(response.data);
  };

  const launchGame = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError('');
    setLaunchUrl('');

    try {
      let result;

      try {
        result = await requestLaunch();
      } catch (err) {
        const message = getApiError(err, 'Unable to launch Crush Game.');
        const status = err?.response?.status;

        if (status === 401 || /jwt expired|session expired|token expired/i.test(message)) {
          await refreshSession();
          result = await requestLaunch();
        } else {
          throw err;
        }
      }

      const { payload, url } = result;
      setLaunchUrl(url);
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
    <div className="crush-provider-page crush-provider-page--compact">
      <div className="crush-provider-backbar">
        <Link className="crush-provider-btn secondary crush-provider-back-btn" to="/">
          <ArrowLeft size={18} />
          Back
        </Link>
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
