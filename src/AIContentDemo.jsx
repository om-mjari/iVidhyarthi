/**
 * Demo/Test Component for AI Weekly Assignments
 * Use this to test AI content generation without full app setup
 */

import React, { useState } from 'react';
import { 
  generateTopicVideos, 
  generateAssignmentQuestions, 
  generateStudyMaterials 
} from './services/aiContentService';

const AIContentDemo = () => {
  const [topic, setTopic] = useState('Introduction to Computer Networks');
  const [videos, setVideos] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [materials, setMaterials] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateContent = async () => {
    setLoading(true);
    try {
      const [vids, qs, mats] = await Promise.all([
        generateTopicVideos(topic, 'Computer Networks Course'),
        generateAssignmentQuestions(topic, 'medium', 5),
        generateStudyMaterials(topic, 1)
      ]);
      
      setVideos(vids);
      setQuestions(qs);
      setMaterials(mats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#667eea', marginBottom: '2rem' }}>🤖 AI Content Generator Demo</h1>
      
      {/* Input Section */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Enter Topic:
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Introduction to React"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}
        />
        <button
          onClick={handleGenerateContent}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Generating...' : '🚀 Generate AI Content'}
        </button>
      </div>

      {/* Results Section */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f4f6',
            borderTop: '5px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6c757d' }}>Generating AI content...</p>
        </div>
      )}

      {!loading && materials && (
        <>
          {/* Study Materials */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#e3f2fd', borderRadius: '12px', borderLeft: '4px solid #2196f3' }}>
            <h2 style={{ color: '#1976d2', marginBottom: '1rem' }}>📖 Study Materials</h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{materials.summary}</p>
            
            <h3 style={{ color: '#1565c0', fontSize: '1.1rem', marginBottom: '0.5rem' }}>🎯 Learning Objectives:</h3>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {materials.learningObjectives.map((obj, idx) => (
                <li key={idx} style={{ marginBottom: '0.3rem' }}>{obj}</li>
              ))}
            </ul>
            
            <h3 style={{ color: '#1565c0', fontSize: '1.1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>✨ Key Points:</h3>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {materials.keyPoints.map((point, idx) => (
                <li key={idx} style={{ marginBottom: '0.3rem' }}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Videos */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🎥 Recommended Videos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {videos.map((video, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease'
                }}>
                  <div style={{
                    width: '100%',
                    height: '180px',
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '3rem'
                  }}>
                    ▶️
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#2c3e50' }}>{video.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>{video.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '15px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {video.difficulty}
                      </span>
                      <span style={{
                        background: '#f8f9fa',
                        color: '#495057',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '15px',
                        fontSize: '0.75rem',
                        border: '1px solid #e9ecef'
                      }}>
                        ⏱️ {video.duration}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>❓ Sample Questions</h2>
            {questions.map((q, idx) => (
              <div key={idx} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1rem',
                borderLeft: '4px solid #667eea',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {q.type}
                  </span>
                  <span style={{
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {q.marks} marks
                  </span>
                </div>
                <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#2c3e50' }}>
                  Q{idx + 1}. {q.question}
                </p>
                {q.type === 'MCQ' && (
                  <div style={{ paddingLeft: '1rem' }}>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} style={{
                        background: '#f8f9fa',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        borderLeft: '3px solid #e9ecef'
                      }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
                <p style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  💡 {q.explanation}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIContentDemo;
