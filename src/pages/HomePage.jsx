import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import GameCard from '../components/GameCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SportsCategoryStrip from '../components/SportsCategoryStrip.jsx';
import LiveSportsSection from '../components/LiveSportsSection.jsx';
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

export default function HomePage() {
  const { user } = useAuth();

  const [games, setGames] = useState([]);
  const [sportsCategories, setSportsCategories] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [matchOfTheDay, setMatchOfTheDay] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

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
      const [categoriesResponse, liveResponse, matchResponse] =
        await Promise.allSettled([
          SportsAPI.categories(),
          SportsAPI.liveMatches(),
          SportsAPI.matchOfTheDay(),
        ]);

      if (!active) return;

      if (categoriesResponse.status === 'fulfilled') {
        setSportsCategories(
          normalizeList(categoriesResponse.value.data, ['categories', 'sports'])
        );
      }

      if (liveResponse.status === 'fulfilled') {
        setLiveMatches(
          normalizeList(liveResponse.value.data, [
            'matches',
            'liveMatches',
            'events',
          ])
        );
      }

      if (matchResponse.status === 'fulfilled') {
        setMatchOfTheDay(
          normalizeObject(matchResponse.value.data, [
            'match',
            'matchOfTheDay',
            'event',
          ])
        );
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
                <img src="/images/brand/7xbet-logo.svg" alt="7XBET" />
              </div>

              <p>Premium • Professional • Stylish</p>
            </div>
          </div>
        </section>

        <SportsCategoryStrip categories={sportsCategories} />

        <LiveSportsSection
          matches={liveMatches}
          matchOfTheDay={matchOfTheDay}
        />

        {error && <div className="auth-message">{error}</div>}

        {user && (
          <div className="grid-4">
            <StatCard
              icon={Wallet}
              label="Wallet balance"
              value={formatCurrency(user?.wallet)}
            />

            <StatCard
              icon={CircleDollarSign}
              label="Net result"
              value={formatCurrency(stats?.totalWinningAmount)}
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
            description=
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
              message=
            />
          )}
        </section>
      </div>

      <FooterSection />
    </>
  );
}