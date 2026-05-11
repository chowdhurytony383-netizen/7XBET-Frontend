import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  LogIn,
  Trophy,
  UserPlus,
  Wallet,
} from 'lucide-react';

import { AccountAPI } from '../api/account.js';
import { GamesAPI } from '../api/games.js';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import { buildSportsSlipItem } from '../utils/sportsVisuals.js';

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

const casinoLobbyCategories = [
  {
    key: 'slots',
    title: 'Slots',
    countLabel: '153 games',
    icon: '🎰',
    description: 'JILI slot games, jackpots and bonus rounds.',
    to: '/jili-games?category=slots',
  },
  {
    key: 'fish',
    title: 'Fishing',
    countLabel: '15 games',
    icon: '🐟',
    description: 'Fishing lobby with fast arcade-style action.',
    to: '/jili-games?category=fish',
  },
  {
    key: 'casino',
    title: 'Table / Casino',
    countLabel: '75 games',
    icon: '♦️',
    description: 'Roulette, baccarat, bingo and casino table games.',
    to: '/jili-games?category=casino',
  },
  {
    key: 'cards',
    title: 'Card / Poker',
    countLabel: '21 games',
    icon: '♠️',
    description: 'Poker, rummy and card game collection.',
    to: '/jili-games?category=cards',
  },
  {
    key: 'arcade',
    title: 'Crash / Arcade',
    countLabel: '2 games',
    icon: '🚀',
    description: 'Crash-style and arcade lobby games.',
    to: '/jili-games?category=arcade',
  },
];

export default function HomePage() {
  const { user, refreshUser } = useAuth();

  const [games, setGames] = useState([]);
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
        setLiveMatches(matches);
        setMatchOfTheDay(matches[0] || null);
      }
    }

    loadSportsContent();

    return () => {
      active = false;
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

  const featuredGames = useMemo(() => games.slice(0, 2), [games]);

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


        <section className="casino-lobby-section">
          <div className="casino-lobby-heading">
            <div>
              <span className="page-eyebrow">Casino</span>
              <h2>Casino Lobby</h2>
              <p>Category অনুযায়ী JILI casino games দেখুন—Slots, Fishing, Table/Casino, Card/Poker এবং Crash/Arcade।</p>
            </div>

            <Link className="btn btn-soft casino-lobby-view-all" to="/jili-games">
              View all games
            </Link>
          </div>

          <div className="casino-lobby-grid">
            {casinoLobbyCategories.map((category) => (
              <Link className={`casino-lobby-card casino-lobby-card-${category.key}`} key={category.key} to={category.to}>
                <span className="casino-lobby-icon" aria-hidden="true">{category.icon}</span>
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </div>
                <strong>{category.countLabel}</strong>
              </Link>
            ))}
          </div>
        </section>

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
            <div className="grid-2">
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