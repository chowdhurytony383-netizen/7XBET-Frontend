import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bomb, Gem, HandCoins, Wallet } from 'lucide-react';
import { GamesAPI } from '../api/games.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import './DicePage.css';
import './MinesPage.css';

const totalTiles = 25;

export default function MinesPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ amount: '', minesCount: 3 });
  const [betId, setBetId] = useState(null);
  const [revealedTiles, setRevealedTiles] = useState([]);
  const [mineTiles, setMineTiles] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);

  const active = Boolean(betId);

  const loadPending = async () => {
    try {
      const response = await GamesAPI.pendingMines();
      const bet = response.data?.bet;
      if (bet?._id) {
        setBetId(bet._id);
        setForm((current) => ({ ...current, amount: bet.betAmount || current.amount, minesCount: bet.gameData?.mineCount || current.minesCount }));
        setRevealedTiles(bet.gameData?.revealedTiles || []);
      }
    } catch (_) {
      // Pending state is optional for this screen.
    }
  };

  useEffect(() => { loadPending(); }, []);

  const safeCount = useMemo(() => revealedTiles.filter((tile) => !mineTiles.includes(tile)).length, [revealedTiles, mineTiles]);

  const startGame = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    const minesCount = Number(form.minesCount);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(minesCount) || minesCount < 1 || minesCount > 24) {
      toast.error('Enter valid game parameters');
      return;
    }

    setLoading(true);
    try {
      const response = await GamesAPI.startMines({ amount, minesCount });
      setBetId(response.data?.bet);
      setRevealedTiles([]);
      setMineTiles([]);
      setMultiplier(1);
      setProfit(0);
      await refreshUser();
      toast.success(response.data?.message || 'Game started');
    } catch (error) {
      toast.error(getApiError(error, 'Unable to start mines game'));
    } finally {
      setLoading(false);
    }
  };

  const revealTile = async (tileIndex) => {
    if (!active || revealedTiles.includes(tileIndex) || loading) return;
    setLoading(true);
    try {
      const response = await GamesAPI.revealMineTile({ betId, tileIndex });
      setRevealedTiles(response.data?.revealedTiles || []);
      setMultiplier(response.data?.multiplier || 1);
      setProfit(response.data?.profit || 0);
      if (response.data?.isMine) {
        setMineTiles((current) => [...new Set([...current, tileIndex])]);
        toast.error('Mine revealed');
        await refreshUser();
      } else {
        toast.success('Safe tile');
      }
    } catch (error) {
      toast.error(getApiError(error, 'Reveal failed'));
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
    if (!active || loading) return;
    setLoading(true);
    try {
      const response = await GamesAPI.endMines({ betId });
      toast.success(response.data?.message || 'Game ended');
      setBetId(null);
      setRevealedTiles([]);
      setMineTiles([]);
      setMultiplier(1);
      setProfit(0);
      await refreshUser();
    } catch (error) {
      toast.error(getApiError(error, 'Cash out failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack mines-page">
      <PageHeader eyebrow="Game" title="Mines" description="Start, reveal and cash out actions are handled by backend mines routes." />

      <div className="grid-4 mines-stats-grid">
        <StatCard icon={Wallet} label="Wallet balance" value={formatCurrency(user?.wallet)} />
        <StatCard icon={Bomb} label="Mines" value={form.minesCount} />
        <StatCard icon={Gem} label="Safe tiles" value={safeCount} />
        <StatCard icon={HandCoins} label="Current profit" value={formatCurrency(profit)} />
      </div>

      <div className="game-play-grid">
        <form className="card play-form-card form-grid" onSubmit={startGame}>
          <div className="input-group">
            <label htmlFor="amount">Bet amount</label>
            <input id="amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} type="number" min="1" required disabled={active} />
          </div>
          <div className="input-group">
            <label htmlFor="minesCount">Mines count</label>
            <input id="minesCount" value={form.minesCount} onChange={(event) => setForm({ ...form, minesCount: Number(event.target.value) })} type="number" min="1" max="24" required disabled={active} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={active || loading}>{loading && !active ? 'Starting...' : 'Start game'}</button>
          <button className="btn btn-warning btn-full" type="button" disabled={!active || loading || !safeCount} onClick={cashOut}>Cash out</button>
          <div className="mines-status">
            <span className="pill">Multiplier {multiplier}</span>
            <span className="pill">Bet {active ? betId : '—'}</span>
          </div>
        </form>

        <section className="card result-card">
          <div className="mines-board">
            {Array.from({ length: totalTiles }, (_, tileIndex) => {
              const revealed = revealedTiles.includes(tileIndex);
              const mine = mineTiles.includes(tileIndex);
              return (
                <button
                  key={tileIndex}
                  className={`mine-tile ${revealed ? 'revealed' : ''} ${mine ? 'mine' : ''}`}
                  disabled={!active || revealed || loading}
                  onClick={() => revealTile(tileIndex)}
                  type="button"
                  aria-label={`Tile ${tileIndex + 1}`}
                >
                  {mine ? <Bomb size={22} /> : revealed ? <Gem size={22} /> : ''}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
