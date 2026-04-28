import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{Icon && <Icon size={20} />}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}
