import { useEffect, useState } from 'react';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'https://sevenxbackend.onrender.com';

export default function CrashPage() {
  const [launchUrl, setLaunchUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function launchGame() {
    try {
      setLoading(true);
      setError('');

      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt');

      const response = await fetch(`${API_BASE}/api/games/7x-crush/launch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Game launch failed');
      }

      setLaunchUrl(data.launchUrl);
    } catch (err) {
      setError(err.message || 'Game launch failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    launchGame();
  }, []);

  if (loading) {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <strong>7X Crush</strong>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <strong>7X Crush</strong>
          <p>{error}</p>
          <button style={styles.button} onClick={launchGame}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.gameWrap}>
      <iframe
        src={launchUrl}
        title="7X Crush"
        style={styles.iframe}
        allow="fullscreen"
      />
    </div>
  );
}

const styles = {
  screen: {
    minHeight: '100vh',
    background: '#050814',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
  },
  card: {
    width: 'min(420px, 100%)',
    background: '#101827',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 20,
    textAlign: 'center',
  },
  button: {
    border: 0,
    borderRadius: 10,
    padding: '10px 16px',
    background: '#22c55e',
    color: '#fff',
    fontWeight: 700,
  },
  gameWrap: {
    width: '100%',
    minHeight: '100vh',
    background: '#050814',
  },
  iframe: {
    width: '100%',
    height: '100vh',
    border: 0,
    display: 'block',
  },
};