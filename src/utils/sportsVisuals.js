export const SPORT_META = {
  football: { key: 'football', name: 'Football', icon: '⚽', className: 'sport-football' },
  soccer: { key: 'soccer', name: 'Football', icon: '⚽', className: 'sport-football' },
  cricket: { key: 'cricket', name: 'Cricket', icon: '🏏', className: 'sport-cricket' },
  basketball: { key: 'basketball', name: 'Basketball', icon: '🏀', className: 'sport-basketball' },
  tennis: { key: 'tennis', name: 'Tennis', icon: '🎾', className: 'sport-tennis' },
  hockey: { key: 'hockey', name: 'Hockey', icon: '🏒', className: 'sport-hockey' },
  baseball: { key: 'baseball', name: 'Baseball', icon: '⚾', className: 'sport-baseball' },
  rugby: { key: 'rugby', name: 'Rugby', icon: '🏉', className: 'sport-rugby' },
  rugby_league: { key: 'rugby_league', name: 'Rugby League', icon: '🏉', className: 'sport-rugby' },
  rugby_union: { key: 'rugby_union', name: 'Rugby Union', icon: '🏉', className: 'sport-rugby' },
  volleyball: { key: 'volleyball', name: 'Volleyball', icon: '🏐', className: 'sport-volleyball' },
  boxing: { key: 'boxing', name: 'Boxing', icon: '🥊', className: 'sport-boxing' },
  mma: { key: 'mma', name: 'MMA', icon: '🥊', className: 'sport-boxing' },
  golf: { key: 'golf', name: 'Golf', icon: '⛳', className: 'sport-default' },
  darts: { key: 'darts', name: 'Darts', icon: '🎯', className: 'sport-default' },
  table_tennis: { key: 'table_tennis', name: 'Table Tennis', icon: '🏓', className: 'sport-tennis' },
  esports: { key: 'esports', name: 'eSports', icon: '🎮', className: 'sport-default' },
  americanfootball: { key: 'americanfootball', name: 'American Football', icon: '🏈', className: 'sport-americanfootball' },
  sports: { key: 'sports', name: 'Sports', icon: '🏆', className: 'sport-default' },
};

const SPORT_PRIORITY = {
  cricket: 0,
  soccer: 1,
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
  if (clean.includes('americanfootball') || clean.includes('american football') || clean.includes('nfl') || clean.includes('ncaaf')) return 'americanfootball';
  if (clean.includes('soccer') || clean.includes('football') || clean.includes('uefa') || clean.includes('epl')) return clean.includes('soccer') ? 'soccer' : 'football';
  if (clean.includes('cricket')) return 'cricket';
  if (clean.includes('basket')) return 'basketball';
  if (clean.includes('tennis')) return 'tennis';
  if (clean.includes('hockey')) return 'hockey';
  if (clean.includes('baseball')) return 'baseball';
  if (clean.includes('rugby')) return 'rugby';
  if (clean.includes('volleyball')) return 'volleyball';
  if (clean.includes('table tennis')) return 'table_tennis';
  if (clean.includes('darts')) return 'darts';
  if (clean.includes('golf')) return 'golf';
  if (clean.includes('esport')
    || clean.includes('e-sport')
    || clean.includes('dota')
    || clean.includes('league of legends')
    || clean === 'lol'
    || clean.includes(' lol ')
    || clean.includes('counter strike')
    || clean.includes('counter-strike')
    || clean.includes('counterstrike')
    || clean.includes('cs2')
    || clean.includes('csgo')
    || clean.includes('valorant')
    || clean.includes('rainbow six')
    || clean.includes('rainbowsix')
    || clean.includes(' r6')
    || clean.includes('overwatch')
    || clean.includes('starcraft')
    || clean.includes('call of duty')
    || clean.includes('pubg')
    || clean.includes('mobile legends')
    || clean.includes('wild rift')
    || clean.includes('arena of valor')
    || clean.includes('king of glory')
    || clean.includes('rocket league')) return 'esports';
  if (clean.includes('mma')) return 'mma';
  if (clean.includes('boxing')) return 'boxing';
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

function safeString(value, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback;
  const text = String(value).trim();
  if (!text || text === '[object Object]') return fallback;
  return text;
}

function readableText(value, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return safeString(value, fallback);
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
        ?? value.title
        ?? value.value
        ?? value.score
        ?? value.total
        ?? value.runs
        ?? value.points
        ?? value.goals
        ?? value.raw?.name
        ?? value.raw?.displayName,
      fallback,
    );
  }
  return fallback;
}

function scoreValueText(value, fallback = '0') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return safeString(value, fallback);
  }

  if (Array.isArray(value)) {
    const parts = value.map((item) => scoreValueText(item, '')).filter(Boolean);
    return parts.length ? parts.join(' · ') : fallback;
  }

  if (typeof value === 'object') {
    const runs = value.runs ?? value.run ?? value.score ?? value.total ?? value.value ?? value.points ?? value.goals;
    const wickets = value.wickets ?? value.wkts ?? value.outs;
    const overs = value.overs ?? value.over;
    if (runs !== undefined && runs !== null && runs !== value) {
      const base = scoreValueText(runs, '0');
      return `${base}${wickets !== undefined && wickets !== null && wickets !== '' ? `/${wickets}` : ''}${overs !== undefined && overs !== null && overs !== '' ? ` (${overs} ov)` : ''}`;
    }

    const nested = value.total_score ?? value.totalScore ?? value.current ?? value.current_score ?? value.currentScore ?? value.score;
    if (nested && typeof nested === 'object' && nested !== value) {
      const text = scoreValueText(nested, '');
      if (text) return text;
    }

    const display = value.display ?? value.displayName ?? value.formatted;
    if (display !== undefined && display !== null && display !== value) {
      const text = safeString(display, '');
      if (text) return text;
    }

    const home = value.home ?? value.homeScore ?? value.localteam_score ?? value.scores?.home;
    const away = value.away ?? value.awayScore ?? value.visitorteam_score ?? value.scores?.away;
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


const COUNTRY_FLAG_EMOJI = {
  afghanistan: '🇦🇫', australia: '🇦🇺', bangladesh: '🇧🇩', canada: '🇨🇦', england: '🏴', india: '🇮🇳', ireland: '🇮🇪', namibia: '🇳🇦', nepal: '🇳🇵', netherlands: '🇳🇱', newzealand: '🇳🇿', pakistan: '🇵🇰', scotland: '🏴', southafrica: '🇿🇦', srilanka: '🇱🇰', unitedarabemirates: '🇦🇪', usa: '🇺🇸', unitedstates: '🇺🇸', westindies: '🌴', zimbabwe: '🇿🇼', oman: '🇴🇲', bahrain: '🇧🇭', qatar: '🇶🇦', kuwait: '🇰🇼', malaysia: '🇲🇾', singapore: '🇸🇬', hongkong: '🇭🇰', thailand: '🇹🇭', philippines: '🇵🇭', indonesia: '🇮🇩', france: '🇫🇷', italy: '🇮🇹', germany: '🇩🇪', spain: '🇪🇸', portugal: '🇵🇹', brazil: '🇧🇷', argentina: '🇦🇷', colombia: '🇨🇴', chile: '🇨🇱', japan: '🇯🇵', korea: '🇰🇷', china: '🇨🇳', russia: '🇷🇺', ukraine: '🇺🇦'
};

function countryFlagForTeamName(name = '') {
  const clean = String(name || '').toLowerCase().replace(/women|men|county|fc|club|team|cricket|national|u19|u20|u21|u23|[^a-z0-9]/g, '');
  if (!clean) return '';
  if (COUNTRY_FLAG_EMOJI[clean]) return COUNTRY_FLAG_EMOJI[clean];
  const found = Object.entries(COUNTRY_FLAG_EMOJI).find(([key]) => clean.includes(key) || key.includes(clean));
  return found?.[1] || '';
}

export function teamLogoText(team) {
  if (team && typeof team === 'object' && team.logoText && String(team.logoText).length <= 3) {
    const flag = countryFlagForTeamName(getTeamName(team));
    return flag || team.logoText;
  }
  if (team && typeof team === 'object' && team.logoText) return team.logoText;
  const flag = countryFlagForTeamName(getTeamName(team));
  return flag || shortTeamCode(getTeamName(team));
}

export function teamLogoClass(team, sportKey = '') {
  if (team && typeof team === 'object' && team.colorClass) return team.colorClass;
  return `team-logo-${colorIndexFor(`${sportKey}:${getTeamName(team)}`)}`;
}

function firstLogoUrl(...values) {
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string') {
      const text = value.trim();
      if (/^https?:\/\//i.test(text) || /^\//.test(text)) return text;
      continue;
    }
    if (Array.isArray(value)) {
      const found = firstLogoUrl(...value);
      if (found) return found;
      continue;
    }
    if (typeof value === 'object') {
      const found = firstLogoUrl(
        value.url,
        value.href,
        value.src,
        value.path,
        value.logo,
        value.logoUrl,
        value.logoURL,
        value.logo_url,
        value.logo_path,
        value.logoPath,
        value.image,
        value.imageUrl,
        value.imageURL,
        value.image_url,
        value.image_path,
        value.imagePath,
        value.flag,
        value.flagUrl,
        value.flagURL,
        value.flag_url,
        value.flag_path,
        value.badge,
        value.badgeUrl,
        value.badge_url,
        value.thumbnail,
        value.thumbnailUrl,
        value.country?.flag,
        value.country?.flagUrl,
        value.country?.flag_url,
        value.team,
        value.competitor,
        value.participant,
        value.raw
      );
      if (found) return found;
    }
  }
  return '';
}

export function getTeamLogoUrl(team) {
  if (!team || typeof team !== 'object') return '';
  return firstLogoUrl(
    team.logo,
    team.logoUrl,
    team.logoURL,
    team.logo_url,
    team.logo_path,
    team.image,
    team.imageUrl,
    team.imageURL,
    team.image_url,
    team.image_path,
    team.flag,
    team.flagUrl,
    team.flagURL,
    team.flag_url,
    team.badge,
    team.badgeUrl,
    team.badge_url,
    team.icon,
    team.logos,
    team.images,
    team.country,
    team.team,
    team.competitor,
    team.participant,
    team.raw
  );
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

function marketPriority(odd = {}) {
  const text = `${odd.marketDisplayName || ''} ${odd.marketName || ''} ${odd.market || ''} ${odd.marketKey || ''}`.toLowerCase();
  if (/moneyline|match winner|winner|1x2|3-way|3 way/.test(text)) return 0;
  if (/handicap|spread|asian|total/.test(text)) return 1;
  if (/team total|runs|overs|run/.test(text)) return 2;
  if (/team|to score/.test(text)) return 3;
  if (/player|batsman|bowler|wicket|six/.test(text)) return 4;
  if (/tie|special|period|half|quarter|set/.test(text)) return 5;
  return 9;
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
        _priority: marketPriority(odd),
      };
    })
    .filter((odd) => odd.selectionId && odd.price > 1)
    .sort((a, b) => a._priority - b._priority || String(a.marketName).localeCompare(String(b.marketName)) || String(a.label).localeCompare(String(b.label)))
    .slice(0, 12);
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
