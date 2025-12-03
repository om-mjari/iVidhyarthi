import React, { useEffect, useMemo, useState } from 'react';
import './Auth.css';

const initialForm = {
  mode: 'login',
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
};

const Auth = ({ onAuthenticated }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [form.mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.mode === 'signup') {
      if (!form.name.trim()) return setError('Please enter your full name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password
          })
        });

        const result = await response.json();

        if (result.success) {
          // Store user data and token
          localStorage.setItem('auth_user', JSON.stringify(result.data.user));
          localStorage.setItem('auth_token', result.data.token);
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => onAuthenticated?.(), 600);
        } else {
          setError(result.message || 'Registration failed');
        }
      } catch (error) {
        setError('Network error. Please check if the server is running.');
        console.error('Registration error:', error);
      }
      return;
    }

    // Login
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password
        })
      });

      const result = await response.json();

      if (result.success) {
        // Store user data and token
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));
        localStorage.setItem('auth_token', result.data.token);
        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => onAuthenticated?.(), 500);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please check if the server is running.');
      console.error('Login error:', error);
    }
  };

  const switchMode = () => setForm(prev => ({ ...initialForm, mode: prev.mode === 'login' ? 'signup' : 'login' }));

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-illustration" aria-hidden>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="brand">StudentHub</div>
          <div className="tag">Learn. Build. Shine.</div>
        </div>
        <div className="auth-form-area">
          <h2>{form.mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="subtitle">Access your personalized student dashboard</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {form.mode === 'signup' && (
              <label className="field">
                <span>Full Name</span>
                <input name="name" type="text" placeholder="Alex Brown" value={form.name} onChange={handleChange} />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Password</span>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} />
            </label>

            {form.mode === 'signup' && (
              <label className="field">
                <span>Confirm Password</span>
                <input name="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
              </label>
            )}

            {error && <div className="msg error" role="alert">{error}</div>}
            {success && <div className="msg success">{success}</div>}

            <button className="auth-submit" type="submit">
              {form.mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          {form.mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, mode: 'forgot' }))}
                className="link"
                style={{ fontSize: '14px', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <div className="switch">
            {form.mode === 'login' ? (
              <span>New here? <button type="button" onClick={switchMode} className="link">Create an account</button></span>
            ) : (
              <span>Already have an account? <button type="button" onClick={switchMode} className="link">Log in</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
