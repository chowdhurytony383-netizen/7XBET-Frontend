import { Link } from 'react-router-dom';
import { Ticket, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils/format.js';
import './SportsBetSlip.css';

export default function SportsBetSlip({
  items = [],
  user,
  placing = false,
  onStakeChange,
  onRemove,
  onClear,
  onPlaceAll,
}) {
  if (!items.length) return null;

  const totalStake = items.reduce((sum, item) => sum + Number(item.stake || 0), 0);
  const possibleReturn = items.reduce((sum, item) => sum + Number(item.stake || 0) * Number(item.odds || 0), 0);

  return (
    <aside className="sports-bet-slip-panel" aria-label="Sports bet slip">
      <div className="sports-bet-slip-head">
        <div>
          <span className="page-eyebrow">Bet Slip</span>
          <h3>{items.length} selection{items.length === 1 ? '' : 's'}</h3>
        </div>
        <button type="button" className="sports-slip-clear" onClick={onClear} aria-label="Clear bet slip"><X size={18} /></button>
      </div>

      <div className="sports-bet-slip-list">
        {items.map((item) => {
          const stake = Number(item.stake || 0);
          const itemReturn = stake * Number(item.odds || 0);

          return (
            <article className="sports-bet-slip-item" key={item.id}>
              <div className="sports-slip-item-top">
                <span className={`sports-slip-icon ${item.sportClass || 'sport-default'}`}>{item.sportIcon || '🏆'}</span>
                <div>
                  <strong>{item.home} vs {item.away}</strong>
                  <small>{item.league}</small>
                </div>
                <button type="button" onClick={() => onRemove?.(item.id)} aria-label="Remove selection"><Trash2 size={16} /></button>
              </div>

              <div className="sports-slip-item-meta">
                <span>{item.marketName}</span>
                <strong>{item.selectionName} @ {Number(item.odds || 0).toFixed(2)}</strong>
              </div>

              <label className="sports-slip-stake-field">
                Stake
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.stake}
                  onChange={(event) => onStakeChange?.(item.id, event.target.value)}
                />
              </label>

              <div className="sports-slip-return-row">
                <span>Return</span>
                <strong>{formatCurrency(itemReturn, user)}</strong>
              </div>
            </article>
          );
        })}
      </div>

      <div className="sports-slip-total-box">
        <div><span>Total stake</span><strong>{formatCurrency(totalStake, user)}</strong></div>
        <div><span>Possible return</span><strong>{formatCurrency(possibleReturn, user)}</strong></div>
      </div>

      {user ? (
        <button className="btn btn-primary btn-full sports-slip-place-btn" type="button" disabled={placing || totalStake <= 0} onClick={onPlaceAll}>
          <Ticket size={18} /> {placing ? 'Placing...' : `Place ${items.length} bet${items.length === 1 ? '' : 's'}`}
        </button>
      ) : (
        <Link className="btn btn-primary btn-full sports-slip-place-btn" to="/login">
          Login to place bet
        </Link>
      )}
    </aside>
  );
}
