import React from 'react';
import { Mail, Phone, Globe, Send } from 'lucide-react';
import './Footer.css';
import oppiLogo from '../../assets/Oppi-logo.png';

const Footer = () => {
  return (
    <footer className="footer" id="help">
      <div className="container footer-main">
        <div className="footer-brand">
          <div className="logos-container">
            <img src={oppiLogo} alt="OPPI Logo" className="footer-logo" />
          </div>
        </div>

        <div className="footer-col contact-col divider-left">
          <h3>Contact</h3>
          <div className="contact-item">
            <Globe size={18} className="icon" />
            <span>indiaoppi.com</span>
          </div>
          <div className="contact-item">
            <Send size={18} className="icon" />
            <span>awards.indiaoppi.com</span>
          </div>
          <div className="contact-item">
            <Mail size={18} className="icon" />
            <span>awards@indiaoppi.com</span>
          </div>
          <div className="contact-item">
            <Phone size={18} className="icon" />
            <span>+91 00000 00000</span>
          </div>
        </div>

        <div className="footer-col address-col divider-left">
          <h3>Mumbai :</h3>
          <p>
            Organisation of Pharmaceutical Producers of India 1620, C Wing, ONE
            BKC G Block, Plot No. C 66, Bandra Kurla Complex,
            Bandra East, Mumbai 400051
          </p>
        </div>

        <div className="footer-col address-col divider-left">
          <h3>Delhi :</h3>
          <p>
            Organisation of Pharmaceutical Producers of India, Avanta Business
            Centre, Cabin No. 8, 3rd Floor, Ambadeep Building, K. G.
            Marg, Connaught Place, New Delhi 110001
          </p>
        </div>
      </div>

      <div className="footer-copyright">
        <p>© OPPI 2026. All rights reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
