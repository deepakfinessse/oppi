import React from 'react';
import { motion } from 'framer-motion';
import './Stats.css';

const Stats = () => {
  const statsList = [
    { value: '60+', label: 'Years of helping pharmaceutical innovation in India' },
    { value: '8', label: 'Years of innovation awards recognizing breakthroughs' },
    { value: 'Rs 1L', label: 'Cash prize + citation bestowed to each category winner' },
  ];

  return (
    <section className="stats-section">
      <div className="container stats-container">
        {statsList.map((stat, index) => (
          <motion.div 
            key={index}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
          >
            <h2 className="stat-value">{stat.value}</h2>
            <p className="stat-label">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
