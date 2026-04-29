import React from "react";
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
          <h2 className="footer-logo">
            <span className="logo-white">7X</span>
            <span className="logo-green">BET</span>
          </h2>
          <p className="footer-support">
            For questions or suggestions, please visit support-en@7xbet.com
          </p>
        </div>

        <div className="footer-grid">
          <div className="footer-column">
            <h4>7XBET</h4>
            <a href="#">About us</a>
            <a href="#">Terms and Conditions</a>
            <a href="#">Contacts</a>
            <a href="#">Affiliate Program</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Responsible Gambling</a>
            <a href="#">KYC Policies</a>
          </div>

          <div className="footer-column">
            <h4>Products</h4>
            <a href="#">Sports</a>
            <a href="#">Esports</a>
            <a href="#">Live Casino</a>
            <a href="#">Slots</a>
            <a href="#">Bonuses</a>
          </div>

          <div className="footer-column">
            <h4>Live</h4>
            <a href="#">Live</a>
            <a href="#">Multi-LIVE</a>
            <a href="#">Results</a>
            <a href="#">Statistics</a>
          </div>

          <div className="footer-column">
            <h4>Useful links</h4>
            <a href="#">Mobile version</a>
            <a href="#">Bet slip check</a>
            <a href="#">Blog</a>
          </div>

          <div className="footer-column">
            <h4>Socials</h4>
            <a href="#">
              <FaFacebookF /> Facebook
            </a>
            <a href="#">
              <FaTelegramPlane /> Telegram
            </a>
          </div>

          <div className="footer-column app-column">
            <h4>Apps</h4>

            <button className="app-btn">
              <FaAndroid className="app-icon" />
              <div>
                <span>Download for</span>
                <strong>Android</strong>
              </div>
            </button>

            <button className="app-btn">
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

        <div className="more-info">More Info ▾</div>
      </div>
    </footer>
  );
};

export default FooterSection;