import React, { useState } from 'react';

const TrustedPartners = () => {
  const partners = [
    { id: 1, name: 'Ministry of Education', logo: '🎓', category: 'Government', url: 'https://www.education.gov.in/' },
    { id: 2, name: 'AICTE', logo: '📚', category: 'Regulatory', url: 'https://www.aicte-india.org/' },
    { id: 3, name: 'Google', logo: '🔍', category: 'Industry', url: 'https://www.google.com/' },
    { id: 4, name: 'Microsoft', logo: '💻', category: 'Industry', url: 'https://www.microsoft.com/' },
    { id: 5, name: 'Amazon AWS', logo: '☁️', category: 'Industry', url: 'https://aws.amazon.com/' },
    { id: 6, name: 'IBM', logo: '🔷', category: 'Industry', url: 'https://www.ibm.com/' }
  ];

  const handlePartnerClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="trusted-partners-section">
      <div className="section-header-center">
        <h2 className="section-title">Trusted By Leading Organizations</h2>
        <p className="section-subtitle">Partnering with the best to deliver quality education</p>
      </div>
      
      <div className="partners-grid">
        {partners.map(partner => (
          <div 
            key={partner.id} 
            className="partner-card clickable"
            onClick={() => handlePartnerClick(partner.url)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handlePartnerClick(partner.url);
              }
            }}
            title={`Visit ${partner.name} website`}
          >
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
