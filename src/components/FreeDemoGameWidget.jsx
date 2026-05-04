import { useEffect, useRef, useState } from 'react';

export default function FreeDemoGameWidget({
  gameSlug = 'super-ace-deluxe',
  publisherId = '7',
}) {
  const scriptRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);

    const scriptId = 'freedemo-game-widget-script';

    const oldScript = document.getElementById(scriptId);
    if (oldScript) {
      oldScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://api.freedemo.games/assets/widget/v1/js/game.widget.js?v=1.1.0';
    script.async = true;
    script.onload = () => setLoadError(false);
    script.onerror = () => setLoadError(true);

    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [gameSlug, publisherId]);

  return (
    <section className="freedemo-demo-section">
      <div className="freedemo-demo-header">
        <span className="page-eyebrow">Demo Game</span>
        <h2>Super Ace Deluxe</h2>
        <p>This is a free demo game preview. It does not use your 7XBET wallet balance.</p>
      </div>

      {loadError && (
        <div className="alert error">
          Demo game failed to load. Please check internet connection or external widget access.
        </div>
      )}

      <div className="freedemo-game-shell">
        <div
          className="freedemo-game-widget"
          data-game-slug={gameSlug}
          data-publisher-id={publisherId}
        />
      </div>
    </section>
  );
}