'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('assignments');

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const isOverdue = (dateStr) => new Date(dateStr) < new Date();

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!course) {
    return <div className="empty-state"><div className="empty-state-title">Course not found</div></div>;
  }

  return (
    <div className="animate-slideUp">
      <div className="glass-card detail-header">
        <span className="course-card-code">{course.code}</span>
        <h1 style={{ fontSize: '1.5rem', marginTop: 'var(--spacing-sm)' }}>{course.title}</h1>
        <p className="text-sm text-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
          {course.description}
        </p>
        <div className="detail-meta">
          <span className="detail-meta-item">Instructor: <strong>{course.teacher_name}</strong></span>
          <span className="detail-meta-item">Enrolled Students: <strong>{course.students?.length}</strong></span>
          <span className="detail-meta-item">Assignments: <strong>{course.assignments?.length}</strong></span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>
          Assignments ({course.assignments?.length || 0})
        </button>
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <button className={`tab ${tab === 'students' ? 'active' : ''}`} onClick={() => setTab('students')}>
            Students ({course.students?.length || 0})
          </button>
        )}
      </div>

      {tab === 'assignments' && (
        <div>
          {(user?.role === 'faculty' || user?.role === 'admin') && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <Link href={`/dashboard/assignments/new?courseId=${id}`} className="btn btn-primary">
                + New Assignment
              </Link>
            </div>
          )}

          {course.assignments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Max Marks</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {course.assignments.map((a) => (
                    <tr key={a.id}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{a.title}</strong></td>
                      <td>{formatDate(a.due_date)}</td>
                      <td>{a.max_marks}</td>
                      <td>{a.submission_count}</td>
                      <td>
                        {isOverdue(a.due_date) ? (
                          <span className="badge badge-late">Closed</span>
                        ) : (
                          <span className="badge badge-graded">Open</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/dashboard/assignments/${a.id}`} className="btn btn-sm btn-secondary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card">
              <div className="empty-state">
                <div className="empty-state-title">No assignments created yet</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'students' && (
        <div className="overflow-x-auto">
          {course.students?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Enrolled On</th>
                </tr>
              </thead>
              <tbody>
                {course.students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-md">
                        <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {s.name?.charAt(0)}
                        </div>
                        <strong style={{ color: 'var(--text-primary)' }}>{s.name}</strong>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>{formatDate(s.enrolled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="glass-card">
              <div className="empty-state">
                <div className="empty-state-title">No students enrolled yet</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
