import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Wallet } from 'lucide-react';
import { AccountAPI } from '../api/account.js';
import { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import './WalletPage.css';

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await AccountAPI.transactions();
      setTransactions(response.data?.data || []);
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

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Wallet"
        title="Wallet"
        description="Balance and transaction records are received from the backend."
        actions={<button className="btn btn-soft" onClick={load}><RefreshCw size={18} /> Refresh</button>}
      />

      {error && <div className="auth-message">{error}</div>}

      <section className="card wallet-balance-card">
        <span>Available balance</span>
        <strong>{formatCurrency(user?.wallet)}</strong>
        <p>The displayed amount is taken from the authenticated user profile.</p>
        <div className="wallet-actions">
          <Link className="btn btn-primary" to="/deposit"><ArrowDownToLine size={18} /> Deposit</Link>
          <Link className="btn btn-soft" to="/withdraw"><ArrowUpFromLine size={18} /> Withdraw</Link>
        </div>
      </section>

      <div className="grid-3">
        <StatCard icon={Wallet} label="Transactions" value={transactions.length} />
        <StatCard icon={ArrowDownToLine} label="Deposits" value={deposits.length} />
        <StatCard icon={ArrowUpFromLine} label="Withdrawals" value={withdrawals.length} />
      </div>

      <TransactionTable transactions={transactions} loading={loading} />
    </div>
  );
}
