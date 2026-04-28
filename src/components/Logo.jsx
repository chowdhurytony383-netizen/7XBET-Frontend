import { Link } from 'react-router-dom';
import './Logo.css';

export default function Logo() {
  return (
    <Link to="/" className="logo-mark" aria-label="7XBET home">
      <span className="logo-seven">7</span>
      <span className="logo-main">
        <strong>XBET</strong>
        <small>Premium • Professional • Stylish</small>
      </span>
    </Link>
  );
}