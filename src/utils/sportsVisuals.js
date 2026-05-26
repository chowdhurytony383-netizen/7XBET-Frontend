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

export function getTeamName(team) {
  if (!team) return 'Team';
  if (typeof team === 'string') return team;
  return team.name || team.displayName || team.shortName || 'Team';
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

function statusTextFor(match = {}) {
  return [
    match.status,
    match.matchStatus,
    match.statusText,
    match.statusShort,
    match.state,
    match.fixtureStatus,
    match.eventStatus,
    match.raw?.status,
    match.raw?.statusText,
    match.raw?.statusShort,
    match.raw?.state,
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map((value) => String(value).toLowerCase())
    .join(' ');
}

function truthyFlag(value) {
  if (value === true) return true;
  const clean = String(value || '').toLowerCase();
  return clean === 'true' || clean === '1' || clean === 'yes' || clean === 'live';
}

function finishedStatus(match = {}) {
  if (match.completed || match.finished || match.isFinished || match.isCompleted) return true;
  const clean = statusTextFor(match);
  return /\b(finished|finish|complete|completed|closed|ended|final|ft|full time|abandoned|cancelled|canceled|postponed)\b/.test(clean);
}

function scoreIndicatesLive(match = {}) {
  const score = match.score || {};
  const scoreValues = [
    score.home,
    score.away,
    score.homeScore,
    score.awayScore,
    match.homeScore,
    match.awayScore,
  ];

  const scoreHasProgress = scoreValues.some((value) => {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'object') {
      return scoreHasProgressFromText(value.display || value.value || value.score || '');
    }
    return scoreHasProgressFromText(value);
  });

  if (scoreHasProgress) return true;

  if (Array.isArray(match.scores)) {
    return match.scores.some((item) => {
      const overs = Number.parseFloat(String(item?.overs || '0'));
      const scoreNumber = Number(item?.score || 0);
      const display = item?.display || item?.value || '';
      return overs > 0 || scoreNumber > 0 || scoreHasProgressFromText(display);
    });
  }

  return false;
}

function scoreHasProgressFromText(value) {
  const text = String(value || '').toLowerCase();
  if (!text || text === '0' || text === '0-0' || text === '0:0') return false;

  const cricketOver = text.match(/\((\d+(?:\.\d+)?)\s*ov\)/);
  if (cricketOver) return Number.parseFloat(cricketOver[1]) > 0;

  return /[1-9]/.test(text);
}

function liveStatus(match = {}) {
  if (finishedStatus(match)) return false;

  const hasRealScoreProgress = scoreIndicatesLive(match);
  const clean = statusTextFor(match);
  const explicitProviderLive = /\b(live|in[-\s]?play|in progress|1h|2h|ht|half time|quarter|q1|q2|q3|q4|inning|innings|over|overs|batting|bowling|lunch|tea|dinner|stumps|break)\b/.test(clean);

  // Strict UI rule for every sport, including Tennis:
  // Do not show LIVE from start time, started flag, or a 0-0 score shell.
  // Show LIVE only when backend/provider gives explicit live status OR score has real progress.
  if (hasRealScoreProgress) return true;
  if (explicitProviderLive && !/\b(upcoming|scheduled|not started|fixture|pre[-\s]?match|ns)\b/.test(clean)) return true;

  if ([match.live, match.isLive, match.inPlay, match.in_play, match.isInPlay].some(truthyFlag)) {
    return explicitProviderLive || hasRealScoreProgress;
  }

  return false;
}

function upcomingStatus(match = {}) {
  if (finishedStatus(match) || liveStatus(match)) return false;

  const clean = statusTextFor(match);
  return /\b(upcoming|not started|scheduled|fixture|pre[-\s]?match|ns|toss|delayed)\b/.test(clean);
}

function statusPriority(match = {}) {
  if (liveStatus(match)) return 0;
  if (upcomingStatus(match)) return 1;
  if (finishedStatus(match)) return 3;
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
    // Home page priority:
    // 1) real live/in-play matches first
    // 2) inside the live group, Cricket first, then Football, then other sports
    // 3) upcoming/unknown/finished groups keep the same sport priority after live
    const status = statusPriority(a) - statusPriority(b);
    if (status !== 0) return status;

    const priority = sportPriorityFor(a) - sportPriorityFor(b);
    if (priority !== 0) return priority;

    return startTimeValue(a) - startTimeValue(b);
  });
}

export function getMatchId(match = {}) {
  return match._id || match.id || match.eventId || match.providerEventId || '';
}

export function getScore(match, side) {
  const score = match?.score || {};
  const value = score?.[side] ?? score?.[side === 'home' ? 'homeScore' : 'awayScore'];
  if (value !== undefined && value !== null && value !== '') {
    if (typeof value === 'object') return value.display || value.value || value.score || 0;
    return value;
  }

  const teamName = side === 'home' ? getTeamName(match?.homeTeam || match?.home) : getTeamName(match?.awayTeam || match?.away);
  const found = Array.isArray(match?.scores)
    ? match.scores.find((item) => String(item?.name || '').toLowerCase() === String(teamName || '').toLowerCase())
    : null;
  if (found) return found.display || found.value || found.score || 0;
  return 0;
}

export function normalizeMatchOdds(match) {
  const odds = match?.mainOdds || match?.odds || match?.markets || [];
  if (!Array.isArray(odds)) return [];

  return odds
    .map((odd, index) => {
      const price = Number(odd.price || odd.odds || odd.value || odd.rate || 0);
      const selectionId = odd.selectionId || odd.key || odd.id || odd.code || `${index}`;
      return {
        key: selectionId,
        selectionId,
        marketKey: odd.marketKey || 'h2h',
        marketName: odd.marketName || 'Match Winner',
        label: odd.label || odd.name || odd.key || 'Selection',
        price,
      };
    })
    .filter((odd) => odd.selectionId && odd.price > 1);
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
