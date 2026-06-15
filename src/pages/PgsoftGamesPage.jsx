import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { PgsoftAPI } from '../api/pgsoft.js';
import { getApiError } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import './PgsoftGamesPage.css';

function normalizeGames(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.games)) return payload.games;
  if (Array.isArray(payload?.data?.games)) return payload.data.games;
  return [];
}

export default function PgsoftGamesPage() {
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [integration, setIntegration] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadGames() {
      setLoading(true);
      setError('');
      try {
        const response = await PgsoftAPI.games();
        if (mounted) {
          setGames(normalizeGames(response.data));
          setIntegration(response.data?.integration || null);
        }
      } catch (err) {
        if (mounted) setError(getApiError(err, 'Unable to load PG SOFT games'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadGames();
    return () => { mounted = false; };
  }, []);

  const filteredGames = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return games;
    return games.filter((game) => {
      const haystack = `${game.title || ''} ${game.name || ''} ${game.category || ''} ${game.id || ''}`.toLowerCase();
      return haystack.includes(text);
    });
  }, [games, query]);

  return (
    <div className="page-stack pgsoft-page">
      <PageHeader eyebrow="Casino provider" title="PG SOFT Games" />

      <section className="pgsoft-hero-card">
        <div className="pgsoft-hero-icon"><Sparkles size={30} /></div>
        <div>
          <h2>Premium mobile slot games</h2>
          <p>
            PG SOFT games will open through Seamless Wallet Mode. Your 7XBET main wallet will be used for bet and win settlement.
          </p>
        </div>
        <span className="pgsoft-hero-badge"><ShieldCheck size={17} /> Seamless Wallet</span>
      </section>

      {integration && !integration.configured && (
        <div className="auth-message">PG SOFT provider credentials are still pending. The lobby will become playable after the backend environment values are added.</div>
      )}

      <div className="pgsoft-filter">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search PG SOFT games" />
      </div>

      {error && <div className="auth-message">{error}</div>}

      {loading ? (
        <div className="card center-screen" style={{ minHeight: 260 }}><div className="loader" /></div>
      ) : filteredGames.length ? (
        <div className="pgsoft-games-grid">
          {filteredGames.map((game) => {
            const id = String(game.id || game.gameId || game.code || '');
            const title = game.title || game.name || `PG SOFT ${id}`;
            return (
              <Link to={`/pgsoft/${encodeURIComponent(id)}`} key={id || title} className="pgsoft-game-card">
                <div className="pgsoft-game-media">
                  <img src={game.image || '/images/others/banner1.png'} alt={title} />
                  <span><Gamepad2 size={18} /></span>
                </div>
                <div className="pgsoft-game-body">
                  <small>{game.category || 'PG SOFT'}</small>
                  <h3>{title}</h3>
                  <p>{game.description || 'Tap to launch this PG SOFT game.'}</p>
                  <strong>Play now</strong>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No PG SOFT games found" message="Update PGSOFT_GAME_LIST after PG SOFT provides the official game IDs." />
      )}
    </div>
  );
}
