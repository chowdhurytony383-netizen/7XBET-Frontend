import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, MousePointerClick } from 'lucide-react';
import { FaFacebookF, FaGoogle } from 'react-icons/fa';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthAPI } from '../api/auth.js';
import { getApiError } from '../api/client.js';
import { countries, currencyLabel, defaultCountry } from '../utils/countries.js';
import { getDefaultRegistrationCountry } from '../utils/currency.js';
import { formatCurrency } from '../utils/format.js';
import './AuthPages.css';

const ONE_CLICK_CREDENTIALS_KEY = 'oneClickCredentials';

export default function RegisterPage() {
  const { register, oneClickRegister } = useAuth();

  const detectedCountry = useMemo(() => getDefaultRegistrationCountry() || defaultCountry, []);

  const [form, setForm] = useState(() => ({
    name: '',
    countryCode: detectedCountry.code,
    currency: detectedCountry.currency,
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  }));

  const [quickForm, setQuickForm] = useState(() => ({
    countryCode: detectedCountry.code,
    currency: detectedCountry.currency,
    referralCode: '',
    acceptedTerms: false,
  }));

  const [submitting, setSubmitting] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectedManualCountry = useMemo(() => {
    return countries.find((item) => item.code === form.countryCode) || defaultCountry;
  }, [form.countryCode]);

  const selectedQuickCountry = useMemo(() => {
    return countries.find((item) => item.code === quickForm.countryCode) || defaultCountry;
  }, [quickForm.countryCode]);

  const updateField = (event) => {
    const { name, value } = event.target;

    if (name === 'countryCode') {
      const country = countries.find((item) => item.code === value) || defaultCountry;

      setForm((current) => ({
        ...current,
        countryCode: country.code,
        currency: country.currency,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateQuickCountry = (event) => {
    const country = countries.find((item) => item.code === event.target.value) || defaultCountry;

    setQuickForm((current) => ({
      ...current,
      countryCode: country.code,
      currency: country.currency,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    if (form.password !== form.confirmPassword) {
      toast.error('Password and confirm password do not match');
      setSubmitting(false);
      return;
    }

    try {
      const response = await register({
        name: form.name,
        fullName: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        country: selectedManualCountry.name,
        countryCode: selectedManualCountry.code,
        currency: form.currency,
        referralCode: form.referralCode,
      });

      const nextMessage =
        response.data?.message || 'Account created. Check your inbox for verification.';

      const loginId =
        response.data?.data?.login ||
        response.data?.data?.user?.userId;

      setMessage(loginId ? `${nextMessage} Your User ID: ${loginId}` : nextMessage);
      toast.success('Registration successful');
    } catch (error) {
      toast.error(getApiError(error, 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const saveOneClickCredentials = (credentials) => {
    sessionStorage.setItem(ONE_CLICK_CREDENTIALS_KEY, JSON.stringify(credentials));
    window.dispatchEvent(new Event('one-click-credentials-created'));
  };

  const registerWithOneClick = async () => {
    if (!quickForm.acceptedTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setQuickSubmitting(true);
    setMessage('');

    try {
      const response = await oneClickRegister({
        country: selectedQuickCountry.name,
        countryCode: selectedQuickCountry.code,
        currency: quickForm.currency,
        referralCode: quickForm.referralCode,
      });

      const account = response.data?.data || {};
      const login = account.login || account.user?.userId || account.user?.login || account.user?.username;
      const password = account.password;

      if (!login || !password) {
        toast.error('User ID or password was not returned from server');
        return;
      }

      saveOneClickCredentials({ login, password });
      toast.success('Registration completed');
    } catch (error) {
      toast.error(getApiError(error, 'One click registration failed'));
    } finally {
      setQuickSubmitting(false);
    }
  };

  const continueWithProvider = (provider) => {
    const targetUrl = AuthAPI.socialAuthUrl(provider);

    if (!targetUrl) {
      toast.error(`${provider} registration URL is not configured`);
      return;
    }

    window.location.href = targetUrl;
  };

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <Logo />

        <h1>Create your account.</h1>

        <p>
          Register with User ID, country-based currency, one click credentials,
          or Google/Facebook authentication.
        </p>
      </div>

      <div className="auth-panel">
        <div className="auth-card register-card">
          <div className="register-card-header">
            <h2>Registration</h2>
            <p>Every registration method creates a unique User ID automatically.</p>
          </div>

          <div className="quick-register-box">
            <div>
              <span className="quick-register-label">Fast signup</span>
              <strong>One Click Registration</strong>
              <small>
                Select country, add referral code if available, then receive User ID and
                password instantly.
              </small>
            </div>

            <button
              className="btn btn-primary quick-register-btn"
              type="button"
              onClick={() => setShowQuickForm((current) => !current)}
            >
              <MousePointerClick size={18} />
              {showQuickForm ? 'Manual Registration' : 'One Click'}
            </button>
          </div>

          {showQuickForm && (
            <div className="one-click-panel">
              <div className="input-group">
                <label htmlFor="quickCountryCode">Country</label>

                <select
                  id="quickCountryCode"
                  name="quickCountryCode"
                  value={quickForm.countryCode}
                  onChange={updateQuickCountry}
                  required
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="quickCurrency">Currency</label>

                <input
                  id="quickCurrency"
                  name="quickCurrency"
                  value={currencyLabel(quickForm.currency)}
                  readOnly
                />
              </div>

              <div className="bonus-card">
                <div className="bonus-thumb">100%</div>

                <div>
                  <strong>Bonus for sports</strong>
                  <span>First deposit bonus up to {formatCurrency(14000, quickForm.currency)}</span>
                </div>

                <span className="bonus-arrow">›</span>
              </div>

              <input
                className="promo-input"
                value={quickForm.referralCode}
                onChange={(event) =>
                  setQuickForm((current) => ({
                    ...current,
                    referralCode: event.target.value,
                  }))
                }
                placeholder="Enter referral / promo code (optional)"
              />

              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={quickForm.acceptedTerms}
                  onChange={(event) =>
                    setQuickForm((current) => ({
                      ...current,
                      acceptedTerms: event.target.checked,
                    }))
                  }
                />

                <span>
                  By ticking this box, the user declares to have read, understood and
                  accepted the{' '}
                  <a href="/other/rules" target="_blank" rel="noreferrer">
                    General Terms and Conditions
                  </a>
                </span>
              </label>

              <button
                className="complete-register-btn"
                type="button"
                onClick={registerWithOneClick}
                disabled={quickSubmitting}
              >
                {quickSubmitting ? 'Creating account...' : 'Complete Registration'}
              </button>
            </div>
          )}

          {!showQuickForm && (
            <>
              <div className="social-auth-grid">
                <button
                  className="social-auth-btn google"
                  type="button"
                  onClick={() => continueWithProvider('google')}
                >
                  <FaGoogle />
                  Continue with Google
                </button>

                <button
                  className="social-auth-btn facebook"
                  type="button"
                  onClick={() => continueWithProvider('facebook')}
                >
                  <FaFacebookF />
                  Continue with Facebook
                </button>
              </div>

              <div className="auth-divider">
                <span>or register manually</span>
              </div>

              <form className="form-grid" onSubmit={submit}>
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>

                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="countryCode">Country</label>

                  <select
                    id="countryCode"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={updateField}
                    required
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="currency">Currency</label>

                  <input
                    id="currency"
                    name="currency"
                    value={currencyLabel(form.currency)}
                    readOnly
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email">Email</label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    required
                    autoComplete="email"
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
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="input-group password-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={updateField}
                    required
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="input-group referral-group">
                  <label htmlFor="referralCode">Referral code (optional)</label>

                  <input
                    id="referralCode"
                    name="referralCode"
                    value={form.referralCode}
                    onChange={updateField}
                  />
                </div>

                <button
                  className="btn btn-primary btn-full"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creating account...' : 'Register'}
                </button>
              </form>
            </>
          )}

          {message ? <div className="auth-message">{message}</div> : null}

          <div className="auth-links">
            <Link to="/login">Already have an account?</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
