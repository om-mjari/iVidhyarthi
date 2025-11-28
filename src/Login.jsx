import React, { useState } from 'react';
import './LoginPremium.css';
import Logo from './Logo';

const Login = ({ onAuthenticated, onSwitchToSignup, onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // MongoDB API connection
  const API_BASE_URL = 'http://localhost:5000/api';

  const loginUser = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Login failed');
    }
    return result;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('Login attempt with:', { email, password: password.length + ' chars' });

    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return setError('Enter a valid email address.');
      }

      // Check for admin credentials first
      if (email === 'admin123@gmail.com' && password === 'admin123456789@') {
        // Create a mock JWT token for admin (in production, this should come from backend)
        const mockToken = 'admin_mock_token_' + Date.now();
        localStorage.setItem('admin_user', JSON.stringify({
          id: 'admin_001',
          email: 'admin123@gmail.com',
          role: 'admin',
          name: 'System Administrator'
        }));
        localStorage.setItem('auth_token', mockToken);
        setSuccess('Admin login successful! Redirecting to dashboard...');
        setTimeout(() => onAdminLogin?.(), 500);
        return;
      }

      // Check for lecturer eligibility first
      const lecturerEligible = localStorage.getItem('lecturer_eligible');
      if (lecturerEligible) {
        try {
          const eligibleData = JSON.parse(lecturerEligible);
          if (eligibleData.passed && eligibleData.email.toLowerCase() === email.toLowerCase()) {
            const lecturerData = {
              id: eligibleData.id,
              name: eligibleData.name,
              email: eligibleData.email,
              specialization: eligibleData.specialization,
              role: 'lecturer'
            };

            // Store lecturer user data
            localStorage.setItem('lecturer_user', JSON.stringify(lecturerData));

            // Initialize lecturer profile if it doesn't exist
            if (!localStorage.getItem('lecturer_profile')) {
              localStorage.setItem('lecturer_profile', JSON.stringify({
                name: lecturerData.name,
                email: lecturerData.email,
                birthdate: '',
                gender: '',
                subjects: lecturerData.specialization || '',
                qualifications: ''
              }));
            }

            // Clear eligibility data
            localStorage.removeItem('lecturer_eligible');
            setSuccess('Lecturer login successful! Redirecting to dashboard...');
            // Navigate by updating history state so App picks it up
            window.history.pushState({ route: 'lecturer-dashboard' }, '', '/lecturer-dashboard');
            // Small delay to allow App state to react
            setTimeout(() => {
              const navEvent = new PopStateEvent('popstate', { state: { route: 'lecturer-dashboard' } });
              window.dispatchEvent(navEvent);
            }, 200);
            return;
          }
        } catch (e) {
          console.error('Error parsing lecturer eligibility data:', e);
        }
      }

      // Static lecturer credentials (fallback)
      if (email.toLowerCase() === 'lecturer123@gmail.com' && password === 'lecturer123456789@') {
        const lecturerData = {
          id: 'lect-001',
          name: 'Lecturer',
          email: 'lecturer123@gmail.com',
          role: 'lecturer'
        };

        // Store lecturer user data
        localStorage.setItem('lecturer_user', JSON.stringify(lecturerData));

        // Initialize lecturer profile if it doesn't exist
        if (!localStorage.getItem('lecturer_profile')) {
          localStorage.setItem('lecturer_profile', JSON.stringify({
            name: lecturerData.name,
            email: lecturerData.email,
            birthdate: '',
            gender: '',
            subjects: '',
            qualifications: ''
          }));
        }

        setSuccess('Lecturer login successful! Redirecting to dashboard...');
        // Navigate by updating history state so App picks it up
        window.history.pushState({ route: 'lecturer-dashboard' }, '', '/lecturer-dashboard');
        // Small delay to allow App state to react
        setTimeout(() => {
          const navEvent = new PopStateEvent('popstate', { state: { route: 'lecturer-dashboard' } });
          window.dispatchEvent(navEvent);
        }, 200);
        return;
      }

      // Static registrar credentials
      if (email.toLowerCase() === 'registrar123@gmail.com' && password === 'registrar123456789@') {
        const registrarData = {
          id: 'reg-001',
          name: 'Registrar',
          email: 'registrar123@gmail.com',
          role: 'registrar'
        };

        // Store registrar user data
        localStorage.setItem('registrar_user', JSON.stringify(registrarData));

        // Initialize registrar profile if it doesn't exist
        if (!localStorage.getItem('registrar_profile')) {
          localStorage.setItem('registrar_profile', JSON.stringify({
            name: registrarData.name,
            email: registrarData.email,
            birthdate: '',
            gender: '',
            university: '',
            contact: ''
          }));
        }

        // Default: mark approval false until admin approves
        if (localStorage.getItem('registrar_approved') === null) {
          localStorage.setItem('registrar_approved', 'false');
        }

        setSuccess('Registrar login successful! Redirecting to dashboard...');

        // Force a page reload to ensure proper state initialization
        setTimeout(() => {
          window.location.href = '/registrar-dashboard';
        }, 500);

        return;
      }

      // Simple login - just verify email and password match registration
      console.log('Attempting simple login...');
      const apiResponse = await loginUser(email, password);
      console.log('Login response:', apiResponse);

      if (apiResponse.success) {
        const userData = apiResponse.data.user;
        console.log('Login successful, user role:', userData.role);

        // Handle different user roles
        if (userData.role === 'registrar') {
          // Store registrar user data
          localStorage.setItem('registrar_user', JSON.stringify({
            id: userData._id || userData.id,
            name: userData.name || '',
            email: userData.email,
            role: 'registrar'
          }));

          // Store JWT token for API authentication
          if (apiResponse.data.token) {
            localStorage.setItem('auth_token', apiResponse.data.token);
          }

          // Initialize registrar profile if it doesn't exist
          if (!localStorage.getItem('registrar_profile')) {
            localStorage.setItem('registrar_profile', JSON.stringify({
              name: userData.name || '',
              email: userData.email,
              birthdate: '',
              gender: '',
              university: '',
              contact: ''
            }));
          }

          // Default: mark approval false until admin approves
          if (localStorage.getItem('registrar_approved') === null) {
            localStorage.setItem('registrar_approved', 'false');
          }

          setSuccess('Registrar login successful! Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/registrar-dashboard';
          }, 500);
        } else if (userData.role === 'instructor') {
          // Store lecturer user data
          localStorage.setItem('lecturer_user', JSON.stringify({
            id: userData._id || userData.id,
            name: userData.name || '',
            email: userData.email,
            role: 'lecturer'
          }));

          // Initialize lecturer profile if it doesn't exist
          if (!localStorage.getItem('lecturer_profile')) {
            localStorage.setItem('lecturer_profile', JSON.stringify({
              name: userData.name || '',
              email: userData.email,
              birthdate: '',
              gender: '',
              subjects: '',
              qualifications: ''
            }));
          }

          setSuccess('Lecturer login successful! Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/lecturer-dashboard';
          }, 500);
        } else {
          // Default to student login
          localStorage.setItem('auth_user', JSON.stringify({
            id: userData._id || userData.id,
            name: userData.name,
            email: userData.email
          }));

          setSuccess('Login successful! Redirecting to home...');
          console.log('Login successful, redirecting to home');
          setTimeout(() => {
            if (onAuthenticated) {
              onAuthenticated();
            }
          }, 500);
        }
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="premium-auth-container">
      {/* Animated Background Waves */}
      <div className="wave-background">
        <svg className="wave wave-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(0, 184, 148, 0.3)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="wave wave-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(0, 230, 170, 0.2)" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,186.7C960,171,1056,149,1152,149.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="wave wave-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(160, 230, 175, 0.15)" d="M0,160L48,149.3C96,139,192,117,288,128C384,139,480,181,576,186.7C672,192,768,160,864,133.3C960,107,1056,85,1152,90.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Floating Decorative Elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Login Card */}
      <div className="premium-login-card">
        {/* Top Section - Welcome Banner */}
        <div className="card-banner">
          <div className="banner-content">
            <h1 className="welcome-title">Welcome to iVidhyarthi</h1>
            <p className="welcome-subtitle">Your gateway to quality education. Learn, grow, and achieve your academic goals with our comprehensive online learning platform.</p>
          </div>
        </div>

        {/* Divider */}
        <div className="card-divider">
          <span className="divider-text">USER LOGIN</span>
        </div>

        {/* Form Section */}
        <div className="card-form-section">
          <form onSubmit={submit} className="premium-form">
            {/* Username Input */}
            <div className="input-group">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                type="email"
                name="email"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input"
                required
              />
            </div>

            {/* Password Input */}
            <div className="input-group">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input"
                required
              />
            </div>

            {/* Error/Success Messages */}
            {error && <div className="message-alert error-alert">{error}</div>}
            {success && <div className="message-alert success-alert">{success}</div>}

            {/* Remember & Forgot */}
            <div className="form-options">
              <label className="remember-checkbox">
                <input type="checkbox" />
                <span className="checkbox-label">Remember</span>
              </label>
              <button type="button" className="forgot-link">Forgot Password?</button>
            </div>

            {/* Login Button */}
            <button type="submit" className="premium-login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="signup-prompt">
            <span>Don't have an account? </span>
            <button type="button" onClick={onSwitchToSignup} className="signup-link">Create Account</button>
          </div>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="page-footer">
        <span>designed by </span>
        <span className="brand-name">iVidhyarthi</span>
      </div>
    </div>
  );
};

export default Login;
