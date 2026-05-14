import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, X } from 'lucide-react';

const STORAGE_KEY = 'oneClickCredentials';

function readSavedCredentials() {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    if (!parsed?.login || !parsed?.password) return null;
    return parsed;
  } catch (_) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export default function OneClickCredentialModal() {
  const location = useLocation();
  const [createdAccount, setCreatedAccount] = useState(null);

  const loadCredentials = useCallback(() => {
    setCreatedAccount(readSavedCredentials());
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [location.pathname, loadCredentials]);

  useEffect(() => {
    window.addEventListener('one-click-credentials-created', loadCredentials);

    return () => {
      window.removeEventListener('one-click-credentials-created', loadCredentials);
    };
  }, [loadCredentials]);

  const closeModal = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setCreatedAccount(null);
  };

  const copyCredentials = async () => {
    if (!createdAccount) return;

    await navigator.clipboard.writeText(
      `Login: ${createdAccount.login}\nPassword: ${createdAccount.password}`
    );

    toast.success('Login and password copied');
  };

  const saveToFile = () => {
    if (!createdAccount) return;

    const bonusLine = createdAccount.signupBonus?.awarded
      ? `\nSignup bonus: ${createdAccount.signupBonus.amount} ${createdAccount.signupBonus.currency}`
      : '';
    const text = `7XBET One Click Registration\n\nLogin: ${createdAccount.login}\nPassword: ${createdAccount.password}${bonusLine}\n\nPlease save your login and password. Password is shown only once.`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `7xbet-login-${createdAccount.login}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const sendToEmail = () => {
    toast('Email sending is not configured yet. Please copy or save your credentials.');
  };

  if (!createdAccount) return null;

  return (
    <div className="credential-modal-backdrop" role="dialog" aria-modal="true">
      <div className="credential-modal one-click-credential-modal">
        <button className="credential-close" type="button" onClick={closeModal} aria-label="Close">
          <X size={30} />
        </button>

        <h2>Thanks for the registration</h2>

        <div className="credential-box">
          <div>
            <span>Login:</span>
            <strong>{createdAccount.login}</strong>
          </div>

          <div className="credential-divider" />

          <div>
            <span>Password:</span>
            <strong>{createdAccount.password}</strong>
          </div>

          <button type="button" onClick={copyCredentials} aria-label="Copy login and password">
            <Copy size={26} />
          </button>
        </div>

        <button className="credential-action" type="button" onClick={sendToEmail}>
          Send to e-mail
        </button>

        <button className="credential-action" type="button" onClick={saveToFile}>
          Save to file
        </button>

        <button className="credential-action" type="button" onClick={() => window.print()}>
          Save as picture
        </button>

        {createdAccount.signupBonus?.awarded && (
          <small className="credential-note">
            Signup bonus credited: {createdAccount.signupBonus.amount} {createdAccount.signupBonus.currency}. Wager 2x before withdrawal.
          </small>
        )}

        <small className="credential-note">
          Please save your login and password. Password is shown only once.
        </small>
      </div>
    </div>
  );
}
