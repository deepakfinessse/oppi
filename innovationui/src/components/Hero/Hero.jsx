// components/Hero/Hero.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Hero.css';
// At the top of your React file
import '@fontsource/bodoni-moda'; // or use an import in your CSS

const Hero = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  // Set target date: 7th August
  const getTargetDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let targetDate = new Date(currentYear, 7, 7);

    if (now > targetDate) {
      targetDate = new Date(currentYear + 1, 7, 7);
    }

    return targetDate;
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = getTargetDate();
      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-wrapper">
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-blue">Excellence in<br />Healthcare</span><br />
            <span className="hero-title-dark">Innovation Awards</span>
          </h1>

          <Link to="/auth" className="apply-now-btn">
            APPLY NOW <ArrowRight width={28} height={22} />
          </Link>

          <div className="deadline-wrapper">
            <div className="deadline-line"></div>
            <p className="deadline-text">
              Submit the entry before 7th August 2026
            </p>
            <div className="deadline-line"></div>
          </div>

          <div className="countdown">
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="countdown-label">Days</span>
            </div>
            <span className="countdown-separator">:</span>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <span className="countdown-separator">:</span>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="countdown-label">Mins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;