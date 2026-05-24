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
  sports: { key: 'sports', name: 'Sports', icon: '🏆', className: 'sport-default' },
};

export function categoryKeyFromText(value = '') {
  const clean = String(value || '').toLowerCase();
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
