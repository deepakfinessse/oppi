import React from 'react';
import { motion } from 'framer-motion';
import './Jury.css';

// Import images from assets
import ashutoshImg from '../../assets/Ashutosh-Pastor-with-round-bg.png';
import meenaImg from '../../assets/meena-ganesh--with-round-bg.png';
import karthikeyanImg from '../../assets/Dr-Karthikeyan-Ponnalagu--with-round-bg.png';
import shubraImg from '../../assets/director_new1--with-round-bg.png';

const Jury = () => {
  const validator = {
    name: "Ashutosh Pastor",
    role: "Sr. Manager and Head - Incubation, Foundation for Innovation & Technology Transfer, IIT Delhi",
    image: ashutoshImg
  };

  const juryMembers = [
    {
      name: "Meena Ganesh",
      role: "Co-Founder & Chairperson Portea Medical, Trustee Bahaar Foundation",
      image: meenaImg
    },
    {
      name: "Dr Karthikeyan Ponnalagu",
      role: "Engineering Director, AI and ML platforms, Amex India pvt Ltd",
      image: karthikeyanImg
    },
    {
      name: "Shubhini A. Saraf",
      role: "Director, National Institute of Pharmaceutical Education & Research (NIPER), Raebareli",
      image: shubraImg
    }
  ];

  return (
    <section className="jury-section" id="jury">
      <div className="container">
        <h2 className="section-title jury-main-title">Meet the Jury</h2>

        <div className="validator-section">
          <div className="subtitle-wrapper">
            <div className="subtitle-line"></div>
            <h3 className="jury-subtitle">Validator</h3>
            <div className="subtitle-line"></div>
          </div>
          <motion.div
            className="jury-card validator-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="jury-image">
              <img src={validator.image} alt={validator.name} />
            </div>
            <div className="jury-info">
              <h4>{validator.name}</h4>
              <p>{validator.role}</p>
            </div>
          </motion.div>
        </div>

        <div className="jury-members-section">
          <div className="subtitle-wrapper">
            <div className="subtitle-line"></div>
            <h3 className="jury-subtitle">Jury Members</h3>
            <div className="subtitle-line"></div>
          </div>
          <div className="jury-grid">
            {juryMembers.map((member, index) => (
              <motion.div
                key={index}
                className="jury-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="jury-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="jury-info">
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Jury;
