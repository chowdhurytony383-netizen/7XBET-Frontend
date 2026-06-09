import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PgsoftAPI } from '../api/pgsoft.js';
import { getApiError } from '../api/client.js';
import './PgsoftGamePage.css';

export default function PgsoftGamePage() {
  const { gameId = '' } = useParams();
  const decodedGameId = useMemo(() => decodeURIComponent(gameId), [gameId]);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const launchGame = async () => {
    setLoading(true);
    setError('');
    setHtml('');

    try {
      const response = await PgsoftAPI.launchHtml({
        gameId: decodedGameId,
        language: 'en',
      });

      const content = response.data || '';
      if (!content || String(content).trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(content);
          throw new Error(parsed?.message || 'PG SOFT launch did not return HTML.');
        } catch (jsonError) {
          if (jsonError.message && jsonError.message !== 'Unexpected end of JSON input') throw jsonError;
        }
      }

      setHtml(content);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedGameId]);

  return (
    <main className="pgsoft-launch-page">
      <header className="pgsoft-launch-header">
        <Link to="/pgsoft-games" className="pgsoft-launch-back"><ArrowLeft size={18} /> PG SOFT Games</Link>
        <strong>Game ID: {decodedGameId}</strong>
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
            <p>Please wait while the game session is created securely.</p>
          </div>
        ) : error ? (
          <div className="pgsoft-launch-state">
            <h2>Game launch failed</h2>
            <p>{error}</p>
            <button type="button" onClick={launchGame}>Try again</button>
          </div>
        ) : (
          <iframe
            title={`PG SOFT ${decodedGameId}`}
            className="pgsoft-launch-frame"
            srcDoc={html}
            sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            allow="autoplay; fullscreen; screen-wake-lock"
          />
        )}
      </section>
    </main>
  );
}
