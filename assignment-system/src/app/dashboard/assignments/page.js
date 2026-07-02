'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, [search, statusFilter, priorityFilter, semesterFilter]);

  const fetchAssignments = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);
      if (priorityFilter) query.append('priority', priorityFilter);
      if (semesterFilter) query.append('semester', semesterFilter);

      const res = await fetch(`/api/assignments?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const isOverdue = (dateStr) => new Date(dateStr) < new Date();

  const getDaysLeft = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>Assignments</h1>
          <p className="page-header-subtitle">
            {user?.role === 'student'
              ? 'View details, download resources, and upload your coursework submission'
              : 'Review submissions, duplicate, and publish coursework assignments'}
          </p>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Link href="/dashboard/assignments/new" className="btn btn-primary">+ New Assignment</Link>
        )}
      </div>

      {/* Advanced Filters */}
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
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select text-xs"
          style={{ width: '130px', padding: '0.5rem 2rem 0.5rem 1rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>

        <select
          className="form-select text-xs"
          style={{ width: '130px', padding: '0.5rem 2rem 0.5rem 1rem' }}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          className="form-select text-xs"
          style={{ width: '130px', padding: '0.5rem 2rem 0.5rem 1rem' }}
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
        >
          <option value="">All Semesters</option>
          <option value="Semester 1">Semester 1</option>
          <option value="Semester 2">Semester 2</option>
          <option value="Semester 3">Semester 3</option>
          <option value="Semester 4">Semester 4</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : assignments.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-title">No assignments found</div>
            <div className="empty-state-text">Refine your search parameters or check your course enrollment settings.</div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Assignment Code</th>
                <th>Title</th>
                <th>Subject</th>
                <th>Course</th>
                <th>Due Date</th>
                <th>Max Marks</th>
                <th>Priority</th>
                {user?.role === 'student' && <th>Submission Status</th>}
                {user?.role === 'student' && <th>Grade</th>}
                {user?.role !== 'student' && <th>Submissions</th>}
                <th>Status</th>
                <th>Time Left</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td><span className="course-card-code" style={{ fontSize: '0.625rem' }}>{a.assignment_number || 'N/A'}</span></td>
                  <td><strong style={{ color: 'var(--text-primary)' }}>{a.title}</strong></td>
                  <td className="text-sm">{a.subject}</td>
                  <td>{a.course_code}</td>
                  <td>{formatDate(a.due_date)}</td>
                  <td>{a.max_marks}</td>
                  <td>
                    <span className={`badge badge-${a.priority === 'high' ? 'late' : a.priority === 'medium' ? 'pending' : 'graded'}`} style={{ fontSize: '0.7rem' }}>
                      {a.priority.toUpperCase()}
                    </span>
                  </td>
                  {user?.role === 'student' && (
                    <td>
                      {a.submission_id ? (
                        <span className={`badge badge-${a.submission_status === 'graded' ? 'graded' : a.submission_status === 'late_submission' ? 'late' : 'pending'}`}>
                          {a.submission_status ? a.submission_status.replace('_', ' ') : 'Submitted'}
                        </span>
                      ) : isOverdue(a.due_date) ? (
                        <span className="badge badge-late">Missing Submission</span>
                      ) : (
                        <span className="badge badge-pending">Not Started</span>
                      )}
                    </td>
                  )}
                  {user?.role === 'student' && (
                    <td>
                      {a.marks !== null && a.marks !== undefined ? (
                        <strong style={{ color: 'var(--accent-success)' }}>{a.marks}/{a.max_marks}</strong>
                      ) : '—'}
                    </td>
                  )}
                  {user?.role !== 'student' && (
                    <td>
                      <strong>{a.submission_count || 0}</strong>
                    </td>
                  )}
                  <td>
                    <span className={`badge badge-${a.status === 'published' ? 'graded' : a.status === 'draft' ? 'pending' : 'late'}`}>
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: isOverdue(a.due_date) ? 'var(--accent-danger)' : 'var(--text-secondary)'
                    }}>
                      {getDaysLeft(a.due_date)}
                    </span>
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
      )}
    </div>
  );
}
