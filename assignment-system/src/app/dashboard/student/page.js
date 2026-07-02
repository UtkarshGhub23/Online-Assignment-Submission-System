'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role === 'student') {
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

  if (authLoading || (loading && user?.role === 'student')) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading Student Dashboard...</p>
      </div>
    );
  }

  if (user?.role !== 'student') {
    return (
      <div className="glass-card text-center" style={{ padding: 'var(--spacing-2xl)', marginTop: 'var(--spacing-2xl)' }}>
        <h2 style={{ color: 'var(--accent-danger)', marginBottom: 'var(--spacing-md)' }}>Access Denied</h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
          This page is reserved for Students only. As a Faculty member, you must use the Faculty Dashboard.
        </p>
        <Link href="/dashboard/faculty" className="btn btn-primary">
          Go to Faculty Dashboard
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
          <h1>Student Dashboard</h1>
          <p className="page-header-subtitle">
            Welcome back, {user?.name}. Browse your courses and submit your assignments before the deadline.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card purple">
          <div className="stat-icon purple">
            <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
            </svg>
          </div>
          <div className="stat-value">{stats.pendingCount}</div>
          <div className="stat-label">Pending Assignments</div>
        </div>
        <div className="glass-card stat-card green">
          <div className="stat-icon green">
            <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-value">{stats.submittedCount}</div>
          <div className="stat-label">Completed Assignments</div>
        </div>
        <div className="glass-card stat-card amber">
          <div className="stat-icon amber">
            <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-value">{stats.lateCount}</div>
          <div className="stat-label">Late Submissions</div>
        </div>
        <div className="glass-card stat-card cyan">
          <div className="stat-icon cyan">
            <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
            </svg>
          </div>
          <div className="stat-value">{stats.averageMarks ? Math.round(stats.averageMarks) : 'N/A'}</div>
          <div className="stat-label">Average Marks</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* Upcoming Deadlines */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>Upcoming Deadlines</h3>
            <Link href="/dashboard/assignments" className="btn btn-sm btn-secondary">View all</Link>
          </div>
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
            <div className="empty-state">
              <div className="empty-state-title">All caught up!</div>
              <div className="empty-state-text">No upcoming deadlines.</div>
            </div>
          )}
        </div>

        {/* Submission History */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>Submission History</h3>
            <Link href="/dashboard/submissions" className="btn btn-sm btn-secondary">View all</Link>
          </div>
          {stats.submissionHistory?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {stats.submissionHistory.map((sub) => (
                <div key={sub.id} className="deadline-item" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-sm)' }}>
                  <div style={{ flex: 1 }}>
                    <strong className="text-sm" style={{ color: 'var(--text-primary)' }}>{sub.assignment_title}</strong>
                    <p className="text-xs text-secondary">Submitted: {formatDate(sub.submitted_at).full}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${sub.status === 'graded' || sub.status === 'approved' ? 'graded' : 'pending'}`} style={{ fontSize: '0.675rem' }}>
                      {sub.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {sub.marks !== null && (
                      <p className="text-xs font-bold" style={{ color: 'var(--accent-success)', marginTop: '0.2rem' }}>
                        {sub.marks}/{sub.max_marks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No submission history records.</p>
          )}
        </div>

        {/* Recent Feedback */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Recent Feedback</h3>
          {stats.recentFeedback?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {stats.recentFeedback.map((g) => (
                <div key={g.id} style={{ padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>{g.assignment_title}</span>
                    <strong style={{ color: 'var(--accent-success)', fontSize: '0.8125rem' }}>{g.marks} marks</strong>
                  </div>
                  <p className="text-xs text-secondary" style={{ fontStyle: 'italic', marginBottom: '0.25rem' }}>&quot;{g.feedback}&quot;</p>
                  <span className="text-xs text-muted" style={{ display: 'block', textAlign: 'right' }}>Graded by {g.grader_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No feedback published yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
