import React, { useState, useEffect } from 'react';

const PopularCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Icon and gradient mapping based on course title keywords
  const getCategoryStyle = (categoryName, index) => {
    const name = categoryName.toLowerCase();
    
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      'linear-gradient(135deg, #f8b500 0%, #fceabb 100%)'
    ];

    // Icon mapping based on keywords
    if (name.includes('programming') || name.includes('code') || name.includes('java') || name.includes('python') || name.includes('c++')) {
      return { icon: '💻', gradient: gradients[0] };
    } else if (name.includes('data') || name.includes('analytics')) {
      return { icon: '📊', gradient: gradients[1] };
    } else if (name.includes('ai') || name.includes('ml') || name.includes('machine learning') || name.includes('artificial')) {
      return { icon: '🤖', gradient: gradients[2] };
    } else if (name.includes('cloud') || name.includes('aws') || name.includes('azure')) {
      return { icon: '☁️', gradient: gradients[3] };
    } else if (name.includes('security') || name.includes('cyber')) {
      return { icon: '🔒', gradient: gradients[4] };
    } else if (name.includes('business') || name.includes('management')) {
      return { icon: '💼', gradient: gradients[5] };
    } else if (name.includes('design') || name.includes('ui') || name.includes('ux')) {
      return { icon: '🎨', gradient: gradients[6] };
    } else if (name.includes('web') || name.includes('html') || name.includes('css')) {
      return { icon: '🌐', gradient: gradients[7] };
    } else if (name.includes('network') || name.includes('ccna')) {
      return { icon: '🌐', gradient: gradients[8] };
    } else if (name.includes('database') || name.includes('sql')) {
      return { icon: '🗄️', gradient: gradients[9] };
    } else if (name.includes('mobile') || name.includes('android') || name.includes('ios')) {
      return { icon: '📱', gradient: gradients[10] };
    } else {
      return { icon: '📚', gradient: gradients[index % gradients.length] };
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tbl-courses');
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          // Filter only approved courses
          const approvedCourses = result.data.filter(course => {
            const statusValue = course.Status || course.status;
            return typeof statusValue === 'string' && statusValue.toLowerCase() === 'approved';
          });

          // Group courses by Title and count them
          const categoryMap = {};
          approvedCourses.forEach(course => {
            const title = course.Title || course.name || 'Other';
            if (categoryMap[title]) {
              categoryMap[title].count++;
            } else {
              categoryMap[title] = {
                name: title,
                count: 1
              };
            }
          });

          // Convert to array and add styling
          const categoriesArray = Object.values(categoryMap).map((cat, index) => {
            const style = getCategoryStyle(cat.name, index);
            return {
              id: index + 1,
              name: cat.name,
              icon: style.icon,
              gradient: style.gradient,
              courses: cat.count
            };
          });

          // Sort by course count (descending) and take top 8
          const topCategories = categoriesArray
            .sort((a, b) => b.courses - a.courses)
            .slice(0, 8);

          setCategories(topCategories);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="popular-categories-section">
        <div className="section-header-center">
          <h2 className="section-title">Explore Popular Categories</h2>
          <p className="section-subtitle">Loading categories...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="popular-categories-section">
      <div className="section-header-center">
        <h2 className="section-title">Explore Popular Categories</h2>
        <p className="section-subtitle">Find the perfect course in your area of interest</p>
      </div>
      
      <div className="categories-grid">
        {categories.length > 0 ? (
          categories.map(category => (
            <div 
              key={category.id} 
              className="category-card"
              style={{ background: category.gradient }}
            >
              <div className="category-icon">{category.icon}</div>
              <h3 className="category-name">{category.name}</h3>
              <p className="category-count">{category.courses} {category.courses === 1 ? 'Course' : 'Courses'}</p>
              <div className="category-overlay"></div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', width: '100%', color: '#6b7280' }}>
            No categories available at the moment.
          </p>
        )}
      </div>
    </section>
  );
};

export default PopularCategories;
