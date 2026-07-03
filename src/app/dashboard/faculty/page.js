'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function FacultyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role === 'faculty') {
      fetchStats();
    }
  }, [user, authLoading]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleString('en', { month: 'short' }),
      full: date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  const getDaysLeft = (dateStr) => {
    const now = new Date();
    const due = new Date(dateStr);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days left`;
  };

  if (authLoading || (loading && user?.role === 'faculty')) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading Faculty Dashboard...</p>
      </div>
    );
  }

  if (user?.role !== 'faculty') {
    return (
      <div className="glass-card text-center" style={{ padding: 'var(--spacing-2xl)', marginTop: 'var(--spacing-2xl)' }}>
        <h2 style={{ color: 'var(--accent-danger)', marginBottom: 'var(--spacing-md)' }}>Access Denied</h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
          This page is reserved for Faculty members only. As a student, you must use the Student Dashboard.
        </p>
        <Link href="/dashboard/student" className="btn btn-primary">
          Go to Student Dashboard
        </Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No data available</div>
        <div className="empty-state-text">Dashboard analytics will appear once there is activity.</div>
      </div>
    );
  }

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>Faculty Dashboard</h1>
          <p className="page-header-subtitle">
            Welcome back, {user?.name}. Manage your courses, assignments, and submissions.
          </p>
        </div>
        <div className="flex gap-sm">
          <Link href="/dashboard/assignments/new" className="btn btn-primary">
            + New Assignment
          </Link>
          <Link href="/dashboard/courses/new" className="btn btn-secondary">
            + New Course
          </Link>
        </div>
      </div>

      {/* Faculty Action Banner */}
      <div className="glass-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)', borderLeft: '3px solid var(--accent-primary)' }}>
        <div>
          <span className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Actionable Tasks</span>
          <p className="text-sm font-semibold" style={{ marginTop: '2px' }}>
            {stats.pendingSubmissions > 0 
              ? `You have ${stats.pendingSubmissions} coursework submission(s) pending your review & grading.` 
              : 'All submitted student assignments are fully graded. Great job!'}
          </p>
        </div>
        {stats.pendingSubmissions > 0 && (
          <Link href="/dashboard/submissions" className="btn btn-sm btn-primary">
            Review Submissions
          </Link>
        )}
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="glass-card stat-card purple" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.totalAssignments}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Total Assignments</div>
        </div>
        <div className="glass-card stat-card green" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.publishedAssignments}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Published Assignments</div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>{stats.draftAssignments}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Draft Assignments</div>
        </div>
        <div className="glass-card stat-card cyan" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.totalStudents}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Total Students</div>
        </div>
        <div className="glass-card stat-card amber" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.pendingSubmissions}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Pending Reviews</div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-info)' }}>{stats.averageMarks ? `${Math.round(stats.averageMarks)}%` : 'N/A'}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Average Class Score</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* Overview Stats */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Coursework Status Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div className="flex justify-between items-center" style={{ padding: '0.5rem 0' }}>
              <span className="text-sm text-secondary">Expired Assignments</span>
              <span className="font-bold">{stats.expiredAssignments}</span>
            </div>
            <div className="flex justify-between items-center" style={{ padding: '0.5rem 0' }}>
              <span className="text-sm text-secondary">Reviewed Submissions</span>
              <span className="font-bold">{stats.gradedSubmissions}</span>
            </div>
            <div className="flex justify-between items-center" style={{ padding: '0.5rem 0' }}>
              <span className="text-sm text-secondary">Late Submissions</span>
              <span className="font-bold">{stats.lateSubmissions}</span>
            </div>
            <div className="flex justify-between items-center" style={{ padding: '0.5rem 0' }}>
              <span className="text-sm text-secondary">Average Score</span>
              <span className="font-bold">{stats.averageMarks ? Math.round(stats.averageMarks) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Upcoming Deadlines</h3>
          <div className="dashboard-scroll-list">
          {stats.upcomingDeadlines?.length > 0 ? stats.upcomingDeadlines.map((a) => {
            const d = formatDate(a.due_date);
            return (
              <Link key={a.id} href={`/dashboard/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                <div className="deadline-item">
                  <div className="deadline-date">
                    <div className="deadline-date-day">{d.day}</div>
                    <div className="deadline-date-month">{d.month}</div>
                  </div>
                  <div className="deadline-info">
                    <div className="deadline-title">{a.title}</div>
                    <div className="deadline-course">{a.course_code} — {a.course_title}</div>
                  </div>
                  <span className="text-xs text-muted">{getDaysLeft(a.due_date)}</span>
                </div>
              </Link>
            );
          }) : (
            <p className="text-sm text-secondary">No upcoming deadlines.</p>
          )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>Recent Submissions</h3>
            <Link href="/dashboard/submissions" className="btn btn-sm btn-secondary">Review all</Link>
          </div>
          <div className="dashboard-scroll-list">
          {stats.recentSubmissions?.length > 0 ? stats.recentSubmissions.map((s) => (
            <Link key={s.id} href={`/dashboard/submissions/${s.id}`} style={{ textDecoration: 'none' }}>
              <div className="deadline-item">
                <div className="sidebar-avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                  {s.student_name?.charAt(0)}
                </div>
                <div className="deadline-info">
                  <div className="deadline-title">{s.student_name}</div>
                  <div className="deadline-course">{s.assignment_title}</div>
                </div>
                <span className={`badge badge-${s.status === 'graded' || s.status === 'approved' ? 'graded' : 'pending'}`}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          )) : (
            <p className="text-sm text-secondary">No submissions yet.</p>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
