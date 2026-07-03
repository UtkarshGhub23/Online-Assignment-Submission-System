'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
      if (res.ok) {
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error('Enroll error:', err);
    }
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>Courses</h1>
          <p className="page-header-subtitle">
            {user?.role === 'student'
              ? 'Browse and enroll in available academic courses'
              : 'Manage registered courses'}
          </p>
        </div>
        <div className="flex gap-md items-center">
          <div className="search-input-wrapper">
            <span className="search-icon">
              <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {(user?.role === 'faculty' || user?.role === 'admin') && (
            <Link href="/dashboard/courses/new" className="btn btn-primary">
              + New Course
            </Link>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-title">No courses found</div>
            <div className="empty-state-text">
              {user?.role === 'faculty'
                ? 'Create a course to begin publishing assignments.'
                : 'No academic courses are currently offered.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="content-grid">
          {filtered.map((course) => (
            <div key={course.id} className="glass-card course-card">
              <div className="course-card-header">
                <span className="course-card-code">{course.code}</span>
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-teacher" style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                  Instructor: {course.teacher_name}
                </p>
              </div>
              <div className="course-card-body">
                <p className="course-card-desc">{course.description}</p>
                <div className="course-card-stats">
                  <span className="course-card-stat">
                    <strong>{course.student_count}</strong> students
                  </span>
                  <span className="course-card-stat">
                    <strong>{course.assignment_count}</strong> assignments
                  </span>
                </div>
              </div>
              <div className="course-card-footer">
                {user?.role === 'student' && !course.is_enrolled ? (
                  <button className="btn btn-primary btn-sm" onClick={() => handleEnroll(course.id)}>
                    Enroll Course
                  </button>
                ) : (
                  <Link href={`/dashboard/courses/${course.id}`} className="btn btn-secondary btn-sm">
                    View Course
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
