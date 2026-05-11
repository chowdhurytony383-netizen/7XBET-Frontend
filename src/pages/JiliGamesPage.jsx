import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Play } from 'lucide-react';
import { JiliAPI } from '../api/jili.js';
import { getApiError } from '../api/client.js';
import './JiliGamesPage.css';

const fallbackGames = [
  { GameId: 49, Name: 'Super Ace' },
  { GameId: 109, Name: 'Fortune Gems' },
  { GameId: 223, Name: 'Fortune Gems 2' },
  { GameId: 27, Name: 'Seven Seven Seven' },
  { GameId: 51, Name: 'Money Coming' },
  { GameId: 102, Name: 'Roma X' },
];

function normalizeGame(raw = {}) {
  const gameId = raw.GameId || raw.gameId || raw.GameID || raw.id || raw.game;
  const name = raw.Name || raw.GameName || raw.name || raw.gameName || `JILI Game ${gameId}`;
  const type = raw.Type || raw.type || raw.Category || raw.category || 'JILI';
  const image = raw.Image || raw.image || raw.Icon || raw.icon || '';
  return { gameId, name, type, image };
}

export default function JiliGamesPage() {
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await JiliAPI.games();
        const list = response.data?.games || response.data?.data || [];
        if (!cancelled) setGames(Array.isArray(list) && list.length ? list : fallbackGames);
      } catch (err) {
        if (!cancelled) {
          setError(getApiError(err, 'Using default JILI game list until provider game list is available.'));
          setGames(fallbackGames);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filteredGames = useMemo(() => {
    const text = query.trim().toLowerCase();
    const normalized = games.map(normalizeGame).filter((game) => game.gameId);
    if (!text) return normalized;
    return normalized.filter((game) => `${game.name} ${game.gameId} ${game.type}`.toLowerCase().includes(text));
  }, [games, query]);

  return (
    <div className="page-stack jili-games-page">
      <section className="jili-games-hero">
        <div>
          <span className="page-eyebrow">JILI Seamless Wallet</span>
          <h1>JILI Games</h1>
          <p>Play JILI slots and casino games using the 7XBET single wallet balance.</p>
        </div>
      </section>

      <div className="jili-games-filter">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search JILI games" />
      </div>

      {error && <div className="jili-games-note">{error}</div>}

      {loading ? (
        <div className="card center-screen" style={{ minHeight: 260 }}><div className="loader" /></div>
      ) : (
        <div className="jili-games-grid">
          {filteredGames.map((game) => (
            <Link
              className="jili-game-card"
              key={`${game.gameId}-${game.name}`}
              to={`/jili/${game.gameId}?title=${encodeURIComponent(game.name)}`}
            >
              <div className="jili-game-card-media">
                {game.image ? <img src={game.image} alt={game.name} /> : <Gamepad2 size={48} />}
              </div>
              <div className="jili-game-card-body">
                <span>Game ID: {game.gameId}</span>
                <h3>{game.name}</h3>
                <p>{game.type}</p>
                <strong>Play <Play size={16} /></strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
