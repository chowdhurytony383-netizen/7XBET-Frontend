import { useState } from 'react';
import toast from 'react-hot-toast';
import { Dice5, Target, Wallet } from 'lucide-react';
import { GamesAPI } from '../api/games.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import './DicePage.css';

export default function DicePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ amount: '', condition: 'above', target: 50 });
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const roll = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    const target = Number(form.target);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(target) || target <= 0 || target >= 100) {
      toast.error('Enter valid bet parameters');
      return;
    }

    setRolling(true);
    try {
      const response = await GamesAPI.rollDice({ amount, condition: form.condition, target });
      setResult(response.data?.bet || response.data);
      await refreshUser();
      toast.success(response.data?.message || 'Roll complete');
    } catch (error) {
      toast.error(getApiError(error, 'Dice roll failed'));
    } finally {
      setRolling(false);
    }
  };

  const diceData = result?.gameData?.diceRoll;
  const rollResult = diceData?.state?.result;
  const payout = diceData?.payout ?? result?.winAmount;
  const multiplier = diceData?.payoutMultiplier;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Game" title="Dice" description=" " />

      <div className="grid-3">
        <StatCard icon={Wallet} label="Wallet balance" value={formatCurrency(user?.wallet)} />
        <StatCard icon={Target} label="Target" value={form.target} />
        <StatCard icon={Dice5} label="Condition" value={form.condition} />
      </div>

      <div className="game-play-grid">
        <form className="card play-form-card form-grid" onSubmit={roll}>
          <div className="input-group">
            <label htmlFor="amount">Bet amount</label>
            <input id="amount" name="amount" value={form.amount} onChange={updateField} type="number" min="1" step="1" required />
          </div>
          <div className="input-group">
            <label>Condition</label>
            <div className="condition-toggle">
              <button type="button" className={`btn ${form.condition === 'above' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setForm({ ...form, condition: 'above' })}>Above</button>
              <button type="button" className={`btn ${form.condition === 'below' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setForm({ ...form, condition: 'below' })}>Below</button>
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="target">Target: {form.target}</label>
            <input id="target" name="target" value={form.target} onChange={updateField} type="range" min="1" max="99" />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={rolling}>{rolling ? 'Rolling...' : 'Roll dice'}</button>
        </form>

        <section className="card result-card">
          <div className="dice-result">
            <div>
              <span className="page-eyebrow">Result</span>
              <div className="dice-number">{rollResult ?? '—'}</div>
              <div className="dice-meta">
                <span className={`pill ${result?.isWin ? 'pill-success' : result ? 'pill-danger' : ''}`}>{result ? (result.isWin ? 'Win' : 'Loss') : 'Waiting'}</span>
                <span className="pill">Payout {formatCurrency(payout)}</span>
                <span className="pill">Multiplier {multiplier || '—'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
