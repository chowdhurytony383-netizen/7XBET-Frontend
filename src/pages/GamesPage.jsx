import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { GamesAPI } from '../api/games.js';
import { getApiError } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import GameCard from '../components/GameCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import './GamesPage.css';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.games)) return payload.games;
  if (Array.isArray(payload?.data?.games)) return payload.data.games;
  return [];
}

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadGames = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await GamesAPI.all();
      setGames(normalizeList(response.data));
    } catch (err) {
      setError(getApiError(err, 'Unable to load games'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGames(); }, []);

  const filteredGames = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return games;
    return games.filter((game) => String(game.displayName || game.name || '').toLowerCase().includes(text));
  }, [games, query]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Game lobby"
        title="Games"
        description="Only backend games are shown here. Add, edit or deactivate game records in the backend/admin system to control this page."
        actions={<button className="btn btn-soft" onClick={loadGames}><RefreshCw size={18} /> Refresh</button>}
      />
      <div className="games-filter">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games" />
      </div>
      {error && <div className="auth-message">{error}</div>}
      {loading ? (
        <div className="card center-screen" style={{ minHeight: 280 }}><div className="loader" /></div>
      ) : filteredGames.length ? (
        <div className="games-grid">
          {filteredGames.map((game) => <GameCard key={game._id || game.name} game={game} />)}
        </div>
      ) : (
        <EmptyState title="No games found" message="No game records matched the current search." />
      )}
    </div>
  );
}
