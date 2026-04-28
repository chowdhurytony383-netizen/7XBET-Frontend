import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { PublicContentAPI } from '../api/publicContent.js';
import { getApiError } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import './ContentPageTemplate.css';

function normalizeList(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }

  return [];
}

function getTitle(item) {
  return item?.displayName || item?.title || item?.name || item?.teamName || item?.categoryName || 'Untitled';
}

function getSubtitle(item) {
  return item?.description || item?.subtitle || item?.league || item?.status || item?.type || '';
}

function getImage(item) {
  return item?.image || item?.banner || item?.thumbnail || item?.icon || '';
}

export default function ContentPageTemplate({
  eyebrow,
  title,
  description,
  endpoint,
  listKeys = ['items', 'data', 'records', 'categories', 'games', 'matches', 'events'],
  emptyTitle,
  emptyMessage,
  actions = [],
  children,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState('');

  async function loadContent() {
    if (!endpoint) return;

    setLoading(true);
    setError('');

    try {
      const response = await PublicContentAPI.get(endpoint);
      setItems(normalizeList(response.data, listKeys));
    } catch (err) {
      setItems([]);
      setError(getApiError(err, 'Backend content unavailable'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const hasItems = useMemo(() => items.length > 0, [items]);

  return (
    <div className="page-stack content-page">
      <section className="content-page-hero">
        <div>
          {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>

        {actions.length > 0 && (
          <div className="content-page-actions">
            {actions.map((action) => (
              <Link key={action.to} to={action.to} className="btn btn-soft">
                {action.label}
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {children}

      <section className="content-page-panel">
        <div className="content-panel-header">
          <div>
            <h2>{title}</h2>
            <p>Content will be displayed here when it is available from the backend/admin panel.</p>
          </div>
          {endpoint && (
            <button type="button" className="btn btn-soft" onClick={loadContent} disabled={loading}>
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>

        {error && <div className="alert error">{error}</div>}

        {loading ? (
          <div className="content-grid">
            <div className="content-skeleton" />
            <div className="content-skeleton" />
            <div className="content-skeleton" />
          </div>
        ) : hasItems ? (
          <div className="content-grid">
            {items.map((item, index) => (
              <article className="content-card" key={item?._id || item?.id || `${title}-${index}`}>
                {getImage(item) ? (
                  <img src={getImage(item)} alt={getTitle(item)} />
                ) : (
                  <div className="content-card-placeholder">{getTitle(item).slice(0, 1)}</div>
                )}
                <div>
                  <h3>{getTitle(item)}</h3>
                  {getSubtitle(item) && <p>{getSubtitle(item)}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={emptyTitle || `No ${title.toLowerCase()} available`}
            message={emptyMessage || `Add ${title.toLowerCase()} content in the backend/admin panel to show it here.`}
          />
        )}
      </section>
    </div>
  );
}
