import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/Logo.jsx';
import { AuthAPI } from '../api/auth.js';
import { getApiError } from '../api/client.js';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await AuthAPI.requestPasswordOtp(email);
      toast.success('OTP sent to email');
      navigate(`/verify-reset-password-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send OTP'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <Logo />
        <h1>Reset password securely.</h1>
        <p>Send an OTP to the registered email address before allowing a new password.</p>
      </div>
      <div className="auth-panel">
        <form className="auth-card form-grid" onSubmit={submit}>
          <div>
            <h2>Forgot password</h2>
            <p>Enter your registered email address.</p>
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send OTP'}
          </button>
          <div className="auth-links"><Link to="/login">Back to login</Link></div>
        </form>
      </div>
    </section>
  );
}
