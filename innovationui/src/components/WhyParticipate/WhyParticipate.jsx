import React from 'react';
import { motion } from 'framer-motion';
import newspaperImg from '../../assets/newspaper.png';
import rupeeBagImg from '../../assets/rupee bag.png';
import b2bImg from '../../assets/b2b.png';
import './WhyParticipate.css';

const WhyParticipate = () => {
  const reasons = [
    {
      icon: b2bImg,
      title: "Mentorship from & exposure to OPPI member companies.",
      alt: 'Mentorship icon',
    },
    {
      icon: rupeeBagImg,
      title: "A grant in aid of ₹ 1,00,000/-",
      alt: 'Grant icon',
    },
    {
      icon: newspaperImg,
      title: "Citation in the media release, on the OPPI website and Social media handles.",
      alt: 'Citation icon',
    },
  ];

  return (
    <section className="why-section" id="categories">
      <div className="container">
        <h2 className="section-title">Why Participate in Innovation Award?</h2>

        <div className="reasons-grid">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              className="reason-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="reason-top">
                <div className="reason-icon-wrapper">
                  <img src={reason.icon} alt={reason.alt} className="reason-icon" />
                </div>
              </div>
              <div className="reason-bottom">
                <p className="reason-title">{reason.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyParticipate;
