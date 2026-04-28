import EmptyState from './EmptyState.jsx';
import './SportsCategoryStrip.css';

function getCategoryKey(category) {
  return category?._id || category?.id || category?.slug || category?.name;
}

function getInitial(name = '') {
  const clean = String(name).trim();
  return clean ? clean.charAt(0).toUpperCase() : 'S';
}

export default function SportsCategoryStrip({ categories = [] }) {
  return (
    <section className="sports-strip-section">
      <div className="section-row-title">
        <h2>Sports</h2>
        <div className="section-row-actions" aria-hidden="true">
          <span>‹</span>
          <span>›</span>
        </div>
      </div>

      {categories.length ? (
        <div className="sports-strip-scroll">
          {categories.map((category) => {
            const name = category?.displayName || category?.name || category?.title || 'Sport';
            const image = category?.image || category?.icon || category?.logo;
            return (
              <button className="sport-tile" key={getCategoryKey(category)} type="button">
                {image ? (
                  <img src={image} alt="" className="sport-tile-image" />
                ) : (
                  <span className="sport-tile-initial">{getInitial(name)}</span>
                )}
                <span title={name}>{name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sports categories unavailable" message="Add sports categories in the backend to show this section." />
      )}
    </section>
  );
}
