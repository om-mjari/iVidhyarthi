import React, { useState } from 'react';
import './LoginPremium.css';

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('Please enter a valid email address');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('OTP sent to your email!');
        setTimeout(() => {
          setStep(2);
          setSuccess('');
        }, 1500);
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Send OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      return setError('Please enter a valid 6-digit OTP');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('OTP verified! Set your new password.');
        setTimeout(() => {
          setStep(3);
          setSuccess('');
        }, 1500);
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          newPassword: newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Reset password error:', error);
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

      {/* Forgot Password Card */}
      <div className="premium-login-card">
        {/* Top Section - Welcome Banner */}
        <div className="card-banner">
          <div className="banner-content">
            <h1 className="welcome-title">
              {step === 1 && 'Reset Your Password'}
              {step === 2 && 'Verify OTP'}
              {step === 3 && 'Create New Password'}
            </h1>
            <p className="welcome-subtitle">
              {step === 1 && 'Enter your email address and we\'ll send you a verification code to reset your password.'}
              {step === 2 && 'Enter the 6-digit code we sent to your email address.'}
              {step === 3 && 'Create a strong password to secure your account.'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="card-divider">
          <span className="divider-text">
            {step === 1 && 'STEP 1 OF 3'}
            {step === 2 && 'STEP 2 OF 3'}
            {step === 3 && 'STEP 3 OF 3'}
          </span>
        </div>

        {/* Form Section */}
        <div className="card-form-section">
          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="premium-form">
              <div className="input-group">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="premium-input"
                  disabled={loading}
                  required
                />
              </div>

              {error && <div className="message-alert error-alert">{error}</div>}
              {success && <div className="message-alert success-alert">{success}</div>}

              <button type="submit" className="premium-login-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>

              <div className="signup-prompt">
                <span>Remember your password? </span>
                <button type="button" onClick={onBack} className="signup-link">Back to Login</button>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="premium-form">
              <div className="input-group">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="premium-input"
                  disabled={loading}
                  maxLength={6}
                  style={{ fontSize: '20px', letterSpacing: '6px', textAlign: 'center' }}
                  required
                />
              </div>

              <div className="form-options" style={{ justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="forgot-link"
                >
                  Didn't receive code? Resend OTP
                </button>
              </div>

              {error && <div className="message-alert error-alert">{error}</div>}
              {success && <div className="message-alert success-alert">{success}</div>}

              <button type="submit" className="premium-login-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="premium-form">
              <div className="input-group">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="premium-input"
                  disabled={loading}
                  required
                />
              </div>

              <div className="input-group">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="premium-input"
                  disabled={loading}
                  required
                />
              </div>

              {error && <div className="message-alert error-alert">{error}</div>}
              {success && <div className="message-alert success-alert">{success}</div>}

              <button type="submit" className="premium-login-btn" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
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

export default ForgotPassword;
