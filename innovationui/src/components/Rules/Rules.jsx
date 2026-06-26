// components/Rules/Rules.jsx
import React from 'react';
import { ChevronRight } from 'lucide-react';
import './Rules.css';
import trophyImg from '../../assets/Trophy5.webp';

const Rules = () => {
  const rules = [
    "The entity should be registered under the Ministry of Corporate Affairs.",
    "Participation in the Excellence in Innovation Award is voluntary.",
    "By participating in the Excellence in Innovation Award, the startups, nominator, ecosystem enablers agree to the OPPI's and its partners use of its name, URL, photos and videos for promotional purposes on its website and other promotional material.",
    "Any false information provided within the context of the Excellence in Innovation Award by any entity concerning identity, mailing address, telephone number, email address, ownership of right, or non-compliance with these rules or any terms and conditions or the like may result in the immediate elimination of the entity from the Awards process.",
    "OPPI reserves the right at its sole discretion to cancel, terminate, modify, or suspend the Excellence in Innovation Award or not award any entity in any sector or sub-sector.",
    "OPPI reserves the right to disqualify any candidate/entity that tampers with the submission process, commits fraud or is in violation of criminal and/or civil laws.",
    "The decisions of the Jury and the implementation committee shall be final and binding.",
    "Applicants reapplying with the same product or service must clearly describe the key improvements, achievements, additional impact, and/or milestones attained since their previous submission."
  ];

  return (
    <section className="rules-section" id="eligibility">
      <div className="container">
        <h2
          className="rules-title"
        >
          Rules of Application
        </h2>

        <div className="rules-container">
          <div className="rules-content">
            <div className="rules-list">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="rule-card"
                >
                  <span className="rule-chevron">
                    <ChevronRight size={18} />
                  </span>
                  <span className="rule-text">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rules-image">
            <img src={trophyImg} alt="Trophy" className="trophy-image" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rules;