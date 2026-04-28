import EmptyState from './EmptyState.jsx';
import { formatCurrency, formatDateTime, gameName } from '../utils/format.js';
import './BetTable.css';

export default function BetTable({ bets = [], loading = false }) {
  if (loading) return <div className="table-card"><div className="loader" /></div>;
  if (!bets.length) return <EmptyState title="No bets found" message="Your bet history will appear after backend records are available." />;

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Amount</th>
              <th>Win amount</th>
              <th>Result</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((bet) => (
              <tr key={bet._id || bet.id}>
                <td>{gameName(bet.game)}</td>
                <td>{formatCurrency(bet.betAmount)}</td>
                <td>{formatCurrency(bet.winAmount)}</td>
                <td><span className={`pill ${bet.isWin ? 'pill-success' : 'pill-danger'}`}>{bet.isWin ? 'Win' : 'Loss'}</span></td>
                <td>{bet.status || '—'}</td>
                <td>{formatDateTime(bet.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
