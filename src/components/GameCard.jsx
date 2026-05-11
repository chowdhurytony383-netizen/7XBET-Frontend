import { Bomb, ChevronRight, Dice5, Gamepad2, Rocket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gameName } from '../utils/format.js';
import './GameCard.css';

const gameAssets = {
  mines: {
    image: '/images/mines-game/poster.avif',
    icon: Bomb,
    path: '/games/mines',
  },
  dice: {
    image: '/images/dice-game/logo.avif',
    icon: Dice5,
    path: '/games/dice',
  },
  fortunetiger: {
    image: '/originals/fortunetiger/icons/icon-512.png',
    icon: Sparkles,
    path: '/source-games/fortunetiger',
  },
  bikiniparadise: {
    image: '/originals/bikiniparadise/icons/icon-512.png',
    icon: Sparkles,
    path: '/source-games/bikiniparadise',
  },
  crash: {
    image: '/images/crash-game/cover.svg',
    icon: Rocket,
    path: '/crash',
  },
};

function normalizeGameValue(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '');
}

function resolveGameKey(game) {
  const value = normalizeGameValue(
    game?.gameCode ||
    game?.code ||
    game?.slug ||
    game?.name ||
    game?.displayName
  );

  if (value.includes('mine')) return 'mines';
  if (value.includes('dice')) return 'dice';
  if (value.includes('fortunetiger')) return 'fortunetiger';
  if (value.includes('bikiniparadise') || value.includes('bikini')) return 'bikiniparadise';
  if (value.includes('crash') || value.includes('aviator')) return 'crash';

  return value;
}

function getGamePath(game, key) {
  if (game?.provider === 'JILI' || game?.config?.provider === 'JILI') {
    const gameId = game?.config?.gameId || game?.jiliGameId || game?.gameId || game?.gameCode?.replace(/^jili-?/i, '');
    if (gameId) return `/jili/${gameId}?title=${encodeURIComponent(game?.displayName || game?.name || 'JILI Game')}`;
  }

  if (game?.route) return game.route;

  if (game?.type === 'source' || game?.distribution === 'source') {
    const code = game?.gameCode || game?.code || key;
    return `/source-games/${code}`;
  }

  return gameAssets[key]?.path || '/games';
}

function getGameImage(game, key) {
  return game?.image || gameAssets[key]?.image || '/images/others/banner1.png';
}

export default function GameCard({ game }) {
  const key = resolveGameKey(game);
  const path = getGamePath(game, key);
  const image = getGameImage(game, key);
  const Icon = gameAssets[key]?.icon || Gamepad2;
  const title = gameName(game);

  return (
    <Link to={path} className="game-card">
      <div className="game-card-image">
        <img src={image} alt={title} />
        <span className="game-card-icon">
          <Icon size={20} />
        </span>
      </div>

      <div className="game-card-content">
        <div>
          <h3>{title}</h3>
          <p>{game?.description || 'Game details are managed from the backend game collection.'}</p>
        </div>

        <span className="game-card-action">
          Play <ChevronRight size={17} />
        </span>
      </div>
    </Link>
  );
}