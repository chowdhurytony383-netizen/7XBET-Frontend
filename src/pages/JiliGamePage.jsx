import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Maximize2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { JiliAPI } from '../api/jili.js';
import { getApiError } from '../api/client.js';
import './JiliGamePage.css';

export default function JiliGamePage() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [launchUrl, setLaunchUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const title = useMemo(() => searchParams.get('title') || `JILI Game ${gameId}`, [gameId, searchParams]);

  const launchGame = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await JiliAPI.launch(gameId, {
        lang: searchParams.get('lang') || 'en-US',
        platform: /android|iphone|ipad|mobile/i.test(navigator.userAgent || '') ? 'MOBILE' : 'WEB',
      });
      const url = response.data?.launchUrl || response.data?.data?.launchUrl || '';
      if (!url) throw new Error('JILI launch URL was empty.');
      setLaunchUrl(url);
    } catch (err) {
      const message = getApiError(err, 'Unable to launch JILI game');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    launchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const openFullScreen = () => {
    const frame = document.querySelector('.jili-game-frame');
    if (frame?.requestFullscreen) frame.requestFullscreen();
  };

  return (
    <div className="jili-game-page">
      <div className="jili-game-topbar">
        <div className="jili-game-title">
          <span className="page-eyebrow">JILI Seamless Wallet</span>
          <h1>{title}</h1>
        </div>

        <div className="jili-game-actions">
          <button className="btn btn-soft jili-game-action-btn" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Back
          </button>
          <button className="btn btn-soft jili-game-action-btn" type="button" onClick={launchGame} disabled={loading}>
            <RefreshCw size={16} />
            Reload
          </button>
          <button className="btn btn-primary jili-game-action-btn" type="button" onClick={openFullScreen} disabled={!launchUrl}>
            <Maximize2 size={16} />
            Full
          </button>
        </div>
      </div>

      {error && (
        <div className="jili-game-error">
          <strong>Game launch failed.</strong>
          <span>{error}</span>
          <Link to="/slots">Back to slots</Link>
        </div>
      )}

      <div className="jili-game-shell">
        {loading ? (
          <div className="jili-game-loading">
            <div className="loader" />
            <p>Launching secure JILI game session...</p>
          </div>
        ) : launchUrl ? (
          <iframe
            className="jili-game-frame"
            src={launchUrl}
            title={title}
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
          />
        ) : null}
      </div>
    </div>
  );
}
