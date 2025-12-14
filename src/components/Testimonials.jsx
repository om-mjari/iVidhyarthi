import React, { useState, useEffect } from 'react';

// Avatar emojis pool - defined outside component for stability
const avatarEmojis = ['👩‍🎓', '👨‍💼', '👩‍💻', '👨‍🔬', '👩‍🏫', '👨‍🎓', '👩‍💼', '👨‍💻', '👩‍🔬', '👨‍🏫'];

// Testimonial templates - defined outside component for stability
const reviewTemplates = [
    'Outstanding educator! The teaching methodology is exceptional and easy to understand. Highly recommended for anyone looking to master {subject}.',
    'Excellent instructor with deep knowledge. The course content is comprehensive and well-structured. Great learning experience!',
    'Best learning experience I\'ve had! The explanations are clear and the practical examples make complex topics simple to grasp.',
    'Exceptional teaching quality! The instructor\'s expertise and dedication truly make a difference in understanding {subject}.',
    'Great instructor with excellent communication skills. The course helped me build strong foundations and practical skills.',
    'Highly knowledgeable and passionate educator. The interactive sessions and real-world examples enhanced my learning journey.',
    'Wonderful teaching approach! Made complex concepts easy to understand. Highly recommend for serious learners.',
    'Professional and engaging instructor. The structured curriculum and hands-on projects were incredibly valuable.'
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tbl-lecturers');
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          // Transform lecturer data into testimonials
          const lecturerTestimonials = result.data.map((lecturer, index) => {
            const randomReview = reviewTemplates[index % reviewTemplates.length];
            const subject = lecturer.Specialization || lecturer.specialization || 'their field';
            const designation = lecturer.Designation || lecturer.designation || 'Instructor';
            
            return {
              id: lecturer._id || lecturer.Lecturer_Id || index + 1,
              name: lecturer.Full_Name || lecturer.name || 'Anonymous',
              image: avatarEmojis[index % avatarEmojis.length],
              rating: 5, // Default 5 stars for all lecturers
              review: randomReview.replace('{subject}', subject),
              course: lecturer.Specialization || lecturer.specialization || 'Various Courses',
              role: designation,
              qualification: lecturer.Highest_Qualification || lecturer.qualification || '',
              experience: lecturer.Experience_Years ? `${lecturer.Experience_Years} years experience` : ''
            };
          });

          setTestimonials(lecturerTestimonials);
        } else {
          // Fallback testimonials if API fails
          setTestimonials([
            {
              id: 1,
              name: 'Expert Instructor',
              image: '👩‍🎓',
              rating: 5,
              review: 'iVidhyarthi provides exceptional learning experiences with dedicated instructors.',
              course: 'Various Courses',
              role: 'Instructor'
            }
          ]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lecturers:', error);
        // Fallback testimonials on error
        setTestimonials([
          {
            id: 1,
            name: 'Expert Instructor',
            image: '👩‍🎓',
            rating: 5,
            review: 'iVidhyarthi provides exceptional learning experiences with dedicated instructors.',
            course: 'Various Courses',
            role: 'Instructor'
          }
        ]);
        setLoading(false);
      }
    };

    fetchLecturers();
  }, []);

  // Auto-carousel effect - runs when testimonials are loaded
  useEffect(() => {
    if (testimonials.length === 0 || loading) {
      console.log('Carousel not starting:', { testimonialsLength: testimonials.length, loading });
      return;
    }

    console.log('Starting auto-carousel with', testimonials.length, 'testimonials');
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % testimonials.length;
        console.log('Auto-carousel: moving from index', prevIndex, 'to', nextIndex);
        return nextIndex;
      });
    }, 5000); // Change slide every 5 seconds

    return () => {
      console.log('Clearing carousel interval');
      clearInterval(interval);
    };
  }, [testimonials.length, loading]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  if (loading) {
    return (
      <section className="testimonials-section">
        <div className="section-header-center">
          <h2 className="section-title">What Our Students Say</h2>
          <p className="section-subtitle">Loading testimonials...</p>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="testimonials-section">
        <div className="section-header-center">
          <h2 className="section-title">What Our Students Say</h2>
          <p className="section-subtitle">No testimonials available at the moment.</p>
        </div>
      </section>
    );
  }

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
