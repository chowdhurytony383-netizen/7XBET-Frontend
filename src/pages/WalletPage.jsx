import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Gift, Wallet, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
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
  if (summary?.rejected || summary?.status === 'CANCELLED') return 'Bonus balance was rejected. Bonus turnover was cancelled.';
  if (!summary?.awarded) return 'First deposit bonus has not been awarded yet.';
  if (numberValue(summary.remainingTurnover) <= 0) return 'Bonus turnover completed. Bonus balance is now withdrawable.';
  return 'Bonus balance is locked until the required bonus turnover is completed.';
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [bonusSummary, setBonusSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectingBonus, setRejectingBonus] = useState(false);
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

  const handleRejectBonus = async () => {
    const confirmed = window.confirm('Reject first deposit bonus? The bonus balance will be removed and bonus turnover will be cancelled.');
    if (!confirmed) return;

    setRejectingBonus(true);
    try {
      const response = await AccountAPI.rejectFirstDepositBonus();
      toast.success(response.data?.message || 'Bonus rejected');
      await load();
      await refreshUser().catch(() => null);
    } catch (err) {
      toast.error(getApiError(err, 'Bonus rejection failed'));
    } finally {
      setRejectingBonus(false);
    }
  };

  const deposits = transactions.filter((item) => item.type === 'DEPOSIT');
  const withdrawals = transactions.filter((item) => item.type === 'WITHDRAW');
  const bonuses = transactions.filter((item) => item.type === 'BONUS');
  const bonusRejected = Boolean(bonusSummary?.rejected || bonusSummary?.status === 'CANCELLED');
  const bonusAwardedAmount = bonusRejected ? 0 : numberValue(bonusSummary?.amount || user?.firstDepositBonusAmount);
  const bonusRemainingTurnover = bonusRejected ? 0 : numberValue(bonusSummary?.remainingTurnover);
  const canRejectBonus = Boolean(bonusSummary?.canReject && !bonusRejected && bonusAwardedAmount > 0);
  const showBonusCard = bonusAwardedAmount > 0 || bonusSummary?.awarded || bonusRejected;

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
          {canRejectBonus && (
            <button
              type="button"
              className="wallet-bonus-reject-btn"
              onClick={handleRejectBonus}
              disabled={rejectingBonus}
            >
              <XCircle size={16} />
              {rejectingBonus ? 'Rejecting...' : 'Reject bonus'}
            </button>
          )}
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
