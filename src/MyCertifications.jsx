import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardHeader from './components/DashboardHeader';
import './MyCertifications.css';

const MyCertifications = ({ user, onNavigate, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user?.id && !user?._id) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/certifications/${user.id || user._id}`);
        if (response.data.success) {
          setCertificates(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching certificates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  return (
    <div className="my-certifications-page">
      <DashboardHeader user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="certifications-container">
        <h2>My Certifications</h2>
        {loading ? (
          <p>Loading certificates...</p>
        ) : certificates.length === 0 ? (
          <div className="no-certificates">
            <p>No certifications found.</p>
            <p>Complete courses to earn certificates!</p>
          </div>
        ) : (
          <div className="certificates-grid">
            {certificates.map(cert => (
              <div key={cert._id} className="certificate-card">
                <div className="cert-icon">🏆</div>
                <h3>{cert.Course_Id}</h3>
                <p>Issued: {new Date(cert.Issue_Date).toLocaleDateString()}</p>
                <p>Grade: {cert.Grade}</p>
                <button className="download-btn">Download</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCertifications;