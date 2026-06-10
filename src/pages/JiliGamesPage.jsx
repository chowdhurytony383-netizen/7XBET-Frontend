import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Gamepad2, Play, Search } from 'lucide-react';
import { JiliAPI } from '../api/jili.js';
import { getApiError } from '../api/client.js';
import './JiliGamesPage.css';

const PAGE_SIZE = 60;

const CATEGORY_DEFINITIONS = [
  { key: 'all', label: 'All Games', shortLabel: 'All', icon: '🎮' },
  { key: 'slots', label: 'Slots', shortLabel: 'Slots', icon: '🎰' },
  { key: 'fish', label: 'Fishing', shortLabel: 'Fish', icon: '🐟' },
  { key: 'casino', label: 'Table / Casino', shortLabel: 'Casino', icon: '♦️' },
  { key: 'crash', label: 'Crash', shortLabel: 'Crash', icon: '🚀' },
  { key: 'cards', label: 'Card / Poker', shortLabel: 'Cards', icon: '♠️' },
  { key: 'arcade', label: 'Arcade / Lobby', shortLabel: 'Arcade', icon: '🕹️' },
];

const CATEGORY_BY_KEY = CATEGORY_DEFINITIONS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

function normalizeCategoryKey(value) {
  const key = String(value || 'all').trim().toLowerCase();
  return CATEGORY_BY_KEY[key] ? key : 'all';
}

const CATEGORY_ID_MAP = {
  1: 'slots',
  2: 'cards',
  3: 'arcade',
  5: 'fish',
  8: 'casino',
};

const fallbackGames = [
  { GameId: 49, Name: 'Super Ace', Type: 'slot', GameCategoryId: 1 },
  { GameId: 109, Name: 'Fortune Gems', Type: 'slot', GameCategoryId: 1 },
  { GameId: 223, Name: 'Fortune Gems 2', Type: 'slot', GameCategoryId: 1 },
  { GameId: 27, Name: 'Seven Seven Seven', Type: 'slot', GameCategoryId: 1 },
  { GameId: 51, Name: 'Money Coming', Type: 'slot', GameCategoryId: 1 },
  { GameId: 1, Name: 'Royal Fishing', Type: 'fish', GameCategoryId: 5 },
];


function normalizeImageGameId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return String(Number(raw));

  const match = raw.match(/(?:gameid|game|jili)[^0-9]{0,4}0*(\d{1,5})/i);
  if (match?.[1]) return String(Number(match[1]));

  return raw;
}

function isUsableImageValue(value) {
  if (!value || typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return false;
  if (/^(icon|download|material)$/i.test(text)) return false;
  return /^(https?:)?\/\//i.test(text) || text.startsWith('/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(text);
}

function buildJiliImageSources(raw = {}, gameId) {
  const providerGame = raw.config?.providerGame || {};
  const id = normalizeImageGameId(gameId);
  const localCandidates = id ? [
    `/images/jili/${id}.webp`,
    `/images/jili/${id}.png`,
    `/images/jili/${id}.jpg`,
    `/images/jili/jili-${id}.webp`,
    `/images/jili/jili-${id}.png`,
    `/images/jili/jili-${id}.jpg`,
  ] : [];
  const candidates = [
    ...localCandidates,
    raw.image,
    raw.Image,
    raw.icon,
    raw.Icon,
    raw.thumbnail,
    raw.thumb,
    raw.logo,
    raw.picture,
    raw.cover,
    raw.banner,
    raw.displayImage,
    raw.imageUrl,
    raw.iconUrl,
    raw.IconUrl,
    raw.GameIcon,
    raw.gameIcon,
    raw.config?.image,
    raw.config?.icon,
    raw.config?.thumbnail,
    raw.config?.imageUrl,
    raw.config?.iconUrl,
    providerGame.image,
    providerGame.Image,
    providerGame.icon,
    providerGame.Icon,
    providerGame.thumbnail,
    providerGame.imageUrl,
    providerGame.iconUrl,
    providerGame.IconUrl,
    providerGame.GameIcon,
    providerGame.gameIcon,
  ].filter(isUsableImageValue).map((item) => String(item).trim());

  return candidates.filter((item, index, all) => item && all.indexOf(item) === index);
}

function JiliGameImage({ game, size = 48 }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = game.imageSources || [];
  const src = sources[sourceIndex];

  if (!src) return <Gamepad2 size={size} />;

  return (
    <img
      src={src}
      alt={game.name}
      loading="lazy"
      decoding="async"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}

function cleanText(value = '') {
  return String(value || '').trim();
}

function pickName(raw = {}) {
  const candidates = [
    raw.displayName,
    raw.Name,
    raw.GameName,
    raw.name,
    raw.gameName,
    raw.title,
    raw.config?.providerGame?.Name,
    raw.config?.providerGame?.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim().replace(/^JILI\s+/i, '');
    if (candidate && typeof candidate === 'object') {
      const value = candidate['en-US'] || candidate.en_US || candidate.en || candidate.English || candidate['zh-CN'] || candidate['zh-TW'];
      if (value) return String(value).trim();
    }
  }

  return '';
}

function pickGameId(raw = {}) {
  return raw.GameId || raw.gameId || raw.GameID || raw.id || raw.game || raw.config?.gameId || raw.config?.providerGame?.GameId;
}

function getTypeSource(raw = {}) {
  return cleanText(
    raw.Type
    || raw.type
    || raw.GameType
    || raw.gameType
    || raw.Category
    || raw.category
    || raw.categoryLabel
    || raw.GameCategoryName
    || raw.gameCategoryName
    || raw.config?.categoryLabel
    || raw.config?.providerGame?.Type
    || raw.config?.providerGame?.type
    || raw.config?.providerGame?.Category
    || raw.config?.providerGame?.category
  );
}

function getCategoryId(raw = {}) {
  const value = raw.GameCategoryId
    || raw.gameCategoryId
    || raw.categoryId
    || raw.gameCategory
    || raw.config?.providerGame?.GameCategoryId
    || raw.config?.providerGame?.gameCategoryId;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function detectCategory(raw = {}) {
  const typeSource = getTypeSource(raw).toLowerCase();

  if (typeSource.includes('fish')) return 'fish';
  if (typeSource.includes('crash') || typeSource.includes('mines') || typeSource.includes('plinko') || typeSource.includes('limbo')) return 'crash';
  if (typeSource.includes('card') || typeSource.includes('poker') || typeSource.includes('rummy') || typeSource.includes('teenpatti') || typeSource.includes('andar')) return 'cards';
  if (typeSource.includes('slot')) return 'slots';
  if (typeSource.includes('arcade') || typeSource.includes('lobby')) return 'arcade';
  if (typeSource.includes('casino') || typeSource.includes('table') || typeSource.includes('bingo') || typeSource.includes('roulette') || typeSource.includes('baccarat') || typeSource.includes('sic bo') || typeSource.includes('keno')) return 'casino';

  return CATEGORY_ID_MAP[getCategoryId(raw)] || 'casino';
}

function normalizeGame(raw = {}) {
  const gameId = pickGameId(raw);
  const name = pickName(raw) || `JILI Game ${gameId}`;
  const category = detectCategory(raw);
  const definition = CATEGORY_BY_KEY[category] || CATEGORY_BY_KEY.casino;
  const imageSources = buildJiliImageSources(raw, gameId);
  const image = imageSources[0] || '';
  const sorting = Number(raw.Sorting ?? raw.sorting ?? raw.sortOrder ?? raw.config?.providerGame?.Sorting ?? 0);

  return {
    gameId,
    name,
    category,
    categoryLabel: definition.label,
    type: getTypeSource(raw) || definition.label,
    image,
    imageSources,
    sorting: Number.isFinite(sorting) ? sorting : 0,
    jp: Boolean(raw.JP || raw.jp || raw.config?.jp || raw.config?.providerGame?.JP),
    freeSpin: Boolean(raw.Freespin || raw.FreeSpin || raw.freespin || raw.config?.freeSpin || raw.config?.providerGame?.Freespin),
  };
}

function sortGames(a, b) {
  if (a.sorting !== b.sorting) return a.sorting - b.sorting;
  return Number(a.gameId || 0) - Number(b.gameId || 0);
}

export default function JiliGamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(() => normalizeCategoryKey(searchParams.get('category')));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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

  useEffect(() => {
    const categoryFromUrl = normalizeCategoryKey(searchParams.get('category'));
    setSelectedCategory((current) => (current === categoryFromUrl ? current : categoryFromUrl));
  }, [searchParams]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedCategory]);

  const changeCategory = (categoryKey) => {
    const nextCategory = normalizeCategoryKey(categoryKey);
    setSelectedCategory(nextCategory);

    const nextParams = new URLSearchParams(searchParams);
    if (nextCategory === 'all') nextParams.delete('category');
    else nextParams.set('category', nextCategory);

    setSearchParams(nextParams, { replace: true });
  };

  const normalizedGames = useMemo(() => {
    const seen = new Set();
    return games
      .map(normalizeGame)
      .filter((game) => game.gameId)
      .filter((game) => {
        const key = String(game.gameId);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(sortGames);
  }, [games]);

  const categoryCounts = useMemo(() => {
    const counts = CATEGORY_DEFINITIONS.reduce((acc, category) => {
      acc[category.key] = 0;
      return acc;
    }, {});

    counts.all = normalizedGames.length;
    for (const game of normalizedGames) {
      counts[game.category] = (counts[game.category] || 0) + 1;
    }

    return counts;
  }, [normalizedGames]);

  const filteredGames = useMemo(() => {
    const text = query.trim().toLowerCase();
    return normalizedGames.filter((game) => {
      const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!text) return true;
      return `${game.name} ${game.gameId} ${game.type} ${game.categoryLabel}`.toLowerCase().includes(text);
    });
  }, [normalizedGames, query, selectedCategory]);

  const activeCategory = CATEGORY_BY_KEY[selectedCategory] || CATEGORY_BY_KEY.all;
  // Keep the JILI games page clean: no big hero/category browser block.
  // Sidebar JILI Games, Slots and Live Casino now open directly to the compact game grid.
  const hideBrowseHeader = true;
  const visibleGames = filteredGames.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredGames.length;

  return (
    <div className={`page-stack jili-games-page jili-games-page--no-header ${hideBrowseHeader ? 'jili-games-page--compact' : ''}`}>
      {!hideBrowseHeader && (
        <>
          <section className="jili-games-hero">
            <div>
              <span className="page-eyebrow">JILI Seamless Wallet</span>
              <h1>JILI Games</h1>
              <p>Category অনুযায়ী JILI games দেখুন এবং 7XBET single wallet balance দিয়ে খেলুন।</p>
            </div>
            <div className="jili-games-hero-stat">
              <strong>{categoryCounts.all}</strong>
              <span>Total games</span>
            </div>
          </section>

          <section className="jili-category-panel">
            <div className="jili-category-header">
              <div>
                <span className="page-eyebrow">Categories</span>
                <h2>{activeCategory.label}</h2>
              </div>
              <span>{filteredGames.length} games</span>
            </div>

            <div className="jili-category-grid">
              {CATEGORY_DEFINITIONS.filter((category) => category.key === 'all' || categoryCounts[category.key] > 0).map((category) => (
                <button
                  type="button"
                  key={category.key}
                  className={`jili-category-card ${selectedCategory === category.key ? 'active' : ''}`}
                  onClick={() => changeCategory(category.key)}
                >
                  <span className="jili-category-icon">{category.icon}</span>
                  <span className="jili-category-name">{category.label}</span>
                  <strong>{categoryCounts[category.key] || 0}</strong>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="jili-games-filter">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by game name or ID" />
      </div>

      {error && <div className="jili-games-note">{error}</div>}

      {loading ? (
        <div className="card center-screen" style={{ minHeight: 260 }}><div className="loader" /></div>
      ) : visibleGames.length ? (
        <>
          <div className="jili-games-grid">
            {visibleGames.map((game) => (
              <Link
                className="jili-game-card"
                key={`${game.gameId}-${game.name}`}
                to={`/jili/${game.gameId}?title=${encodeURIComponent(game.name)}`}
              >
                <div className="jili-game-card-media">
                  <JiliGameImage game={game} size={44} />
                </div>
                <div className="jili-game-card-body">
                  <h3>{game.name}</h3>
                  {(game.jp || game.freeSpin) && (
                    <div className="jili-game-tags">
                      {game.jp && <em>JP</em>}
                      {game.freeSpin && <em>Free Spin</em>}
                    </div>
                  )}
                  <strong>Play <Play size={14} /></strong>
                </div>
              </Link>
            ))}
          </div>

          {canLoadMore && (
            <button type="button" className="jili-load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Load more games ({filteredGames.length - visibleGames.length} left)
            </button>
          )}
        </>
      ) : (
        <div className="jili-games-empty">
          <Gamepad2 size={42} />
          <h3>No games found</h3>
          <p>Search text অথবা category filter পরিবর্তন করে আবার দেখুন।</p>
        </div>
      )}
    </div>
  );
}
