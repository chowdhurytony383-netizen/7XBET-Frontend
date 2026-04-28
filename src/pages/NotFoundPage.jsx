import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import './AuthPages.css';

export default function NotFoundPage() {
  return (
    <section className="center-screen">
      <div className="auth-card">
        <Logo />
        <h2 style={{ marginTop: 24 }}>Page not found</h2>
        <p>The route you requested does not exist.</p>
        <Link className="btn btn-primary" to="/">Back to home</Link>
      </div>
    </section>
  );
}
