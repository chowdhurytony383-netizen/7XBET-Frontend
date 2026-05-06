import { useEffect, useState } from 'react';
import './CrashPage.css';

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

      const gameLaunchUrl =
        data.launchUrl ||
        data?.data?.launchUrl ||
        data?.result?.launchUrl;

      if (!response.ok || !gameLaunchUrl) {
        throw new Error(data.message || data.error || 'Game launch failed');
      }

      setLaunchUrl(gameLaunchUrl);
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
      <main className="crash-provider-shell">
        <div className="crash-provider-card">
          <div className="crash-provider-logo">7X Crush</div>
          <h2>Loading game...</h2>
          <p>Please wait while we connect to the game server.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="crash-provider-shell">
        <div className="crash-provider-card">
          <div className="crash-provider-logo">7X Crush</div>
          <h2>Game launch failed</h2>
          <p>{error}</p>
          <button type="button" onClick={launchGame}>
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="crash-provider-game">
      <iframe
        src={launchUrl}
        title="7X Crush"
        className="crash-provider-iframe"
        allow="fullscreen"
      />
    </main>
  );
}