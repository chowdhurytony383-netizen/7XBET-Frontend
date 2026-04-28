import EmptyState from './EmptyState.jsx';
import { formatCurrency, formatDateTime } from '../utils/format.js';
import './TransactionTable.css';

function statusClass(status) {
  if (status === 'SUCCESS') return 'pill-success';
  if (status === 'FAILED') return 'pill-danger';
  return 'pill-warning';
}

export default function TransactionTable({ transactions = [], loading = false }) {
  if (loading) return <div className="transaction-table"><div className="loader" /></div>;
  if (!transactions.length) return <EmptyState title="No transactions found" message="Deposits and withdrawals from the backend will appear here." />;

  return (
    <div className="transaction-table">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction._id || transaction.id}>
                <td>{transaction.type || '—'}</td>
                <td>{formatCurrency(transaction.amount)}</td>
                <td><span className={`pill ${statusClass(transaction.status)}`}>{transaction.status || 'PENDING'}</span></td>
                <td>{transaction.razorpayPaymentId || transaction.razorpayPayoutId || transaction.razorpayOrderId || transaction._id || '—'}</td>
                <td>{formatDateTime(transaction.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
