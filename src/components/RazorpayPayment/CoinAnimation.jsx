import React, { useEffect, useState } from 'react';
import './RazorpayPayment.css';

const CoinAnimation = ({ onComplete }) => {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    const newCoins = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setCoins(newCoins);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="coin-overlay">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="coin"
          style={{
            left: `${coin.left}%`,
            animationDelay: `${coin.delay}s`,
          }}
        />
      ))}
      <h2 style={{ color: 'gold', fontSize: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Payment Successful!</h2>
    </div>
  );
};

export default CoinAnimation;
