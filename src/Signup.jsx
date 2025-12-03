import React, { useState, useEffect } from 'react';
import './SignupPremium.css';

const Signup = ({ onAuthenticated, onSwitchToLogin }) => {
  // Form state management
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    mobileNo: '',
    contactNo: '',
    dob: '',
    gender: '',
    university: '',
    institute: '',
    branch: '',
    course: '',
    semester: '',
    highestQualification: '',
    specialization: '',
    designation: '',
    experienceYears: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('Student');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');


  // Simple scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Dropdown options
  // Default/fallback institute options
  const defaultInstituteOptions = [
    'Indian Institute of Technology (IIT) Bombay',
    'Indian Institute of Technology (IIT) Madras',
    'Indian Institute of Technology (IIT) Kanpur',
    'Indian Institute of Technology (IIT) Kharagpur',
    'Indian Institute of Technology (IIT) Roorkee',
    'National Institute of Technology (NIT) Trichy',
    'National Institute of Technology (NIT) Warangal',
    'Birla Institute of Technology and Science (BITS) Pilani',
    'Vellore Institute of Technology (VIT) Vellore',
    'Manipal Institute of Technology',
    'SRM Institute of Science and Technology',
    'Amity University',
    'Lovely Professional University (LPU)',
    'Delhi Technological University (DTU)',
    'Other'
  ];

  // University -> Institutes mapping (sampled; extend as needed)
  const universityToInstitutes = {
    'University of Delhi': [
      'St. Stephen\'s College',
      'Hindu College',
      'Miranda House',
      'Sri Ram College of Commerce (SRCC)',
      'Other'
    ],
    'Jawaharlal Nehru University': [
      'School of Computer & Systems Sciences',
      'School of Engineering',
      'School of Language, Literature and Culture Studies',
      'Other'
    ],
    'Banaras Hindu University': [
      'Institute of Science',
      'Institute of Technology (IIT-BHU)',
      'Faculty of Arts',
      'Other'
    ],
    'University of Mumbai': [
      'KJ Somaiya College of Engineering',
      'Veermata Jijabai Technological Institute (VJTI)',
      'Sardar Patel Institute of Technology (SPIT)',
      'Other'
    ],
    'University of Calcutta': [
      'Rajabazar Science College',
      'University College of Science and Technology',
      'Heramba Chandra College',
      'Other'
    ],
    'University of Madras': [
      'College of Engineering, Guindy (Anna University affiliate)',
      'Loyola College',
      'Madras Christian College',
      'Other'
    ],
    'Pune University': [
      'College of Engineering Pune (COEP)',
      'Fergusson College',
      'MIT-WPU School of Engineering',
      'Other'
    ],
    'Gujarat University': [
      'LD College of Engineering',
      'St. Xavier\'s College, Ahmedabad',
      'Government Engineering College, Ahmedabad',
      'Other'
    ],
    'Rajasthan University': [
      'University Five Year Law College',
      'Maharaja College',
      'Maharani College',
      'Other'
    ],
    'Anna University': [
      'College of Engineering, Guindy',
      'Madras Institute of Technology (MIT), Chromepet',
      'ACT Campus',
      'Other'
    ],
    'Osmania University': [
      'University College of Engineering (UCE)',
      'University College of Science',
      'Nizam College',
      'Other'
    ],
    'Andhra University': [
      'College of Engineering (A), Visakhapatnam',
      'College of Science & Technology',
      'College of Arts & Commerce',
      'Other'
    ],
    'Kerala University': [
      'College of Engineering Trivandrum (CET)',
      'Mar Ivanios College',
      'Government Engineering College, Barton Hill',
      'Other'
    ],
    'Mysore University': [
      'SJCE (JSS Science and Technology University)',
      'Yuvaraja\'s College',
      'Vidyavardhaka College of Engineering',
      'Other'
    ]
  };

  const getInstituteOptions = (selectedUniversity) => {
    if (!selectedUniversity || selectedUniversity === 'Other') {
      return defaultInstituteOptions;
    }
    return universityToInstitutes[selectedUniversity] || defaultInstituteOptions;
  };

  const universityOptions = [
    'University of Delhi',
    'Jawaharlal Nehru University',
    'Banaras Hindu University',
    'Aligarh Muslim University',
    'University of Mumbai',
    'University of Calcutta',
    'University of Madras',
    'Pune University',
    'Gujarat University',
    'Rajasthan University',
    'Anna University',
    'Osmania University',
    'Andhra University',
    'Kerala University',
    'Mysore University',
    'Other'
  ];

  const branchOptions = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology',
    'Biomedical Engineering',
    'Other'
  ];

  const courseOptions = [
    'B.Tech Computer Science and Engineering',
    'B.E Computer Science and Engineering',
    'M.Tech Computer Science and Engineering',
    'M.E Computer Science and Engineering',
    'MCA (Master of Computer Applications)',
    'BCA (Bachelor of Computer Applications)',
    'B.Sc Computer Science',
    'M.Sc Computer Science',
    'PhD Computer Science and Engineering',
    'Other'
  ];

  const qualificationOptions = [
    'Diploma',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD',
    'Other'
  ];

  const semesterOptions = [
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester'
  ];

  const genderOptions = [
    'Male',
    'Female',
    'Other',
    'Prefer not to say'
  ];

  const specializationOptions = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Management',
    'Other'
  ];

  const designationOptions = [
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Lecturer',
    'Senior Lecturer',
    'Research Associate',
    'Visiting Faculty',
    'Other'
  ];

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // basic field validation (e.g., email, fullName) you already have ...

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid Gmail address (e.g., user@gmail.com).');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const result = await response.json();
      if (result.success) {
        setOtpSent(true);
        setSuccess('OTP sent to your email! Please enter it below.');
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Error sending OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');

    if (!enteredOtp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: enteredOtp }),
      });
      const result = await response.json();

      if (result.success) {
        setIsOtpVerified(true);
        setSuccess('Email verified successfully! You can now complete your registration.');
      } else {
        setError('Invalid or expired OTP. Please try again.');
        setIsOtpVerified(false);
      }
    } catch (err) {
      setError('Error verifying OTP. Please try again.');
      setIsOtpVerified(false);
    }
  };


  // Form input handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error on input change
  };

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name.trim()) && name.trim().length >= 2;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email.trim());
  };

  const validateContact = (contact) => {
    const contactRegex = /^[6-9]\d{9}$/;
    return contactRegex.test(contact.trim());
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 16;
    }
    return age >= 16;
  };

  // Reset dependent fields when parent changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, institute: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.university]);

  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Check if OTP is verified
    if (!isOtpVerified) {
      setError('Please verify your email with OTP first');
      setIsSubmitting(false);
      return;
    }

    if (isSubmitting) {
      console.log('Already submitting, ignoring click');
      return;
    }

    console.log('Submit clicked, form data:', formData);

    try {
      // Basic validation
      if (!validateName(formData.fullName)) {
        setError('Full name should contain only letters and spaces (minimum 2 characters).');
        setIsSubmitting(false);
        return;
      }

      if (!validateEmail(formData.email)) {
        setError('Please enter a valid Gmail address (e.g., user@gmail.com).');
        setIsSubmitting(false);
        return;
      }

      // Tab-specific validation
      if (activeTab === 'Student') {
        if (!validateContact(formData.contactNumber)) {
          setError('Contact number should be 10 digits starting with 6, 7, 8, or 9.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.dob) {
          setError('Please enter your date of birth.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.gender) {
          setError('Please select your gender.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.university) {
          setError('Please select your university.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.institute) {
          setError('Please select your institute.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.branch) {
          setError('Please select your branch.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.course) {
          setError('Please select your course.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.semester) {
          setError('Please select your semester.');
          setIsSubmitting(false);
          return;
        }
      } else if (activeTab === 'Lecturer') {
        if (!validateContact(formData.mobileNo)) {
          setError('Mobile number should be 10 digits starting with 6, 7, 8, or 9.');
          return;
        }
        if (!formData.dob) {
          setError('Please enter your date of birth.');
          return;
        }
        if (!formData.gender) {
          setError('Please select your gender.');
          return;
        }
        if (!formData.university) {
          setError('Please select your university.');
          return;
        }
        if (!formData.institute) {
          setError('Please select your institute.');
          return;
        }
        if (!formData.highestQualification) {
          setError('Please select your highest qualification.');
          return;
        }
        if (!formData.specialization) {
          setError('Please select your specialization.');
          return;
        }
        if (!formData.designation) {
          setError('Please select your designation.');
          return;
        }
        if (!formData.experienceYears || formData.experienceYears < 0) {
          setError('Please enter valid years of experience.');
          return;
        }
      } else if (activeTab === 'Registrar') {
        if (!validateContact(formData.contactNo)) {
          setError('Contact number should be 10 digits starting with 6, 7, 8, or 9.');
          return;
        }
        if (!formData.university) {
          setError('Please select your university.');
          return;
        }
      }

      if (!validatePassword(formData.password)) {
        setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      // Direct registration without OTP
      console.log('Sending registration request to http://localhost:5000/api/auth/register');
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          userType: activeTab,
          phone: activeTab === 'Student' ? formData.contactNumber : (activeTab === 'Lecturer' ? formData.mobileNo : formData.contactNo),
          dateOfBirth: formData.dob,
          gender: formData.gender?.toLowerCase(),
          // Top-level fields for lecturer
          specialization: formData.specialization || '',
          designation: formData.designation || '',
          experienceYears: formData.experienceYears || '',
          highestQualification: formData.highestQualification || '',
          // Education object for backward compatibility
          education: {
            institution: formData.institute || '',
            university: formData.university || '',
            course: formData.course || '',
            semester: formData.semester || '',
            branch: formData.branch || '',
            highestQualification: formData.highestQualification || '',
            specialization: formData.specialization || '',
            designation: formData.designation || '',
            experienceYears: formData.experienceYears || ''
          }
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = null;
      }

      if (!response.ok) {
        const apiMsg = (result && (result.message || result.error)) || '';
        const friendly = apiMsg || (response.status === 400 ? 'Bad request. Please review the form or use a new email.' : 'Registration failed.');
        throw new Error(friendly);
      }
      console.log('Registration response:', result);

      // If success from backend (201 or 200)
      if (result?.success) {
        // If user signed up as Lecturer, navigate to eligibility quiz
        if (activeTab === 'Lecturer') {
          try {
            const stored = {
              id: result?.data?.user?._id,
              specialization: formData.specialization || 'Computer Science',
              name: formData.fullName,
              email: formData.email,
            };
            localStorage.setItem('lecturer_pending_quiz', JSON.stringify(stored));
          } catch { }
          window.location.href = '/lecturer-eligibility';
          return;
        }

        setSuccess('Account created successfully! Redirecting to login...');
        if (typeof onSwitchToLogin === 'function') {
          setTimeout(() => { onSwitchToLogin(); }, 1000);
        }
        return;
      }

      // If backend says already exists, send user to Login
      const msg = (result?.message || '').toLowerCase();
      if (msg.includes('already exists')) {
        setSuccess('This email is already registered. Redirecting to login...');
        if (typeof onSwitchToLogin === 'function') {
          setTimeout(() => { onSwitchToLogin(); }, 1000);
        }
        return;
      }

      throw new Error(result.message || 'Registration failed');
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="premium-signup-container">
      {/* Animated Wave Background */}
      <div className="wave-background">
        <svg className="wave wave-1" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="rgba(0, 184, 148, 0.3)" />
        </svg>
        <svg className="wave wave-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="rgba(85, 197, 122, 0.2)" />
        </svg>
        <svg className="wave wave-3" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="rgba(160, 230, 175, 0.15)" />
        </svg>
      </div>

      {/* Floating Decorative Shapes */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Premium Registration Card */}
      <div className="premium-signup-card">
        {/* Card Header */}
        <div className="card-header">
          <div className="brand-logo">iVidhyarthi</div>
          <h2 className="card-title">Create your account</h2>
          <p className="card-subtitle">Join and manage your learning journey</p>
        </div>

        {/* Premium Role Selector - Segmented Control */}
        <div className="role-selector">
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab ${activeTab === 'Student' ? 'active' : ''}`}
              onClick={() => setActiveTab('Student')}
            >
              <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`role-tab ${activeTab === 'Lecturer' ? 'active' : ''}`}
              onClick={() => setActiveTab('Lecturer')}
            >
              <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Lecturer</span>
            </button>
            <button
              type="button"
              className={`role-tab ${activeTab === 'Registrar' ? 'active' : ''}`}
              onClick={() => setActiveTab('Registrar')}
            >
              <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Registrar</span>
            </button>
          </div>
        </div>

        {/* Card Body - Form Section */}
        <div className="card-body">

          <form onSubmit={handleSignUp} className="premium-form">
            {/* Common fields for all user types */}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  name="fullName"
                  type="text"
                  className="premium-input"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className="email-otp-wrapper">
                <div className="input-wrapper">
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    name="email"
                    type="email"
                    className={`premium-input ${otpSent ? 'disabled' : ''}`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={otpSent}
                  />
                </div>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSubmitting || !formData.email}
                    className="premium-otp-btn"
                  >
                    {isSubmitting ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <div className="otp-sent-badge">
                    <svg className="check-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    <span>OTP Sent</span>
                  </div>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="otp-verification-card">
                <div className="otp-card-header">
                  <svg className="shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h4>Verify Your Email</h4>
                  <p>We've sent a 6-digit code to <strong>{formData.email}</strong></p>
                </div>
                <div className="otp-input-group">
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className={`premium-input otp-code ${isOtpVerified ? 'verified' : ''}`}
                      placeholder="Enter 6-digit OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      maxLength="6"
                      required
                      disabled={isOtpVerified}
                    />
                  </div>
                  {isOtpVerified ? (
                    <div className="otp-verified-badge">
                      <svg className="verified-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>Email Verified ✓</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={!enteredOtp || enteredOtp.length < 6}
                      className="premium-verify-btn"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Student-specific fields */}
            {activeTab === 'Student' && (
              <>
                <div className="form-group">
                  <label className="form-label">Contact Number *</label>
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      name="contactNumber"
                      type="tel"
                      className="premium-input"
                      placeholder="Enter your contact number"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        name="dob"
                        type="date"
                        className="premium-input"
                        value={formData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="5" />
                          <path d="M20 21a8 8 0 00-16 0" />
                        </svg>
                      </div>
                      <select
                        name="gender"
                        className="premium-select"
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        required
                      >
                        <option value="">Select Gender</option>
                        {genderOptions.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">University *</label>
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                    </div>
                    <select
                      name="university"
                      className="premium-select"
                      value={formData.university}
                      onChange={(e) => handleInputChange('university', e.target.value)}
                      required
                    >
                      <option value="">Select University</option>
                      {universityOptions.map(university => (
                        <option key={university} value={university}>{university}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Institute *</label>
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <select
                      name="institute"
                      className="premium-select"
                      value={formData.institute}
                      onChange={(e) => handleInputChange('institute', e.target.value)}
                      required
                    >
                      <option value="">Select Institute</option>
                      {getInstituteOptions(formData.university).map(institute => (
                        <option key={institute} value={institute}>{institute}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Branch *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <select
                        name="branch"
                        className="premium-select"
                        value={formData.branch}
                        onChange={(e) => handleInputChange('branch', e.target.value)}
                        required
                      >
                        <option value="">Select Branch</option>
                        {branchOptions.map(branch => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <select
                        name="semester"
                        className="premium-select"
                        value={formData.semester}
                        onChange={(e) => handleInputChange('semester', e.target.value)}
                        required
                      >
                        <option value="">Select Semester</option>
                        {semesterOptions.map(semester => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <select
                      name="course"
                      className="premium-select"
                      value={formData.course}
                      onChange={(e) => handleInputChange('course', e.target.value)}
                      required
                    >
                      <option value="">Select Course</option>
                      {courseOptions.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Lecturer-specific fields */}
            {activeTab === 'Lecturer' && (
              <>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      name="mobileNo"
                      type="tel"
                      className="premium-input"
                      placeholder="Enter your mobile number"
                      value={formData.mobileNo || ''}
                      onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        name="dob"
                        type="date"
                        className="premium-input"
                        value={formData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="5" />
                          <path d="M20 21a8 8 0 00-16 0" />
                        </svg>
                      </div>
                      <select
                        name="gender"
                        className="premium-select"
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        required
                      >
                        <option value="">Select Gender</option>
                        {genderOptions.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">University *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                      </div>
                      <select
                        name="university"
                        className="premium-select"
                        value={formData.university}
                        onChange={(e) => handleInputChange('university', e.target.value)}
                        required
                      >
                        <option value="">Select University</option>
                        {universityOptions.map(university => (
                          <option key={university} value={university}>{university}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Institute *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <select
                        name="institute"
                        className="premium-select"
                        value={formData.institute}
                        onChange={(e) => handleInputChange('institute', e.target.value)}
                        required
                      >
                        <option value="">Select Institute</option>
                        {getInstituteOptions(formData.university).map(institute => (
                          <option key={institute} value={institute}>{institute}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Highest Qualification *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 14l9-5-9-5-9 5 9 5m0 7v-7" />
                        </svg>
                      </div>
                      <select
                        name="highestQualification"
                        className="premium-select"
                        value={formData.highestQualification || ''}
                        onChange={(e) => handleInputChange('highestQualification', e.target.value)}
                        required
                      >
                        <option value="">Select Qualification</option>
                        {qualificationOptions.map(qualification => (
                          <option key={qualification} value={qualification}>{qualification}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specialization *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <select
                        name="specialization"
                        className="premium-select"
                        value={formData.specialization || ''}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        required
                      >
                        <option value="">Select Specialization</option>
                        {specializationOptions.map(specialization => (
                          <option key={specialization} value={specialization}>{specialization}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Designation *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <select
                        name="designation"
                        className="premium-select"
                        value={formData.designation || ''}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        required
                      >
                        <option value="">Select Designation</option>
                        {designationOptions.map(designation => (
                          <option key={designation} value={designation}>{designation}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience (Years) *</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <input
                        name="experienceYears"
                        type="number"
                        className="premium-input"
                        placeholder="Enter years of experience"
                        value={formData.experienceYears || ''}
                        onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Registrar-specific fields */}
            {activeTab === 'Registrar' && (
              <>
                <div className="form-group">
                  <label className="form-label">Contact Number *</label>
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      name="contactNo"
                      type="tel"
                      className="premium-input"
                      placeholder="Enter your contact number"
                      value={formData.contactNo || ''}
                      onChange={(e) => handleInputChange('contactNo', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">University *</label>
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                    </div>
                    <select
                      name="university"
                      className="premium-select"
                      value={formData.university}
                      onChange={(e) => handleInputChange('university', e.target.value)}
                      required
                    >
                      <option value="">Select University</option>
                      {universityOptions.map(university => (
                        <option key={university} value={university}>{university}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Password fields for all user types */}
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  className="premium-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  className="premium-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert-message error-alert" role="alert">
                <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="alert-message success-alert">
                <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {success}
              </div>
            )}

            <button
              type="submit"
              className="premium-submit-btn"
              disabled={isSubmitting || !isOtpVerified}
            >
              {isSubmitting ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </>
              ) : !isOtpVerified ? (
                'Verify OTP First'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>Already have an account? <button type="button" onClick={onSwitchToLogin} className="login-link">Log in</button></p>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <div className="page-footer">
        <p>designed by <span className="brand-name">iVidhyarthi</span></p>
      </div>
    </div>
  );
};

export default Signup;
