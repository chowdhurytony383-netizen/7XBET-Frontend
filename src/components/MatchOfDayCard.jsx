import './MatchOfDayCard.css';

function getTeamName(team) {
  if (!team) return '';
  if (typeof team === 'string') return team;
  return team.name || team.displayName || '';
}

function getTeamLogo(team) {
  if (!team || typeof team === 'string') return '';
  return team.logo || team.image || team.flag || '';
}

function TeamBadge({ team }) {
  const name = getTeamName(team);
  const logo = getTeamLogo(team);
  const initial = name ? name.charAt(0).toUpperCase() : 'T';

  return (
    <div className="motd-team">
      <div className="motd-logo-wrap">
        {logo ? <img src={logo} alt="" /> : <span>{initial}</span>}
      </div>
      <strong>{name || 'Team'}</strong>
    </div>
  );
}

export default function MatchOfDayCard({ match }) {
  if (!match) return null;

  const homeTeam = match.homeTeam || match.home || match.teamA;
  const awayTeam = match.awayTeam || match.away || match.teamB;
  const league = match.league?.name || match.league || match.tournament || '';
  const startTime = match.startTime || match.dateTime || match.kickoffTime || match.matchTime || '';

  return (
    <article className="match-of-day-card">
      <h3>Match Of The Day</h3>
      <div className="motd-meta">
        {league && <span>{league}</span>}
        {startTime && <strong>{startTime}</strong>}
      </div>
      <div className="motd-body">
        <TeamBadge team={homeTeam} />
        <span className="motd-vs">VS</span>
        <TeamBadge team={awayTeam} />
      </div>
    </article>
  );
}
