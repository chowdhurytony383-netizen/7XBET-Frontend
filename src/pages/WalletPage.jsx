import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Gift, Wallet } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import './WalletPage.css';

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function bonusStatusText(summary) {
  if (!summary?.awarded) return 'First deposit bonus has not been awarded yet.';
  if (numberValue(summary.remainingTurnover) <= 0) return 'Bonus turnover completed. Bonus balance is now withdrawable.';
  return 'Bonus balance is locked until the required bonus turnover is completed.';
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [bonusSummary, setBonusSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await AccountAPI.transactions();
      setTransactions(response.data?.data || []);
      setBonusSummary(response.data?.bonusSummary || null);
      await refreshUser().catch(() => null);
    } catch (err) {
      setError(getApiError(err, 'Unable to load transactions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deposits = transactions.filter((item) => item.type === 'DEPOSIT');
  const withdrawals = transactions.filter((item) => item.type === 'WITHDRAW');
  const bonuses = transactions.filter((item) => item.type === 'BONUS');
  const bonusAwardedAmount = numberValue(bonusSummary?.amount || user?.firstDepositBonusAmount);
  const bonusRemainingTurnover = numberValue(bonusSummary?.remainingTurnover);
  const showBonusCard = bonusAwardedAmount > 0 || user?.firstDepositBonusAwarded || bonusSummary?.awarded;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Wallet"
        title="Wallet"
        description="Balance and transaction records are received from the backend."
      />

      {error && <div className="auth-message">{error}</div>}

      <section className="card wallet-balance-card">
        <span>Available balance</span>
        <strong>{formatCurrency(user?.wallet, user)}</strong>
        <p>The displayed amount is taken from the authenticated user profile.</p>
        <div className="wallet-actions">
          <Link className="btn btn-primary" to="/deposit"><ArrowDownToLine size={18} /> Deposit</Link>
          <Link className="btn btn-soft" to="/withdraw"><ArrowUpFromLine size={18} /> Withdraw</Link>
        </div>
      </section>

      {showBonusCard && (
        <section className="card wallet-bonus-card">
          <div className="wallet-bonus-icon"><Gift size={22} /></div>
          <div>
            <span>First deposit bonus balance</span>
            <strong>{formatCurrency(bonusAwardedAmount, user)}</strong>
            <p>{bonusStatusText(bonusSummary)}</p>
          </div>
          <div className="wallet-bonus-meta">
            <small>Remaining bonus turnover</small>
            <b>{formatCurrency(bonusRemainingTurnover, user)}</b>
          </div>
        </section>
      )}

      <div className="grid-3">
        <StatCard icon={Wallet} label="Transactions" value={transactions.length} />
        <StatCard icon={ArrowDownToLine} label="Deposits" value={deposits.length} />
        <StatCard icon={ArrowUpFromLine} label="Withdrawals" value={withdrawals.length} />
        <StatCard icon={Gift} label="Bonus Entries" value={bonuses.length} />
      </div>

      <TransactionTable transactions={transactions} loading={loading} currency={user} />
    </div>
  );
}
