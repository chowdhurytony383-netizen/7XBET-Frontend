import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Flame,
  LogIn,
  Trophy,
  UserPlus,
  Wallet,
} from 'lucide-react';

import { AccountAPI } from '../api/account.js';
import { GamesAPI } from '../api/games.js';
import { JiliAPI } from '../api/jili.js';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import { buildSportsSlipItem, sortMatchesBySportPriority } from '../utils/sportsVisuals.js';

import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import GameCard from '../components/GameCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SportsCategoryStrip from '../components/SportsCategoryStrip.jsx';
import LiveSportsSection from '../components/LiveSportsSection.jsx';
import SportsBetSlip from '../components/SportsBetSlip.jsx';
import FooterSection from '../components/FooterSection.jsx';

import './HomePage.css';

function normalizeList(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }

  return [];
}

function normalizeObject(payload, keys = []) {
  if (!payload) return null;
  if (payload?._id || payload?.id) return payload;

  for (const key of keys) {
    if (payload?.[key]) return payload[key];
    if (payload?.data?.[key]) return payload.data[key];
  }

  return payload?.data || null;
}


const HOT_GAME_IDS = [49, 109, 223, 51, 103, 126, 2, 5, 6, 27, 30, 1];
const HOT_GAME_NAMES = [
  'super ace',
  'fortune gems',
  'money coming',
  'golden empire',
  'roma',
  'crazy777',
  'royal fishing',
  'jackpot fishing',
  'boxing king',
  'lucky coming',
  'fortune coins',
  'cash coin',
];

const JILI_CATEGORY_ID_MAP = {
  1: 'slots',
  2: 'cards',
  3: 'arcade',
  5: 'fish',
  8: 'casino',
};

function pickJiliGameName(raw = {}) {
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
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().replace(/^JILI\s+/i, '');
    }

    if (candidate && typeof candidate === 'object') {
      const value = candidate['en-US'] || candidate.en_US || candidate.en || candidate.English || candidate['zh-CN'] || candidate['zh-TW'];
      if (value) return String(value).trim().replace(/^JILI\s+/i, '');
    }
  }

  return '';
}

function pickJiliGameId(raw = {}) {
  return raw.GameId || raw.gameId || raw.GameID || raw.id || raw.game || raw.gameCode || raw.code || raw.config?.gameId || raw.config?.providerGame?.GameId;
}

function detectJiliCategory(raw = {}) {
  const typeSource = String(
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
    || ''
  ).toLowerCase();

  if (typeSource.includes('fish')) return 'Fishing';
  if (typeSource.includes('card') || typeSource.includes('poker') || typeSource.includes('rummy') || typeSource.includes('teenpatti')) return 'Card';
  if (typeSource.includes('crash') || typeSource.includes('mines') || typeSource.includes('plinko') || typeSource.includes('limbo')) return 'Crash';
  if (typeSource.includes('slot')) return 'Slots';
  if (typeSource.includes('arcade') || typeSource.includes('lobby')) return 'Arcade';
  if (typeSource.includes('casino') || typeSource.includes('table') || typeSource.includes('bingo') || typeSource.includes('roulette') || typeSource.includes('baccarat')) return 'Casino';

  const categoryId = Number(raw.GameCategoryId || raw.gameCategoryId || raw.categoryId || raw.gameCategory || raw.config?.providerGame?.GameCategoryId || 0);
  const key = JILI_CATEGORY_ID_MAP[categoryId];
  if (key === 'slots') return 'Slots';
  if (key === 'fish') return 'Fishing';
  if (key === 'cards') return 'Card';
  if (key === 'arcade') return 'Arcade';
  return 'Casino';
}

function isUsableImageValue(value) {
  if (!value || typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return false;
  if (/^(icon|download|material)$/i.test(text)) return false;
  return /^(https?:)?\/\//i.test(text) || text.startsWith('/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(text);
}

function collectImageCandidates(raw = {}) {
  const providerGame = raw.config?.providerGame || {};
  const candidates = [
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
  ];

  return candidates
    .filter(isUsableImageValue)
    .map((item) => String(item).trim())
    .filter((item, index, all) => all.indexOf(item) === index);
}

function buildJiliImageSources(raw = {}, gameId) {
  const id = String(gameId || '').trim();
  const sources = [...collectImageCandidates(raw)];

  if (id) {
    // Put official JILI icons here after downloading from the ICON folder:
    // public/images/jili/49.webp, public/images/jili/49.png, etc.
    sources.push(
      `/images/jili/${id}.webp`,
      `/images/jili/${id}.png`,
      `/images/jili/${id}.jpg`,
      `/images/jili/jili-${id}.webp`,
      `/images/jili/jili-${id}.png`,
      `/images/jili/jili-${id}.jpg`
    );
  }

  return sources.filter((item, index, all) => item && all.indexOf(item) === index);
}

function JiliHotGameImage({ game }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = game.imageSources || [];
  const src = sources[sourceIndex];

  if (!src) {
    return <span className="casino-hot-fallback">🎮</span>;
  }

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

function normalizeJiliGame(raw = {}) {
  const gameId = pickJiliGameId(raw);
  const name = pickJiliGameName(raw) || `JILI Game ${gameId}`;
  const imageSources = buildJiliImageSources(raw, gameId);
  const categoryLabel = detectJiliCategory(raw);

  return {
    gameId,
    name,
    imageSources,
    categoryLabel,
    hotScore: HOT_GAME_IDS.indexOf(Number(gameId)),
  };
}

function pickHotJiliGames(list = []) {
  const normalized = list
    .map(normalizeJiliGame)
    .filter((game) => game.gameId)
    .filter((game, index, all) => all.findIndex((item) => String(item.gameId) === String(game.gameId)) === index);

  const byPreferredId = normalized
    .filter((game) => HOT_GAME_IDS.includes(Number(game.gameId)))
    .sort((a, b) => HOT_GAME_IDS.indexOf(Number(a.gameId)) - HOT_GAME_IDS.indexOf(Number(b.gameId)));

  const byPreferredName = normalized.filter((game) => {
    const name = game.name.toLowerCase();
    return !byPreferredId.some((item) => String(item.gameId) === String(game.gameId))
      && HOT_GAME_NAMES.some((keyword) => name.includes(keyword));
  });

  const selected = [...byPreferredId, ...byPreferredName];
  const fallback = normalized.filter((game) => !selected.some((item) => String(item.gameId) === String(game.gameId)));

  return [...selected, ...fallback].slice(0, 12);
}


export default function HomePage() {
  const { user, refreshUser } = useAuth();

  const [games, setGames] = useState([]);
  const [jiliGames, setJiliGames] = useState([]);
  const [jiliLoading, setJiliLoading] = useState(true);
  const [sportsCategories, setSportsCategories] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [matchOfTheDay, setMatchOfTheDay] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [homeBetSlipItems, setHomeBetSlipItems] = useState([]);
  const [placingHomeBets, setPlacingHomeBets] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadGames() {
      setError('');

      try {
        const gamesResponse = await GamesAPI.all();

        if (!active) return;

        setGames(normalizeList(gamesResponse.data, ['games']));
      } catch (err) {
        if (active) {
          setError(getApiError(err, 'Unable to load games from backend'));
        }
      }
    }

    loadGames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadJiliGames() {
      setJiliLoading(true);
      try {
        const response = await JiliAPI.games();
        if (!active) return;
        setJiliGames(normalizeList(response.data, ['games', 'data']));
      } catch (_) {
        if (active) setJiliGames([]);
      } finally {
        if (active) setJiliLoading(false);
      }
    }

    loadJiliGames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshMs = Math.max(10000, Number(import.meta.env.VITE_SPORTS_REFRESH_MS || 15000));

    async function loadSportsContent() {
      const [categoriesResponse, liveResponse] = await Promise.allSettled([
        SportsAPI.categories(),
        SportsAPI.liveMatches(),
      ]);

      if (!active) return;

      if (categoriesResponse.status === 'fulfilled') {
        setSportsCategories(
          normalizeList(categoriesResponse.value.data, ['categories', 'sports'])
        );
      }

      if (liveResponse.status === 'fulfilled') {
        const matches = normalizeList(liveResponse.value.data, [
          'matches',
          'liveMatches',
          'events',
        ]);
        const sortedMatches = sortMatchesBySportPriority(matches);
        setLiveMatches(sortedMatches);
        setMatchOfTheDay(sortedMatches[0] || null);
      }
    }

    loadSportsContent();
    const timer = window.setInterval(loadSportsContent, refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAccountStats() {
      if (!user) {
        setStats(null);
        return;
      }

      try {
        const statsResponse = await AccountAPI.betStats();

        if (active) {
          setStats(statsResponse.data || null);
        }
      } catch (err) {
        if (active) {
          setError(getApiError(err, 'Unable to load account statistics'));
        }
      }
    }

    loadAccountStats();

    return () => {
      active = false;
    };
  }, [user]);


  const addHomeSelection = (match, odd) => {
    const item = buildSportsSlipItem(match, odd, 1);
    if (!item.eventId || !item.selectionId) {
      toast.error('This sports selection is not ready for betting');
      return;
    }

    setHomeBetSlipItems((current) => {
      if (current.some((existing) => existing.id === item.id)) {
        toast('Already added to bet slip');
        return current;
      }
      return [...current, item];
    });
  };

  const updateHomeStake = (id, stake) => {
    setHomeBetSlipItems((current) => current.map((item) => (
      item.id === id ? { ...item, stake } : item
    )));
  };

  const removeHomeSlipItem = (id) => {
    setHomeBetSlipItems((current) => current.filter((item) => item.id !== id));
  };

  const placeHomeBets = async () => {
    if (!user) {
      toast.error('Please login to place a sports bet');
      return;
    }

    const selections = homeBetSlipItems.map((item) => ({
      eventId: item.eventId,
      marketKey: item.marketKey,
      selectionId: item.selectionId,
      stake: Number(item.stake),
    })).filter((item) => item.eventId && item.selectionId && Number.isFinite(item.stake) && item.stake > 0);

    if (!selections.length) {
      toast.error('Enter a valid stake amount');
      return;
    }

    setPlacingHomeBets(true);
    try {
      await SportsAPI.placeMultipleBets({ selections });
      setHomeBetSlipItems([]);
      toast.success(`${selections.length} sports bet${selections.length === 1 ? '' : 's'} placed successfully`);
      await refreshUser?.();
    } catch (err) {
      toast.error(getApiError(err, 'Sports bet failed'));
    } finally {
      setPlacingHomeBets(false);
    }
  };

  const featuredGames = useMemo(() => games.slice(0, 4), [games]);
  const hotJiliGames = useMemo(() => pickHotJiliGames(jiliGames), [jiliGames]);

  return (
    <>
      <div className="page-stack">
        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="page-eyebrow">Online gaming platform</span>

            <h1>
              {user?.name || user?.fullName
                ? `Welcome, ${user.fullName || user.name}`
                : 'Welcome to 7XBET'}
            </h1>

            <p>
              Premium, professional and stylish gaming experience. Browse
              available games before login; wallet, profile and history appear
              after sign in.
            </p>

            <div className="home-actions">
              <Link className="btn btn-primary" to="/games">
                View games
              </Link>

              {user ? (
                <>
                  <Link className="btn btn-soft" to="/deposit">
                    Deposit
                  </Link>

                  <Link className="btn btn-soft" to="/dashboard">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn btn-soft" to="/login">
                    <LogIn size={18} /> Login
                  </Link>

                  <Link className="btn btn-soft" to="/register">
                    <UserPlus size={18} /> Register
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="home-hero-image">
            <div className="home-brand-card">
              <div className="home-brand-logo">
                <img src="/images/brand/7xbet-premium-logo.png" alt="7XBET" />
              </div>

              <p>Premium • Professional • Stylish</p>
            </div>
          </div>
        </section>

        <SportsCategoryStrip categories={sportsCategories} />

        <LiveSportsSection
          matches={liveMatches}
          matchOfTheDay={matchOfTheDay}
          onSelectBet={addHomeSelection}
        />

        {/* Crush Game Banner */}
        <section className="home-crush-banner-section" aria-label="7XBET Crush Game">
          <div className="home-crush-banner-heading">
            <h3>Crush Game</h3>
          </div>

          <Link
            className="home-crush-banner-link"
            to="/crash"
            aria-label="Open 7XBET Crush Game"
          >
            <img
              src="/images/crush-game-banner.png"
              alt="7XBET Crush Game"
              className="home-crush-banner-image"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </section>

        <section className="casino-lobby-section casino-lobby-section-hot-only">
          <div className="casino-hot-panel">
            <div className="casino-hot-heading">
              <div>
                <span><Flame size={16} /> Hot</span>
                <h3>Hot Games</h3>
              </div>
              <Link to="/jili/80?title=lobby">Open Lobby</Link>
            </div>

            {jiliLoading ? (
              <div className="casino-hot-loading">Loading hot games...</div>
            ) : hotJiliGames.length ? (
              <div className="casino-hot-grid">
                {hotJiliGames.map((game) => (
                  <Link
                    className="casino-hot-card"
                    key={`hot-${game.gameId}`}
                    to={`/jili/${game.gameId}?title=${encodeURIComponent(game.name)}`}
                  >
                    <div className="casino-hot-media">
                      <JiliHotGameImage game={game} />
                    </div>
                    <strong>{game.name}</strong>
                    <em>{game.categoryLabel}</em>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="casino-hot-loading">Hot games not available right now.</div>
            )}
          </div>
        </section>

        <div className="home-casino-banner-stack">
          <Link
            className="home-slot-banner home-category-banner"
            to="/jili-games?category=slots"
            aria-label="View all JILI slot games"
          >
            <img src="/images/jili/slots-banner.webp" alt="Slots games" loading="lazy" decoding="async" />
            <span className="home-slot-banner-cta">View all slot games</span>
          </Link>

          <Link
            className="home-slot-banner home-category-banner home-live-casino-banner"
            to="/jili-games?category=casino"
            aria-label="View all JILI table and casino games"
          >
            <img src="/images/jili/live-casino-banner.webp" alt="Live Casino games" loading="lazy" decoding="async" />
            <span className="home-slot-banner-cta">View live casino</span>
          </Link>
        </div>

        {error && <div className="auth-message">{error}</div>}

        {user && (
          <div className="grid-4">
            <StatCard
              icon={Wallet}
              label="Wallet balance"
              value={formatCurrency(user?.wallet, user)}
            />

            <StatCard
              icon={CircleDollarSign}
              label="Net result"
              value={formatCurrency(stats?.totalWinningAmount, user)}
            />

            <StatCard
              icon={Trophy}
              label="Wins"
              value={stats?.totalWins ?? 0}
            />

            <StatCard
              icon={Activity}
              label="Current streak"
              value={stats?.totalWinningStreak ?? 0}
            />
          </div>
        )}

        <section className="home-section">
          <PageHeader
            eyebrow="Games"
            title="Available games"
            description=" "
            actions={
              <Link className="btn btn-soft" to="/games">
                <BarChart3 size={18} /> View all
              </Link>
            }
          />

          {featuredGames.length ? (
            <div className="home-featured-games-grid">
              {featuredGames.map((game) => (
                <GameCard key={game._id || game.name} game={game} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No games available"
              message=" "
            />
          )}
        </section>
      </div>

      <SportsBetSlip
        items={homeBetSlipItems}
        user={user}
        placing={placingHomeBets}
        onStakeChange={updateHomeStake}
        onRemove={removeHomeSlipItem}
        onClear={() => setHomeBetSlipItems([])}
        onPlaceAll={placeHomeBets}
      />

      <FooterSection />
    </>
  );
}