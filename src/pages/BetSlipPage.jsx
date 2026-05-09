import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import './BetSlipPage.css';

export default function BetSlipPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await SportsAPI.myBets();
        if (!active) return;
        setBets(response.data?.data || response.data?.bets || []);
      } catch (error) {
        toast.error(getApiError(error, 'Unable to load sports bets'));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="page-stack bet-slip-page">
      <PageHeader
        eyebrow="Bet slip"
        title="My sports bets"
        description="Sports bets placed from the automatic live sports system."
      />

      <section className="bet-slip-card">
        {loading ? (
          <p>Loading bets...</p>
        ) : bets.length ? (
          <div className="bet-slip-list">
            {bets.map((bet) => (
              <article className="bet-slip-row" key={bet._id || bet.betId}>
                <div>
                  <strong>{bet.homeTeam} vs {bet.awayTeam}</strong>
                  <span>{bet.marketName} · {bet.selectionName}</span>
                  <small>{formatDate(bet.createdAt)}</small>
                </div>
                <div>
                  <span className={`bet-slip-status ${String(bet.status).toLowerCase()}`}>{bet.status}</span>
                  <strong>{formatCurrency(bet.stake)} @ {Number(bet.odds || 0).toFixed(2)}</strong>
                  <small>Return: {formatCurrency(bet.potentialReturn)}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No sports bets available. Go to Sports and place a bet.</p>
        )}
      </section>
    </div>
  );
}
