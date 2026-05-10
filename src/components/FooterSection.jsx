import React from "react";
import { Link } from "react-router-dom";
import "./FooterSection.css";
import {
  FaFacebookF,
  FaTelegramPlane,
  FaAndroid,
  FaApple,
} from "react-icons/fa";

const FooterSection = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="footer-logo" to="/" aria-label="7XBET home">
            <img src="/images/brand/7xbet-premium-logo.png" alt="7XBET" loading="lazy" />
          </Link>
          <p className="footer-support">
            For questions or suggestions, please Contact us:
 support-en@7xbet.asia
          </p>
        </div>

        <div className="footer-grid">
          <div className="footer-column">
            <h4>7XBET</h4>
            <Link to="/about-us">About us</Link>
            <Link to="/terms-and-conditions">Terms and Conditions</Link>
            <Link to="/contacts">Contacts</Link>
            <Link to="/affiliate-program">Affiliate Program</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/responsible-gambling">Responsible Gambling</Link>
            <Link to="/kyc-policies">KYC Policies</Link>
          </div>

          <div className="footer-column">
            <h4>Products</h4>
            <Link to="/sports">Sports</Link>
            <Link to="/esports">Esports</Link>
            <Link to="/live-casino">Live Casino</Link>
            <Link to="/slots">Slots</Link>
            <Link to="/bonuses">Bonuses</Link>
          </div>

          <div className="footer-column">
            <h4>Live</h4>
            <Link to="/sports">Live</Link>
            <Link to="/sports">Multi-LIVE</Link>
            <Link to="/sports">Results</Link>
            <Link to="/sports">Statistics</Link>
          </div>

          <div className="footer-column">
            <h4>Useful links</h4>
            <Link to="/">Mobile version</Link>
            <Link to="/bet-slip">Bet slip check</Link>
            <Link to="/other">Blog</Link>
          </div>

          <div className="footer-column">
            <h4>Socials</h4>
            <a href="#" aria-label="7XBET Facebook">
              <FaFacebookF /> Facebook
            </a>
            <a href="#" aria-label="7XBET Telegram">
              <FaTelegramPlane /> Telegram
            </a>
          </div>

          <div className="footer-column app-column">
            <h4>Apps</h4>

            <button className="app-btn" type="button">
              <FaAndroid className="app-icon" />
              <div>
                <span>Download for</span>
                <strong>Android</strong>
              </div>
            </button>

            <button className="app-btn" type="button">
              <FaApple className="app-icon" />
              <div>
                <span>Download for</span>
                <strong>iOS</strong>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="footer-info-box">
        <h3>7XBET Official Betting Site & Online Casino</h3>
        <hr />
        <p>
          7XBET is a modern online betting platform designed for sports betting,
          esports, live casino, and slot lovers. Users can enjoy a secure and
          smooth betting experience with a responsive desktop and mobile
          interface.
        </p>
        <p>
          New users can get a welcome bonus offer, easy registration, and quick
          deposit options. Our Android and iOS experience is optimized to
          deliver fast performance and instant updates.
        </p>

        <Link className="more-info" to="/about-us">More Info ▾</Link>
      </div>
    </footer>
  );
};

export default FooterSection;
