import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CalendarDays, ListChecks, Radio, Trophy } from 'lucide-react';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getMatchId, getScore, getStrictMatchStatus, getTeamName, sportMetaFromMatch, statusClass } from '../utils/sportsVisuals.js';
import './SportsUtilityPages.css';

function scoreValue(value) {
  if (value === undefined || value === null || value === '') return '0';
  if (typeof value === 'object') return value.display || value.formatted || value.value || value.score || value.points || value.goals || '0';
  return String(value);
}

function kickoff(match = {}) {
  const raw = match.commenceTime || match.startTime || match.dateTime || '';
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return raw || 'Finished';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}

export default function SportsResultsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await SportsAPI.results({ limit: 120 });
        if (!active) return;
        setMatches(response.data?.data || response.data?.matches || []);
      } catch (err) {
        if (active) setError(getApiError(err, 'Unable to load sports results'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    matches.forEach((match) => {
      const meta = sportMetaFromMatch(match);
      const key = `${meta.key}:${match.league || match.tournament || meta.name}`;
      const item = map.get(key) || { meta, league: match.league || match.tournament || meta.name, items: [] };
      item.items.push(match);
      map.set(key, item);
    });
    return Array.from(map.values());
  }, [matches]);

  return (
    <div className="page-stack sports-utility-page">
      <PageHeader eyebrow="7XBET Sports" title="Results" description="Finished scoreboards grouped by sport and league." />
      <div className="sports-utility-nav">
        <Link to="/sports?mode=live"><Radio size={16} /> Live</Link>
        <Link to="/sports?mode=prematch"><CalendarDays size={16} /> Pre-match</Link>
        <Link to="/sports"><Trophy size={16} /> Sportsbook</Link>
        <Link to="/sports/statistics"><BarChart3 size={16} /> Statistics</Link>
      </div>
      {loading ? <div className="sports-utility-empty">Loading results...</div> : null}
      {error ? <div className="auth-message">{error}</div> : null}
      {!loading && !groups.length ? <EmptyState title="No results available" message="Finished matches will appear here after settlement/sync." /> : null}
      <div className="sports-results-groups">
        {groups.map((group) => (
          <section className="sports-results-group" key={`${group.meta.key}-${group.league}`}>
            <h3><span className={group.meta.className}>{group.meta.icon}</span>{group.league}</h3>
            {group.items.map((match) => (
              <Link className="sports-result-row" to={`/sports?mode=finished&sport=${group.meta.key}&match=${getMatchId(match) || ''}`} key={getMatchId(match) || `${match.homeTeam}-${match.awayTeam}`}>
                <div><strong>{getTeamName(match.homeTeam || match.home)}</strong><small>{kickoff(match)}</small></div>
                <b>{scoreValue(getScore(match, 'home'))} - {scoreValue(getScore(match, 'away'))}</b>
                <div><strong>{getTeamName(match.awayTeam || match.away)}</strong><small className={statusClass(getStrictMatchStatus(match))}>{getStrictMatchStatus(match)}</small></div>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
