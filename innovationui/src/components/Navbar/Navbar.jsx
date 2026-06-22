import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import oppiLogo from '../../assets/Oppi-logo.png';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'ABOUT', href: '#about' },
    { name: 'CATEGORIES', href: '#categories' },
    { name: 'ELIGIBILITY', href: '#eligibility' },
    { name: 'JURY', href: '#jury' },
    { name: 'HELP', href: '#help' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        <div className="nav-brand">
          <img src={oppiLogo} alt="OPPI Logo" className="logo-img" />
        </div>

        <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.name}>
              {/* Assuming these are anchor links for the homepage */}
              <a href={link.href.startsWith('/') ? link.href : `/${link.href}`} onClick={() => setIsMobileMenuOpen(false)}>
                {link.name}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-action">
          <Link to="/auth" className="apply-btn" onClick={() => setIsMobileMenuOpen(false)}>
            APPLY NOW <ArrowRight width={23} height={18} />
          </Link>
        </div>

        <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </div>
      </div>
    </nav >
  );
};

export default Navbar;
