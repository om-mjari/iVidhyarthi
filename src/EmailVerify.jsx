import React, { useEffect, useState } from 'react';

function EmailVerify({ onGoToLogin }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const run = async () => {
      try {
        // Support both: /verify-email?token=xxx and /users/:id/verify/:token
        const url = new URL(window.location.href);
        let token = url.searchParams.get('token');

        if (!token) {
          const parts = url.pathname.split('/').filter(Boolean);
          const verifyIdx = parts.findIndex(p => p === 'verify');
          if (verifyIdx !== -1 && parts[verifyIdx + 1]) {
            token = parts[verifyIdx + 1];
          }
        }

        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link.');
          return;
        }

        const resp = await fetch('http://localhost:5000/api/auth/verify-email?token=' + encodeURIComponent(token));
        const data = await resp.json();

        if (resp.ok && data?.success) {
          setStatus('success');
          setMessage('Email verified successfully');
        } else {
          setStatus('error');
          setMessage(data?.message || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Something went wrong while verifying.');
      }
    };
    run();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fc', padding: '1rem' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2rem 2.5rem', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 18px 44px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 16 }} aria-hidden>
          {status === 'loading' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>
        <h2 style={{ margin: 0, marginBottom: 8, color: '#111827' }}>{message}</h2>
        <p style={{ color: '#6b7280', marginTop: 0, marginBottom: 24 }}>You can now proceed to login.</p>
        <button onClick={onGoToLogin} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.9rem 1.25rem', width: '100%', fontWeight: 700, cursor: 'pointer' }}>Login</button>
      </div>
    </div>
  );
}

export default EmailVerify;


