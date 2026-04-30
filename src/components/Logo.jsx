import { Link } from 'react-router-dom';
import './Logo.css';

export default function Logo() {
  return (
    <Link to="/" className="logo-mark" aria-label="7XBET home">
      <img className="logo-image" src="/images/brand/7xbet-logo.svg" alt="7XBET" />
    </Link>
  );
}
