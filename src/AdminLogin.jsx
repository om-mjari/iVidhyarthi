import React, { useState } from 'react';
import './Auth.css';
//helloom
const AdminLogin = ({ onAdminAuthenticated, onBackToHome }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Static admin credentials
  const ADMIN_EMAIL = 'admin123@gmail.com';
  const ADMIN_PASSWORD = 'admin123456789@';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check admin credentials
      if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
        // Set admin user in localStorage
        localStorage.setItem('admin_user', JSON.stringify({
          id: 'admin_001',
          email: ADMIN_EMAIL,
          role: 'admin',
          name: 'System Administrator'
        }));
        
        onAdminAuthenticated?.();
      } else {
        setError('Invalid admin credentials. Please check your email and password.');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-illustration" aria-hidden>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="brand">iVidhyarthi</div>
          <div className="tag">Admin Portal</div>
        </div>
        <div className="auth-form-area">
          <h2>Admin Login</h2>
          <p className="subtitle">Access the administrative dashboard</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span>Admin Email *</span>
              <input 
                name="email" 
                type="email" 
                placeholder="admin123@gmail.com" 
                value={formData.email} 
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Admin Password *</span>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••••••••••" 
                value={formData.password} 
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </label>

            {error && <div className="msg error" role="alert">{error}</div>}
            
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Login as Admin'}
            </button>
          </form>

          <div className="switch">
            <span>Not an admin? <button type="button" onClick={onBackToHome} className="link">Go to Home</button></span>
          </div>

          <div className="admin-credentials-hint">
            <p style={{ 
              fontSize: '0.8rem', 
              color: '#6b7280', 
              textAlign: 'center', 
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              🔐 <strong>Admin Credentials:</strong><br/>
              Email: admin123@gmail.com<br/>
              Password: admin123456789@
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
