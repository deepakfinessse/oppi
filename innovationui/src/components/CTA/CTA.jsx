import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './CTA.css';

const CTA = () => {
  return (
    <section className="cta-section">
      <div className="container">
        <motion.div 
          className="cta-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="cta-title">
            Your research<br />
            deserves to be celebrated
          </h2>
          <p className="cta-subtitle">
            Join India's most distinguished roster of pharmaceutical innovators.<br />
            Applications close on 15th July 2026
          </p>
          <Link to="/register" className="cta-btn">
            APPLY NOW <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
