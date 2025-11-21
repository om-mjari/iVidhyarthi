import React from 'react';

const Logo = ({ 
  size = 'medium', 
  showText = true, 
  onClick = null,
  className = '',
  style = {} 
}) => {
  const sizes = {
    small: { width: '36px', height: '36px', fontSize: '0.95rem' },
    medium: { width: '48px', height: '48px', fontSize: '1.25rem' },
    large: { width: '64px', height: '64px', fontSize: '1.5rem' },
    xlarge: { width: '80px', height: '80px', fontSize: '1.75rem' }
  };

  const logoSize = sizes[size] || sizes.medium;

  return (
    <div 
      className={`logo-container ${className}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: showText ? '0.875rem' : '0',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.3s ease',
        ...style
      }}
    >
      {/* Professional Education Icon */}
      <div 
        style={{
          width: logoSize.width,
          height: logoSize.height,
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3), 0 0 30px rgba(59, 130, 246, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated gradient overlay */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'logoShine 3s linear infinite'
        }} />
        
        {/* Graduation Cap Icon */}
        <svg 
          width="60%" 
          height="60%" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <path 
            d="M12 3L1 9L12 15L23 9L12 3Z" 
            fill="white" 
            opacity="0.9"
          />
          <path 
            d="M12 15L5 11V17C5 17 7 20 12 20C17 20 19 17 19 17V11L12 15Z" 
            fill="white" 
            opacity="0.95"
          />
          <circle 
            cx="20" 
            cy="9" 
            r="2" 
            fill="#fbbf24"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Enhanced Logo Text */}
      {showText && (
        <span 
          style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #10b981 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: logoSize.fontSize,
            fontWeight: '800',
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: '-0.5px',
            position: 'relative',
            textShadow: '0 2px 10px rgba(16, 185, 129, 0.1)'
          }}
        >
          iVidhyarthi
        </span>
      )}
      
      <style>{`
        @keyframes logoShine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        
        .logo-container:hover > div:first-child {
          transform: scale(1.05) rotate(5deg);
          box-shadow: 0 6px 30px rgba(16, 185, 129, 0.4), 0 0 40px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Logo;
