import React, { useState } from 'react';

const TrustedPartners = () => {
  const partners = [
    { id: 1, name: 'Ministry of Education', logo: '🎓', category: 'Government' },
    { id: 2, name: 'AICTE', logo: '📚', category: 'Regulatory' },
    { id: 3, name: 'Google', logo: '🔍', category: 'Industry' },
    { id: 4, name: 'Microsoft', logo: '💻', category: 'Industry' },
    { id: 5, name: 'Amazon AWS', logo: '☁️', category: 'Industry' },
    { id: 6, name: 'IBM', logo: '🔷', category: 'Industry' }
  ];

  return (
    <section className="trusted-partners-section">
      <div className="section-header-center">
        <h2 className="section-title">Trusted By Leading Organizations</h2>
        <p className="section-subtitle">Partnering with the best to deliver quality education</p>
      </div>
      
      <div className="partners-grid">
        {partners.map(partner => (
          <div key={partner.id} className="partner-card">
            <div className="partner-logo">{partner.logo}</div>
            <p className="partner-name">{partner.name}</p>
            <span className="partner-category">{partner.category}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustedPartners;
