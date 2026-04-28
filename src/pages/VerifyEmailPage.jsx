import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { AuthAPI } from '../api/auth.js';
import { getApiError } from '../api/client.js';
import './AuthPages.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState({ loading: true, message: '' });

  useEffect(() => {
    let active = true;
    async function verify() {
      if (!token) {
        setState({ loading: false, message: 'Verification token is missing.' });
        return;
      }
      try {
        const response = await AuthAPI.verifyEmail(token);
        if (active) setState({ loading: false, message: response.data?.message || 'Email verified successfully.' });
      } catch (error) {
        if (active) setState({ loading: false, message: getApiError(error, 'Email verification failed') });
      }
    }
    verify();
    return () => { active = false; };
  }, [token]);

  return (
    <section className="center-screen">
      <div className="auth-card">
        <Logo />
        <h2 style={{ marginTop: 24 }}>Email verification</h2>
        {state.loading ? <div className="loader" /> : <p>{state.message}</p>}
        <div className="auth-links">
          <Link to="/login">Go to login</Link>
          <Link to="/">Go to home</Link>
        </div>
      </div>
    </section>
  );
}
