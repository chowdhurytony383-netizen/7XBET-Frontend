.static-info-page {
  padding-bottom: 28px;
}

.static-info-hero,
.static-info-layout,
.static-info-section,
.static-info-nav-card,
.static-info-summary-card {
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.static-info-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, .8fr);
  gap: 22px;
  align-items: stretch;
  border-radius: 30px;
  padding: clamp(22px, 3vw, 36px);
  background:
    radial-gradient(circle at 8% 0%, rgba(34, 197, 94, .19), transparent 26rem),
    linear-gradient(135deg, rgba(15, 33, 47, .96), rgba(15, 23, 42, .82));
}

.static-info-hero-copy {
  display: grid;
  align-content: center;
  gap: 13px;
}

.static-info-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.static-info-title-row h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 62px);
  line-height: .96;
  letter-spacing: -.055em;
}

.static-info-icon {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 20px;
  color: #bbf7d0;
  background: rgba(34, 197, 94, .13);
  border: 1px solid rgba(34, 197, 94, .25);
}

.static-info-hero-copy p {
  max-width: 860px;
  margin: 0;
  color: var(--muted);
  font-size: 1.03rem;
  line-height: 1.72;
}

.static-info-updated {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: .82rem;
  font-weight: 800;
  color: #dbeafe;
  background: rgba(96, 165, 250, .12);
  border: 1px solid rgba(96, 165, 250, .24);
}

.static-info-summary-card {
  border-radius: 24px;
  padding: 22px;
  background: rgba(3, 13, 23, .52);
}

.static-info-summary-card h2 {
  margin: 0 0 14px;
  font-size: 1.2rem;
}

.static-info-summary-card ul {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.static-info-summary-card li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  color: #d7e0ef;
  line-height: 1.45;
}

.static-info-summary-card li svg {
  margin-top: 2px;
  color: #22c55e;
}

.static-info-layout {
  display: grid;
  grid-template-columns: 285px minmax(0, 1fr);
  gap: 22px;
  border-radius: 30px;
  padding: 22px;
  background: rgba(15, 33, 47, .55);
}

.static-info-nav-card {
  position: sticky;
  top: 88px;
  align-self: start;
  border-radius: 24px;
  padding: 18px;
  background: rgba(3, 13, 23, .58);
}

.static-back-link {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding: 0 13px;
  border-radius: 14px;
  color: var(--text);
  background: rgba(255, 255, 255, .08);
  border: 1px solid var(--border);
  font-weight: 800;
}

.static-info-nav-card h3 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #ffffff;
}

.static-info-nav-card nav {
  display: grid;
  gap: 8px;
}

.static-info-nav-card nav a {
  display: block;
  border-radius: 14px;
  padding: 11px 12px;
  color: #aab7cc;
  background: rgba(255, 255, 255, .045);
  border: 1px solid transparent;
  font-weight: 750;
  transition: .18s ease;
}

.static-info-nav-card nav a:hover,
.static-info-nav-card nav a.active {
  color: #bbf7d0;
  border-color: rgba(34, 197, 94, .25);
  background: rgba(34, 197, 94, .10);
}

.static-info-content {
  display: grid;
  gap: 16px;
}

.static-info-section {
  border-radius: 24px;
  padding: clamp(20px, 2.5vw, 28px);
  background: rgba(3, 13, 23, .42);
}

.static-info-section h2 {
  margin: 0 0 12px;
  font-size: clamp(21px, 2.5vw, 28px);
  letter-spacing: -.025em;
}

.static-info-section p {
  margin: 0;
  color: #b8c4d6;
  line-height: 1.78;
  font-size: 1rem;
}

.static-info-section p + p {
  margin-top: 12px;
}

.static-info-notice {
  background: linear-gradient(135deg, rgba(250, 204, 21, .10), rgba(15, 23, 42, .52));
  border-color: rgba(250, 204, 21, .22);
}

.static-info-notice h2 {
  color: #fef3c7;
}

@media (max-width: 1050px) {
  .static-info-hero,
  .static-info-layout {
    grid-template-columns: 1fr;
  }

  .static-info-nav-card {
    position: static;
  }

  .static-info-nav-card nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Mobile compact view: Desktop screenshot-এর মতো ছোট, clean, business-standard look */
@media (max-width: 680px) {
  .main-content:has(.static-info-page) {
    padding: 8px 8px 14px !important;
    overflow-x: hidden !important;
  }

  .static-info-page {
    width: 100%;
    min-width: 0;
    padding: 0 8px 16px;
    gap: 10px !important;
  }

  .static-info-hero,
  .static-info-layout {
    border-radius: 18px;
    padding: 12px;
    gap: 10px;
  }

  .static-info-hero-copy {
    gap: 8px;
  }

  .static-info-title-row {
    align-items: center;
    gap: 9px;
  }

  .static-info-icon {
    width: 34px;
    height: 34px;
    border-radius: 12px;
  }

  .static-info-icon svg {
    width: 18px;
    height: 18px;
  }

  .static-info-title-row h1 {
    font-size: clamp(22px, 6vw, 30px);
    line-height: 1.02;
    letter-spacing: -.045em;
  }

  .static-info-hero-copy p {
    font-size: .78rem;
    line-height: 1.55;
  }

  .static-info-updated {
    padding: 6px 9px;
    font-size: .64rem;
  }

  .static-info-summary-card,
  .static-info-section,
  .static-info-nav-card {
    border-radius: 15px;
    padding: 11px;
  }

  .static-info-summary-card h2 {
    margin-bottom: 8px;
    font-size: .95rem;
  }

  .static-info-summary-card ul {
    gap: 7px;
  }

  .static-info-summary-card li {
    grid-template-columns: 14px minmax(0, 1fr);
    gap: 7px;
    font-size: .75rem;
    line-height: 1.42;
  }

  .static-info-summary-card li svg {
    width: 13px;
    height: 13px;
    margin-top: 2px;
  }

  .static-back-link {
    min-height: 32px;
    margin-bottom: 10px;
    padding: 0 10px;
    border-radius: 10px;
    gap: 6px;
    font-size: .76rem;
  }

  .static-back-link svg {
    width: 15px;
    height: 15px;
  }

  .static-info-nav-card h3 {
    margin-bottom: 8px;
    font-size: .82rem;
  }

  .static-info-nav-card nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .static-info-nav-card nav a {
    min-height: 30px;
    border-radius: 9px;
    padding: 7px 8px;
    font-size: .70rem;
    line-height: 1.2;
  }

  .static-info-content {
    gap: 10px;
  }

  .static-info-section h2 {
    margin-bottom: 7px;
    font-size: .98rem;
    line-height: 1.25;
  }

  .static-info-section p {
    font-size: .73rem;
    line-height: 1.58;
  }

  .static-info-section p + p {
    margin-top: 8px;
  }
}

@media (max-width: 420px) {
  .main-content:has(.static-info-page) {
    padding: 6px 6px 12px !important;
  }

  .static-info-page {
    padding-left: 4px;
    padding-right: 4px;
  }

  .static-info-hero,
  .static-info-layout {
    padding: 10px;
    border-radius: 16px;
  }

  .static-info-title-row h1 {
    font-size: clamp(20px, 5.8vw, 26px);
  }

  .static-info-icon {
    width: 32px;
    height: 32px;
  }

  .static-info-hero-copy p {
    font-size: .74rem;
  }

  .static-info-summary-card li,
  .static-info-section p {
    font-size: .70rem;
  }

  .static-info-nav-card nav a {
    font-size: .66rem;
    padding: 7px 7px;
  }
}
