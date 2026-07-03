'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function GradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        // Filter graded submissions (non-draft grades)
        const gradedSubmissions = (data.submissions || []).filter(
          s => s.marks !== null && s.is_draft !== 1
        );
        setGrades(gradedSubmissions);
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading Grades...</p>
      </div>
    );
  }

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>Grades & Feedback</h1>
          <p className="page-header-subtitle">
            Assessments, feedback reviews, and grade logs from your course instructors.
          </p>
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-title">No feedback yet</div>
            <div className="empty-state-text">
              Your assignments have not been graded yet. Feedback will appear here as soon as instructors release it.
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Submitted At</th>
                  <th>Graded At</th>
                  <th>Score / Marks</th>
                  <th>Instructor Feedback</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{g.assignment_title}</strong>
                    </td>
                    <td>
                      <span className="course-card-code" style={{ fontSize: '0.75rem' }}>{g.course_code}</span>
                    </td>
                    <td className="text-xs">{formatDate(g.submitted_at)}</td>
                    <td className="text-xs">{formatDate(g.graded_at)}</td>
                    <td>
                      <strong style={{ color: 'var(--accent-success)' }}>{g.marks}</strong>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}> / {g.max_marks}</span>
                    </td>
                    <td style={{ maxWidth: '300px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      &quot;{g.feedback || 'No comments provided.'}&quot;
                    </td>
                    <td>
                      <Link href={`/dashboard/assignments/${g.assignment_id}`} className="btn btn-sm btn-secondary">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
