import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/Logo.jsx';
import { AuthAPI } from '../api/auth.js';
import { getApiError } from '../api/client.js';
import './AuthPages.css';

export default function SetNewPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: params.get('email') || '', newPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await AuthAPI.setNewPassword(form);
      toast.success('Password updated');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getApiError(error, 'Unable to set password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <Logo />
        <h1>Set new password.</h1>
        <p>Complete the reset flow using the verified email address.</p>
      </div>
      <div className="auth-panel">
        <form className="auth-card form-grid" onSubmit={submit}>
          <div>
            <h2>New password</h2>
            <p>Choose a strong password for your account.</p>
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </div>
          <div className="input-group">
            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save password'}
          </button>
          <div className="auth-links"><Link to="/login">Back to login</Link></div>
        </form>
      </div>
    </section>
  );
}
