import EmptyState from './EmptyState.jsx';
import { formatCurrency, formatDateTime } from '../utils/format.js';
import './TransactionTable.css';

function statusClass(status) {
  if (status === 'SUCCESS') return 'pill-success';
  if (['FAILED', 'REJECTED', 'CANCELLED'].includes(status)) return 'pill-danger';
  return 'pill-warning';
}

function typeLabel(transaction) {
  if (transaction?.type === 'BONUS') return 'BONUS BALANCE';
  return transaction?.type || '—';
}

function amountCurrency(transaction, fallbackCurrency) {
  return transaction?.currency || transaction?.gatewayPayload?.currency || fallbackCurrency;
}

function referenceText(transaction) {
  if (transaction?.type === 'BONUS') {
    return transaction?.gatewayPayload?.bonusCode || 'FIRST_DEPOSIT_100';
  }

  return transaction?.razorpayPaymentId
    || transaction?.razorpayPayoutId
    || transaction?.razorpayOrderId
    || transaction?.gatewayPayload?.txHash
    || transaction?._id
    || '—';
}

export default function TransactionTable({ transactions = [], loading = false, currency }) {
  if (loading) return <div className="transaction-table"><div className="loader" /></div>;
  if (!transactions.length) return <EmptyState title="No transactions found" message="Deposits, bonus balance, and withdrawals from the backend will appear here." />;

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
              <tr
                key={transaction._id || transaction.id}
                className={transaction.type === 'BONUS' ? 'transaction-row-bonus' : ''}
              >
                <td>
                  <strong>{typeLabel(transaction)}</strong>
                  {transaction.type === 'BONUS' && <small>Bonus balance</small>}
                </td>
                <td>{formatCurrency(transaction.amount, amountCurrency(transaction, currency))}</td>
                <td><span className={`pill ${statusClass(transaction.status)}`}>{transaction.status || 'PENDING'}</span></td>
                <td>
                  <span>{referenceText(transaction)}</span>
                  {transaction.userNote && <small>{transaction.userNote}</small>}
                </td>
                <td>{formatDateTime(transaction.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
