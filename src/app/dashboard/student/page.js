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
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          This page is reserved for Students only.
        </p>
        <Link href="/dashboard/faculty" className="btn btn-primary">
          Go to Faculty Dashboard
        </Link>
      </div>
    );
  }

  // Find next urgent assignment
  const nextUrgent = stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0
    ? stats.upcomingDeadlines[0]
    : null;

  return (
    <div className="animate-slideUp" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Banner / Guide */}
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-secondary" style={{ marginTop: '2px' }}>
              Student ID: {user?.enrollment_number} | CS Section A
            </p>
          </div>
          <span className="badge badge-student" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Active Student</span>
        </div>

        {nextUrgent ? (
          <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-tertiary)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            <div>
              <span className="text-xs text-muted" style={{ fontWeight: 600 }}>NEXT ACTION REQUIRED</span>
              <p className="text-sm font-semibold" style={{ marginTop: '2px' }}>
                Submit &ldquo;{nextUrgent.title}&rdquo; ({nextUrgent.course_code}) before the deadline.
              </p>
            </div>
            <Link href={`/dashboard/assignments/${nextUrgent.id}`} className="btn btn-sm btn-primary" style={{ alignSelf: 'center' }}>
              Submit Now
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-success)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              ✨ All Caught Up! You have no upcoming coursework deadlines left.
            </p>
          </div>
        )}
      </div>

      {/* Mini Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="glass-card stat-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Pending</span>
            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-tertiary)' }}>{stats?.pendingCount || 0}</span>
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Completed</span>
            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-success)' }}>{stats?.submittedCount || 0}</span>
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Late Submissions</span>
            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-danger)' }}>{stats?.lateCount || 0}</span>
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Avg Grade</span>
            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-info)' }}>
              {stats?.averageMarks ? `${Math.round(stats.averageMarks)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Unified Timeline / Activity Feed */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--spacing-md)' }}>
        Coursework Activity & Timeline
      </h2>

      {(!stats?.upcomingDeadlines || stats.upcomingDeadlines.length === 0) && (!stats?.submissionHistory || stats.submissionHistory.length === 0) ? (
        <div className="glass-card" style={{ padding: 'var(--spacing-2xl)' }}>
          <div className="empty-state">
            <span style={{ fontSize: '2.5rem' }}>📂</span>
            <div className="empty-state-title" style={{ marginTop: 'var(--spacing-sm)' }}>No Assignments Yet</div>
            <div className="empty-state-text">Your faculty has not published any coursework assignments for your class.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          
          {/* 1. Pending / Upcoming Deadlines first */}
          {stats?.upcomingDeadlines?.map((a) => {
            const isSubmitted = stats?.submissionHistory?.some(s => s.assignment_id === a.id);
            if (isSubmitted) return null; // Only show actually pending ones

            return (
              <div key={`pending-${a.id}`} className="glass-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)', borderLeft: '4px solid var(--accent-tertiary)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                  <div className="deadline-date" style={{ background: 'rgba(217, 119, 6, 0.08)', color: 'var(--accent-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.6rem', textAlign: 'center', minWidth: '55px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{new Date(a.due_date).getDate()}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {new Date(a.due_date).toLocaleString('en', { month: 'short' })}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>ASSIGNMENT DUE ({getDaysLeft(a.due_date)})</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{a.title}</h3>
                    <p className="text-xs text-secondary">{a.course_code} — {a.course_title}</p>
                  </div>
                </div>
                <div className="flex gap-sm items-center">
                  <Link href={`/dashboard/assignments/${a.id}`} className="btn btn-sm btn-primary">
                    Submit Assignment
                  </Link>
                </div>
              </div>
            );
          })}

          {/* 2. Submitted Submissions & Grades */}
          {stats?.submissionHistory?.map((sub) => (
            <div key={`sub-${sub.id}`} className="glass-card" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <div className="deadline-date" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-success)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.6rem', textAlign: 'center', minWidth: '55px' }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                </div>
                <div>
                  <span className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    {sub.status === 'graded' || sub.status === 'reviewed' ? 'GRADED & RELEASED' : 'SUBMITTED (PENDING ASSESSMENT)'}
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{sub.assignment_title}</h3>
                  <p className="text-xs text-secondary">Uploaded: {formatDate(sub.submitted_at)}</p>
                </div>
              </div>
              
              <div className="flex gap-sm items-center" style={{ flexWrap: 'wrap' }}>
                {(sub.status === 'graded' || sub.status === 'reviewed') && sub.marks !== null ? (
                  <div style={{ textAlign: 'right', marginRight: 'var(--spacing-md)' }}>
                    <span className="text-xs text-muted" style={{ display: 'block' }}>SCORE</span>
                    <strong style={{ color: 'var(--accent-success)', fontSize: '1.1rem' }}>{sub.marks}</strong>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>/{sub.max_marks}</span>
                  </div>
                ) : (
                  <span className="badge badge-pending" style={{ fontSize: '0.675rem' }}>UNDER REVIEW</span>
                )}
                <Link href={`/dashboard/assignments/${sub.assignment_id}`} className="btn btn-sm btn-secondary">
                  View Assessment
                </Link>
              </div>
            </div>
          ))}

        </div>
      )}
      
    </div>
  );
}
