import React from 'react';

const WhyChoose = () => {
  const features = [
    {
      id: 1,
      icon: '👨‍🏫',
      title: 'Expert Instructors',
      description: 'Learn from industry professionals and certified educators with years of real-world experience.',
      color: '#14b8a6'
    },
    {
      id: 2,
      icon: '🎯',
      title: 'Industry-Relevant Courses',
      description: 'Access cutting-edge curriculum designed to meet current industry demands and trends.',
      color: '#0891b2'
    },
    {
      id: 3,
      icon: '💰',
      title: 'Affordable Pricing',
      description: 'Quality education at prices that won\'t break the bank. Flexible payment options available.',
      color: '#06b6d4'
    },
    {
      id: 4,
      icon: '🏆',
      title: 'Certificate of Completion',
      description: 'Earn recognized certificates to showcase your skills and boost your professional profile.',
      color: '#14b8a6'
    }
  ];

  return (
    <section className="why-choose-section">
      <div className="section-header-center">
        <h2 className="section-title">Why Choose iVidhyarthi?</h2>
        <p className="section-subtitle">Join thousands of learners achieving their goals</p>
      </div>
      
      <div className="features-grid">
        {features.map(feature => (
          <div key={feature.id} className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}>
              <span className="feature-icon">{feature.icon}</span>
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChoose;
