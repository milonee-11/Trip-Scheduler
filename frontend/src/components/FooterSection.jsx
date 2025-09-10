import React from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="footer-section">
      <div className="footer-content">
        {/* Left Section */}
        <div className="footer-left">
          <h3>TripScheduler</h3>
          <p>
            Explore the royal heritage of Rajasthan with curated travel
            experiences. From desert safaris to palace stays, we offer it all.
          </p>
          <p>
            <strong>Contact:</strong> +91 9876543210
          </p>
          <p>
            <strong>Email:</strong> info@tripscheduler.com
          </p>
          <p>
            <strong>Address:</strong> MI Road, Jaipur, Rajasthan, India
          </p>

          {/* Social Links */}
          <div className="footer-socials">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a
                href="https://instagram.com/yourpage"
                target="_blank"
                rel="noreferrer"
                className="icon instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://facebook.com/yourpage"
                target="_blank"
                rel="noreferrer"
                className="icon facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://youtube.com/yourpage"
                target="_blank"
                rel="noreferrer"
                className="icon youtube"
              >
                <FaYoutube />
              </a>
              <a
                href="https://twitter.com/yourpage"
                target="_blank"
                rel="noreferrer"
                className="icon twitter"
              >
                <FaTwitter />
              </a>
              <a
                href="https://linkedin.com/in/yourpage"
                target="_blank"
                rel="noreferrer"
                className="icon linkedin"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>
          {/* Quick Links */}
        <div className="footer-column" style={{marginRight:'30px'}}>
          <h4 style={{color:'brown'}}>Quick Links</h4>
          <ul className="quick-links">
            <li><Link to="/">🏠 Home</Link></li>
            <li><Link to="/about">ℹ️ About Us</Link></li>
            <li><Link to="/contact">📞 Contact</Link></li>
            <li><Link to="/blog">📰 News</Link></li>
           
          </ul>
        </div>

        {/* Right Section (Map) */}
        <div className="footer-right">
          <h4>Our Location</h4>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.699053795352!2d75.7873!3d26.9124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db3a3f290f48f%3A0x4d2386246c6e37f6!2sJaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1617958390130!5m2!1sen!2sin"
            width="100%"
            height="220"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Rajasthan Travels Map"
          />
        </div>
      </div>

      <p className="footer-bottom">
        &copy; {new Date().getFullYear()} TripScheduler. All rights reserved.
      </p>

      {/* Styling */}
      <style>{`
        .footer-section {
          background: linear-gradient(to right, #fdfbfb, #ebedee);
          padding: 20px 5px;
          color: #333;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 -2px 6px rgba(0,0,0,0.1);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 40px;
          max-width: 1200px;
          margin: auto;
        }

        .footer-left {
          flex: 1;
          min-width: 320px;
        }

        .footer-left h3 {
          font-size: 2rem;
          margin-bottom: 15px;
          color: #c94f4f;
        }

        .footer-left p {
          margin: 6px 0;
          font-size: 1rem;
          color: #555;
        }

        .footer-socials h4 {
          margin-top: 25px;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .social-icons {
          margin-top: 10px;
          display: flex;
          gap: 15px;
        }

        .social-icons a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.3rem;
          transition: 0.3s;
        }

        .social-icons a.instagram { background: #E1306C; color: white; }
        .social-icons a.facebook { background: #3b5998; color: white; }
        .social-icons a.youtube { background: #FF0000; color: white; }
        .social-icons a.twitter { background: #1DA1F2; color: white; }
        .social-icons a.linkedin { background: #0077B5; color: white; }

        .social-icons a:hover {
          transform: scale(1.1);
          opacity: 0.9;
        }

        .footer-right {
          flex: 1;
          min-width: 320px;
        }

        .footer-right h4 {
          font-size: 1.3rem;
          margin-bottom: 12px;
          color: #c94f4f;
        }

        .footer-right iframe {
          width: 100%;
          height: 220px;
          border-radius: 10px;
        }

        .footer-bottom {
          text-align: center;
          margin-top: 25px;
          font-size: 0.95rem;
          color: #666;
          margin-bottom:0px;
      
        }
           /* Quick Links */
        .quick-links {
          list-style: none;
          padding: 0;
          margin: 0;
          color: #c94f4f;
        }

        .quick-links li {
          margin: 8px 0;
        }

        .quick-links a {
          text-decoration: none;
          font-size: 1rem;
          color: #333;
          transition: 0.3s;
        }

        .quick-links a:hover {
          color: #c94f4f;
          padding-left: 6px;
        }
      `}</style>
    </footer>
  );
};

export default FooterSection;
