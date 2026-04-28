import { Inbox } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({ title = 'No records found', message = 'There is no data available from the backend yet.' }) {
  return (
    <div className="empty-state">
      <Inbox size={26} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
