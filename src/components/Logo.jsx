import { Link } from 'react-router-dom';
import './Logo.css';

export default function Logo({ compact = false, className = '' }) {
  const src = compact
    ? '/images/brand/7xbet-icon.svg'
    : '/images/brand/7xbet-premium-logo.png';

  return (
    <Link
      to="/"
      className={`logo-mark ${compact ? 'logo-mark-compact' : ''} ${className}`.trim()}
      aria-label="7XBET home"
    >
      <img className="logo-img" src={src} alt="7XBET" loading="eager" />
    </Link>
  );
}
