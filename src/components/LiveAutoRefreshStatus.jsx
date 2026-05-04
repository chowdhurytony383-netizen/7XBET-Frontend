import { Radio } from 'lucide-react';

export default function LiveAutoRefreshStatus({ label = 'Live: auto refresh every 1s' }) {
  return (
    <span className="live-auto-refresh-status" title={label}>
      <Radio size={16} /> {label}
    </span>
  );
}
