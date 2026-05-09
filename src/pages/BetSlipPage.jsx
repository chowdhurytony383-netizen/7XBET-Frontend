import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import { SportsAPI } from '../api/sports.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';
import './BetSlipPage.css';

function statusLabel(status) {
  const clean = String(status || 'pending').toUpperCase();
  if (clean === 'WON') return 'Win';
  if (clean === 'LOST') return 'Lose';
  return clean.charAt(0) + clean.slice(1).toLowerCase();
}

export default function BetSlipPage() {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await SportsAPI.myBets();
      setBets(response.data?.data || response.data?.bets || []);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load sports bets'));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      if (!active) return;
      await load(true);
    }

    initialLoad();
    const timer = window.setInterval(() => {
      if (active) load(false).catch(() => null);
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [load]);

  return (
    <div className="page-stack bet-slip-page">
      <PageHeader
        eyebrow="Bet slip"
        title="My sports bets"
        description="Sports bets placed from Home and Sports pages. Win/Lose status and wallet result update automatically."
      />

      <section className="bet-slip-card">
        {loading ? (
          <p>Loading bets...</p>
        ) : bets.length ? (
          <div className="bet-slip-list">
            {bets.map((bet) => {
              const status = String(bet.status || 'pending').toLowerCase();
              const won = status === 'won';
              const lost = status === 'lost';
              const resultAmount = won ? Number(bet.payoutAmount || bet.potentialReturn || 0) : lost ? 0 : Number(bet.potentialReturn || 0);

              return (
                <article className="bet-slip-row" key={bet._id || bet.betId}>
                  <div>
                    <strong>{bet.homeTeam} vs {bet.awayTeam}</strong>
                    <span>{bet.marketName} · {bet.selectionName}</span>
                    <small>{formatDate(bet.createdAt)}</small>
                  </div>
                  <div>
                    <span className={`bet-slip-status ${status}`}>{statusLabel(bet.status)}</span>
                    <strong>{formatCurrency(bet.stake, user)} @ {Number(bet.odds || 0).toFixed(2)}</strong>
                    <small>{won ? 'Won amount' : lost ? 'Lost amount' : 'Possible return'}: {won ? formatCurrency(resultAmount, user) : lost ? formatCurrency(bet.stake, user) : formatCurrency(resultAmount, user)}</small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p>No sports bets available. Go to Sports or Home and place a bet.</p>
        )}
      </section>
    </div>
  );
}
