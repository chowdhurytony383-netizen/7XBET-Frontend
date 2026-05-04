import { useEffect } from 'react';

export default function FreeDemoGameWidget({
  gameSlug = 'super-ace-deluxe',
  publisherId = '7',
}) {
  useEffect(() => {
    const scriptId = 'freedemo-game-widget-script';

    // আগে script loaded থাকলে আবার load করবে না
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://api.freedemo.games/assets/widget/v1/js/game.widget.js?v=1.1.0';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      // এখানে script remove করছি না, কারণ অন্য game widget থাকলে problem হতে পারে
    };
  }, []);

  return (
    <div
      className="freedemo-game-widget"
      data-game-slug={gameSlug}
      data-publisher-id={publisherId}
      style={{
        width: '100%',
        minHeight: '650px',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#050816',
      }}
    />
  );
}