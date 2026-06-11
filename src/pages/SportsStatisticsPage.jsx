import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, CalendarDays, Radio, ShieldCheck, Ticket, Trophy } from 'lucide-react';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import { sortSportMetas, sportMetaFrom } from '../utils/sportsVisuals.js';
import './SportsUtilityPages.css';

export default function SportsStatisticsPage() {
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setError('');
      try {
        const [overviewResponse, statusResponse] = await Promise.allSettled([
          SportsAPI.statistics({ limit: 40 }),
          SportsAPI.syncStatus(),
        ]);
        if (!active) return;
        if (overviewResponse.status === 'fulfilled') setOverview(overviewResponse.value.data?.data || overviewResponse.value.data || null);
        if (statusResponse.status === 'fulfilled') setStatus(statusResponse.value.data?.data || statusResponse.value.data || null);
      } catch (err) {
        if (active) setError(getApiError(err, 'Unable to load sportsbook statistics'));
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const sports = useMemo(() => sortSportMetas((overview?.sports || []).map((item) => ({ ...sportMetaFrom(`${item.key || ''} ${item.name || item.displayName || ''}`), ...item }))), [overview]);
  const summary = overview?.summary || {};

  return (
    <div className="page-stack sports-utility-page">
      <PageHeader eyebrow="7XBET Sports" title="Statistics" description="Provider status, event counts, live/pre-match coverage and sportsbook health." />
      <div className="sports-utility-nav">
        <Link to="/sports?mode=live"><Radio size={16} /> Live</Link>
        <Link to="/sports?mode=prematch"><CalendarDays size={16} /> Pre-match</Link>
        <Link to="/sports?mode=finished"><Trophy size={16} /> Results</Link>
      </div>
      {error ? <div className="auth-message">{error}</div> : null}
      <section className="sports-stat-grid">
        <article><Activity size={20} /><span>Total events</span><strong>{summary.events ?? overview?.events ?? 0}</strong></article>
        <article><Radio size={20} /><span>Live</span><strong>{summary.live ?? 0}</strong></article>
        <article><CalendarDays size={20} /><span>Pre-match</span><strong>{summary.prematch ?? 0}</strong></article>
        <article><Ticket size={20} /><span>Finished</span><strong>{summary.finished ?? 0}</strong></article>
      </section>
      <section className="sports-provider-health">
        <h3><ShieldCheck size={18} /> Provider health</h3>
        <div><span>Provider</span><strong>{overview?.provider || status?.provider || 'Sports API'}</strong></div>
        <div><span>Football override</span><strong>{status?.footballProviderOverride || status?.sportmonksFootballOverrideEnabled ? 'Sportmonks active' : 'Default provider'}</strong></div>
        <div><span>Details provider</span><strong>{status?.detailsProvider || 'Configured by backend'}</strong></div>
      </section>
      <section className="sports-stat-sports-list">
        <h3><BarChart3 size={18} /> Sports coverage</h3>
        {sports.map((sport) => (
          <Link to={`/sports?sport=${sport.key}`} key={sport.key}>
            <span className={sport.className}>{sport.icon}</span>
            <strong>{sport.displayName || sport.name}</strong>
            <em>Live {sport.live || 0}</em>
            <em>Pre {sport.prematch || 0}</em>
            <b>{sport.count || 0}</b>
          </Link>
        ))}
      </section>
    </div>
  );
}
