import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { FaFacebookF, FaGoogle } from 'react-icons/fa';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthAPI } from '../api/auth.js';
import { getApiError } from '../api/client.js';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const continueWithProvider = (provider) => {
    const targetUrl = AuthAPI.socialAuthUrl(provider);

    if (!targetUrl) {
      toast.error(`${provider} login URL is not configured`);
      return;
    }

    window.location.href = targetUrl;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login({
        email: form.email,
        login: form.email,
        userId: form.email,
        password: form.password,
      });

      toast.success('Login successful');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (error) {
      toast.error(getApiError(error, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <Logo />

        <h1>Sign in to your account.</h1>

        <p>
          Login with email, User ID, Google, or Facebook.
        </p>
      </div>

      <div className="auth-panel">
        <form className="auth-card login-card" onSubmit={submit}>
          <div className="login-card-header">
            <h2>Login</h2>
            <p>Enter your email or generated User ID to continue.</p>
          </div>

          <div className="social-auth-grid login-social-grid">
            <button
              className="social-auth-btn google"
              type="button"
              onClick={() => continueWithProvider('google')}
            >
              <FaGoogle />
              <span>Google Login</span>
            </button>

            <button
              className="social-auth-btn facebook"
              type="button"
              onClick={() => continueWithProvider('facebook')}
            >
              <FaFacebookF />
              <span>Facebook Login</span>
            </button>
          </div>

          <div className="auth-divider">
            <span>or login manually</span>
          </div>

          <div className="login-form-fields">
            <div className="input-group">
              <label htmlFor="email">Email or User ID</label>

              <input
                id="email"
                name="email"
                value={form.email}
                onChange={updateField}
                required
                autoComplete="username"
              />
            </div>

            <div className="input-group password-field">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={updateField}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>

          <div className="auth-links login-links">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/register">Create account</Link>
          </div>
        </form>
      </div>
    </section>
  );
}