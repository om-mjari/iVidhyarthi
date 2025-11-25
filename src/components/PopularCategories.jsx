import React from 'react';

const PopularCategories = () => {
  const categories = [
    {
      id: 1,
      name: 'Programming',
      icon: '💻',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      courses: 45
    },
    {
      id: 2,
      name: 'Data Science',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      courses: 32
    },
    {
      id: 3,
      name: 'AI & ML',
      icon: '🤖',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      courses: 28
    },
    {
      id: 4,
      name: 'Cloud Computing',
      icon: '☁️',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      courses: 24
    },
    {
      id: 5,
      name: 'Cyber Security',
      icon: '🔒',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      courses: 19
    },
    {
      id: 6,
      name: 'Business',
      icon: '💼',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      courses: 38
    },
    {
      id: 7,
      name: 'Design',
      icon: '🎨',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      courses: 22
    },
    {
      id: 8,
      name: 'Web Development',
      icon: '🌐',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      courses: 41
    }
  ];

  return (
    <section className="popular-categories-section">
      <div className="section-header-center">
        <h2 className="section-title">Explore Popular Categories</h2>
        <p className="section-subtitle">Find the perfect course in your area of interest</p>
      </div>
      
      <div className="categories-grid">
        {categories.map(category => (
          <div 
            key={category.id} 
            className="category-card"
            style={{ background: category.gradient }}
          >
            <div className="category-icon">{category.icon}</div>
            <h3 className="category-name">{category.name}</h3>
            <p className="category-count">{category.courses} Courses</p>
            <div className="category-overlay"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularCategories;
