import { useEffect, useState } from 'react';
import { Activity, Banknote, Percent, Trophy } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import BetTable from '../components/BetTable.jsx';
import './DashboardPage.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [bets, setBets] = useState([]);
  const [walletStats, setWalletStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [statsResponse, betsResponse, walletResponse] = await Promise.all([
          AccountAPI.betStats(),
          AccountAPI.bets(),
          AccountAPI.walletStats(),
        ]);
        if (!active) return;
        setStats(statsResponse.data || null);
        setBets(betsResponse.data?.data || []);
        setWalletStats(walletResponse.data || []);
      } catch (err) {
        if (active) setError(getApiError(err, 'Unable to load dashboard'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const totalGames = (stats?.totalWins || 0) + (stats?.totalLose || 0);
  const winRate = totalGames ? Math.round((Number(stats?.totalWins || 0) / totalGames) * 100) : 0;
  const chartData = walletStats.map((item) => ({
    date: formatDate(item.date),
    wallet: Number(item.actualWalletAfterBets || item.walletAmount || 0),
    net: Number(item.netBetResult || 0),
  }));

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Analytics"
        title="Dashboard"
        description="Stats, chart and table data are fetched from backend account routes."
      />
      {error && <div className="auth-message">{error}</div>}
      <div className="grid-4">
        <StatCard icon={Banknote} label="Net result" value={formatCurrency(stats?.totalWinningAmount)} />
        <StatCard icon={Trophy} label="Total wins" value={stats?.totalWins ?? 0} />
        <StatCard icon={Activity} label="Total losses" value={stats?.totalLose ?? 0} />
        <StatCard icon={Percent} label="Win rate" value={`${winRate}%`} />
      </div>

      <div className="dashboard-panels">
        <section className="card dashboard-chart">
          <h3>Wallet performance</h3>
          {loading ? (
            <div className="loader" />
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.16)" />
                <XAxis dataKey="date" stroke="#93a4b8" />
                <YAxis stroke="#93a4b8" />
                <Tooltip contentStyle={{ background: '#0f212f', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14 }} />
                <Area type="monotone" dataKey="wallet" stroke="#22c55e" fill="#22c55e" fillOpacity={0.16} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
        <section className="card dashboard-chart">
          <h3>Bet summary</h3>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.16)" />
              <XAxis dataKey="date" stroke="#93a4b8" />
              <YAxis stroke="#93a4b8" />
              <Tooltip contentStyle={{ background: '#0f212f', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14 }} />
              <Area type="monotone" dataKey="net" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.16} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="page-stack">
        <PageHeader eyebrow="History" title="Recent bets" />
        <BetTable bets={bets} loading={loading} />
      </section>
    </div>
  );
}
