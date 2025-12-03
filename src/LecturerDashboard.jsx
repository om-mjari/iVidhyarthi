import React, { useEffect, useMemo, useState } from 'react';
import './LecturerDashboardPremium.css';
import './UploadsModule.css';

// ============================================
// AUTOMATIC COURSE IMAGE ASSIGNMENT SYSTEM
// ============================================

/**
 * Category-based image pools with high-quality professional images
 * Each category has multiple images to ensure variety
 */
const CATEGORY_IMAGE_POOLS = {
  // Programming (Category ID: 1)
  'Programming': [
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80', // Code on screen
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80', // Programming workspace
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80', // Developer coding
    'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&q=80', // JavaScript code
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80', // Python programming
  ],
  
  // Web Development (Category ID: 2)
  'Web Development': [
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80', // Web design
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', // Laptop coding
    'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&q=80', // Web development
    'https://images.unsplash.com/photo-1508317469940-e3de49ba902e?w=800&q=80', // Responsive design
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80', // Web coding
  ],
  
  // Mobile App Development (Category ID: 3)
  'Mobile App Development': [
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80', // Mobile apps
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80', // App development
    'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=800&q=80', // Mobile UI
    'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800&q=80', // App design
    'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&q=80', // Smartphone apps
  ],
  
  // Data Science (Category ID: 4)
  'Data Science': [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', // Data analytics
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', // Data dashboard
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80', // Data charts
    'https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=800&q=80', // Analytics graphs
    'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800&q=80', // Big data
  ],
  
  // Cloud Computing (Category ID: 5)
  'Cloud Computing': [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', // Cloud network
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', // Cloud infrastructure
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', // Server room
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80', // Cloud technology
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80', // Cloud computing
  ],
  
  // Networking (Category ID: 6)
  'Networking': [
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', // Network cables
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', // Network infrastructure
    'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80', // Networking devices
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', // Network connections
    'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80', // Network technology
  ],
  
  // Cyber Security (Category ID: 7)
  'Cyber Security': [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', // Security lock
    'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80', // Cybersecurity
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80', // Security shield
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80', // Digital security
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80', // Security lock code
  ],
  
  // Designing (Category ID: 8)
  'Designing': [
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80', // UI design
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80', // Graphic design
    'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&q=80', // Design tools
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80', // Creative design
    'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&q=80', // Design workspace
  ],
  
  // Business / Management (Category ID: 9)
  'Business / Management': [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80', // Business meeting
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80', // Team collaboration
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80', // Business professional
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80', // Office work
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80', // Business strategy
  ],
  
  // Language Learning (Category ID: 10)
  'Language Learning': [
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80', // Books learning
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', // Language education
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80', // Books and learning
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80', // Language books
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80', // Writing learning
  ],
};

/**
 * Default high-quality professional images for uncategorized courses
 */
const DEFAULT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80', // Education abstract
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', // University learning
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80', // Online course
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80', // Learning together
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80', // Professional course
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800&q=80', // Educational setting
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', // Study materials
];

/**
 * Tracks used images per category to ensure variety
 * Format: { categoryName: [usedImageIndexes] }
 */
let usedImagesTracker = {};

/**
 * Automatically assigns a course image based on category
 * @param {number} categoryId - The category ID
 * @param {string} categoryName - The category name
 * @param {number} courseId - The course ID (for logging)
 * @returns {object} - { Image_URL, Category, Assigned_By_System }
 */
function assignCourseImage(categoryId, categoryName, courseId = null) {
  let selectedImage = '';
  
  // (A) Category-based image selection
  if (categoryName && CATEGORY_IMAGE_POOLS[categoryName]) {
    const categoryPool = CATEGORY_IMAGE_POOLS[categoryName];
    
    // Initialize tracker for this category if not exists
    if (!usedImagesTracker[categoryName]) {
      usedImagesTracker[categoryName] = [];
    }
    
    // Get available images (not recently used)
    let availableIndexes = categoryPool
      .map((_, idx) => idx)
      .filter(idx => !usedImagesTracker[categoryName].includes(idx));
    
    // Reset tracker if all images have been used
    if (availableIndexes.length === 0) {
      usedImagesTracker[categoryName] = [];
      availableIndexes = categoryPool.map((_, idx) => idx);
    }
    
    // Select random image from available ones
    const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    selectedImage = categoryPool[randomIndex];
    
    // Mark as used
    usedImagesTracker[categoryName].push(randomIndex);
    
    // Keep only last 3 used images to allow repetition after a gap
    if (usedImagesTracker[categoryName].length > 3) {
      usedImagesTracker[categoryName].shift();
    }
  } 
  // (B) Default random image if no category selected
  else {
    const randomIndex = Math.floor(Math.random() * DEFAULT_IMAGE_POOL.length);
    selectedImage = DEFAULT_IMAGE_POOL[randomIndex];
  }
  
  // Return image assignment metadata
  const result = {
    Course_Id: courseId,
    Category: categoryName || 'Uncategorized',
    Image_URL: selectedImage,
    Assigned_By_System: true
  };
  
  console.log('🖼️ Auto-assigned course image:', result);
  
  return result;
}

function TopBar({ onLogout }) {
  const lecturer = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('lecturer_user')); } catch { return null; }
  }, []);

  return (
    <div className="lec-topbar">
      <div className="brand">iVidhyarthi • Lecturer</div>
      <div className="spacer" />
      <div className="profile-mini">
        <div className="avatar">{(lecturer?.name || 'L')[0]}</div>
        <div className="meta">
          <div className="name">{lecturer?.name || 'Lecturer'}</div>
          <div className="email">{lecturer?.email}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, trend, icon }) {
  return (
    <div className="stat">
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}

function ProfileSlideOver({ open, onClose }) {
  const API_BASE_URL = 'http://localhost:5000/api';
  const [form, setForm] = useState({
    Full_Name: '',
    email: '',
    Mobile_No: '',
    DOB: '',
    Gender: '',
    Specialization: '',
    Highest_Qualification: '',
    Designation: '',
    Experience_Years: '',
    Institute_Name: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch profile data from database when modal opens
  useEffect(() => {
    if (open) {
      fetchProfileData();
    }
  }, [open]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const lecturer = JSON.parse(localStorage.getItem('lecturer_user') || '{}');
      const identifier = lecturer.email || lecturer.id;
      
      if (!identifier) {
        throw new Error('Lecturer identification not found');
      }

      const response = await fetch(`${API_BASE_URL}/lecturer-profile/${encodeURIComponent(identifier)}`);
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        
        // Format DOB for input[type="date"]
        let formattedDOB = '';
        if (data.DOB) {
          const date = new Date(data.DOB);
          if (!isNaN(date.getTime())) {
            formattedDOB = date.toISOString().split('T')[0];
          }
        }

        setForm({
          Full_Name: data.Full_Name || '',
          email: data.email || '',
          Mobile_No: data.Mobile_No || '',
          DOB: formattedDOB,
          Gender: data.Gender || '',
          Specialization: data.Specialization || '',
          Highest_Qualification: data.Highest_Qualification || '',
          Designation: data.Designation || '',
          Experience_Years: data.Experience_Years || '',
          Institute_Name: data.Institute_Name || ''
        });
        
        // Update localStorage with fresh data
        localStorage.setItem('lecturer_profile', JSON.stringify(data));
      } else {
        throw new Error(result.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile data');
      
      // Fallback to localStorage
      try {
        const lecturer = JSON.parse(localStorage.getItem('lecturer_user') || '{}');
        setForm(prev => ({
          ...prev,
          Full_Name: lecturer.name || '',
          email: lecturer.email || '',
          Specialization: lecturer.specialization || ''
        }));
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const lecturer = JSON.parse(localStorage.getItem('lecturer_user') || '{}');
      const identifier = lecturer.email || lecturer.id;
      
      if (!identifier) {
        throw new Error('Lecturer identification not found');
      }

      // Prepare update data
      const updateData = {
        Full_Name: form.Full_Name.trim(),
        email: form.email.trim(),
        Mobile_No: form.Mobile_No.trim(),
        DOB: form.DOB || null,
        Gender: form.Gender,
        Specialization: form.Specialization.trim(),
        Highest_Qualification: form.Highest_Qualification.trim(),
        Designation: form.Designation.trim(),
        Experience_Years: form.Experience_Years ? Number(form.Experience_Years) : null
      };

      const response = await fetch(`${API_BASE_URL}/lecturer-profile/${encodeURIComponent(identifier)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update localStorage with new data
      const updatedLecturer = {
        ...lecturer,
        name: form.Full_Name,
        email: form.email,
        specialization: form.Specialization
      };
      localStorage.setItem('lecturer_user', JSON.stringify(updatedLecturer));
      localStorage.setItem('lecturer_profile', JSON.stringify(result.data));

      setSuccess('✓ Profile updated successfully!');
      
      setTimeout(() => {
        if (onClose) onClose();
        // Reload page to reflect changes
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`lec-profile-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`lec-profile-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="lec-profile-header">
          <h3>👤 My Profile</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close profile">×</button>
        </div>
        
        {loading ? (
          <div className="lec-profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile data...</p>
          </div>
        ) : (
          <form className="lec-profile-form" onSubmit={save}>
            {error && (
              <div className="alert-error">
                ⚠️ {error}
              </div>
            )}
            
            {success && (
              <div className="alert-success">
                {success}
              </div>
            )}

            <div className="profile-section">
              <h4 className="section-title">Personal Information</h4>
              
              <label className="lec-form-field">
                <span>Full Name *</span>
                <input 
                  className="input" 
                  type="text" 
                  name="Full_Name" 
                  value={form.Full_Name} 
                  onChange={handleChange} 
                  placeholder="Enter your full name"
                  required
                  disabled={saving}
                />
              </label>
              
              <label className="lec-form-field">
                <span>Email *</span>
                <input 
                  className="input" 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  placeholder="your.email@example.com"
                  required
                  disabled={saving}
                />
              </label>
              
              <label className="lec-form-field">
                <span>Mobile Number</span>
                <input 
                  className="input" 
                  type="tel" 
                  name="Mobile_No" 
                  value={form.Mobile_No} 
                  onChange={handleChange} 
                  placeholder="+91 98765 43210"
                  disabled={saving}
                />
              </label>
              
              <label className="lec-form-field">
                <span>Date of Birth</span>
                <input 
                  className="input" 
                  type="date" 
                  name="DOB" 
                  value={form.DOB} 
                  onChange={handleChange}
                  disabled={saving}
                />
              </label>
              
              <div className="lec-form-field">
                <span>Gender</span>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      name="Gender" 
                      value="male" 
                      checked={form.Gender === 'male'} 
                      onChange={handleChange}
                      disabled={saving}
                    /> 
                    Male
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="Gender" 
                      value="female" 
                      checked={form.Gender === 'female'} 
                      onChange={handleChange}
                      disabled={saving}
                    /> 
                    Female
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="Gender" 
                      value="other" 
                      checked={form.Gender === 'other'} 
                      onChange={handleChange}
                      disabled={saving}
                    /> 
                    Other
                  </label>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h4 className="section-title">Professional Information</h4>
              
              <label className="lec-form-field">
                <span>Institute</span>
                <input 
                  className="input" 
                  type="text" 
                  value={form.Institute_Name} 
                  disabled
                  style={{ background: 'rgba(200, 200, 200, 0.1)', cursor: 'not-allowed' }}
                />
                <small style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>Institute cannot be changed</small>
              </label>
              
              <label className="lec-form-field">
                <span>Specialization</span>
                <input 
                  className="input" 
                  type="text" 
                  name="Specialization" 
                  value={form.Specialization} 
                  onChange={handleChange} 
                  placeholder="e.g., Computer Science, Data Science, Web Development"
                  disabled={saving}
                />
              </label>
              
              <label className="lec-form-field">
                <span>Highest Qualification</span>
                <input 
                  className="input" 
                  type="text" 
                  name="Highest_Qualification" 
                  value={form.Highest_Qualification} 
                  onChange={handleChange} 
                  placeholder="e.g., M.Tech, PhD, M.Sc"
                  disabled={saving}
                />
              </label>
              
              <label className="lec-form-field">
                <span>Designation</span>
                <input 
                  className="input" 
                  type="text" 
                  name="Designation" 
                  value={form.Designation} 
                  onChange={handleChange} 
                  placeholder="e.g., Assistant Professor, Senior Lecturer"
                  disabled={saving}
                />
              </label>
              
              <label className="lec-form-field">
                <span>Years of Experience</span>
                <input 
                  className="input" 
                  type="number" 
                  name="Experience_Years" 
                  value={form.Experience_Years} 
                  onChange={handleChange} 
                  placeholder="Enter years"
                  min="0"
                  disabled={saving}
                />
              </label>
            </div>
            
            <div className="lec-profile-actions">
              <button type="button" className="button ghost" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="button primary" disabled={saving || loading}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}

function UploadsTab() {
  const API_BASE_URL = 'http://localhost:5000/api';
  const [activeUploadTab, setActiveUploadTab] = useState('materials');
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Material upload state
  const [materialForm, setMaterialForm] = useState({
    title: '',
    contentType: 'pdf',
    file: null
  });

  // Assignment upload state
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignmentType: 'pdf',
    marks: 100,
    file: null
  });

  const lecturer = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('lecturer_user')); } catch { return null; }
  }, []);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const lecturerId = lecturer?.email || lecturer?.id;
      const response = await fetch(`${API_BASE_URL}/tbl-courses?lecturerId=${lecturerId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Fetch topics when course is selected
  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setSelectedTopic('');
    setTopics([]);
    
    if (!courseId) return;

    setLoadingTopics(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tbl-courses/${courseId}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.Topics) {
        setTopics(result.data.Topics);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setUploadError('Failed to load topics');
    } finally {
      setLoadingTopics(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (type === 'materials') {
      const contentType = materialForm.contentType;
      if (contentType === 'pdf' && !file.type.includes('pdf')) {
        setUploadError('Please select a PDF file');
        return;
      }
      if (contentType === 'video' && !file.type.includes('video')) {
        setUploadError('Please select a video file');
        return;
      }
      setMaterialForm(prev => ({ ...prev, file }));
    } else {
      setAssignmentForm(prev => ({ ...prev, file }));
    }
    setUploadError('');
  };

  // Upload material
  const uploadMaterial = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse || !selectedTopic || !materialForm.title || !materialForm.file) {
      setUploadError('Please fill all required fields and select a file');
      return;
    }

    setUploadingFile(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', materialForm.file);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'File upload failed');
      }

      // Save content metadata
      const contentData = {
        Course_Id: selectedCourse,
        Topic_Id: selectedTopic,
        Title: materialForm.title,
        Content_Type: materialForm.contentType,
        File_Url: `${API_BASE_URL}/files/${uploadResult.fileId}`
      };

      const saveResponse = await fetch(`${API_BASE_URL}/course-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      });

      const saveResult = await saveResponse.json();

      if (!saveResult.success) {
        throw new Error(saveResult.message || 'Failed to save content');
      }

      setUploadSuccess('✓ Material uploaded successfully!');
      setMaterialForm({ title: '', contentType: 'pdf', file: null });
      document.getElementById('material-file-input').value = '';

      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  // Upload assignment
  const uploadAssignment = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse || !selectedTopic || !assignmentForm.title || !assignmentForm.description || !assignmentForm.dueDate) {
      setUploadError('Please fill all required fields');
      return;
    }

    setUploadingFile(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      let fileUrl = null;

      // Upload file if provided
      if (assignmentForm.file) {
        const formData = new FormData();
        formData.append('file', assignmentForm.file);

        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'File upload failed');
        }

        fileUrl = `${API_BASE_URL}/files/${uploadResult.fileId}`;
      }

      // Save assignment
      const assignmentData = {
        Course_Id: selectedCourse,
        Topic_Id: selectedTopic,
        Title: assignmentForm.title,
        Description: assignmentForm.description,
        Due_Date: new Date(assignmentForm.dueDate).toISOString(),
        Assignment_Type: assignmentForm.assignmentType === 'pdf' ? 'Individual' : assignmentForm.assignmentType === 'task' ? 'Project' : 'Other',
        Marks: Number(assignmentForm.marks),
        Submission_Data: fileUrl ? { file_url: fileUrl } : null
      };

      const saveResponse = await fetch(`${API_BASE_URL}/assignments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });

      const saveResult = await saveResponse.json();

      if (!saveResult.success) {
        throw new Error(saveResult.message || 'Failed to save assignment');
      }

      setUploadSuccess('✓ Assignment created successfully!');
      setAssignmentForm({
        title: '',
        description: '',
        dueDate: '',
        assignmentType: 'pdf',
        marks: 100,
        file: null
      });
      if (document.getElementById('assignment-file-input')) {
        document.getElementById('assignment-file-input').value = '';
      }

      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="uploads-container">
      {/* Upload Type Tabs */}
      <div className="upload-tabs">
        <button 
          className={`upload-tab ${activeUploadTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveUploadTab('materials')}
        >
          <span className="tab-icon">📚</span>
          <span>Course Materials</span>
        </button>
        <button 
          className={`upload-tab ${activeUploadTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveUploadTab('assignments')}
        >
          <span className="tab-icon">📝</span>
          <span>Assignments</span>
        </button>
      </div>

      {/* Course & Topic Selection */}
      <div className="upload-selection-card">
        <div className="selection-grid">
          <div className="selection-field">
            <label className="selection-label">
              <span className="label-icon">📖</span>
              Select Course *
            </label>
            <select 
              className="selection-input"
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              disabled={uploadingFile}
            >
              <option value="">Choose a course...</option>
              {courses.map(course => (
                <option key={course.Course_Id} value={course.Course_Id}>
                  {course.Title}
                </option>
              ))}
            </select>
          </div>

          <div className="selection-field">
            <label className="selection-label">
              <span className="label-icon">🎯</span>
              Select Topic *
            </label>
            <select 
              className="selection-input"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedCourse || loadingTopics || uploadingFile}
            >
              <option value="">
                {loadingTopics ? 'Loading topics...' : 'Choose a topic...'}
              </option>
              {topics.map(topic => (
                <option key={topic.Topic_Id} value={topic.Topic_Id}>
                  {topic.Order_Number}. {topic.Title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedCourse && (
          <div className="selection-hint">
            <span>💡</span>
            <span>Select a course to view its topics</span>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {uploadSuccess && (
        <div className="upload-alert upload-success">
          {uploadSuccess}
        </div>
      )}
      
      {uploadError && (
        <div className="upload-alert upload-error">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Upload Forms */}
      {selectedCourse && selectedTopic && (
        <>
          {activeUploadTab === 'materials' && (
            <form className="upload-form-card" onSubmit={uploadMaterial}>
              <div className="form-header">
                <h3>📚 Upload Course Material</h3>
                <p>Add PDF, Notes, or Video content for your students</p>
              </div>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label className="form-label">Material Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Introduction to React Hooks"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                    disabled={uploadingFile}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Content Type *</label>
                  <select
                    className="form-input"
                    value={materialForm.contentType}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, contentType: e.target.value, file: null }))}
                    disabled={uploadingFile}
                  >
                    <option value="pdf">📄 PDF Document</option>
                    <option value="notes">📝 Notes/Text</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Upload File *</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      id="material-file-input"
                      className="file-input"
                      onChange={(e) => handleFileSelect(e, 'materials')}
                      accept={
                        materialForm.contentType === 'pdf' ? '.pdf' :
                        materialForm.contentType === 'video' ? 'video/*' :
                        '.txt,.doc,.docx'
                      }
                      disabled={uploadingFile}
                      required
                    />
                    <label htmlFor="material-file-input" className="file-label">
                      <span className="file-icon">📎</span>
                      <span className="file-text">
                        {materialForm.file ? materialForm.file.name : 'Choose file...'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="button primary large"
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <span className="spinner"></span>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Upload Material</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeUploadTab === 'assignments' && (
            <form className="upload-form-card" onSubmit={uploadAssignment}>
              <div className="form-header">
                <h3>📝 Create Assignment</h3>
                <p>Set up a new assignment for your students</p>
              </div>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label className="form-label">Assignment Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Week 5 - React Project"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                    disabled={uploadingFile}
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Describe the assignment objectives and requirements..."
                    rows="4"
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                    disabled={uploadingFile}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Due Date *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    disabled={uploadingFile}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Total Marks *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="100"
                    min="1"
                    value={assignmentForm.marks}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, marks: e.target.value }))}
                    disabled={uploadingFile}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Assignment Type</label>
                  <select
                    className="form-input"
                    value={assignmentForm.assignmentType}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignmentType: e.target.value }))}
                    disabled={uploadingFile}
                  >
                    <option value="pdf">📄 PDF Document</option>
                    <option value="task">✅ Task</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Attachment (Optional)</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      id="assignment-file-input"
                      className="file-input"
                      onChange={(e) => handleFileSelect(e, 'assignments')}
                      disabled={uploadingFile}
                    />
                    <label htmlFor="assignment-file-input" className="file-label">
                      <span className="file-icon">📎</span>
                      <span className="file-text">
                        {assignmentForm.file ? assignmentForm.file.name : 'Choose file...'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="button primary large"
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <span className="spinner"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Create Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function SessionsTab() {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lecturer_sessions')) || []; } catch { return []; }
  });
  const [form, setForm] = useState({ title: '', date: '', link: '' });

  const addSession = () => {
    if (!form.title || !form.date || !form.link) return;
    const next = [...sessions, { ...form, id: Date.now() }];
    setSessions(next);
    localStorage.setItem('lecturer_sessions', JSON.stringify(next));
    setForm({ title: '', date: '', link: '' });
  };

  return (
    <div className="panel">
      <h3>Problem-Solving Sessions</h3>
      <div className="grid-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Date & Time</label>
          <input className="input" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Meeting Link</label>
          <input className="input" placeholder="https://meet..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        </div>
      </div>
      <button className="button primary" onClick={addSession}>Schedule Session</button>

      <div className="items-list">
        {sessions.length === 0 && <div className="muted">No sessions scheduled.</div>}
        {sessions.map((s) => (
          <div className="item" key={s.id}>
            <div>
              <div className="item-title">{s.title}</div>
              <div className="item-sub">{new Date(s.date).toLocaleString()} • <a href={s.link} target="_blank">Join</a></div>
            </div>
            <button className="button ghost sm" onClick={() => {
              const next = sessions.filter(x => x.id !== s.id);
              setSessions(next);
              localStorage.setItem('lecturer_sessions', JSON.stringify(next));
            }}>Cancel</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Mock student enrollment data
  const [enrollments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lecturer_enrollments')) || [
        { id: 1, studentName: 'Aarav Sharma', email: 'aarav@example.com', course: 'React Development', enrollDate: '2025-08-15', progress: 85, status: 'Active' },
        { id: 2, studentName: 'Diya Patel', email: 'diya@example.com', course: 'JavaScript Fundamentals', enrollDate: '2025-08-20', progress: 92, status: 'Active' },
        { id: 3, studentName: 'Arjun Kumar', email: 'arjun@example.com', course: 'React Development', enrollDate: '2025-08-18', progress: 67, status: 'Active' },
        { id: 4, studentName: 'Priya Singh', email: 'priya@example.com', course: 'Data Structures & Algorithms', enrollDate: '2025-08-10', progress: 78, status: 'Active' },
        { id: 5, studentName: 'Rohit Gupta', email: 'rohit@example.com', course: 'JavaScript Fundamentals', enrollDate: '2025-08-25', progress: 45, status: 'Active' },
        { id: 6, studentName: 'Sneha Reddy', email: 'sneha@example.com', course: 'Python Programming', enrollDate: '2025-08-12', progress: 89, status: 'Active' },
        { id: 7, studentName: 'Vikram Joshi', email: 'vikram@example.com', course: 'Data Structures & Algorithms', enrollDate: '2025-08-22', progress: 56, status: 'Active' },
        { id: 8, studentName: 'Ananya Das', email: 'ananya@example.com', course: 'React Development', enrollDate: '2025-08-28', progress: 34, status: 'Active' },
        { id: 9, studentName: 'Karan Mehta', email: 'karan@example.com', course: 'Python Programming', enrollDate: '2025-08-14', progress: 91, status: 'Active' },
        { id: 10, studentName: 'Riya Agarwal', email: 'riya@example.com', course: 'JavaScript Fundamentals', enrollDate: '2025-08-30', progress: 23, status: 'Active' }
      ];
    } catch {
      return [];
    }
  });

  // Get unique courses for filter dropdown
  const courses = [...new Set(enrollments.map(e => e.course))];

  // Filter enrollments based on search and course selection
  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || enrollment.course === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  // Group enrollments by course for summary
  const enrollmentsByCourse = enrollments.reduce((acc, enrollment) => {
    acc[enrollment.course] = (acc[enrollment.course] || 0) + 1;
    return acc;
  }, {});

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#4caf50';
    if (progress >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="panel">
      <h3>Student Enrollments</h3>

      {/* Summary Stats */}
      <div className="stats" style={{ marginBottom: '20px' }}>
        <Stat 
          label="Total Students" 
          value={enrollments.length} 
          trend="Across all courses" 
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
        />
        <Stat 
          label="Active Courses" 
          value={courses.length} 
          trend="Currently teaching" 
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
        />
        <Stat 
          label="Avg Progress" 
          value={`${Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)}%`} 
          trend="Overall completion" 
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
        />
      </div>

      {/* Course Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {Object.entries(enrollmentsByCourse).map(([course, count]) => (
          <div key={course} className="chart-card" style={{ padding: '16px' }}>
            <div className="chart-title" style={{ fontSize: '14px', marginBottom: '8px' }}>{course}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e8bff' }}>{count} students</div>
          </div>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input
            className="input"
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <select
            className="input"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="table">
        <div className="t-head">
          <div>Student</div>
          <div>Course</div>
          <div>Enrolled</div>
          <div>Progress</div>
          <div>Status</div>
        </div>
        {filteredEnrollments.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No students found matching your criteria.
          </div>
        )}
        {filteredEnrollments.map((enrollment) => (
          <div className="t-row" key={enrollment.id}>
            <div>
              <div style={{ fontWeight: '500' }}>{enrollment.studentName}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{enrollment.email}</div>
            </div>
            <div>{enrollment.course}</div>
            <div>{new Date(enrollment.enrollDate).toLocaleDateString()}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '60px',
                  height: '6px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${enrollment.progress}%`,
                    height: '100%',
                    backgroundColor: getProgressColor(enrollment.progress),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: getProgressColor(enrollment.progress) }}>
                  {enrollment.progress}%
                </span>
              </div>
            </div>
            <div>
              <span className={`badge ${enrollment.status === 'Active' ? 'success' : 'warning'}`}>
                {enrollment.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackTab() {
  const [feedback, setFeedback] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lecturer_feedback')) || [
        { id: 1, student: 'Aarav', rating: 5, comment: 'Great explanations!' },
        { id: 2, student: 'Diya', rating: 4, comment: 'Helpful sessions and materials.' }
      ];
    } catch { return []; }
  });

  return (
    <div className="panel">
      <h3>Student Feedback & Ratings</h3>
      <div className="items-list">
        {feedback.length === 0 && <div className="muted">No feedback yet.</div>}
        {feedback.map((f) => (
          <div className="item" key={f.id}>
            <div>
              <div className="item-title">{f.student} • {Array.from({ length: f.rating }).map((_, i) => '⭐').join('')}</div>
              <div className="item-sub">{f.comment}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoursesTab() {
  const API_BASE_URL = 'http://localhost:5000/api';

  // Load categories from MongoDB API
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);

  // Category label helper with examples shown in the dropdown
  const CATEGORY_EXAMPLES = {
    'Programming': 'C, C++, Java, Python, Swift',
    'Web Development': 'HTML, CSS, JS, React, PHP',
    'Mobile App Development': 'Android, iOS, Flutter',
    'Data Science': 'Machine Learning, AI, NLP',
    'Cloud Computing': 'AWS, Azure, Google Cloud',
    'Networking': 'CCNA, Network Security',
    'Cyber Security': 'Ethical Hacking, Forensics',
    'Designing': 'Photoshop, Figma, UI/UX',
    'Business / Management': 'MBA Courses, Leadership',
    'Language Learning': 'English, Spanish, French'
  };

  // Fetch categories from API on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const defaults = [
        { categoryId: 1, categoryName: 'Programming' },
        { categoryId: 2, categoryName: 'Web Development' },
        { categoryId: 3, categoryName: 'Mobile App Development' },
        { categoryId: 4, categoryName: 'Data Science' },
        { categoryId: 5, categoryName: 'Cloud Computing' },
        { categoryId: 6, categoryName: 'Networking' },
        { categoryId: 7, categoryName: 'Cyber Security' },
        { categoryId: 8, categoryName: 'Designing' },
        { categoryId: 9, categoryName: 'Business / Management' },
        { categoryId: 10, categoryName: 'Language Learning' }
      ];
      try {
        const response = await fetch(`${API_BASE_URL}/course-categories`);
        const result = await response.json();

        if (result.success && result.data?.length > 0) {
          // Map to match frontend format
          const mapped = result.data.map(cat => ({
            categoryId: cat.Category_Id,
            categoryName: cat.Category_Name
          }));
          setCategories(mapped);
        } else {
          // Seed categories if empty
          const seedResponse = await fetch(`${API_BASE_URL}/course-categories/seed`, {
            method: 'POST'
          });
          const seedResult = await seedResponse.json();
          if (seedResult.success && seedResult.data?.length > 0) {
            const mapped = seedResult.data.map(cat => ({
              categoryId: cat.Category_Id,
              categoryName: cat.Category_Name
            }));
            setCategories(mapped);
          } else {
            // Final fallback to defaults to ensure dropdown is populated
            setCategories(defaults);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to localStorage if API fails
        try {
          const local = JSON.parse(localStorage.getItem('tbl_coursecategories') || '[]');
          if (local.length > 0) {
            setCategories(local);
          } else {
            setCategories(defaults);
          }
        } catch { }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    price: '',
    duration: '',
    description: ''
  });
  // Course topics state: nested structure with subtopics
  // topics: [{ id, Title, Description, Order_Number, Estimated_Hours, subtopics: [...] }]
  const [topics, setTopics] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);

  const lecturer = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('lecturer_user')); } catch { return null; }
  }, []);

  // Fetch courses created by this lecturer on mount
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const lecturerId = lecturer?.email || lecturer?.id || 'lecturer@example.com';
        const response = await fetch(`${API_BASE_URL}/tbl-courses?lecturerId=${lecturerId}`);
        const result = await response.json();

        if (result.success && result.data) {
          // Map backend courses to frontend format
          const mapped = result.data.map(course => ({
            id: course.Course_Id,
            name: course.Title,
            instructor: lecturer?.name || 'Lecturer',
            price: course.Price,
            rating: 4.5,
            image: course.image_url || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80', // Use auto-assigned image or default
            description: course.Description || '',
            createdBy: 'lecturer',
            categoryId: course.Category_Id,
            duration: course.Duration || '',
            courseData: course // Keep original data for updates
          }));
          setCourses(mapped);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (lecturer) {
      fetchCourses();
    }
  }, [lecturer]);

  // Topic/Subtopic handlers with auto-numbering
  const addMainTopic = () => {
    const orderNum = topics.length + 1;
    const newTopic = {
      id: Date.now(),
      Title: '',
      Description: '',
      Order_Number: orderNum,
      Estimated_Hours: '',
      subtopics: []
    };
    setTopics([...topics, newTopic]);
    setValidationErrors([]);
  };

  const addSubTopic = (topicId) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        const subOrderNum = topic.subtopics.length + 1;
        const newSubTopic = {
          id: Date.now(),
          Title: '',
          Description: '',
          Order_Number: `${topic.Order_Number}.${subOrderNum}`,
          Parent_Topic_Id: topicId
        };
        return { ...topic, subtopics: [...topic.subtopics, newSubTopic] };
      }
      return topic;
    }));
    setValidationErrors([]);
  };

  const updateMainTopicField = (id, field, value) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const updateSubTopicField = (topicId, subTopicId, field, value) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          subtopics: topic.subtopics.map(sub =>
            sub.id === subTopicId ? { ...sub, [field]: value } : sub
          )
        };
      }
      return topic;
    }));
  };

  const removeMainTopic = (id) => {
    const filtered = topics.filter(t => t.id !== id);
    // Re-number remaining topics
    const renumbered = filtered.map((topic, idx) => ({
      ...topic,
      Order_Number: idx + 1,
      subtopics: topic.subtopics.map((sub, subIdx) => ({
        ...sub,
        Order_Number: `${idx + 1}.${subIdx + 1}`
      }))
    }));
    setTopics(renumbered);
    setValidationErrors([]);
  };

  const removeSubTopic = (topicId, subTopicId) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        const filteredSubs = topic.subtopics.filter(sub => sub.id !== subTopicId);
        // Re-number remaining subtopics
        const renumberedSubs = filteredSubs.map((sub, idx) => ({
          ...sub,
          Order_Number: `${topic.Order_Number}.${idx + 1}`
        }));
        return { ...topic, subtopics: renumberedSubs };
      }
      return topic;
    }));
    setValidationErrors([]);
  };

  // Validation function
  const validateTopics = () => {
    const errors = [];
    
    if (topics.length < 3) {
      errors.push('You must add at least 3 Main Topics to create a course.');
    }
    
    topics.forEach((topic, idx) => {
      if (topic.subtopics.length === 0) {
        errors.push(`Main Topic ${idx + 1} must have at least 1 Sub Topic.`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const addCourse = async () => {
    // Validate form
    if (!form.categoryId || !form.name || !form.price) {
      window.alert('Please select a category, enter course name and price.');
      return;
    }

    if (!form.duration) {
      window.alert('Please specify course duration');
      return;
    }

    // Validate topics/subtopics
    if (!validateTopics()) {
      window.alert('Please fix the following issues:\n\n' + validationErrors.join('\n'));
      return;
    }

    // Validate lecturer is logged in
    if (!lecturer || (!lecturer.email && !lecturer.id)) {
      window.alert('Lecturer information not found. Please log in again.');
      return;
    }

    setSavingCourse(true);

    try {
      // Get lecturer ID
      const lecturerId = lecturer.email || lecturer.id || `lecturer_${Date.now()}`;

      // Get category name for image assignment
      const selectedCategory = categories.find(cat => cat.categoryId === Number(form.categoryId));
      const categoryName = selectedCategory?.categoryName || '';

      // 🖼️ AUTOMATIC IMAGE ASSIGNMENT
      const imageAssignment = assignCourseImage(
        Number(form.categoryId),
        categoryName,
        null // Course ID will be assigned by backend
      );

      // Prepare course data according to backend requirements
      const courseData = {
        // Required fields - ensure they are not empty
        Title: form.name.trim(),
        Category_Id: Number(form.categoryId),
        Price: Number(form.price),
        Lecturer_Id: lecturerId,

        // Optional fields
        Duration: form.duration.trim(),
        Description: (form.description || '').trim(),
        
        // Auto-assigned image URL
        image_url: imageAssignment.Image_URL
      };

      // Attach topics with subtopics if any
      if (topics && topics.length > 0) {
        courseData.Topics = topics.map(t => ({
          Title: (t.Title || '').trim(),
          Description: (t.Description || '').trim(),
          Order_Number: Number(t.Order_Number),
          Estimated_Hours: t.Estimated_Hours ? Number(t.Estimated_Hours) : null,
          SubTopics: t.subtopics.map(sub => ({
            Title: (sub.Title || '').trim(),
            Description: (sub.Description || '').trim(),
            Order_Number: sub.Order_Number
          }))
        }));
      }

      // Validate data before sending
      console.log('Lecturer object:', lecturer);
      console.log('Sending course data:', courseData);
      console.log('All required fields present:', {
        Title: !!courseData.Title,
        Category_Id: !!courseData.Category_Id && !isNaN(courseData.Category_Id),
        Price: !!courseData.Price && !isNaN(courseData.Price),
        Lecturer_Id: !!courseData.Lecturer_Id
      });

      // Save to database
      const response = await fetch(`${API_BASE_URL}/tbl-courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(courseData)
      });

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `Failed to create course (HTTP ${response.status})`;

        try {
          const errorData = await response.json();
          console.error('Error response from server:', errorData);

          // Use the message from the server
          if (errorData.message) {
            errorMessage = errorData.message;
          }

          // Handle validation errors array
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            const errorList = errorData.errors.join('\n• ');
            errorMessage += `\n\n• ${errorList}`;
          }

          throw new Error(errorMessage);
        } catch (e) {
          if (e instanceof SyntaxError) {
            // JSON parsing failed, use default error
            throw new Error(errorMessage);
          } else {
            // Re-throw the error we created
            throw e;
          }
        }
      }

      const result = await response.json();

      if (!result || result.success === false) {
        throw new Error(result?.message || 'Failed to add course');
      }

      // Update local state with the new course
      const responseData = result.data || result;
      const newCourse = {
        id: responseData.Course_Id || responseData.id || Date.now(),
        name: responseData.Title || form.name,
        instructor: lecturer?.name || 'Lecturer',
        price: Number(responseData.Price || form.price),
        rating: 4.5,
        image: responseData.image_url || imageAssignment.Image_URL, // Use auto-assigned image
        description: responseData.Description || form.description,
        createdBy: 'lecturer',
        categoryId: Number(responseData.Category_Id || form.categoryId),
        duration: responseData.Duration || form.duration,
        courseData: responseData
      };

      // Update local state
      setCourses(prev => [...prev, newCourse]);

      // Reset form
      setForm({
        categoryId: '',
        name: '',
        price: '',
        duration: '',
        description: ''
      });
      // Reset topics
      setTopics([]);

      // Show success message
      window.alert('✓ Course created successfully!');
    } catch (error) {
      console.error('Error adding course:', error);

      let errorMessage = 'Failed to add course. ';

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Cannot connect to backend server. Please make sure the backend is running on http://localhost:5000';
      } else {
        errorMessage += error.message || 'An unknown error occurred.';
      }

      window.alert(errorMessage);
    } finally {
      setSavingCourse(false);
    }
  };

  const updateCourse = async () => {
    if (!editingCourse || !form.categoryId || !form.name || !form.price || !form.duration) {
      window.alert('Please fill all required fields.');
      return;
    }

    // Validate topics/subtopics
    if (!validateTopics()) {
      window.alert('Please fix the following issues:\n\n' + validationErrors.join('\n'));
      return;
    }

    setSavingCourse(true);

    try {
      const courseId = editingCourse.id;
      
      // Get category name for image assignment
      const selectedCategory = categories.find(cat => cat.categoryId === Number(form.categoryId));
      const categoryName = selectedCategory?.categoryName || '';
      
      // 🖼️ AUTO-ASSIGN NEW IMAGE IF CATEGORY CHANGED
      const categoryChanged = editingCourse.categoryId !== Number(form.categoryId);
      let imageUrl = editingCourse.image; // Keep existing image by default
      
      if (categoryChanged) {
        const imageAssignment = assignCourseImage(
          Number(form.categoryId),
          categoryName,
          courseId
        );
        imageUrl = imageAssignment.Image_URL;
        console.log('🔄 Category changed - assigning new image:', imageAssignment);
      }
      
      const updatedData = {
        Title: form.name.trim(),
        Category_Id: Number(form.categoryId),
        Price: Number(form.price),
        Duration: form.duration.trim(),
        Description: (form.description || '').trim(),
        image_url: imageUrl // Include updated image
      };

      if (topics && topics.length > 0) {
        updatedData.Topics = topics.map(t => ({
          Title: (t.Title || '').trim(),
          Description: (t.Description || '').trim(),
          Order_Number: Number(t.Order_Number),
          Estimated_Hours: t.Estimated_Hours ? Number(t.Estimated_Hours) : null,
          SubTopics: t.subtopics.map(sub => ({
            Title: (sub.Title || '').trim(),
            Description: (sub.Description || '').trim(),
            Order_Number: sub.Order_Number
          }))
        }));
      }

      const response = await fetch(`${API_BASE_URL}/tbl-courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update course');
      }

      const result = await response.json();

      if (!result || result.success === false) {
        throw new Error(result?.message || 'Failed to update course');
      }

      // Update local state
      const responseData = result.data || result;
      const updatedCourse = {
        id: courseId,
        name: responseData.Title || form.name,
        instructor: lecturer?.name || 'Lecturer',
        price: Number(responseData.Price || form.price),
        rating: editingCourse.rating || 4.5,
        image: responseData.image_url || imageUrl, // Use backend image or auto-assigned image
        description: responseData.Description || form.description,
        createdBy: 'lecturer',
        categoryId: Number(responseData.Category_Id || form.categoryId),
        duration: responseData.Duration || form.duration,
        courseData: responseData
      };

      setCourses(prev => prev.map(course =>
        course.id === courseId ? updatedCourse : course
      ));

      // Reset form and editing state
      setEditingCourse(null);
      setForm({
        categoryId: '',
        name: '',
        price: '',
        duration: '',
        description: ''
      });
      // Reset topics
      setTopics([]);

      window.alert('✓ Course updated successfully!');
    } catch (error) {
      console.error('Error updating course:', error);
      window.alert(`Failed to update course: ${error.message}`);
    } finally {
      setSavingCourse(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tbl-courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete course');
      }

      // Update local state
      setCourses(prev => prev.filter(course => course.id !== courseId));
      window.alert('✓ Course deleted successfully!');
    } catch (error) {
      console.error('Error deleting course:', error);
      window.alert(`Failed to delete course: ${error.message}`);
    }
  };

  const startEdit = async (course) => {
    setEditingCourse(course);
    setForm({
      categoryId: course.categoryId?.toString() || '',
      name: course.name,
      price: course.price.toString(),
      duration: course.duration || '',
      description: course.description || ''
    });
    
    // Fetch full course details including topics/subtopics from API
    try {
      const response = await fetch(`${API_BASE_URL}/tbl-courses/${course.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const courseData = result.data;
        const existing = courseData.Topics || [];
        
        if (existing && Array.isArray(existing) && existing.length > 0) {
          const mapped = existing.map((t, idx) => ({
            id: t.Topic_Id || t.id || Date.now() + idx,
            Title: t.Title || t.title || t.Name || '',
            Description: t.Description || t.description || '',
            Order_Number: t.Order_Number != null ? Number(t.Order_Number) : idx + 1,
            Estimated_Hours: t.Estimated_Hours != null ? String(t.Estimated_Hours) : '',
            subtopics: (t.SubTopics || t.subtopics || []).map((sub, subIdx) => ({
              id: sub.SubTopic_Id || sub.id || Date.now() + idx * 1000 + subIdx,
              Title: sub.Title || sub.title || '',
              Description: sub.Description || sub.description || '',
              Order_Number: sub.Order_Number || `${t.Order_Number || idx + 1}.${subIdx + 1}`,
              Parent_Topic_Id: t.Topic_Id || t.id
            }))
          }));
          setTopics(mapped);
        } else {
          setTopics([]);
        }
      } else {
        setTopics([]);
      }
    } catch (e) {
      console.error('Error loading course topics:', e);
      setTopics([]);
    }
    
    setValidationErrors([]);
    // Scroll to top to show form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setForm({
      categoryId: '',
      name: '',
      price: '',
      duration: '',
      description: ''
    });
    setTopics([]);
    setValidationErrors([]);
  };

  const viewCourse = async (course) => {
    try {
      // Fetch full course details including topics/subtopics
      const response = await fetch(`${API_BASE_URL}/tbl-courses/${course.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setViewingCourse({ ...course, fullData: result.data });
      } else {
        setViewingCourse(course);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      setViewingCourse(course);
    }
  };

  const closeViewCourse = () => {
    setViewingCourse(null);
  };

  return (
    <div className="panel">
      <h3>Course Management</h3>

      {/* View Course Modal */}
      {viewingCourse && (
        <>
          <div className="lec-modal-overlay" onClick={closeViewCourse} />
          <div className="lec-modal lec-modal-large">
            <div className="lec-modal-header">
              <h3>📚 Course Overview</h3>
              <button className="btn-close" onClick={closeViewCourse}>×</button>
            </div>
            <div className="lec-modal-body">
              {/* Course Header - Image Left, Details Right */}
              <div className="view-course-header">
                <div className="view-course-image">
                  <img
                    src={viewingCourse.image || viewingCourse.fullData?.image_url}
                    alt={viewingCourse.name}
                  />
                </div>

                <div className="view-course-header-details">
                  <h2 className="view-course-title">{viewingCourse.name}</h2>
                  
                  <div className="view-course-meta">
                    <div className="view-meta-item">
                      <span className="view-meta-icon">🏷️</span>
                      <span>{categories.find(c => c.categoryId === viewingCourse.categoryId)?.categoryName || 'N/A'}</span>
                    </div>
                    <div className="view-meta-item">
                      <span className="view-meta-icon">👨‍🏫</span>
                      <span>{viewingCourse.instructor}</span>
                    </div>
                    <div className="view-meta-item">
                      <span className="view-meta-icon">⭐</span>
                      <span>{viewingCourse.rating} / 5.0</span>
                    </div>
                  </div>

                  {viewingCourse.description && (
                    <div className="view-course-description-text">
                      {viewingCourse.description}
                    </div>
                  )}

                  <div className="view-course-stats">
                    <span className="view-stat-badge">
                      <span>💰</span>
                      <span>₹{viewingCourse.price}</span>
                    </span>
                    <span className="view-stat-badge">
                      <span>⏱️</span>
                      <span>{viewingCourse.duration || 'N/A'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Topics & Subtopics Section */}
              {viewingCourse.fullData?.Topics && viewingCourse.fullData.Topics.length > 0 && (
                <div className="view-section">
                  <h4 className="view-section-title">📋 Course Curriculum ({viewingCourse.fullData.Topics.length} Topics)</h4>
                  <div className="view-topics-container">
                    {viewingCourse.fullData.Topics.map((topic, idx) => (
                      <div key={topic.Topic_Id || idx} className="view-topic-card">
                        <div className="view-topic-header">
                          <span className="view-topic-number">{topic.Order_Number}.</span>
                          <div className="view-topic-info">
                            <span className="view-topic-title">{topic.Title}</span>
                            {topic.Description && (
                              <div className="view-topic-description">{topic.Description}</div>
                            )}
                            {topic.Estimated_Hours && (
                              <div className="view-topic-hours">⏱ {topic.Estimated_Hours} hours</div>
                            )}
                          </div>
                        </div>

                        {/* Subtopics */}
                        {topic.SubTopics && topic.SubTopics.length > 0 && (
                          <div className="view-subtopics">
                            {topic.SubTopics.map((sub, subIdx) => (
                              <div key={sub.SubTopic_Id || subIdx} className="view-subtopic-item">
                                <span className="view-subtopic-number">{sub.Order_Number}</span>
                                <div className="view-subtopic-content">
                                  <span className="view-subtopic-title">{sub.Title}</span>
                                  {sub.Description && (
                                    <div className="view-subtopic-description">{sub.Description}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Topics Message */}
              {(!viewingCourse.fullData?.Topics || viewingCourse.fullData.Topics.length === 0) && (
                <div className="view-section">
                  <div className="view-no-content">
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                    <div>No topics added to this course yet.</div>
                  </div>
                </div>
              )}
            </div>
            <div className="lec-modal-footer">
              <button className="button primary" onClick={closeViewCourse}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Course Form */}
      <div className="lec-form-card">
        <h4>{editingCourse ? 'Edit Course' : 'Create New Course'}</h4>
        {loadingCategories && <div className="lec-loading">Loading categories...</div>}
        {!loadingCategories && (
          <>
            <div className="grid-2">
              <div>
                <label className="label">Category *</label>
                <select
                  className="input"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  disabled={savingCourse}
                >
                  <option value="">Select category</option>
                  {categories.map(c => {
                    const label = CATEGORY_EXAMPLES[c.categoryName]
                      ? `${c.categoryName} — ${CATEGORY_EXAMPLES[c.categoryName]}`
                      : c.categoryName;
                    return (
                      <option key={c.categoryId} value={c.categoryId}>{label}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="label">Course Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter course name"
                  disabled={savingCourse}
                />
              </div>
              <div>
                <label className="label">Price (₹) *</label>
                <input
                  className="input"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Enter price"
                  disabled={savingCourse}
                />
              </div>
              <div>
                <label className="label">Duration *</label>
                <input
                  className="input"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g., 8 weeks or 20 hours"
                  disabled={savingCourse}
                />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label className="label">Description</label>
              <textarea
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter course description"
                rows="3"
                disabled={savingCourse}
              />
            </div>
            
            {/* Auto Image Assignment Notice */}
            <div style={{ 
              marginTop: '16px', 
              padding: '12px 16px', 
              background: 'linear-gradient(135deg, rgba(230, 255, 245, 0.5) 0%, rgba(234, 244, 255, 0.5) 100%)', 
              border: '1px solid rgba(46, 139, 255, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '1.5rem' }}>🖼️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--sky-dark)', marginBottom: '4px' }}>
                  Smart Image Assignment
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', lineHeight: '1.5' }}>
                  Professional course image will be automatically assigned based on your selected category. No manual upload needed!
                </div>
              </div>
            </div>
            
            {/* Course Topics Section */}
            <div style={{ marginTop: '20px' }} className="topic-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <label className="label" style={{ marginBottom: '4px' }}>Course Topics & Sub Topics</label>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', fontWeight: '500' }}>
                    Required: At least 3 Main Topics, each with at least 1 Sub Topic
                  </div>
                </div>
                <button type="button" className="button primary" onClick={addMainTopic} disabled={savingCourse} style={{ padding: '10px 16px', fontSize: '0.9rem' }}>+ Add Main Topic</button>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="validation-errors" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '8px' }}>
                  {validationErrors.map((err, idx) => (
                    <div key={idx} style={{ color: '#d32f2f', fontSize: '0.9rem', fontWeight: '600', marginBottom: idx < validationErrors.length - 1 ? '6px' : '0' }}>
                      ⚠ {err}
                    </div>
                  ))}
                </div>
              )}

              {topics.length === 0 && (
                <div className="muted" style={{ padding: '20px', textAlign: 'center', background: 'rgba(46, 139, 255, 0.05)', borderRadius: '12px', border: '1px dashed rgba(46, 139, 255, 0.2)' }}>
                  No topics added yet. Click "Add Main Topic" to get started.
                </div>
              )}

              {/* Main Topics */}
              {topics.map((topic, topicIdx) => (
                <div key={topic.id} className="main-topic-block" style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid rgba(46, 139, 255, 0.15)' }}>
                  {/* Main Topic Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--sky-dark)', minWidth: '40px' }}>
                      {topic.Order_Number}.
                    </div>
                    <div style={{ flex: 1, fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                      Main Topic {topicIdx + 1}
                    </div>
                    <button type="button" className="button ghost sm" onClick={() => removeMainTopic(topic.id)} disabled={savingCourse} style={{ color: '#d32f2f' }}>Remove</button>
                  </div>

                  {/* Main Topic Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <input className="input topic-field" placeholder="Main Topic Title *" value={topic.Title} onChange={(e) => updateMainTopicField(topic.id, 'Title', e.target.value)} disabled={savingCourse} />
                    <input className="input topic-field" placeholder="Description" value={topic.Description} onChange={(e) => updateMainTopicField(topic.id, 'Description', e.target.value)} disabled={savingCourse} />
                    <input className="input topic-field" placeholder="Est. Hours" type="number" value={topic.Estimated_Hours} onChange={(e) => updateMainTopicField(topic.id, 'Estimated_Hours', e.target.value)} disabled={savingCourse} />
                  </div>

                  {/* Sub Topics Section */}
                  <div className="subtopics-section" style={{ marginTop: '12px', paddingLeft: '20px', borderLeft: '3px solid var(--sky-medium)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-medium)' }}>
                        Sub Topics ({topic.subtopics.length})
                      </div>
                      <button type="button" className="button secondary" onClick={() => addSubTopic(topic.id)} disabled={savingCourse} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>+ Add Sub Topic</button>
                    </div>

                    {topic.subtopics.length === 0 && (
                      <div className="muted" style={{ fontSize: '0.85rem', padding: '10px', background: 'rgba(255, 181, 71, 0.1)', borderRadius: '8px', border: '1px dashed rgba(255, 181, 71, 0.3)' }}>
                        ⚠ Add at least 1 Sub Topic
                      </div>
                    )}

                    {topic.subtopics.map((subTopic, subIdx) => (
                      <div key={subTopic.id} className="subtopic-row" style={{ display: 'grid', gridTemplateColumns: '80px 2fr 3fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '10px', background: 'rgba(234, 244, 255, 0.5)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-medium)' }}>
                          {subTopic.Order_Number}
                        </div>
                        <input className="input topic-field" placeholder="Sub Topic Title *" value={subTopic.Title} onChange={(e) => updateSubTopicField(topic.id, subTopic.id, 'Title', e.target.value)} disabled={savingCourse} style={{ padding: '8px 10px' }} />
                        <input className="input topic-field" placeholder="Description" value={subTopic.Description} onChange={(e) => updateSubTopicField(topic.id, subTopic.id, 'Description', e.target.value)} disabled={savingCourse} style={{ padding: '8px 10px' }} />
                        <button type="button" className="button ghost sm" onClick={() => removeSubTopic(topic.id, subTopic.id)} disabled={savingCourse} style={{ padding: '6px 10px' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              {editingCourse ? (
                <>
                  <button
                    className="button primary"
                    onClick={updateCourse}
                    disabled={savingCourse}
                  >
                    {savingCourse ? 'Updating...' : 'Update Course'}
                  </button>
                  <button
                    className="button secondary"
                    onClick={cancelEdit}
                    disabled={savingCourse}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="button primary"
                  onClick={addCourse}
                  disabled={savingCourse}
                >
                  {savingCourse ? 'Creating...' : 'Create Course'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Courses List */}
      <div className="items-list">
        <h4>Your Courses ({courses.length})</h4>
        {loadingCourses && <div className="lec-loading">Loading courses...</div>}
        {!loadingCourses && courses.length === 0 && <div className="muted">No courses created yet. Create your first course above!</div>}
        {!loadingCourses && courses.map((course) => (
          <div className="item" key={course.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <img
                src={course.image}
                alt={course.name}
                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <div className="item-title">{course.name}</div>
                <div className="item-sub">
                  ₹{course.price} • {course.duration || 'Duration not set'} • Rating: {course.rating} ⭐
                </div>
                {course.description && (
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                    {course.description.length > 100 ? `${course.description.substring(0, 100)}...` : course.description}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                  Category: {categories.find(c => c.categoryId === course.categoryId)?.categoryName || 'N/A'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button className="button ghost sm" onClick={() => viewCourse(course)}>View</button>
              <button className="button ghost sm" onClick={() => startEdit(course)}>Edit</button>
              <button className="button ghost sm" onClick={() => deleteCourse(course.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarningsTab() {
  const [payouts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lecturer_payouts')) || [
        { id: 1, date: '2025-08-01', amount: 12500, status: 'Paid' },
        { id: 2, date: '2025-09-01', amount: 9800, status: 'Processing' }
      ];
    } catch { return []; }
  });

  const total = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="panel">
      <h3>Earnings & Payouts</h3>
      <div className="stats">
        <Stat 
          label="Total Earnings" 
          value={`₹${total.toLocaleString()}`} 
          trend="This quarter" 
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <Stat 
          label="Active Courses" 
          value="3" 
          trend="2% MoM" 
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
        />
        <Stat 
          label="Avg. Rating" 
          value="4.7" 
          trend="+0.2" 
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
        />
      </div>
      <div className="charts" style={{ marginTop: '12px' }}>
        <div className="chart-card">
          <div className="chart-title">Monthly Earnings (₹)</div>
          <svg className="chart" viewBox="0 0 300 180">
            <polyline fill="none" stroke="#4da3ff" strokeWidth="3" points="10,150 50,140 90,120 130,100 170,110 210,80 250,70 290,60" />
            <line x1="10" y1="150" x2="290" y2="150" stroke="#e6f0fb" />
            <line x1="10" y1="120" x2="290" y2="120" stroke="#e6f0fb" />
            <line x1="10" y1="90" x2="290" y2="90" stroke="#e6f0fb" />
          </svg>
        </div>
        <div className="chart-card">
          <div className="chart-title">Enrollments This Month</div>
          <svg className="chart" viewBox="0 0 300 180">
            <rect x="30" y="80" width="24" height="70" fill="#89c3ff" />
            <rect x="70" y="60" width="24" height="90" fill="#4da3ff" />
            <rect x="110" y="100" width="24" height="50" fill="#b7dcff" />
            <rect x="150" y="40" width="24" height="110" fill="#2e8bff" />
            <rect x="190" y="90" width="24" height="60" fill="#89c3ff" />
            <rect x="230" y="70" width="24" height="80" fill="#4da3ff" />
            <line x1="20" y1="150" x2="280" y2="150" stroke="#e6f0fb" />
          </svg>
        </div>
      </div>
      <div className="table">
        <div className="t-head">
          <div>Date</div>
          <div>Amount</div>
          <div>Status</div>
        </div>
        {payouts.map((p) => (
          <div className="t-row" key={p.id}>
            <div>{new Date(p.date).toLocaleDateString()}</div>
            <div>₹{p.amount.toLocaleString()}</div>
            <div><span className={`badge ${p.status === 'Paid' ? 'success' : 'warning'}`}>{p.status}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LecturerDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('lecturer_user');
    if (!raw) {
      window.alert('Please login as lecturer');
    }
  }, []);

  // Handle logout with confirmation
  const handleLogoutClick = (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to logout?')) {
      if (onLogout && typeof onLogout === 'function') {
        onLogout();
      }
    }
  };

  return (
    <div className="lec-layout">
      <TopBar onLogout={handleLogoutClick} />
      <div className="content">
        <div className="sidebar">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Overview
          </button>
          <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setProfileOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>
          <button className={`tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Courses
          </button>
          <button className={`tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Students
          </button>
          <button className={`tab ${activeTab === 'uploads' ? 'active' : ''}`} onClick={() => setActiveTab('uploads')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Uploads
          </button>
          <button className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Sessions
          </button>
          <button className={`tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Feedback
          </button>
          <button className={`tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Earnings
          </button>
          <button className="tab logout-btn" onClick={handleLogoutClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>

        <div className="main">
          {activeTab === 'overview' && (
            <div className="panel">
              <h3>Welcome back!</h3>
              <div className="stats">
                <Stat 
                  label="Students" 
                  value="1,284" 
                  trend="+4.1%" 
                  icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                />
                <Stat 
                  label="Sessions This Month" 
                  value="6" 
                  trend="Next in 2 days" 
                  icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                />
                <Stat 
                  label="Materials" 
                  value={(JSON.parse(localStorage.getItem('lecturer_materials') || '[]')).length} 
                  trend="Stored" 
                  icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>}
                />
              </div>
              <div className="charts" style={{ marginTop: '12px' }}>
                <div className="chart-card">
                  <div className="chart-title">Earnings Trend (₹)</div>
                  <svg className="chart" viewBox="0 0 300 180">
                    <polyline fill="none" stroke="#2e8bff" strokeWidth="3" points="10,150 40,140 70,135 100,120 130,110 160,90 190,80 220,75 250,68 280,60" />
                    <line x1="10" y1="150" x2="280" y2="150" stroke="#e6f0fb" />
                    <line x1="10" y1="120" x2="280" y2="120" stroke="#e6f0fb" />
                    <line x1="10" y1="90" x2="280" y2="90" stroke="#e6f0fb" />
                  </svg>
                </div>
                <div className="chart-card">
                  <div className="chart-title">Enrollments by Course (This Month)</div>
                  <svg className="chart" viewBox="0 0 300 180">
                    <rect x="30" y="80" width="24" height="70" fill="#b7dcff" />
                    <rect x="70" y="60" width="24" height="90" fill="#4da3ff" />
                    <rect x="110" y="100" width="24" height="50" fill="#89c3ff" />
                    <rect x="150" y="40" width="24" height="110" fill="#2e8bff" />
                    <rect x="190" y="90" width="24" height="60" fill="#89c3ff" />
                    <rect x="230" y="70" width="24" height="80" fill="#4da3ff" />
                    <line x1="20" y1="150" x2="280" y2="150" stroke="#e6f0fb" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && <CoursesTab />}
          {activeTab === 'students' && <StudentsTab />}
          {activeTab === 'uploads' && <UploadsTab />}
          {activeTab === 'sessions' && <SessionsTab />}
          {activeTab === 'feedback' && <FeedbackTab />}
          {activeTab === 'earnings' && <EarningsTab />}
        </div>
      </div>
      <ProfileSlideOver open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default LecturerDashboard;