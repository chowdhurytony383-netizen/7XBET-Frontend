export const SPORT_META = {
  football: { key: 'football', name: 'Football', icon: '⚽', className: 'sport-football' },
  cricket: { key: 'cricket', name: 'Cricket', icon: '🏏', className: 'sport-cricket' },
  basketball: { key: 'basketball', name: 'Basketball', icon: '🏀', className: 'sport-basketball' },
  tennis: { key: 'tennis', name: 'Tennis', icon: '🎾', className: 'sport-tennis' },
  hockey: { key: 'hockey', name: 'Hockey', icon: '🏒', className: 'sport-hockey' },
  baseball: { key: 'baseball', name: 'Baseball', icon: '⚾', className: 'sport-baseball' },
  rugby: { key: 'rugby', name: 'Rugby', icon: '🏉', className: 'sport-rugby' },
  volleyball: { key: 'volleyball', name: 'Volleyball', icon: '🏐', className: 'sport-volleyball' },
  boxing: { key: 'boxing', name: 'Boxing / MMA', icon: '🥊', className: 'sport-boxing' },
  americanfootball: { key: 'americanfootball', name: 'American Football', icon: '🏈', className: 'sport-americanfootball' },
  sports: { key: 'sports', name: 'Sports', icon: '🏆', className: 'sport-default' },
};

const SPORT_PRIORITY = {
  cricket: 0,
  football: 1,
  basketball: 2,
  tennis: 3,
  volleyball: 4,
  baseball: 5,
  hockey: 6,
  rugby: 7,
  americanfootball: 8,
  boxing: 9,
  sports: 99,
};

export function categoryKeyFromText(value = '') {
  const clean = String(value || '').toLowerCase();
  if (clean.includes('americanfootball') || clean.includes('american football') || clean.includes('nfl') || clean.includes('ncaaf')) return 'americanfootball';
  if (clean.includes('soccer') || clean.includes('football') || clean.includes('uefa') || clean.includes('epl')) return 'football';
  if (clean.includes('cricket')) return 'cricket';
  if (clean.includes('basket')) return 'basketball';
  if (clean.includes('tennis')) return 'tennis';
  if (clean.includes('hockey')) return 'hockey';
  if (clean.includes('baseball')) return 'baseball';
  if (clean.includes('rugby')) return 'rugby';
  if (clean.includes('volleyball')) return 'volleyball';
  if (clean.includes('boxing') || clean.includes('mma')) return 'boxing';
  return 'sports';
}

export function sportMetaFrom(value = '', fallbackTitle = '') {
  const key = categoryKeyFromText(`${value || ''} ${fallbackTitle || ''}`);
  return SPORT_META[key] || SPORT_META.sports;
}

export function sportMetaFromMatch(match = {}) {
  if (match.category?.key && SPORT_META[match.category.key]) return SPORT_META[match.category.key];
  if (match.categoryKey && SPORT_META[match.categoryKey]) return SPORT_META[match.categoryKey];
  return sportMetaFrom(`${match.sportKey || ''} ${match.sport || ''} ${match.sportTitle || ''} ${match.categoryName || ''}`);
}

function readableText(value, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => readableText(item, '')).filter(Boolean).join(', ') || fallback;
  }
  if (typeof value === 'object') {
    return readableText(
      value.display
        ?? value.displayName
        ?? value.name
        ?? value.shortName
        ?? value.label
        ?? value.value
        ?? value.score
        ?? value.total
        ?? value.runs
        ?? value.raw?.name
        ?? value.raw?.displayName,
      fallback,
    );
  }
  return fallback;
}

function scoreValueText(value, fallback = '0') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const direct = value.display ?? value.value ?? value.score ?? value.total ?? value.runs ?? value.points ?? value.goals;
    const base = scoreValueText(direct, '');
    if (base) {
      const wickets = value.wickets !== undefined && value.wickets !== null && value.wickets !== '' ? `/${value.wickets}` : '';
      const overs = value.overs ? ` (${value.overs} ov)` : '';
      return `${base}${wickets}${overs}`;
    }
    const home = value.home ?? value.homeScore ?? value.scores?.home;
    const away = value.away ?? value.awayScore ?? value.scores?.away;
    if (home !== undefined || away !== undefined) {
      return `${scoreValueText(home, '0')} - ${scoreValueText(away, '0')}`;
    }
  }
  return fallback;
}

export function getTeamName(team) {
  if (!team) return 'Team';
  return readableText(team, 'Team');
}

export function shortTeamCode(name = '') {
  const words = String(name || 'Team')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'TM';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase();
}

function colorIndexFor(value = '') {
  const source = String(value || 'team');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 9973;
  }
  return (hash % 8) + 1;
}

export function teamLogoText(team) {
  if (team && typeof team === 'object' && team.logoText) return team.logoText;
  return shortTeamCode(getTeamName(team));
}

export function teamLogoClass(team, sportKey = '') {
  if (team && typeof team === 'object' && team.colorClass) return team.colorClass;
  return `team-logo-${colorIndexFor(`${sportKey}:${getTeamName(team)}`)}`;
}

export function getTeamLogoUrl(team) {
  if (!team || typeof team !== 'object') return '';
  return team.logo
    || team.logoUrl
    || team.image
    || team.imageUrl
    || team.image_path
    || team.flag
    || team.flagUrl
    || team.badge
    || team.raw?.logo
    || team.raw?.logoUrl
    || team.raw?.image
    || team.raw?.imageUrl
    || team.raw?.image_path
    || '';
}

function sportPriorityFor(metaOrMatch = {}) {
  const meta = metaOrMatch?.key ? metaOrMatch : sportMetaFromMatch(metaOrMatch);
  return SPORT_PRIORITY[meta.key] ?? SPORT_PRIORITY.sports;
}


function scoreTextHasRealProgress(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text || text === '0' || text === '0-0' || text === '0:0' || text === '0/0') return false;

  const cricketOver = text.match(/\((\d+(?:\.\d+)?)\s*ov\)/);
  if (cricketOver) return Number.parseFloat(cricketOver[1]) > 0;

  return /[1-9]/.test(text);
}

function scoreItemHasRealProgress(item = {}) {
  if (!item || typeof item !== 'object') return false;

  const numericValues = [item.score, item.value, item.runs, item.total, item.points, item.goals];
  if (numericValues.some((value) => Number(value || 0) > 0)) return true;

  const overs = Number.parseFloat(String(item.overs || '0'));
  if (Number.isFinite(overs) && overs > 0) return true;

  return [item.display, item.label, item.description].some(scoreTextHasRealProgress);
}

export function hasRealScoreProgress(match = {}) {
  if (Array.isArray(match.scores) && match.scores.some(scoreItemHasRealProgress)) return true;

  const score = match.score || {};
  return [score.home, score.away, score.homeScore, score.awayScore].some(scoreTextHasRealProgress);
}

export function getStrictMatchStatus(match = {}) {
  const raw = String(match.status || match.matchStatus || '').trim().toLowerCase();
  if (match.completed || raw.includes('finish') || raw.includes('complete') || raw.includes('closed') || raw.includes('cancel')) return 'Finished';

  // Official providers can sometimes update score before the cached status field changes.
  // If real score progress exists, the match is live even when an old response says Upcoming.
  if (hasRealScoreProgress(match)) return 'Live';

  if (raw.includes('live') || raw.includes('inning') || raw.includes('quarter') || raw.includes('half') || raw.includes('set')) return 'Live';

  return 'Upcoming';
}

function statusPriority(match = {}) {
  const clean = String(getStrictMatchStatus(match)).toLowerCase();
  if (clean.includes('live') || clean.includes('innings') || clean.includes('quarter') || clean.includes('half')) return 0;
  if (clean.includes('upcoming') || clean.includes('not started') || clean.includes('scheduled')) return 1;
  if (clean.includes('finish') || clean.includes('complete')) return 3;
  return 2;
}

function startTimeValue(match = {}) {
  const value = match.startTime || match.dateTime || match.kickoffTime || match.commenceTime || match.startingAt || '';
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function sortSportMetas(items = []) {
  return [...items].sort((a, b) => {
    const priority = sportPriorityFor(a) - sportPriorityFor(b);
    if (priority !== 0) return priority;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

export function sortMatchesBySportPriority(items = []) {
  return [...items].sort((a, b) => {
    const priority = sportPriorityFor(a) - sportPriorityFor(b);
    if (priority !== 0) return priority;
    const status = statusPriority(a) - statusPriority(b);
    if (status !== 0) return status;
    return startTimeValue(a) - startTimeValue(b);
  });
}

export function getMatchId(match = {}) {
  return match._id || match.id || match.eventId || match.providerEventId || '';
}

export function getScore(match, side) {
  const normalizedSide = String(side || '').toLowerCase();
  const score = match?.score || {};
  const value = score?.[normalizedSide] ?? score?.[normalizedSide === 'home' ? 'homeScore' : 'awayScore'];

  if (value !== undefined && value !== null && value !== '') {
    return scoreValueText(value, '0');
  }

  if (Array.isArray(match?.scores)) {
    const bySide = match.scores.find((item) => String(item?.side || '').toLowerCase() === normalizedSide);
    if (bySide) return scoreValueText(bySide.display ?? bySide.value ?? bySide.score ?? bySide, '0');

    const teamName = normalizedSide === 'home'
      ? getTeamName(match?.homeTeam || match?.home)
      : getTeamName(match?.awayTeam || match?.away);

    const found = match.scores.find((item) => String(readableText(item?.name || item?.label || '')).toLowerCase() === String(teamName || '').toLowerCase());
    if (found) return scoreValueText(found.display ?? found.value ?? found.score ?? found, '0');
  }

  return '0';
}

export function normalizeMatchOdds(match) {
  const odds = match?.mainOdds || match?.odds || match?.markets || [];
  if (!Array.isArray(odds)) return [];

  return odds
    .map((odd, index) => {
      const price = Number(odd.price || odd.odds || odd.value || odd.rate || 0);
      const selectionId = odd.selectionId || odd.key || odd.id || odd.code || `${index}`;
      const marketName = readableText(odd.marketDisplayName || odd.marketName || odd.market || odd.marketKey, 'Market');
      return {
        key: selectionId,
        selectionId,
        providerOddsId: odd.providerOddsId || '',
        sportsbook: odd.sportsbook || odd.bookmaker || '',
        marketKey: odd.marketKey || odd.market_id || 'market',
        marketName,
        marketDisplayName: marketName,
        label: readableText(odd.label || odd.displayName || odd.name || odd.key, 'Selection'),
        price,
      };
    })
    .filter((odd) => odd.selectionId && odd.price > 1)
    .slice(0, 6);
}

export function statusClass(status = '') {
  const clean = String(status).toLowerCase();
  if (clean.includes('live')) return 'live';
  if (clean.includes('finish') || clean.includes('lost')) return 'finished';
  return 'upcoming';
}

export function buildSportsSlipItem(match, odd, defaultStake = 1) {
  const homeTeam = match.homeTeam || match.home || match.teamA;
  const awayTeam = match.awayTeam || match.away || match.teamB;
  const sportMeta = sportMetaFromMatch(match);

  return {
    id: `${getMatchId(match)}:${odd.selectionId}`,
    eventId: getMatchId(match),
    providerEventId: match.providerEventId || '',
    marketKey: odd.marketKey || 'h2h',
    marketName: odd.marketName || 'Match Winner',
    selectionId: odd.selectionId,
    selectionName: odd.label,
    odds: Number(odd.price || 0),
    stake: defaultStake,
    home: getTeamName(homeTeam),
    away: getTeamName(awayTeam),
    league: match.league || match.tournament || match.categoryName || sportMeta.name,
    sport: match.sport || match.sportTitle || sportMeta.name,
    sportIcon: sportMeta.icon,
    sportClass: sportMeta.className,
    startTime: match.startTime || match.dateTime || match.kickoffTime || '',
  };
}
