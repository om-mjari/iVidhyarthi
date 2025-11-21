import React, { useEffect, useMemo, useState } from 'react';
import './LecturerDashboardPremium.css';

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
  const [form, setForm] = useState(() => {
    try {
      // First try to get existing profile data
      const profile = JSON.parse(localStorage.getItem('lecturer_profile') || '{}');

      // If no profile exists, try to initialize from lecturer_user data
      if (!profile.name) {
        const lecturer = JSON.parse(localStorage.getItem('lecturer_user') || '{}');
        return {
          name: lecturer.name || '',
          email: lecturer.email || '',
          birthdate: '',
          gender: '',
          subjects: lecturer.specialization || '',
          qualifications: ''
        };
      }

      return {
        name: '',
        email: '',
        birthdate: '',
        gender: '',
        subjects: '',
        qualifications: '',
        ...profile // Spread existing profile data to ensure all fields are included
      };
    } catch (error) {
      console.error('Error initializing profile:', error);
      return {
        name: '',
        email: '',
        birthdate: '',
        gender: '',
        subjects: '',
        qualifications: ''
      };
    }
  });

  // Update form when it opens to get the latest data
  useEffect(() => {
    if (open) {
      try {
        const lecturer = JSON.parse(localStorage.getItem('lecturer_user') || '{}');
        const profile = JSON.parse(localStorage.getItem('lecturer_profile') || '{}');

        // Format birthdate for input[type="date"]
        let formattedBirthdate = '';
        if (profile.birthdate) {
          const date = new Date(profile.birthdate);
          if (!isNaN(date.getTime())) {
            formattedBirthdate = date.toISOString().split('T')[0];
          }
        }

        setForm({
          // Start with current form values as fallback
          ...form,
          // Update with lecturer data
          name: lecturer.name || form.name,
          email: lecturer.email || form.email,
          subjects: lecturer.specialization || form.subjects || '',
          // Update with profile data, preserving existing values if not in profile
          birthdate: formattedBirthdate,
          gender: profile.gender || '',
          qualifications: profile.qualifications || '',
          // Keep other existing form fields
          ...profile
        });
      } catch (error) {
        console.error('Error updating profile data:', error);
      }
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // For radio buttons, use the value, for checkboxes use checked, otherwise use value
    const newValue = type === 'radio' ? value :
      type === 'checkbox' ? checked :
        value;
    setForm(prev => ({ ...prev, [name]: newValue }));
  };

  const save = (e) => {
    e?.preventDefault(); // Prevent form submission if called from form
    try {
      // Get current lecturer data
      const lecturer = JSON.parse(localStorage.getItem('lecturer_user') || '{}');

      // Update lecturer data with new values
      const updatedLecturer = {
        ...lecturer,
        name: form.name || lecturer.name,
        email: form.email || lecturer.email,
        specialization: form.subjects || lecturer.specialization
      };

      // Save updated lecturer data
      localStorage.setItem('lecturer_user', JSON.stringify(updatedLecturer));

      // Prepare profile data to save
      const profileToSave = {
        name: form.name,
        email: form.email,
        birthdate: form.birthdate,  // This will be in YYYY-MM-DD format from the date input
        gender: form.gender,
        subjects: form.subjects,
        qualifications: form.qualifications,
        lastUpdated: new Date().toISOString()
      };

      // Save profile data
      localStorage.setItem('lecturer_profile', JSON.stringify(profileToSave));

      // Update the UI by forcing a re-render
      setForm(prev => ({ ...prev, ...profileToSave }));

      // Close the modal if onClose is provided
      if (onClose) onClose();

      // Show success message (you can add a toast or alert here if needed)
      console.log('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <>
      <div className={`lec-profile-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`lec-profile-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="lec-profile-header">
          <h3>Profile</h3>
          <button className="btn-secondary" onClick={onClose} aria-label="Close profile">×</button>
        </div>
        <form className="lec-profile-form" onSubmit={(e) => e.preventDefault()}>
          <label className="lec-form-field">
            <span>Name</span>
            <input className="input" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
          </label>
          <label className="lec-form-field">
            <span>Birthdate</span>
            <input className="input" type="date" name="birthdate" value={form.birthdate} onChange={handleChange} />
          </label>
          <label className="lec-form-field">
            <span>Subjects</span>
            <textarea className="input" name="subjects" value={form.subjects} onChange={handleChange} rows="3" placeholder="e.g., DSA, React, Python" />
          </label>
          <label className="lec-form-field">
            <span>Qualifications</span>
            <textarea className="input" name="qualifications" value={form.qualifications} onChange={handleChange} rows="3" placeholder="e.g., M.Tech, PhD" />
          </label>
          <div className="lec-form-field">
            <span>Gender</span>
            <div className="radio-group">
              <label><input type="radio" name="gender" value="Male" checked={form.gender === 'Male'} onChange={handleChange} /> Male</label>
              <label><input type="radio" name="gender" value="Female" checked={form.gender === 'Female'} onChange={handleChange} /> Female</label>
              <label><input type="radio" name="gender" value="Other" checked={form.gender === 'Other'} onChange={handleChange} /> Other</label>
            </div>
          </div>
          <div className="lec-profile-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn-primary" onClick={save}>Update</button>
          </div>
        </form>
      </aside>
    </>
  );
}

function UploadsTab() {
  const [materials, setMaterials] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lecturer_materials')) || []; } catch { return []; }
  });
  const [fileMeta, setFileMeta] = useState({ title: '', type: 'PDF', url: '' });

  const addMaterial = () => {
    if (!fileMeta.title || !fileMeta.url) return;
    const next = [...materials, { ...fileMeta, id: Date.now() }];
    setMaterials(next);
    localStorage.setItem('lecturer_materials', JSON.stringify(next));
    setFileMeta({ title: '', type: 'PDF', url: '' });
  };

  return (
    <div className="panel">
      <h3>Course Materials</h3>
      <div className="grid-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={fileMeta.title} onChange={(e) => setFileMeta({ ...fileMeta, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={fileMeta.type} onChange={(e) => setFileMeta({ ...fileMeta, type: e.target.value })}>
            <option>PDF</option>
            <option>Video</option>
            <option>Notes</option>
          </select>
        </div>
        <div>
          <label className="label">Link / URL</label>
          <input className="input" placeholder="https://..." value={fileMeta.url} onChange={(e) => setFileMeta({ ...fileMeta, url: e.target.value })} />
        </div>
      </div>
      <button className="button primary" onClick={addMaterial}>Add Material</button>

      <div className="items-list">
        {materials.length === 0 && <div className="muted">No materials uploaded yet.</div>}
        {materials.map((m) => (
          <div className="item" key={m.id}>
            <div>
              <div className="item-title">{m.title}</div>
              <div className="item-sub">{m.type} • <a href={m.url} target="_blank">Open</a></div>
            </div>
            <button className="button ghost sm" onClick={() => {
              const next = materials.filter(x => x.id !== m.id);
              setMaterials(next);
              localStorage.setItem('lecturer_materials', JSON.stringify(next));
            }}>Remove</button>
          </div>
        ))}
      </div>
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
            image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
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

    // Validate lecturer is logged in
    if (!lecturer || (!lecturer.email && !lecturer.id)) {
      window.alert('Lecturer information not found. Please log in again.');
      return;
    }

    setSavingCourse(true);

    try {
      // Get lecturer ID
      const lecturerId = lecturer.email || lecturer.id || `lecturer_${Date.now()}`;

      // Prepare course data according to backend requirements
      const courseData = {
        // Required fields - ensure they are not empty
        Title: form.name.trim(),
        Category_Id: Number(form.categoryId),
        Price: Number(form.price),
        Lecturer_Id: lecturerId,

        // Optional fields
        Duration: form.duration.trim(),
        Description: (form.description || '').trim()
      };

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
        image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
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

    setSavingCourse(true);

    try {
      const courseId = editingCourse.id;
      const updatedData = {
        Title: form.name.trim(),
        Category_Id: Number(form.categoryId),
        Price: Number(form.price),
        Duration: form.duration.trim(),
        Description: (form.description || '').trim()
      };

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
        image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
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

  const startEdit = (course) => {
    setEditingCourse(course);
    setForm({
      categoryId: course.categoryId?.toString() || '',
      name: course.name,
      price: course.price.toString(),
      duration: course.duration || '',
      description: course.description || ''
    });
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
  };

  const viewCourse = (course) => {
    setViewingCourse(course);
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
          <div className="lec-modal">
            <div className="lec-modal-header">
              <h3>Course Details</h3>
              <button className="btn-secondary" onClick={closeViewCourse}>×</button>
            </div>
            <div className="lec-modal-body">
              <div style={{ marginBottom: '20px' }}>
                <img
                  src={viewingCourse.image}
                  alt={viewingCourse.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }}
                />
              </div>
              <div className="lec-view-field">
                <span className="lec-view-label">Course Name:</span>
                <span className="lec-view-value">{viewingCourse.name}</span>
              </div>
              <div className="lec-view-field">
                <span className="lec-view-label">Category:</span>
                <span className="lec-view-value">
                  {categories.find(c => c.categoryId === viewingCourse.categoryId)?.categoryName || 'N/A'}
                </span>
              </div>
              <div className="lec-view-field">
                <span className="lec-view-label">Price:</span>
                <span className="lec-view-value">₹{viewingCourse.price}</span>
              </div>
              <div className="lec-view-field">
                <span className="lec-view-label">Duration:</span>
                <span className="lec-view-value">{viewingCourse.duration || 'N/A'}</span>
              </div>
              <div className="lec-view-field">
                <span className="lec-view-label">Instructor:</span>
                <span className="lec-view-value">{viewingCourse.instructor}</span>
              </div>
              <div className="lec-view-field">
                <span className="lec-view-label">Rating:</span>
                <span className="lec-view-value">{viewingCourse.rating} ⭐</span>
              </div>
              <div className="lec-view-field">
                <span className="lec-view-label">Description:</span>
                <span className="lec-view-value">{viewingCourse.description || 'No description available'}</span>
              </div>
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