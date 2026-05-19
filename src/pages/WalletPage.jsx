import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDownToLine, ArrowUpFromLine, Gift, XCircle, Wallet } from 'lucide-react';
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
  if (!summary?.awarded) return 'New account signup bonus has not been awarded yet.';
  if (numberValue(summary.remainingTurnover) <= 0) return 'Signup bonus turnover completed. Bonus balance is now withdrawable.';

  const required = numberValue(summary.totalRequiredTurnover);
  return required > 0
    ? `Signup bonus is locked until required turnover is completed. Total required turnover: ${required}.`
    : 'Signup bonus is locked until the required bonus turnover is completed.';
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
      setBonusSummary(response.data?.signupBonusSummary || response.data?.bonusSummary || null);
      await refreshUser().catch(() => null);
    } catch (err) {
      setError(getApiError(err, 'Unable to load transactions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRejectSignupBonus = async () => {
    const confirmed = window.confirm('Reject your sign up bonus? The bonus amount will be removed from your wallet and the signup bonus turnover will be cancelled. You cannot claim this signup bonus again.');
    if (!confirmed) return;

    setRejectingBonus(true);
    try {
      const response = await AccountAPI.rejectSignupBonus();
      toast.success(response.data?.message || 'Signup bonus rejected');
      if (response.data?.user) await refreshUser().catch(() => null);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Unable to reject signup bonus'));
    } finally {
      setRejectingBonus(false);
    }
  };

  const deposits = transactions.filter((item) => item.type === 'DEPOSIT');
  const withdrawals = transactions.filter((item) => item.type === 'WITHDRAW');
  const bonuses = transactions.filter((item) => item.type === 'BONUS');
  const bonusAwardedAmount = numberValue(bonusSummary?.amount || user?.signupBonusAmount);
  const bonusRemainingTurnover = numberValue(bonusSummary?.remainingTurnover);
  const showBonusCard = bonusAwardedAmount > 0 || bonusSummary?.awarded;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Wallet"
        title="Wallet"
        description="Balance and transaction records are received from the backend. Signup bonus withdrawal depends on turnover, not document verification."
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
            <span>New account signup bonus</span>
            <strong>{formatCurrency(bonusAwardedAmount, user)}</strong>
            <p>{bonusStatusText(bonusSummary)}</p>
          </div>
          <div className="wallet-bonus-meta">
            <small>Remaining bonus turnover</small>
            <b>{formatCurrency(bonusRemainingTurnover, user)}</b>
          </div>
          {bonusSummary?.canReject && (
            <button
              type="button"
              className="wallet-bonus-reject-btn"
              onClick={handleRejectSignupBonus}
              disabled={rejectingBonus}
            >
              <XCircle size={18} />
              {rejectingBonus ? 'Rejecting...' : 'Reject Bonus'}
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
