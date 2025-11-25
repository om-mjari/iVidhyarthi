import React, { useState, useEffect } from 'react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      image: '👩‍🎓',
      rating: 5,
      review: 'iVidhyarthi transformed my career! The courses are comprehensive and the instructors are exceptional. Highly recommended for anyone looking to upskill.',
      course: 'Full Stack Development',
      role: 'Software Engineer'
    },
    {
      id: 2,
      name: 'Rahul Kumar',
      image: '👨‍💼',
      rating: 5,
      review: 'Outstanding learning experience! The platform is user-friendly, and the course content is up-to-date with industry standards.',
      course: 'Data Science & AI',
      role: 'Data Analyst'
    },
    {
      id: 3,
      name: 'Anita Patel',
      image: '👩‍💻',
      rating: 5,
      review: 'Best online learning platform I\'ve used. The flexibility and quality of education is unmatched. Got certified and landed my dream job!',
      course: 'Cloud Computing',
      role: 'Cloud Architect'
    },
    {
      id: 4,
      name: 'Vikram Singh',
      image: '👨‍🔬',
      rating: 4,
      review: 'Great courses with practical knowledge. The projects helped me build a strong portfolio that impressed employers.',
      course: 'Machine Learning',
      role: 'ML Engineer'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  return (
    <section className="testimonials-section">
      <div className="section-header-center">
        <h2 className="section-title">What Our Students Say</h2>
        <p className="section-subtitle">Real stories from real learners</p>
      </div>
      
      <div className="testimonials-carousel">
        <button className="carousel-btn prev" onClick={prevTestimonial} aria-label="Previous testimonial">
          ‹
        </button>
        
        <div className="testimonial-card-wrapper">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`testimonial-card ${index === currentIndex ? 'active' : ''}`}
              style={{
                transform: `translateX(${(index - currentIndex) * 100}%)`,
                opacity: index === currentIndex ? 1 : 0,
                pointerEvents: index === currentIndex ? 'auto' : 'none'
              }}
            >
              <div className="testimonial-avatar">{testimonial.image}</div>
              <div className="testimonial-rating">{renderStars(testimonial.rating)}</div>
              <p className="testimonial-review">"{testimonial.review}"</p>
              <h4 className="testimonial-name">{testimonial.name}</h4>
              <p className="testimonial-role">{testimonial.role}</p>
              <p className="testimonial-course">Completed: {testimonial.course}</p>
            </div>
          ))}
        </div>
        
        <button className="carousel-btn next" onClick={nextTestimonial} aria-label="Next testimonial">
          ›
        </button>
      </div>
      
      <div className="carousel-dots">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
