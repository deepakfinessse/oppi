import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
const Linkedin = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import './Jury.css';
import { api, getFileUrl } from '../../services/api';

// Import images from assets
import ashutoshImg from '../../assets/Ashutosh-Pastor-with-round-bg.png';
import meenaImg from '../../assets/meena-ganesh--with-round-bg.png';
import karthikeyanImg from '../../assets/Dr-Karthikeyan-Ponnalagu--with-round-bg.png';
import shubraImg from '../../assets/director_new1--with-round-bg.png';

const Jury = () => {
  const defaultValidator = {
    name: "Ashutosh Pastor",
    role: "Sr. Manager and Head - Incubation, Foundation for Innovation & Technology Transfer, IIT Delhi",
    image: ashutoshImg
  };

  const defaultJuryMembers = [
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

  const [validator, setValidator] = useState(defaultValidator);
  const [juryMembers, setJuryMembers] = useState(defaultJuryMembers);

  useEffect(() => {
    let active = true;
    const loadJury = async () => {
      try {
        const data = await api.getJuryMembers();
        if (!active) return;
        if (data && data.length > 0) {
          const valData = data.filter(m => m.type === 'VALIDATOR');
          const juryData = data.filter(m => m.type === 'JURY');
          
          if (valData.length > 0) {
            setValidator({
              name: valData[0].name,
              role: valData[0].role,
              image: getFileUrl(valData[0].imageUrl) || ashutoshImg,
              instagramUrl: valData[0].instagramUrl
            });
          } else {
            setValidator(defaultValidator);
          }
          
          if (juryData.length > 0) {
            setJuryMembers(juryData.map(m => ({
              name: m.name,
              role: m.role,
              image: getFileUrl(m.imageUrl) || meenaImg,
              instagramUrl: m.instagramUrl
            })));
          } else {
            setJuryMembers(defaultJuryMembers);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch jury members from api, using local assets", err);
      }
    };
    loadJury();
    return () => {
      active = false;
    };
  }, []);


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
              {validator.instagramUrl && (
                <a href={validator.instagramUrl} target="_blank" rel="noopener noreferrer" className="jury-social-link" title="LinkedIn">
                  <Linkedin size={18} />
                </a>
              )}
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
                  {member.instagramUrl && (
                    <a href={member.instagramUrl} target="_blank" rel="noopener noreferrer" className="jury-social-link" title="LinkedIn">
                      <Linkedin size={18} />
                    </a>
                  )}
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
