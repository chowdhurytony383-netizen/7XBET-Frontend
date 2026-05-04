import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/Logo.jsx';
import { AuthAPI } from '../api/auth.js';
import { getApiError } from '../api/client.js';
import './AuthPages.css';

export default function VerifyResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') || '');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await AuthAPI.verifyPasswordOtp({ email, otp });
      toast.success('OTP verified');
      navigate(`/set-new-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(getApiError(error, 'OTP verification failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <Logo />
        <h1>Verify OTP.</h1>
        <p>Submit the OTP sent to continue password reset.</p>
      </div>
      <div className="auth-panel">
        <form className="auth-card form-grid" onSubmit={submit}>
          <div>
            <h2>OTP verification</h2>
            <p>Enter email and OTP.</p>
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="otp">OTP</label>
            <input id="otp" value={otp} onChange={(event) => setOtp(event.target.value)} required inputMode="numeric" />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify OTP'}
          </button>
          <div className="auth-links"><Link to="/forgot-password">Request new OTP</Link></div>
        </form>
      </div>
    </section>
  );
}
