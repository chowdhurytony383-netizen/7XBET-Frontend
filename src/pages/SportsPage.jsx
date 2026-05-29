import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, BarChart3, Clock, Info, ListChecks, MapPin, Radio, ShieldCheck, Ticket, Trophy, Users, Wallet, X } from 'lucide-react';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import {
  buildSportsSlipItem,
  getMatchId,
  getScore,
  getStrictMatchStatus,
  getTeamLogoUrl,
  getTeamName,
  normalizeMatchOdds,
  sortMatchesBySportPriority,
  sortSportMetas,
  sportMetaFrom,
  sportMetaFromMatch,
  statusClass,
  teamLogoClass,
  teamLogoText,
} from '../utils/sportsVisuals.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SportsBetSlip from '../components/SportsBetSlip.jsx';
import { connectRealtimeSocket } from '../socket/realtimeSocket.js';
import './SportsPage.css';


function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function textValue(value, fallback = '—') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text && text !== '[object Object]' ? text : fallback;
  }
  if (Array.isArray(value)) {
    const text = value.map((item) => textValue(item, '')).filter(Boolean).join(', ');
    return text || fallback;
  }
  if (typeof value === 'object') {
    const scoreLike = scoreText(value, '');
    if (scoreLike && scoreLike !== '[object Object]') return scoreLike;

    const direct = value.display
      ?? value.displayName
      ?? value.formatted
      ?? value.name
      ?? value.description
      ?? value.short_code
      ?? value.label
      ?? value.title
      ?? value.value;
    if (direct !== undefined && direct !== null && direct !== value) return textValue(direct, fallback);
    try {
      const json = JSON.stringify(value);
      return json && json !== '{}' ? json : fallback;
    } catch (_error) {
      return fallback;
    }
  }
  return fallback;
}

function scoreText(value, fallback = '0') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'object') return textValue(value, fallback);
  if (Array.isArray(value)) {
    const parts = value.map((item) => scoreText(item, '')).filter(Boolean);
    return parts.length ? parts.join(' · ') : fallback;
  }

  const runs = value.runs ?? value.run ?? value.score ?? value.total ?? value.value ?? value.points ?? value.goals;
  const wickets = value.wickets ?? value.wkts ?? value.outs;
  const overs = value.overs ?? value.over;
  if (runs !== undefined && runs !== null && runs !== value) {
    const base = scoreText(runs, '0');
    return `${base}${wickets !== undefined && wickets !== null && wickets !== '' ? `/${wickets}` : ''}${overs !== undefined && overs !== null && overs !== '' ? ` (${overs} ov)` : ''}`;
  }

  const nested = value.total_score ?? value.totalScore ?? value.current ?? value.current_score ?? value.currentScore ?? value.score;
  if (nested && typeof nested === 'object' && nested !== value) {
    const text = scoreText(nested, '');
    if (text) return text;
  }

  const directText = value.display ?? value.displayName ?? value.formatted;
  if (directText !== undefined && directText !== null && directText !== value) {
    const text = String(directText).trim();
    if (text && text !== '[object Object]') return text;
  }

  const home = value.home ?? value.homeScore ?? value.localteam_score ?? value.scores?.home;
  const away = value.away ?? value.awayScore ?? value.visitorteam_score ?? value.scores?.away;
  if (home !== undefined || away !== undefined) return `${scoreText(home, '0')} - ${scoreText(away, '0')}`;

  return fallback;
}

function scoreLineFor(event = {}, details = {}) {
  if (details?.resultInfo && String(details.resultInfo) !== '[object Object] - [object Object]') return textValue(details.resultInfo, '0 - 0');
  return `${scoreText(getScore(event, 'home'), '0')} - ${scoreText(getScore(event, 'away'), '0')}`;
}

function isEmptyDetailValue(value) {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    if (value.name || value.description || value.short_code || value.value || value.display || value.total || value.score || value.runs || value.points || value.goals) return false;
    return Object.keys(value).length === 0;
  }
  return false;
}

function DetailsItem({ label, value }) {
  if (isEmptyDetailValue(value)) return null;
  return (
    <div className="sports-detail-item">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </div>
  );
}

function DetailsSection({ icon, title, children }) {
  return (
    <section className="sports-detail-section">
      <h4>{icon}{title}</h4>
      {children}
    </section>
  );
}

function MiniTeam({ team }) {
  const logo = getTeamLogoUrl(team);
  return (
    <div className="sports-detail-team">
      {logo ? <img src={logo} alt={team?.name || team?.raw?.name || 'Team'} /> : <span>{teamLogoText(team?.name || team?.raw?.name || 'TM')}</span>}
      <strong>{team?.name || team?.raw?.name || 'Team'}</strong>
    </div>
  );
}

function EventList({ items = [] }) {
  const limited = asArray(items).slice(0, 14);
  if (!limited.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-list">
      {limited.map((item, index) => (
        <div className="sports-detail-list-row" key={item.id || `${item.type_id || 'event'}-${index}`}>
          <span>{item.minute ?? item.sort_order ?? item.period_id ?? index + 1}</span>
          <strong>{textValue(item.type || item.type_id || item.name || item.description, 'Event')}</strong>
          <small>{textValue(item.player_name || item.player?.name || item.participant_name || item.result || item.info || item.addition, '')}</small>
        </div>
      ))}
    </div>
  );
}

function StatisticsList({ items = [] }) {
  const limited = asArray(items).slice(0, 18);
  if (!limited.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-stat-grid">
      {limited.map((item, index) => (
        <div className="sports-detail-stat" key={item.id || `${item.type_id || 'stat'}-${index}`}>
          <span>{textValue(item.type || item.type_id || item.name || item.code, 'Statistic')}</span>
          <strong>{textValue(item.data?.value ?? item.value ?? item.amount ?? item.percentage ?? item.data, '—')}</strong>
        </div>
      ))}
    </div>
  );
}

function LineupsList({ items = [] }) {
  const limited = asArray(items).slice(0, 16);
  if (!limited.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-lineups">
      {limited.map((item, index) => (
        <div className="sports-detail-lineup" key={item.id || `${item.player_id || 'player'}-${index}`}>
          <span>{item.jersey_number || item.number || index + 1}</span>
          <strong>{textValue(item.player?.display_name || item.player?.name || item.player_name || item.name, 'Player')}</strong>
          <small>{textValue(item.position?.name || item.position_id || item.type || item.formation_position, '')}</small>
        </div>
      ))}
    </div>
  );
}

function compactJson(value) {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return '—';
  }
}


function normalizeKey(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function valueLooksUseful(value) {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'object' && !Array.isArray(value)) return Object.keys(value).length > 0;
  if (Array.isArray(value)) return value.length > 0;
  const text = String(value).trim();
  return Boolean(text && text !== '[object Object]' && text !== '{}');
}

function personValue(value, fallback = '') {
  if (!valueLooksUseful(value)) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return textValue(value, fallback);
  if (Array.isArray(value)) return value.map((item) => personValue(item, '')).filter(Boolean).slice(0, 3).join(', ') || fallback;
  if (typeof value === 'object') {
    const direct = value.display_name
      ?? value.displayName
      ?? value.full_name
      ?? value.fullName
      ?? value.player_name
      ?? value.playerName
      ?? value.name
      ?? value.short_name
      ?? value.shortName
      ?? value.label
      ?? value.title
      ?? value.value
      ?? value.player?.display_name
      ?? value.player?.displayName
      ?? value.player?.full_name
      ?? value.player?.fullName
      ?? value.player?.name
      ?? value.team?.name
      ?? value.competitor?.name;
    if (direct !== undefined && direct !== null && direct !== value) return textValue(direct, fallback);
  }
  return textValue(value, fallback);
}

function findDeep(root, candidateKeys = [], options = {}) {
  const wanted = new Set(candidateKeys.map(normalizeKey).filter(Boolean));
  const maxDepth = options.maxDepth ?? 7;
  const seen = new WeakSet();
  const queue = [{ value: root, depth: 0 }];

  while (queue.length) {
    const { value, depth } = queue.shift();
    if (!value || typeof value !== 'object' || depth > maxDepth) continue;
    if (seen.has(value)) continue;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) queue.push({ value: item, depth: depth + 1 });
      continue;
    }

    for (const [key, entry] of Object.entries(value)) {
      if (wanted.has(normalizeKey(key)) && valueLooksUseful(entry)) return entry;
      if (entry && typeof entry === 'object') queue.push({ value: entry, depth: depth + 1 });
    }
  }

  return undefined;
}

function firstUseful(...values) {
  return values.find(valueLooksUseful);
}

function normalizeLiveState(details = {}, event = {}) {
  const raw = details?.raw || {};
  const source = {
    details,
    state: details?.state,
    inPlay: details?.state?.inPlay,
    event,
    rawResult: raw?.results?.payload || raw?.results?.data || raw?.rawResult || event?.rawResult,
    fixture: raw?.fixture?.payload || raw?.fixture?.data || raw?.providerEvent || event?.raw,
    playerResults: raw?.playerResults?.payload || raw?.playerResults?.data || details?.playerResults,
  };
  const sportText = `${details?.sport || event?.sport || event?.sportKey || event?.sportTitle || ''}`.toLowerCase();
  const cricket = sportText.includes('cricket');
  const football = /soccer|football/.test(sportText) && !/american/.test(sportText);

  const rows = [];
  const add = (label, value, formatter = textValue) => {
    if (!valueLooksUseful(value)) return;
    const text = formatter(value, '');
    if (!valueLooksUseful(text)) return;
    if (rows.some((row) => row.label === label && row.value === text)) return;
    rows.push({ label, value: text });
  };

  add('Clock / minute', firstUseful(
    details?.state?.timer,
    findDeep(source, ['clock', 'game_clock', 'gameClock', 'minute', 'minutes', 'time', 'timer'])
  ));
  add('Period / innings', firstUseful(
    findDeep(source, ['period', 'period_number', 'periodNumber', 'current_period', 'currentPeriod', 'inning', 'innings', 'current_inning', 'currentInning'])
  ));

  if (cricket) {
    add('Current over', firstUseful(findDeep(source, ['overs', 'over', 'current_over', 'currentOver', 'over_number', 'overNumber'])));
    add('Balls', firstUseful(findDeep(source, ['balls', 'ball', 'balls_bowled', 'ballsBowled'])));
    add('Batting team', firstUseful(findDeep(source, ['batting_team', 'battingTeam', 'current_batting_team', 'currentBattingTeam'])));
    add('Bowling team', firstUseful(findDeep(source, ['bowling_team', 'bowlingTeam', 'current_bowling_team', 'currentBowlingTeam'])));
    add('Striker', firstUseful(findDeep(source, ['striker', 'on_strike', 'onStrike', 'current_batter', 'currentBatter', 'batter', 'batsman', 'current_batsman', 'currentBatsman'])), personValue);
    add('Non-striker', firstUseful(findDeep(source, ['non_striker', 'nonStriker', 'non_strike_batsman', 'nonStrikeBatsman', 'runner'])), personValue);
    add('Current bowler', firstUseful(findDeep(source, ['bowler', 'current_bowler', 'currentBowler'])), personValue);
    add('Target', firstUseful(findDeep(source, ['target', 'target_score', 'targetScore', 'runs_to_win', 'runsToWin'])));
    add('Run rate', firstUseful(findDeep(source, ['run_rate', 'runRate', 'current_run_rate', 'currentRunRate'])));
    add('Required rate', firstUseful(findDeep(source, ['required_run_rate', 'requiredRunRate', 'required_rate', 'requiredRate'])));
    add('Last ball / play', firstUseful(findDeep(source, ['last_ball', 'lastBall', 'last_play', 'lastPlay', 'last_event', 'lastEvent', 'commentary'])));
  }

  if (football) {
    const goalEvents = asArray(details?.events).filter((item) => /goal|score/i.test(`${item.type || item.name || item.description || item.type_id || ''}`)).slice(0, 5);
    add('Match time', firstUseful(findDeep(source, ['minute', 'clock', 'game_clock', 'period_time', 'periodTime'])));
    if (goalEvents.length) {
      add('Goal scorers', goalEvents.map((item) => `${item.minute ? `${item.minute}' ` : ''}${personValue(item.player || item.player_name || item.name || item.description, 'Goal')}`).join(' · '));
    }
    add('Possession', firstUseful(findDeep(source, ['possession', 'ball_possession', 'ballPossession'])));
    add('Last event', firstUseful(findDeep(source, ['last_event', 'lastEvent', 'last_play', 'lastPlay', 'commentary'])));
  }

  add('Game state', firstUseful(findDeep(source, ['game_state', 'gameState', 'state', 'status', 'description'])));
  add('Last update', firstUseful(details?.lastProviderUpdate, event?.lastScoreUpdate, event?.updatedAt));

  return rows.slice(0, 14);
}

function LiveSituationPanel({ details = {}, event = {} }) {
  const rows = normalizeLiveState(details, event);
  if (!rows.length) {
    return (
      <div className="sports-live-situation-empty">
        <strong>Live state coverage limited</strong>
        <span>এই fixture-এ 7XBET live odds/score আছে, কিন্তু ball-by-ball, batsman, bowler, scorer বা deep live state এখনো পাওয়া যায়নি। Feed data এলে এখানে automatic দেখাবে।</span>
      </div>
    );
  }

  return (
    <div className="sports-live-situation-grid">
      {rows.map((row) => (
        <div className="sports-live-situation-card" key={`${row.label}:${row.value}`}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function GenericDataList({ items = [], empty = 'Not available yet' }) {
  const limited = asArray(items).slice(0, 18);
  if (!limited.length) return <p className="sports-detail-muted">{empty}</p>;

  return (
    <div className="sports-detail-list">
      {limited.map((item, index) => (
        <div className="sports-detail-list-row" key={item.id || item.player_id || item.team_id || `${item.name || 'row'}-${index}`}>
          <span>{item.minute ?? item.time ?? item.position ?? item.rank ?? index + 1}</span>
          <strong>{textValue(item.name || item.player?.name || item.team?.name || item.type?.name || item.type || item.description || item.group || item.league?.name, 'Item')}</strong>
          <small>{textValue(item.value ?? item.total ?? item.points ?? item.score ?? item.result ?? item.country?.name ?? item.info ?? compactJson(item.data), '')}</small>
        </div>
      ))}
    </div>
  );
}

function formatCricketScoreItem(score = {}) {
  if (!score) return '';
  if (typeof score !== 'object') return textValue(score, '');
  if (score.display || score.displayName || score.formatted) return textValue(score.display || score.displayName || score.formatted, '');
  const rawScore = score.score ?? score.runs ?? score.total ?? score.value ?? score.points ?? score.goals;
  if (rawScore === undefined || rawScore === null || rawScore === '') return '';
  const wickets = score.wickets !== undefined && score.wickets !== null && score.wickets !== '' ? `/${score.wickets}` : '';
  const overs = score.overs ? ` (${score.overs} ov)` : '';
  return `${textValue(rawScore, '0')}${wickets}${overs}`;
}

function ScoresPanel({ scores }) {
  if (!scores) return <p className="sports-detail-muted">Not available yet</p>;

  const normalized = (() => {
    if (Array.isArray(scores)) {
      return scores.map((score, index) => {
        const cricketValue = formatCricketScoreItem(score);
        if (cricketValue) {
          return {
            label: textValue(score.label || score.team || score.name || score.description || score.id || `Innings ${index + 1}`),
            value: cricketValue,
          };
        }
        return {
          label: textValue(score.period || score.type || score.name || score.description || score.id || `Period ${index + 1}`),
          home: score.home ?? score.localteam_score ?? score.home_score ?? score.score?.home ?? score.scores?.home,
          away: score.away ?? score.visitorteam_score ?? score.away_score ?? score.score?.away ?? score.scores?.away,
        };
      });
    }

    if (typeof scores === 'object') {
      const home = scores.home ?? scores.localteam_score ?? scores.home_score ?? scores.score?.home ?? scores.scores?.home;
      const away = scores.away ?? scores.visitorteam_score ?? scores.away_score ?? scores.score?.away ?? scores.scores?.away;
      if (home !== undefined || away !== undefined) {
        return [{ label: 'Current score', home, away }];
      }

      return Object.entries(scores).map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' ? value.display || value.value : value,
        home: typeof value === 'object' ? value.home ?? value.localteam_score ?? value.home_score : undefined,
        away: typeof value === 'object' ? value.away ?? value.visitorteam_score ?? value.away_score : undefined,
      }));
    }

    return [];
  })().filter((item) => item.value !== undefined || item.home !== undefined || item.away !== undefined);

  if (!normalized.length) return <p className="sports-detail-muted">Not available yet</p>;

  return (
    <div className="sports-detail-stat-grid">
      {normalized.map((item, index) => (
        <div className="sports-detail-stat" key={`${item.label}-${index}`}>
          <span>{textValue(item.label, `Score ${index + 1}`)}</span>
          <strong>{item.value !== undefined ? scoreText(item.value, textValue(item.value)) : `${scoreText(item.home, '0')}${item.away !== undefined ? ` - ${scoreText(item.away, '0')}` : ''}`}</strong>
        </div>
      ))}
    </div>
  );
}

function OddsList({ market, event, onSelect, selectedIds = new Set() }) {
  const selections = asArray(market?.selections);
  if (!selections.length) return <p className="sports-detail-muted">No betting market available</p>;

  const canBet = Boolean(event && onSelect);
  const matchId = event ? getMatchId(event) : '';

  return (
    <div className="sports-detail-odds-row sports-detail-odds-row-clickable">
      {selections.map((selection, index) => {
        const odd = normalizeProviderOddForSlip(selection, market || {}, index);
        const selected = selectedIds.has(`${matchId}:${odd.selectionId}`);
        const disabled = !canBet || String(odd.status || 'OPEN').toUpperCase() !== 'OPEN' || odd.price <= 1;
        return (
          <button
            type="button"
            key={odd.selectionId || selection.selectionId || selection.name || index}
            className={`sports-provider-odd-card sports-main-market-card ${selected ? 'selected' : ''}`}
            disabled={disabled}
            onClick={() => onSelect?.(event, odd)}
          >
            <small>7XBET</small>
            <span>{odd.label}</span>
            <b>{odd.price.toFixed(2)}</b>
          </button>
        );
      })}
    </div>
  );
}


const MARKET_GROUP_DEFINITIONS = [
  { key: 'main', label: 'Main', hint: 'Winner, 1X2, moneyline', pattern: /\b(moneyline|match winner|winner|1x2|3-way|3 way|draw no bet|double chance)\b/i },
  { key: 'runs', label: 'Runs / Overs', hint: 'Runs, innings, over totals', pattern: /\b(run|runs|over|overs|innings|odd\/even|odd even|total runs|team total|1st|first)\b/i },
  { key: 'player', label: 'Player Props', hint: 'Player runs, batsman, bowler, wickets', pattern: /\b(player|batsman|bowler|wicket|wickets|six|sixes|boundary|boundaries|dismissal)\b/i },
  { key: 'team', label: 'Team Props', hint: 'Team score and team specials', pattern: /\b(team|to score|top team|last team|first team|clean sheet)\b/i },
  { key: 'handicap', label: 'Handicap / Totals', hint: 'Spread, handicap, totals', pattern: /\b(handicap|spread|asian|total points|total goals|total|over\/under|line)\b/i },
  { key: 'specials', label: 'Specials', hint: 'Tie, periods, corners, cards, specials', pattern: /\b(tie|special|correct|exact|corner|corners|card|cards|period|half|quarter|set|method|race to)\b/i },
];

const MARKET_GROUP_FALLBACK = { key: 'specials', label: 'Specials', hint: 'Other 7XBET markets' };

function cleanMarketTitle(value = '') {
  return textValue(value, 'Market')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function marketTitleFrom(market = {}) {
  return cleanMarketTitle(
    market.marketDisplayName
    || market.marketName
    || market.market
    || market.marketKey
    || market.market_id
    || market.name
    || market.id
    || 'Market',
  );
}

function marketGroupFor(market = {}) {
  const title = `${marketTitleFrom(market)} ${market.marketKey || ''} ${market.market_id || ''}`.toLowerCase();
  // Player props must win over generic runs because markets like "Player Runs" are player bets.
  const player = MARKET_GROUP_DEFINITIONS.find((group) => group.key === 'player');
  if (player.pattern.test(title)) return player;
  const found = MARKET_GROUP_DEFINITIONS.find((group) => group.key !== 'player' && group.pattern.test(title));
  return found || MARKET_GROUP_FALLBACK;
}

function priceNumber(value) {
  const price = Number(value?.price ?? value?.odds ?? value?.value ?? value?.rate ?? value?.decimal ?? 0);
  return Number.isFinite(price) ? price : 0;
}

function lineText(odd = {}) {
  const point = odd.point ?? odd.points ?? odd.line ?? odd.handicap ?? odd.total;
  if (point === undefined || point === null || point === '') return '';
  return String(point);
}

function normalizeProviderOddForSlip(odd = {}, market = {}, index = 0) {
  const marketKey = odd.marketKey || odd.market_id || odd.marketId || market.marketKey || market.market_id || market.id || 'market';
  const title = marketTitleFrom({ ...market, marketKey });
  const line = lineText(odd);
  const labelBase = textValue(odd.displayName || odd.selectionName || odd.name || odd.selection || odd.label || odd.outcome || odd.team || odd.participant, 'Selection');
  const label = line && !String(labelBase).includes(line) ? `${labelBase} ${line}` : labelBase;
  const selectionId = odd.selectionId
    || odd.selection_id
    || odd.id
    || odd.key
    || odd.code
    || odd.providerOddsId
    || `${marketKey}:${label}:${line || index}`;

  return {
    key: selectionId,
    selectionId,
    providerOddsId: odd.providerOddsId || odd.provider_odds_id || odd.id || '',
    sportsbook: odd.sportsbook || odd.bookmaker || market.bookmaker || market.sportsbook || '',
    marketKey,
    marketName: title,
    marketDisplayName: title,
    label,
    point: odd.point ?? odd.points ?? odd.line ?? odd.handicap ?? odd.total ?? null,
    price: priceNumber(odd),
    status: odd.status || 'OPEN',
    raw: odd,
  };
}

function buildProviderMarketRows(markets = [], odds = []) {
  const marketRows = asArray(markets).map((market, marketIndex) => {
    const rawOdds = asArray(market.selections || market.odds || market.outcomes || market.options);
    const normalizedOdds = rawOdds
      .map((odd, index) => normalizeProviderOddForSlip(odd, market, index))
      .filter((odd) => odd.price > 1);

    return {
      ...market,
      id: market._id || market.id || market.marketKey || market.market_id || `market-${marketIndex}`,
      marketKey: market.marketKey || market.market_id || market.id || `market-${marketIndex}`,
      marketName: marketTitleFrom(market),
      odds: normalizedOdds,
    };
  }).filter((market) => market.odds.length);

  if (marketRows.length) return marketRows;

  const grouped = new Map();
  asArray(odds).forEach((odd, index) => {
    const marketKey = odd.marketKey || odd.market_id || odd.market || 'market';
    const current = grouped.get(marketKey) || {
      id: marketKey,
      marketKey,
      marketName: marketTitleFrom(odd),
      odds: [],
    };
    const normalized = normalizeProviderOddForSlip(odd, current, index);
    if (normalized.price > 1) current.odds.push(normalized);
    grouped.set(marketKey, current);
  });

  return Array.from(grouped.values()).filter((market) => market.odds.length);
}

function AllOddsMarketsPanel({ markets = [], odds = [], event, onSelect, selectedIds = new Set() }) {
  const [activeGroup, setActiveGroup] = useState('main');
  const [visibleCount, setVisibleCount] = useState(18);
  const rows = buildProviderMarketRows(markets, odds);

  if (!rows.length) return <p className="sports-detail-muted">No extra 7XBET markets returned for this fixture.</p>;

  const grouped = MARKET_GROUP_DEFINITIONS.reduce((acc, group) => ({ ...acc, [group.key]: [] }), { all: rows });
  rows.forEach((market) => {
    const group = marketGroupFor(market);
    grouped[group.key] = grouped[group.key] || [];
    grouped[group.key].push(market);
  });

  const tabs = [
    { key: 'all', label: 'All Markets', hint: 'Everything', count: rows.length },
    ...MARKET_GROUP_DEFINITIONS.map((group) => ({ ...group, count: grouped[group.key]?.length || 0 })),
  ].filter((tab) => tab.key === 'all' || tab.count > 0);

  const effectiveKey = grouped[activeGroup]?.length ? activeGroup : (tabs.find((tab) => tab.key !== 'all')?.key || 'all');
  const selectedRows = (effectiveKey === 'all' ? rows : grouped[effectiveKey] || rows);
  const visibleRows = selectedRows.slice(0, visibleCount);
  const selectedGroup = tabs.find((tab) => tab.key === effectiveKey) || tabs[0];
  const canBet = Boolean(onSelect && event);
  const matchId = event ? getMatchId(event) : '';

  return (
    <div className="sports-market-browser">
      <div className="sports-market-browser-head">
        <div>
          <strong>{selectedGroup?.label || 'All Markets'}</strong>
          <span>{selectedGroup?.hint || '7XBET markets'} · {selectedRows.length} market{selectedRows.length === 1 ? '' : 's'}</span>
        </div>
        <small>{canBet ? 'Tap any open price to add it to bet slip' : '7XBET market preview'}</small>
      </div>

      <div className="sports-market-tabs" role="tablist" aria-label="Market groups">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={effectiveKey === tab.key ? 'active' : ''}
            onClick={() => { setActiveGroup(tab.key); setVisibleCount(18); }}
          >
            <span>{tab.label}</span>
            <b>{tab.count}</b>
          </button>
        ))}
      </div>

      <div className="sports-provider-markets sports-provider-markets-premium">
        {visibleRows.map((market, index) => {
          const marketOdds = asArray(market.odds).slice(0, 18);
          return (
            <div className="sports-provider-market" key={market._id || market.id || market.marketKey || index}>
              <strong>
                {marketTitleFrom(market)}
                <small>7XBET</small>
              </strong>
              <div className="sports-provider-odds-grid sports-provider-odds-grid-clickable">
                {marketOdds.map((odd, oddIndex) => {
                  const selected = selectedIds.has(`${matchId}:${odd.selectionId}`);
                  const disabled = !canBet || String(odd.status || 'OPEN').toUpperCase() !== 'OPEN' || odd.price <= 1;
                  return (
                    <button
                      type="button"
                      key={odd.selectionId || `${market.marketKey}-${oddIndex}`}
                      className={`sports-provider-odd-card ${selected ? 'selected' : ''}`}
                      disabled={disabled}
                      onClick={() => onSelect?.(event, odd)}
                    >
                      <small>7XBET</small>
                      <span>{odd.label}</span>
                      <b>{odd.price.toFixed(2)}</b>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedRows.length > visibleRows.length ? (
        <button type="button" className="sports-show-more-markets" onClick={() => setVisibleCount((count) => count + 18)}>
          Show more markets ({selectedRows.length - visibleRows.length} remaining)
        </button>
      ) : null}
    </div>
  );
}

function ProviderRawPanel({ raw }) {
  if (!raw || typeof raw !== 'object') return <p className="sports-detail-muted">No raw feed payload available.</p>;
  const sections = Object.entries(raw).filter(([, value]) => value !== undefined && value !== null);
  if (!sections.length) return <p className="sports-detail-muted">No raw feed payload available.</p>;

  return (
    <div className="sports-provider-raw-list">
      {sections.map(([key, value]) => (
        <details key={key}>
          <summary>{key}</summary>
          <pre>{compactJson(value)}</pre>
        </details>
      ))}
    </div>
  );
}

function ActiveMarketsPanel({ items }) {
  const rows = asArray(items).slice(0, 40);
  if (!rows.length) return <p className="sports-detail-muted">No active market catalog returned for this fixture.</p>;
  return (
    <div className="sports-detail-list">
      {rows.map((item, index) => (
        <div className="sports-detail-list-row" key={item.id || item.market_id || `${item.name}-${index}`}>
          <span>{index + 1}</span>
          <strong>{textValue(item.name || item.market || item.market_id || item.id, 'Market')}</strong>
          <small>{textValue(item.sportsbook || item.bookmaker || item.league?.name || item.sport?.name || '', '')}</small>
        </div>
      ))}
    </div>
  );
}

function MatchDetailsModal({ data, loading, onClose, onSelect, selectedIds, betSlipCount = 0 }) {
  if (!data && !loading) return null;

  const event = data?.event || data?.data?.event;
  const market = data?.market || data?.data?.market;
  const details = data?.details || data?.data?.details;
  const showRawProviderPayload = String(import.meta.env.VITE_SPORTS_SHOW_RAW_PROVIDER || '').toLowerCase() === 'true';

  return (
    <div className="sports-detail-backdrop" role="dialog" aria-modal="true">
      <div className="sports-detail-modal">
        <button type="button" className="sports-detail-close" onClick={onClose} aria-label="Close details"><X size={20} /></button>
        <div className="sports-detail-header">
          <span className="page-eyebrow">Full Match Details</span>
          <h3>{event ? `${getTeamName(event.homeTeam)} vs ${getTeamName(event.awayTeam)}` : 'Loading match details...'}</h3>
          
        </div>

        {loading ? <div className="sports-empty-panel">Loading full details...</div> : null}

        {!loading && details && !details.available ? (
          <div className="sports-warning-panel">
            <Info size={20} />
            <div>
              <strong>Live details limited</strong>
              <p>{details.message || '7XBET odds are available. Full stats, lineups and commentary will show only when the live feed returns them.'}</p>
            </div>
          </div>
        ) : null}

        {!loading && event ? (
          <div className="sports-detail-body">
            <DetailsSection icon={<Info size={18} />} title="Basic information">
              <div className="sports-detail-grid">
                <DetailsItem label="Sport" value={event.sportTitle || event.sport} />
                <DetailsItem label="League" value={details?.league?.name || event.league} />
                <DetailsItem label="Status" value={getStrictMatchStatus(event)} />
                <DetailsItem label="Start time" value={details?.startingAt || event.startTime} />
                <DetailsItem label="Result" value={scoreLineFor(event, details)} />
                <DetailsItem label="Round" value={details?.round?.name || details?.round?.id} />
              </div>
            </DetailsSection>

            <DetailsSection icon={<Activity size={18} />} title="Live situation / match state">
              <LiveSituationPanel details={details} event={event} />
            </DetailsSection>

            <DetailsSection icon={<Users size={18} />} title="Teams">
              <div className="sports-detail-teams">
                <MiniTeam team={details?.homeTeam || event.homeTeam} />
                <span>VS</span>
                <MiniTeam team={details?.awayTeam || event.awayTeam} />
              </div>
            </DetailsSection>

            <DetailsSection icon={<MapPin size={18} />} title="Venue / tournament">
              <div className="sports-detail-grid">
                <DetailsItem label="Venue" value={details?.venue?.name} />
                <DetailsItem label="City" value={details?.venue?.city_name || details?.venue?.city} />
                <DetailsItem label="Season" value={details?.season?.name} />
                <DetailsItem label="Stage" value={details?.stage?.name} />
                <DetailsItem label="Referee" value={asArray(details?.referees).map((referee) => referee.name).filter(Boolean).join(', ')} />
                <DetailsItem label="Length" value={details?.length ? `${details.length} minutes` : ''} />
              </div>
            </DetailsSection>

            <DetailsSection icon={<Ticket size={18} />} title="Betting odds">
              <OddsList market={market} event={event} onSelect={onSelect} selectedIds={selectedIds} />
            </DetailsSection>

            <DetailsSection icon={<Ticket size={18} />} title="Premium sportsbook markets">
              <AllOddsMarketsPanel markets={details?.markets || details?.dbMarkets} odds={details?.odds} event={event} onSelect={onSelect} selectedIds={selectedIds} />
            </DetailsSection>

            <DetailsSection icon={<Activity size={18} />} title="Active market catalog">
              <ActiveMarketsPanel items={details?.activeMarkets} />
            </DetailsSection>

            <DetailsSection icon={<Trophy size={18} />} title="Futures / outright markets">
              <GenericDataList items={details?.futures} />
            </DetailsSection>

            <DetailsSection icon={<Ticket size={18} />} title="Futures odds">
              <GenericDataList items={details?.futuresOdds} />
            </DetailsSection>

            <DetailsSection icon={<Info size={18} />} title="League / team catalog">
              <GenericDataList items={[...(asArray(details?.leagues).slice(0, 10)), ...(asArray(details?.teamsCatalog).slice(0, 10))]} empty="No league/team catalog returned for this fixture." />
            </DetailsSection>

            <DetailsSection icon={<ListChecks size={18} />} title="Match events / commentary">
              <EventList items={details?.events} />
            </DetailsSection>

            <DetailsSection icon={<BarChart3 size={18} />} title="Statistics">
              <StatisticsList items={details?.statistics} />
            </DetailsSection>

            <DetailsSection icon={<Users size={18} />} title="Lineups / players">
              <LineupsList items={details?.lineups} />
            </DetailsSection>

            <DetailsSection icon={<BarChart3 size={18} />} title="Scores / periods">
              <ScoresPanel scores={details?.scores || event?.scores || event?.score} />
            </DetailsSection>

            <DetailsSection icon={<Users size={18} />} title="Player statistics">
              <GenericDataList items={details?.players} />
            </DetailsSection>

            <DetailsSection icon={<Users size={18} />} title="Squads / rosters">
              <GenericDataList items={details?.squads} />
            </DetailsSection>

            <DetailsSection icon={<ShieldCheck size={18} />} title="Injuries / availability">
              <GenericDataList items={details?.injuries} />
            </DetailsSection>

            <DetailsSection icon={<Trophy size={18} />} title="Standings / table">
              <GenericDataList items={details?.standings} />
            </DetailsSection>

            {showRawProviderPayload ? (
              <DetailsSection icon={<Info size={18} />} title="Raw feed payload">
                <ProviderRawPanel raw={details?.raw} />
              </DetailsSection>
            ) : null}

          </div>
        ) : null}

        {betSlipCount > 0 ? (
          <div className="sports-detail-slip-sticky">
            <span>{betSlipCount} selection{betSlipCount === 1 ? '' : 's'} in bet slip</span>
            <button type="button" onClick={onClose}>Close details to place bet</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MatchTeam({ team, sportKey, score }) {
  const logo = getTeamLogoUrl(team);
  return (
    <div className="sports-team-row">
      <span className={`sports-team-logo ${teamLogoClass(team, sportKey)}`}>
        {logo ? <img src={logo} alt={getTeamName(team)} loading="lazy" /> : teamLogoText(team)}
      </span>
      <strong>{getTeamName(team)}</strong>
      <b>{scoreText(score, '0')}</b>
    </div>
  );
}

function marketLabelFromOdds(odds = []) {
  const first = odds.find((odd) => odd?.marketDisplayName || odd?.marketName || odd?.marketKey);
  const label = first?.marketDisplayName || first?.marketName || first?.marketKey || 'Main market';
  return String(label).replace(/_/g, ' ');
}

function MatchCard({ match, onSelect, selectedIds, onDetails }) {
  const homeTeam = match.homeTeam || match.home;
  const awayTeam = match.awayTeam || match.away;
  const odds = normalizeMatchOdds(match);
  const marketLabel = marketLabelFromOdds(odds);
  const status = getStrictMatchStatus(match);
  const sportMeta = sportMetaFromMatch(match);
  const matchId = getMatchId(match);
  const disabled = match.completed || statusClass(status) === 'finished';

  return (
    <article className="sports-live-card">
      <div
        className="sports-live-card-top sports-live-card-top-clickable"
        role="button"
        tabIndex={0}
        onClick={() => onDetails(match)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onDetails(match);
          }
        }}
      >
        <div className="sports-card-title-block">
          <span className={`sports-competition ${sportMeta.className}`}><span>{sportMeta.icon}</span>{match.sport || match.sportTitle || sportMeta.name}</span>
          <h3>{getTeamName(homeTeam)} <span>vs</span> {getTeamName(awayTeam)}</h3>
          <p>{match.league || match.tournament || sportMeta.name} · {match.startTime || 'Auto sync'}</p>
        </div>
        <div className="sports-card-actions">
          <span className={`sports-status-pill ${statusClass(status)}`}>{status}</span>
          <button type="button" className="sports-details-button" onClick={(event) => { event.stopPropagation(); onDetails(match); }}>
            <Info size={15} /> Details
          </button>
        </div>
      </div>

      <div className="sports-score-board">
        <MatchTeam team={homeTeam} sportKey={match.sportKey} score={getScore(match, 'home')} />
        <MatchTeam team={awayTeam} sportKey={match.sportKey} score={getScore(match, 'away')} />
      </div>

      <div className="sports-market-label">{marketLabel}</div>

      <div className="sports-odds-grid">
        {odds.length ? odds.map((odd) => {
          const selected = selectedIds.has(`${matchId}:${odd.selectionId}`);
          return (
            <button
              type="button"
              className={`sports-odd-button ${selected ? 'selected' : ''}`}
              key={odd.selectionId}
              disabled={disabled}
              onClick={() => onSelect(match, odd)}
            >
              <small>{odd.label}</small>
              <strong>{odd.price.toFixed(2)}</strong>
            </button>
          );
        }) : (
          <span className="sports-no-odds">Markets opening soon</span>
        )}
      </div>
    </article>
  );
}

function BetHistory({ bets = [] }) {
  if (!bets.length) {
    return <div className="sports-empty-panel">No sports bets yet.</div>;
  }

  return (
    <div className="sports-bets-list">
      {bets.map((bet) => (
        <article className="sports-bet-row" key={bet._id || bet.betId}>
          <div>
            <strong>{bet.homeTeam} vs {bet.awayTeam}</strong>
            <span>{bet.marketName} · {bet.selectionName}</span>
            <small>{formatDate(bet.createdAt)}</small>
          </div>
          <div>
            <span className={`sports-bet-status ${String(bet.status).toLowerCase()}`}>{bet.status}</span>
            <strong>{formatCurrency(bet.stake)} @ {Number(bet.odds || 0).toFixed(2)}</strong>
            <small>{String(bet.status).toUpperCase() === 'WON' ? 'Won' : 'Return'}: {formatCurrency(bet.payoutAmount || bet.potentialReturn)}</small>
          </div>
        </article>
      ))}
    </div>
  );
}


function mergeSportsScoreUpdateIntoMatches(list = [], payload = {}) {
  if (!payload?.providerEventId && !payload?.eventId && !payload?.id) return list;
  const wantedIds = new Set([payload.providerEventId, payload.eventId, payload.id].filter(Boolean).map(String));
  let changed = false;
  const next = list.map((match) => {
    const ids = [getMatchId(match), match.providerEventId, match.eventId, match.id, match._id].filter(Boolean).map(String);
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
  return changed ? next : list;
}

export default function SportsPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');
  const [betSlipItems, setBetSlipItems] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);
  const [overview, setOverview] = useState(null);
  const [viewMode, setViewMode] = useState(searchParams.get('mode') || 'live');
  const maxVisibleMatches = Math.max(12, Number(import.meta.env.VITE_SPORTS_PAGE_MATCH_LIMIT || 48));

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const matchParams = { status: viewMode, limit: maxVisibleMatches };
      if (selectedSport !== 'all') matchParams.sport = selectedSport;

      const [overviewResponse, matchesResponse, statusResponse, betResponse] = await Promise.all([
        SportsAPI.overview({ limit: 12 }).catch(() => null),
        SportsAPI.liveMatches(matchParams),
        SportsAPI.syncStatus().catch(() => null),
        user ? SportsAPI.myBets().catch(() => null) : Promise.resolve(null),
      ]);

      const overviewPayload = overviewResponse?.data?.data || overviewResponse?.data || null;
      setOverview(overviewPayload);
      setCategories(overviewPayload?.sports || overviewResponse?.data?.sports || []);
      setMatches(matchesResponse.data?.data || matchesResponse.data?.matches || []);
      setStatus(statusResponse?.data?.data || null);
      setBets(user ? (betResponse?.data?.data || betResponse?.data?.bets || []) : []);
    } catch (error) {
      if (!silent) toast.error(getApiError(error, 'Unable to load sports data'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, selectedSport, viewMode, maxVisibleMatches]);

  useEffect(() => {
    let active = true;
    const refreshMs = Math.max(10000, Number(import.meta.env.VITE_SPORTS_REFRESH_MS || 15000));

    const runLoad = async (options = {}) => {
      if (!active) return;
      await load(options);
    };

    runLoad({ silent: false });
    const timer = window.setInterval(() => runLoad({ silent: true }), refreshMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [load]);


  useEffect(() => {
    const socket = connectRealtimeSocket();

    const onScoreUpdate = (payload = {}) => {
      setMatches((current) => mergeSportsScoreUpdateIntoMatches(current, payload));
      setMatchDetails((current) => {
        if (!current?.event) return current;
        const merged = mergeSportsScoreUpdateIntoMatches([current.event], payload)[0];
        if (merged === current.event) return current;
        return {
          ...current,
          event: merged,
          details: current.details ? {
            ...current.details,
            scores: Array.isArray(payload.scores) ? payload.scores : current.details.scores,
            resultInfo: payload.score?.display || payload.score?.summary || current.details.resultInfo,
            state: current.details.state ? { ...current.details.state, name: payload.status || current.details.state.name } : current.details.state,
          } : current.details,
        };
      });
    };

    const onRefreshHint = () => {
      load({ silent: true });
    };

    socket.emit('sports:join');
    socket.on('sports:score:update', onScoreUpdate);
    socket.on('sports:refresh:hint', onRefreshHint);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off('sports:score:update', onScoreUpdate);
      socket.off('sports:refresh:hint', onRefreshHint);
    };
  }, [load]);

  useEffect(() => {
    const sportFromUrl = searchParams.get('sport') || 'all';
    const modeFromUrl = searchParams.get('mode') || 'live';
    setSelectedSport(sportFromUrl);
    setViewMode(modeFromUrl === 'prematch' ? 'prematch' : 'live');
  }, [searchParams]);

  const sports = useMemo(() => {
    const unique = new Map();
    (overview?.sports || []).forEach((sport) => {
      const meta = sportMetaFrom(`${sport?.key || sport?.slug || ''} ${sport?.name || sport?.displayName || ''}`);
      unique.set(meta.key, { ...meta, ...sport, name: sport?.displayName || sport?.name || meta.name });
    });
    categories.forEach((category) => {
      const meta = category?.key
        ? sportMetaFrom(`${category.key} ${category.name || category.title || category.slug || ''}`)
        : sportMetaFrom(category?.name || category?.title || category?.slug || '');
      unique.set(meta.key, {
        ...meta,
        name: category?.name || category?.title || meta.name,
      });
    });
    matches.forEach((match) => {
      const meta = sportMetaFromMatch(match);
      unique.set(meta.key, meta);
    });
    return sortSportMetas(Array.from(unique.values()));
  }, [categories, matches, overview]);

  const visibleMatches = useMemo(() => {
    const sorted = sortMatchesBySportPriority(matches);
    if (selectedSport === 'all') return sorted;
    return sorted.filter((match) => sportMetaFromMatch(match).key === selectedSport);
  }, [matches, selectedSport]);

  const renderMatches = useMemo(() => visibleMatches.slice(0, maxVisibleMatches), [visibleMatches, maxVisibleMatches]);

  const groupedMatches = useMemo(() => {
    const groups = new Map();
    renderMatches.forEach((match) => {
      const meta = sportMetaFromMatch(match);
      if (!groups.has(meta.key)) groups.set(meta.key, { meta, items: [] });
      groups.get(meta.key).items.push(match);
    });
    return Array.from(groups.values()).sort((a, b) => sortSportMetas([a.meta, b.meta])[0]?.key === a.meta.key ? -1 : 1);
  }, [renderMatches]);

  const selectedIds = useMemo(() => new Set(betSlipItems.map((item) => item.id)), [betSlipItems]);

  const changeSport = (key) => {
    setSelectedSport(key);
    const next = new URLSearchParams(searchParams);
    if (key === 'all') next.delete('sport');
    else next.set('sport', key);
    next.set('mode', viewMode);
    setSearchParams(next);
  };

  const changeMode = (mode) => {
    const normalized = mode === 'prematch' ? 'prematch' : 'live';
    setViewMode(normalized);
    const next = new URLSearchParams(searchParams);
    next.set('mode', normalized);
    if (selectedSport !== 'all') next.set('sport', selectedSport);
    setSearchParams(next);
  };

  const addSelection = (match, odd) => {
    const item = buildSportsSlipItem(match, odd, 1);
    if (!item.eventId || !item.selectionId) {
      toast.error('This selection is not ready for betting');
      return;
    }

    setBetSlipItems((current) => {
      if (current.some((existing) => existing.id === item.id)) {
        toast('Already added to bet slip');
        return current;
      }
      toast.success('Added to bet slip');
      return [...current, item];
    });
  };

  const updateStake = (id, stake) => {
    setBetSlipItems((current) => current.map((item) => (
      item.id === id ? { ...item, stake } : item
    )));
  };

  const removeSlipItem = (id) => {
    setBetSlipItems((current) => current.filter((item) => item.id !== id));
  };

  const openDetails = async (match) => {
    const eventId = getMatchId(match);
    if (!eventId) {
      toast.error('Match details are not available yet');
      return;
    }

    setDetailsOpen(true);
    setDetailsLoading(true);
    setMatchDetails({ event: match, market: null, details: null });

    try {
      const response = await SportsAPI.eventDetails(eventId);
      setMatchDetails(response.data?.data || response.data || null);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load match details'));
      setMatchDetails({ event: match, details: { available: false, message: getApiError(error, 'Unable to load match details') } });
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const matchIdFromUrl = searchParams.get('match');
    if (!matchIdFromUrl || detailsOpen || !matches.length) return;

    const match = matches.find((item) => String(getMatchId(item)) === String(matchIdFromUrl));
    if (match) openDetails(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, matches, detailsOpen]);

  const submitBets = async () => {
    if (!user) {
      toast.error('Please login to place a sports bet');
      return;
    }

    const selections = betSlipItems.map((item) => ({
      eventId: item.eventId,
      marketKey: item.marketKey,
      selectionId: item.selectionId,
      stake: Number(item.stake),
    })).filter((item) => item.eventId && item.selectionId && Number.isFinite(item.stake) && item.stake > 0);

    if (!selections.length) {
      toast.error('Enter a valid stake amount');
      return;
    }

    setPlacing(true);
    try {
      await SportsAPI.placeMultipleBets({ selections });
      setBetSlipItems([]);
      toast.success(`${selections.length} sports bet${selections.length === 1 ? '' : 's'} placed successfully`);
      await Promise.all([load(), refreshUser?.()]);
    } catch (error) {
      toast.error(getApiError(error, 'Sports bet failed'));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="page-stack sports-page">
      <PageHeader
        eyebrow="7XBET Sports"
        title="Premium Live & Pre-match Sports"
        description="Fast-loading 7XBET sports markets with live scores, match cards, and mobile-first betting flow."
      />

      <section className="sports-hero-panel">
        <div>
          <span className="page-eyebrow">7XBET auto update</span>
          <h2>Live & pre-match markets</h2>
          <p>Quick sports list, fast match cards, live scores and protected real-price betting.</p>
        </div>
        <div className="sports-hero-stats">
          <div><Activity size={18} /><span>Events</span><strong>{status?.events ?? matches.length}</strong></div>
          <div><Ticket size={18} /><span>Open bets</span><strong>{status?.openBets ?? 0}</strong></div>
          <div><Wallet size={18} /><span>Balance</span><strong>{formatCurrency(user?.wallet, user)}</strong></div>
        </div>
      </section>

      <div className="sports-mode-switch" role="tablist" aria-label="Sports mode">
        <button type="button" className={viewMode === 'live' ? 'active' : ''} onClick={() => changeMode('live')}>LIVE</button>
        <button type="button" className={viewMode === 'prematch' ? 'active' : ''} onClick={() => changeMode('prematch')}>Pre-match</button>
      </div>

      <div className="sports-toolbar sports-toolbar-premium">
        <div className="sports-tabs sports-tabs-counts">
          <button type="button" className={selectedSport === 'all' ? 'active' : ''} onClick={() => changeSport('all')}>All <b>{overview?.summary?.[viewMode] || visibleMatches.length}</b></button>
          {sports.map((sport) => (
            <button type="button" key={sport.key} className={selectedSport === sport.key ? `active ${sport.className}` : ''} onClick={() => changeSport(sport.key)}>
              <span>{sport.icon}</span> {sport.name}
              <b>{Number(sport?.[viewMode] ?? sport?.count ?? 0)}</b>
            </button>
          ))}
        </div>
        <span className="sports-live-sync-pill"><Radio size={16} /> Auto update</span>
      </div>


      <div className="sports-trust-strip">
        <span><ShieldCheck size={16} /> Real 7XBET odds</span>
        <span><Radio size={16} /> Live score updates</span>
        <span><Ticket size={16} /> Locked/suspended odds protected</span>
      </div>

      <div className="sports-layout-grid">
        <section className="sports-live-list">
          <div className="section-row-title sports-live-title-row">
            <h2><Clock size={20} /> {viewMode === 'prematch' ? 'Pre-match Sports' : 'Live Sports'} </h2>
            <span>{renderMatches.length}{visibleMatches.length > renderMatches.length ? ` / ${visibleMatches.length}` : ''} matches</span>
          </div>
          {visibleMatches.length > renderMatches.length ? (
            <p className="sports-list-hint">Showing first {renderMatches.length} matches for faster mobile loading. Use a sport tab to narrow the list.</p>
          ) : null}

          {loading && !visibleMatches.length ? (
            <div className="sports-empty-panel">Loading 7XBET sports feed...</div>
          ) : groupedMatches.length ? (
            groupedMatches.map((group) => (
              <div className="sports-category-block" key={group.meta.key}>
                <div className="sports-category-heading">
                  <span className={`sports-category-icon ${group.meta.className}`}>{group.meta.icon}</span>
                  <div>
                    <h3>{group.meta.name}</h3>
                    <small>{group.items.length} event{group.items.length === 1 ? '' : 's'}</small>
                  </div>
                </div>
                {group.items.map((match) => (
                  <MatchCard key={getMatchId(match)} match={match} onSelect={addSelection} selectedIds={selectedIds} onDetails={openDetails} />
                ))}
              </div>
            ))
          ) : (
            <div className="sports-empty-panel">No matches available right now. Try another sport or check the live feed later.</div>
          )}
        </section>

        <aside className="sports-side-panel">
          <div className="sports-side-card">
            <h3>My Sports Bets</h3>
            <BetHistory bets={bets} />
            {!user ? <Link className="btn btn-primary btn-full" to="/login">Login to bet</Link> : null}
          </div>
        </aside>
      </div>

      <SportsBetSlip
        items={betSlipItems}
        user={user}
        placing={placing}
        onStakeChange={updateStake}
        onRemove={removeSlipItem}
        onClear={() => setBetSlipItems([])}
        onPlaceAll={submitBets}
      />

      {detailsOpen ? (
        <MatchDetailsModal
          data={matchDetails}
          loading={detailsLoading}
          onSelect={addSelection}
          selectedIds={selectedIds}
          betSlipCount={betSlipItems.length}
          onClose={() => {
            setDetailsOpen(false);
            setMatchDetails(null);
            if (searchParams.has('match')) {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('match');
              setSearchParams(nextParams, { replace: true });
            }
          }}
        />
      ) : null}
    </div>
  );
}
