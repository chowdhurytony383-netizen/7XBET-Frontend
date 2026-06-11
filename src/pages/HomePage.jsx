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
import { connectRealtimeSocket } from '../socket/realtimeSocket.js';
import FooterSection from '../components/FooterSection.jsx';

import './HomePage.css';
import FootballWorldFeverCanvas from '../components/home/FootballWorldFeverCanvas.jsx';

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

const HOME_PROMO_BARS = [
  '/images/home-promo-bars/bar-01.webp',
  '/images/home-promo-bars/bar-02.webp',
  '/images/home-promo-bars/bar-03.webp',
  '/images/home-promo-bars/bar-04.webp',
  '/images/home-promo-bars/bar-05.webp',
  '/images/home-promo-bars/bar-06.webp',
  '/images/home-promo-bars/bar-07.webp',
  '/images/home-promo-bars/bar-08.webp',
  '/images/home-promo-bars/bar-09.webp',
  '/images/home-promo-bars/bar-10.webp',
  '/images/home-promo-bars/bar-11.webp',
  '/images/home-promo-bars/bar-12.webp',
  '/images/home-promo-bars/bar-13.webp',
  '/images/home-promo-bars/bar-14.webp',
];

function HomePromoBarCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (HOME_PROMO_BARS.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HOME_PROMO_BARS.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="home-promo-bar" aria-label="7XBET promotion banners">
      <div
        className="home-promo-bar-track"
        style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
      >
        {HOME_PROMO_BARS.map((src, index) => (
          <Link
            className="home-promo-bar-slide"
            key={src}
            to="/promotions"
            aria-label={`Open 7XBET promotion ${index + 1}`}
          >
            <img
              src={src}
              alt={`7XBET promotion ${index + 1}`}
              loading={index <= 1 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </Link>
        ))}
      </div>

      <div className="home-promo-bar-dots" aria-hidden="true">
        {HOME_PROMO_BARS.map((src, index) => (
          <span key={`${src}-dot`} className={index === activeIndex ? 'is-active' : ''} />
        ))}
      </div>
    </section>
  );
}


function HomeFreeSpinBanner() {
  return (
    <section className="home-free-spin-section" aria-label="Free spin lucky wheel">
      <Link className="home-free-spin-card" to="/free-spin" aria-label="Open Free Spin Lucky Wheel">
        <div className="home-free-spin-logo-wrap" aria-hidden="true">
          <img src="/images/brand/7xbet-premium-logo.png" alt="" />
        </div>

        <div className="home-free-spin-copy">
          <span>Lucky Wheel</span>
          <strong>Free Spin</strong>
          <small>Every 6 hours • Bonus rewards</small>
        </div>

        <div className="home-free-spin-mini-wheel" aria-hidden="true">
          <i>×2</i>
          <b>৳</b>
        </div>

        <em>PLAY</em>
      </Link>
    </section>
  );
}

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
  const sources = [];

  if (id) {
    // Prefer local official JILI images first. This protects the UI if the database
    // image was overwritten by a generic fallback during provider sync.
    sources.push(
      `/images/jili/${id}.webp`,
      `/images/jili/${id}.png`,
      `/images/jili/${id}.jpg`,
      `/images/jili/jili-${id}.webp`,
      `/images/jili/jili-${id}.png`,
      `/images/jili/jili-${id}.jpg`
    );
  }

  sources.push(...collectImageCandidates(raw));
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


function getHomeRailGameId(game = {}) {
  const value = game?.config?.gameId || game?.config?.providerGame?.GameId || game?.gameId || game?.jiliGameId || game?.gameCode || game?._id || game?.id;
  return String(value || '').replace(/^jili-?/i, '').trim();
}

function getHomeRailGameTitle(game = {}) {
  return String(game?.displayName || game?.Name || game?.name || game?.title || 'Game').replace(/^JILI\s+/i, '').trim();
}

function getHomeRailGamePath(game = {}) {
  const provider = String(game?.provider || game?.config?.provider || '').toUpperCase();
  const gameId = getHomeRailGameId(game);
  const title = getHomeRailGameTitle(game);

  if (provider === 'JILI' && gameId) {
    return `/jili/${gameId}?title=${encodeURIComponent(title)}`;
  }

  if (game?.route) return game.route;

  if (game?.type === 'source' || game?.distribution === 'source') {
    return `/source-games/${game?.gameCode || game?.slug || game?.name || ''}`;
  }

  const normalized = String(game?.gameCode || game?.slug || game?.name || '').toLowerCase();
  if (normalized.includes('crash')) return '/crash';
  if (normalized.includes('mine')) return '/games/mines';
  if (normalized.includes('dice')) return '/games/dice';

  return '/games';
}

function buildHomeRailImageSources(game = {}) {
  const provider = String(game?.provider || game?.config?.provider || '').toUpperCase();
  const gameId = getHomeRailGameId(game);
  const sources = [];

  if (provider === 'JILI' && gameId) {
    sources.push(...buildJiliImageSources(game, gameId));
  }

  sources.push(
    game?.image,
    game?.assetPath,
    game?.thumbnail,
    game?.icon,
    game?.config?.image,
    game?.config?.providerGame?.Image,
    game?.config?.providerGame?.image,
    '/images/others/banner1.png'
  );

  return sources
    .filter(isUsableImageValue)
    .map((item) => String(item).trim())
    .filter((item, index, all) => all.indexOf(item) === index);
}

function HomeRailGameImage({ game }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = buildHomeRailImageSources(game);
  const src = sources[sourceIndex];

  if (!src) return <span className="home-game-rail-fallback">🎮</span>;

  return (
    <img
      src={src}
      alt={getHomeRailGameTitle(game)}
      loading="lazy"
      decoding="async"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}

function HomeGameRail({ eyebrow, title, games = [], className = '' }) {
  const items = Array.isArray(games) ? games.slice(0, 20) : [];

  if (!items.length) return null;

  return (
    <section className={`home-game-rail-section ${className}`}>
      <div className="home-game-rail-heading">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        <Link to="/games">View all ›</Link>
      </div>

      <div className="home-game-rail-scroll" aria-label={title}>
        {items.map((game, index) => (
          <Link
            className="home-game-rail-card"
            key={`${title}-${game?._id || game?.id || game?.gameCode || game?.name || index}`}
            to={getHomeRailGamePath(game)}
          >
            <div className="home-game-rail-media">
              <HomeRailGameImage game={game} />
            </div>
            <strong>{getHomeRailGameTitle(game)}</strong>
          </Link>
        ))}
      </div>
    </section>
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



function mergeSportsScoreUpdateIntoMatches(list = [], payload = {}) {
  if (!payload?.providerEventId && !payload?.eventId && !payload?.id) return list;
  const wantedIds = new Set([payload.providerEventId, payload.eventId, payload.id].filter(Boolean).map(String));
  let changed = false;
  const next = list.map((match) => {
    const ids = [match._id, match.id, match.eventId, match.providerEventId].filter(Boolean).map(String);
    if (!ids.some((id) => wantedIds.has(id))) return match;
    changed = true;
    return {
      ...match,
      status: payload.status || match.status,
      completed: payload.completed ?? match.completed,
      score: payload.score || match.score,
      scores: Array.isArray(payload.scores) ? payload.scores : match.scores,
      lastScoreUpdate: payload.lastScoreUpdate || new Date().toISOString(),
    };
  });
  return changed ? sortMatchesBySportPriority(next) : list;
}

export default function HomePage() {
  const { user, refreshUser } = useAuth();

  const [games, setGames] = useState([]);
  const [homeGameSections, setHomeGameSections] = useState({ newGames: [], popularGames: [] });
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
        const [gamesResponse, homeSectionsResponse] = await Promise.all([
          GamesAPI.all(),
          GamesAPI.homeSections().catch(() => null),
        ]);

        if (!active) return;

        setGames(normalizeList(gamesResponse.data, ['games']));
        const sectionData = homeSectionsResponse?.data?.data || homeSectionsResponse?.data || {};
        setHomeGameSections({
          newGames: Array.isArray(sectionData.newGames) ? sectionData.newGames : [],
          popularGames: Array.isArray(sectionData.popularGames) ? sectionData.popularGames : [],
        });
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
      const limit = Number(import.meta.env.VITE_SPORTS_HOME_MATCH_LIMIT || 12);

      // Fast first paint: /sports/overview is cached and returns sport counts plus
      // top live/pre-match cards in one small response. This prevents the home page
      // from waiting for heavy all-sports match APIs before showing content.
      const overviewResponse = await SportsAPI.overview({ limit }).catch(() => null);
      if (!active) return;

      const overviewPayload = overviewResponse?.data?.data || overviewResponse?.data || null;
      const overviewSports = overviewPayload?.sports || overviewResponse?.data?.sports || [];
      const overviewMatches = [
        ...(overviewPayload?.topLive || overviewResponse?.data?.topLive || []),
        ...(overviewPayload?.topPrematch || overviewResponse?.data?.topPrematch || []),
      ];

      if (overviewSports.length) setSportsCategories(overviewSports);
      if (overviewMatches.length) {
        const sortedMatches = sortMatchesBySportPriority(overviewMatches).slice(0, limit * 2);
        setLiveMatches(sortedMatches);
        setMatchOfTheDay(sortedMatches[0] || null);
      }

      // Silent background refresh of live-only data. If it is slow or unavailable,
      // the overview data already on screen remains visible.
      SportsAPI.liveMatches({ status: 'live', limit })
        .then((liveResponse) => {
          if (!active) return;
          const liveOnly = normalizeList(liveResponse.data, ['matches', 'liveMatches', 'events']);
          if (!liveOnly.length) return;
          const combined = [...liveOnly, ...overviewMatches];
          const seen = new Set();
          const deduped = combined.filter((match) => {
            const id = match?.id || match?._id || match?.providerEventId || `${match?.homeTeam?.name || match?.homeTeam}-${match?.awayTeam?.name || match?.awayTeam}-${match?.startTime || match?.dateTime}`;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
          const sortedMatches = sortMatchesBySportPriority(deduped).slice(0, limit * 2);
          setLiveMatches(sortedMatches);
          setMatchOfTheDay(sortedMatches[0] || null);
        })
        .catch(() => {});
    }

    loadSportsContent();
    const timer = window.setInterval(loadSportsContent, refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const socket = connectRealtimeSocket();

    const onScoreUpdate = (payload = {}) => {
      setLiveMatches((current) => mergeSportsScoreUpdateIntoMatches(current, payload));
      setMatchOfTheDay((current) => {
        if (!current) return current;
        const [merged] = mergeSportsScoreUpdateIntoMatches([current], payload);
        return merged || current;
      });
    };

    let lastRefreshHintAt = 0;
    let refreshTimer = null;
    const onRefreshHint = () => {
      // The direct score event updates visible cards immediately. A delayed HTTP refresh
      // also pulls new markets/details if the provider added or locked odds.
      const now = Date.now();
      if (now - lastRefreshHintAt < 12000) return;
      lastRefreshHintAt = now;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        SportsAPI.liveMatches({ status: 'live', limit: Number(import.meta.env.VITE_SPORTS_HOME_MATCH_LIMIT || 12) }).then((response) => {
          const matches = normalizeList(response.data, ['matches', 'liveMatches', 'events']);
          const sortedMatches = sortMatchesBySportPriority(matches);
          setLiveMatches(sortedMatches);
          setMatchOfTheDay(sortedMatches[0] || null);
        }).catch(() => {});
      }, 1200);
    };

    socket.emit('sports:join');
    socket.on('sports:score:update', onScoreUpdate);
    socket.on('sports:refresh:hint', onRefreshHint);
    if (!socket.connected) socket.connect();

    return () => {
      window.clearTimeout(refreshTimer);
      socket.off('sports:score:update', onScoreUpdate);
      socket.off('sports:refresh:hint', onRefreshHint);
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
  const newestHomeGames = useMemo(() => (homeGameSections.newGames || []).slice(0, 20), [homeGameSections]);
  const popularHomeGames = useMemo(() => (homeGameSections.popularGames || []).slice(0, 20), [homeGameSections]);
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

        <FootballWorldFeverCanvas />

        <HomeFreeSpinBanner />

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

        <HomeGameRail
          eyebrow="New"
          title="New Game"
          games={newestHomeGames}
          className="home-new-games-rail"
        />

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

        <HomeGameRail
          eyebrow="Popular"
          title="Most Popular Games"
          games={popularHomeGames}
          className="home-popular-games-rail"
        />

        <HomePromoBarCarousel />

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