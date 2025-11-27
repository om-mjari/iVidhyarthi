import React, { useEffect, useState } from 'react';

/**
 * Payment Configuration Banner Component
 * Shows demo mode status and provides setup instructions
 */
const PaymentConfigBanner = () => {
  const [config, setConfig] = useState(null);
  const [show, setShow] = useState(true);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    // Check payment configuration status
    fetch('http://localhost:5000/api/payments/config/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConfig(data.data);
        }
      })
      .catch(err => {
        console.error('Failed to check payment config:', err);
      });
  }, []);

  if (!config || !config.demoMode || !show) {
    return null;
  }

  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '50px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
        }}
      >
        <span>🎭</span>
        <span>Demo Mode Active</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        animation: 'slideDown 0.5s ease-out',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '24px' }}>🎭</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>
              Payment Demo Mode Active
            </div>
            <div style={{ fontSize: '12px', opacity: '0.95' }}>
              All payments are simulated for testing • No real charges will occur
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => {
              const win = window.open('/RAZORPAY_DEMO_SETUP.md', '_blank');
              if (win) win.focus();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            📚 Setup Guide
          </button>
          
          <button
            onClick={() => setMinimized(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            ─
          </button>

          <button
            onClick={() => setShow(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              lineHeight: '1',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            ×
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentConfigBanner;
