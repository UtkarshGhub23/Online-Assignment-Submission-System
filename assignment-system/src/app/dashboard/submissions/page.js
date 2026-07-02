'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [search, statusFilter, semesterFilter, deptFilter]);

  const fetchSubmissions = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);
      if (semesterFilter) query.append('semester', semesterFilter);
      if (deptFilter) query.append('department', deptFilter);

      const res = await fetch(`/api/submissions?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>Coursework Submissions</h1>
          <p className="page-header-subtitle">
            {user?.role === 'student' ? 'Track your coursework submission history' : 'Review enrollees submissions and publish grades'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">
            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            className="form-input search-input"
            placeholder={user?.role === 'student' ? "Search by assignment title..." : "Search by student name or assignment..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select text-xs"
          style={{ width: '150px', padding: '0.5rem 2rem 0.5rem 1rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="returned">Returned</option>
          <option value="late_submission">Late Submission</option>
        </select>

        {user?.role !== 'student' && (
          <>
            <select
              className="form-select text-xs"
              style={{ width: '150px', padding: '0.5rem 2rem 0.5rem 1rem' }}
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="Semester 3">Semester 3</option>
              <option value="Semester 4">Semester 4</option>
            </select>

            <select
              className="form-select text-xs"
              style={{ width: '170px', padding: '0.5rem 2rem 0.5rem 1rem' }}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : submissions.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-title">No submissions found</div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {user?.role !== 'student' && <th>Enrollment No</th>}
                {user?.role !== 'student' && <th>Student</th>}
                <th>Assignment</th>
                <th>Course</th>
                <th>File</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Marks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  {user?.role !== 'student' && <td><span className="course-card-code" style={{ fontSize: '0.625rem' }}>{s.enrollment_number || 'N/A'}</span></td>}
                  {user?.role !== 'student' && (
                    <td>
                      <div className="flex items-center gap-sm">
                        <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                          {s.student_name?.charAt(0)}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {s.student_name}
                        </span>
                      </div>
                    </td>
                  )}
                  <td><strong style={{ color: 'var(--text-primary)' }}>{s.assignment_title}</strong></td>
                  <td>{s.course_code}</td>
                  <td className="text-xs">📄 {s.file_name}</td>
                  <td className="text-xs">{formatDate(s.submitted_at)}</td>
                  <td>
                    <span className={`badge badge-${s.status === 'graded' || s.status === 'approved' ? 'graded' : s.status === 'rejected' ? 'late' : 'pending'}`}>
                      {s.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {s.marks !== null && s.marks !== undefined && !s.is_draft ? (
                      <strong style={{ color: 'var(--accent-success)' }}>{s.marks}/{s.max_marks}</strong>
                    ) : '—'}
                  </td>
                  <td>
                    <Link href={`/dashboard/submissions/${s.id}`} className="btn btn-sm btn-secondary">
                      {user?.role !== 'student' && s.status === 'submitted' ? 'Grade' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
