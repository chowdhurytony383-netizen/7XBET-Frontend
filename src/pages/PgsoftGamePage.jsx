import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PgsoftAPI } from '../api/pgsoft.js';
import { getApiError } from '../api/client.js';
import { getSavedSiteLanguage } from '../utils/languages.js';
import './PgsoftGamePage.css';

export default function PgsoftGamePage() {
  const { gameId = '' } = useParams();
  const decodedGameId = useMemo(() => decodeURIComponent(gameId), [gameId]);
  const [launchUrl, setLaunchUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const launchGame = async () => {
    setLoading(true);
    setError('');
    setLaunchUrl('');

    try {
      const response = await PgsoftAPI.createLaunchTicket({
        gameId: decodedGameId,
        language: getSavedSiteLanguage(),
      });
      const nextUrl = response.data?.data?.launchUrl;
      if (!nextUrl) throw new Error('PG SOFT launch URL was not returned.');
      setLaunchUrl(nextUrl);
    } catch (err) {
      const message = getApiError(err, 'PG SOFT game launch failed');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    launchGame();
    // A reload must create a fresh one-time launch ticket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedGameId]);

  return (
    <main className="pgsoft-launch-page">
      <header className="pgsoft-launch-header">
        <Link to="/pgsoft-games" className="pgsoft-launch-back"><ArrowLeft size={18} /> PG SOFT Games</Link>
        <strong>{decodedGameId === 'lobby' ? 'PG SOFT Lobby' : `Game ID: ${decodedGameId}`}</strong>
        <button type="button" onClick={launchGame} disabled={loading}>
          {loading ? <Loader2 size={17} className="pgsoft-spin" /> : <RefreshCcw size={17} />}
          Reload
        </button>
      </header>

      <section className="pgsoft-launch-frame-wrap">
        {loading ? (
          <div className="pgsoft-launch-state">
            <Loader2 size={34} className="pgsoft-spin" />
            <h2>Launching PG SOFT game...</h2>
            <p>Please wait while the secure game session is created.</p>
          </div>
        ) : error ? (
          <div className="pgsoft-launch-state">
            <h2>Game launch failed</h2>
            <p>{error}</p>
            <button type="button" onClick={launchGame}>Try again</button>
          </div>
        ) : (
          <iframe
            key={launchUrl}
            title={`PG SOFT ${decodedGameId}`}
            className="pgsoft-launch-frame"
            src={launchUrl}
            allow="web-share *; clipboard-write *; screen-wake-lock *; fullscreen *"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </section>
    </main>
  );
}
