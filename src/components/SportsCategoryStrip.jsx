import { Link } from 'react-router-dom';
import EmptyState from './EmptyState.jsx';
import { sportMetaFrom } from '../utils/sportsVisuals.js';
import './SportsCategoryStrip.css';

function getCategoryKey(category) {
  const meta = sportMetaFrom(
    `${category?.key || category?.slug || category?.name || ''} ${category?.displayName || category?.title || ''}`
  );
  return category?.categoryKey || category?.key || category?.slug || meta.key || category?._id || category?.id;
}

function getCategoryName(category) {
  const meta = sportMetaFrom(
    `${category?.key || category?.slug || category?.name || ''} ${category?.displayName || category?.title || ''}`
  );
  return category?.displayName || category?.name || category?.title || meta.name;
}

export default function SportsCategoryStrip({ categories = [] }) {
  return (
    <section className="sports-strip-section">
      <div className="section-row-title">
        <h2>Sports Categories</h2>
        <Link className="view-all-link" to="/sports">View all ›</Link>
      </div>

      {categories.length ? (
        <div className="sports-strip-scroll">
          {categories.map((category) => {
            const name = getCategoryName(category);
            const meta = sportMetaFrom(`${category?.key || ''} ${category?.slug || ''} ${name}`);
            const sportKey = meta.key || getCategoryKey(category);
            const image = category?.image || category?.logo;

            return (
              <Link className="sport-tile" key={getCategoryKey(category)} to={`/sports?sport=${encodeURIComponent(sportKey)}`}>
                <span className={`sport-tile-icon ${meta.className}`}>
                  {image ? <img src={image} alt="" /> : meta.icon}
                </span>
                <span title={name}>{name}</span>
                <small>{Number(category?.matchCount || category?.eventCount || 0) > 0 ? `${category.matchCount || category.eventCount} games` : 'Open'}</small>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sports categories unavailable" message="Automatic sports categories will appear here when the provider sends events." />
      )}
    </section>
  );
}
