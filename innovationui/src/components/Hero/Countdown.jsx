import React, { useState, useEffect } from 'react';
import './Hero.css';

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 92,
    hours: 10,
    minutes: 0,
  });

  // Simple countdown logic simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        return prev;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown">
      <div className="countdown-item">
        <span className="count">{timeLeft.days.toString().padStart(2, '0')}</span>
        <span className="label">Days</span>
      </div>
      <div className="countdown-divider">:</div>
      <div className="countdown-item">
        <span className="count">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="label">Hours</span>
      </div>
      <div className="countdown-divider">:</div>
      <div className="countdown-item">
        <span className="count">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="label">Mins</span>
      </div>
    </div>
  );
};

export default Countdown;
