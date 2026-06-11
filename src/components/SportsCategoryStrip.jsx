import { Link } from 'react-router-dom';
import EmptyState from './EmptyState.jsx';
import { sportMetaFrom } from '../utils/sportsVisuals.js';
import './SportsCategoryStrip.css';

function getCategoryKey(category) {
  const meta = sportMetaFrom(`${category?.key || category?.slug || category?.name || ''} ${category?.displayName || category?.title || ''}`);
  return category?.categoryKey || category?.key || category?.slug || meta.key || category?._id || category?.id;
}

function getCategoryName(category) {
  const meta = sportMetaFrom(`${category?.key || category?.slug || category?.name || ''} ${category?.displayName || category?.title || ''}`);
  return category?.displayName || category?.name || category?.title || meta.name;
}


export default function SportsCategoryStrip({ categories = [] }) {
  return (
    <section className="sports-strip-section seven-sport-strip-section">
      <div className="section-row-title">
        <h2>Sports Categories</h2>
        <Link className="view-all-link" to="/sports">View all ›</Link>
      </div>

      {categories.length ? (
        <div className="seven-sports-category-rail">
          {categories.map((category) => {
            const name = getCategoryName(category);
            const meta = sportMetaFrom(`${category?.key || ''} ${category?.slug || ''} ${name}`);
            const sportKey = meta.key || getCategoryKey(category);
            const image = category?.image || category?.logo;
            const liveCount = Number(category?.live || 0);

            return (
              <Link className="seven-sport-pill-card" key={getCategoryKey(category)} to={`/sports?mode=${liveCount ? 'live' : 'prematch'}&sport=${encodeURIComponent(sportKey)}`}>
                <span className={`seven-sport-pill-icon ${meta.className}`}>
                  {image ? <img src={image} alt="" /> : meta.icon}
                </span>
                <strong title={name}>{name}</strong>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sports categories loading" message="7XBET live and pre-match sports will appear here automatically." />
      )}
    </section>
  );
}
