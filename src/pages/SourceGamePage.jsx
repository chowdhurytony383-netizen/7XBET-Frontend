import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Maximize2, RefreshCw } from 'lucide-react';
import { SourceGamesAPI } from '../api/sourceGames.js';
import { getApiError } from '../api/client.js';
import './SourceGamePage.css';

const sourceGameTitles = {
  fortunetiger: 'Fortune Tiger',
};

export default function SourceGamePage() {
  const { gameCode } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [frameKey, setFrameKey] = useState(1);

  const title = sourceGameTitles[gameCode] || gameCode;

  const iframeUrl = useMemo(() => {
    const token = session?.token || '';
    return `/originals/${gameCode}/index.html?token=${encodeURIComponent(token)}`;
  }, [gameCode, session]);

  const loadSession = async () => {
    setError('');

    try {
      const response = await SourceGamesAPI.session(gameCode);
      setSession(response.data?.data || response.data || null);
    } catch (err) {
      setError(getApiError(err, 'Unable to create game session'));
    }
  };

  useEffect(() => {
    loadSession();
  }, [gameCode]);

  const reloadGame = () => {
    setFrameKey((current) => current + 1);
  };

  const openFullScreen = () => {
    const frame = document.querySelector('.source-game-frame');
    if (frame?.requestFullscreen) frame.requestFullscreen();
  };

  return (
    <div className="source-game-page">
      <div className="source-game-topbar">
        <Link className="btn btn-soft" to="/games">
          <ArrowLeft size={18} />
          Back to games
        </Link>

        <div>
          <span className="page-eyebrow">Source game</span>
          <h1>{title}</h1>
        </div>

        <div className="source-game-actions">
          <button className="btn btn-soft" type="button" onClick={reloadGame}>
            <RefreshCw size={18} />
            Reload
          </button>

          <button className="btn btn-primary" type="button" onClick={openFullScreen}>
            <Maximize2 size={18} />
            Full screen
          </button>
        </div>
      </div>

      {error && <div className="auth-message">{error}</div>}

      <div className="source-game-shell">
        <iframe
          key={frameKey}
          className="source-game-frame"
          src={iframeUrl}
          title={title}
          allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}