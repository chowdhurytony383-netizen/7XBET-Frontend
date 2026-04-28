import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { AgentAPI } from '../api/agent.js';
import { getApiError } from '../api/client.js';
import './AuthPages.css';

export default function AgentLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ agentId: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await AgentAPI.login(form);
      toast.success('Agent login successful');
      navigate('/agent/dashboard', { replace: true });
    } catch (error) {
      toast.error(getApiError(error, 'Agent login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <Logo />
        <h1>Agent panel login.</h1>
        <p>Login with the Agent ID and password created from the main admin panel.</p>
      </div>

      <div className="auth-panel">
        <form className="auth-card form-grid" onSubmit={submit}>
          <div>
            <h2><Shield size={26} /> Agent Login</h2>
            <p>Only agent accounts can access this separate panel.</p>
          </div>

          <div className="input-group">
            <label htmlFor="agentId">Agent ID</label>
            <input id="agentId" name="agentId" value={form.agentId} onChange={updateField} required autoComplete="username" placeholder="AG12345678" />
          </div>

          <div className="input-group password-field">
            <label htmlFor="agentPassword">Password</label>
            <input id="agentPassword" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login to Agent Panel'}
          </button>
        </form>
      </div>
    </section>
  );
}
