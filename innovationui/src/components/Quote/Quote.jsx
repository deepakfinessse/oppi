import React from 'react';
import './Quote.css';

const Quote = () => {
  const statsList = [
    { value: '60+', label: "Years of OPPI's pharmaceutical leadership in India" },
    { value: '6', label: 'Years of Innovation Award recognising research excellence' },
    { value: 'Rs 1L', label: 'Cash prize + citation awarded to winning company' },
  ];

  return (
    <section className="quote-section" id="about">
      <div className="container">
        <div
          className="quote-content"
        >
          <p className="quote-text">
            "Innovation in healthcare is not a luxury — it is the infrastructure of a healthier India."
          </p>
        </div>

        <div className="quote-desc">
          <p>
            The Organisation of Pharmaceutical Producers of India (OPPI) works closely with the government and other stakeholders to foster a productive environment for pharmaceutical innovation. As one of OPPI's three core pillars, innovation is consistently prioritized. OPPI and its member companies are committed to creating an ecosystem where innovation flourishes, driving progress and shaping the future of healthcare.
          </p>
        </div>

        <div className="quote-stats" aria-label="OPPI innovation highlights">
          {statsList.map((stat) => (
            <div
              key={stat.value}
              className="quote-stat-card"
            >
              <h3 className="quote-stat-value">{stat.value}</h3>
              <p className="quote-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Quote;
