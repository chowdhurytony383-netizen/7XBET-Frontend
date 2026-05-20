import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import './ContentPageTemplate.css';
import './CustomerSupportPage.css';

export default function CustomerSupportPage() {
  return (
    <div className="page-stack content-page customer-support-page">
      <section className="content-page-hero">
        <div>
          <span className="page-eyebrow">Support</span>
          <h1>Customer Support</h1>
          <p>Contact our support team for account, deposit, withdrawal, bonus, verification, or technical help.</p>
        </div>

        <div className="content-page-actions">
          <Link to="/" className="btn btn-soft">
            Main page
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="content-page-panel">
        <div className="content-panel-header">
          <div>
            <h2>Customer Support</h2>
            <p>Use the official support options below.</p>
          </div>
        </div>

        <div className="content-grid customer-support-grid">
          <a
            className="content-card customer-support-card"
            href="mailto:support-en@7xbet.asia"
            aria-label="Email 7XBET support"
          >
            <div className="customer-support-icon">
              <Mail size={34} />
            </div>

            <div>
              <h3>Support Email</h3>
              <p>support-en@7xbet.asia</p>
            </div>
          </a>

          <Link
            className="content-card customer-support-card"
            to="/live-support"
            aria-label="Open Live Support"
          >
            <div className="customer-support-icon">
              <MessageCircle size={34} />
            </div>

            <div>
              <h3>Live Support</h3>
              <p>Open live support page</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}