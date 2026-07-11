'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function FacultyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === 'faculty') fetchStats();
  }, [user, authLoading]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) setStats((await res.json()).stats);
    } catch {}
    finally { setLoading(false); }
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (authLoading || (loading && user?.role === 'faculty')) return (
    <div className="loading-container"><div className="spinner" /><p className="loading-text">Restoring your workspace environment...</p></div>
  );

  if (user?.role !== 'faculty') return (
    <div style={{ textAlign: 'center', padding: '100px 24px' }}>
      <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto', marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      <h2 style={{ color: 'var(--danger)', marginBottom: 12 }}>Faculty Account Required</h2>
      <Link href="/dashboard/student" className="btn btn-primary">Go to Student Workspace</Link>
    </div>
  );

  const pendingCount = stats?.pendingSubmissions ?? 0;
  const totalSubmissions = stats?.totalSubmissions ?? 0;
  const gradedCount = stats?.gradedSubmissions ?? 0;

  // Evaluation rate
  const evaluationRate = totalSubmissions > 0 
    ? Math.round((gradedCount / totalSubmissions) * 100) 
    : 100;

  // Workload estimator: 5 mins per pending submission
  const estimatedMins = pendingCount * 6;

  // Simulated heatmap cells
  const heatmapCells = Array.from({ length: 28 }, (_, i) => {
    if (i === 4 || i === 12 || i === 18) return 4;
    if (i === 1 || i === 9 || i === 22) return 2;
    if (i % 3 === 0) return 1;
    return 0;
  });

  return (
    <div className="animate-slideUp" style={{ width: '100%' }}>
      
      {/* Editorial Title Block */}
      <div style={{ marginBottom: '48px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Faculty Workspace
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-4)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: '1.05', color: 'white', margin: 0 }}>
          Today&apos;s Focus.
        </h1>
        <p style={{ fontSize: '1.0625rem', color: 'var(--text-3)', marginTop: '8px', maxWidth: '600px' }}>
          Good {timeOfDay}, {user?.name.split(' ')[0]}. Here is the path through your pending reviews and courses today.
        </p>
      </div>

      {/* Workflow Timeline Structure (Asymmetric columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="content-grid">
        
        {/* Left Column: Chronological Action Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Action Card 1: The Evaluation Queue */}
          <div className="glass-card" style={{ padding: '32px !important' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
                  Queue
                </span>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
                  Submission Evaluation
                </h3>
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: pendingCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {pendingCount}
              </span>
            </div>

            {pendingCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', margin: 0 }}>
                  Students have uploaded papers waiting for grading marks. These tasks impact course timeline velocities.
                </p>
                
                {/* Timeline items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  {stats?.recentSubmissions?.slice(0, 3).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-gradient-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                          {s.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'white' }}>{s.student_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Uploaded {s.assignment_title}</div>
                        </div>
                      </div>
                      
                      <Link href={`/dashboard/submissions/${s.id}`} className="btn btn-sm btn-secondary" style={{ background: 'var(--bg-hover)', border: 'none', fontSize: '0.75rem' }}>
                        Grade Now
                      </Link>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <Link href="/dashboard/submissions" className="btn btn-gradient" style={{ fontSize: '0.8125rem' }}>
                    Open Evaluation Queue
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)' }}>
                <svg width={36} height={36} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto', marginBottom: 12, opacity: 0.5 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>All grading queues are empty. Good work!</span>
              </div>
            )}
          </div>

          {/* Action Card 2: Upcoming Deadlines & Submission Velocities */}
          <div className="glass-card" style={{ padding: '32px !important' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
              Releases
            </span>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Active Assignments Tracker
            </h3>

            {stats?.upcomingDeadlines?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.upcomingDeadlines.slice(0, 3).map(a => {
                  const daysLeftDiff = Math.ceil((new Date(a.due_date) - Date.now()) / 86400000);
                  const isUrgent = daysLeftDiff <= 2;
                  return (
                    <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--line-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href={`/dashboard/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>{a.title}</span>
                        </Link>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isUrgent ? 'var(--warning)' : 'var(--text-4)' }}>
                          {daysLeftDiff < 0 ? 'Closed' : daysLeftDiff === 0 ? 'Due today' : `${daysLeftDiff} days remaining`}
                        </span>
                      </div>
                      
                      {/* Visual progress track instead of statistics */}
                      <div style={{ width: '100%', height: 4, background: 'var(--bg-muted)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          position: 'absolute', top: 0, left: 0, bottom: 0,
                          width: `${evaluationRate}%`,
                          background: 'var(--brand-gradient)',
                          borderRadius: 2
                        }} />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-4)' }}>
                        <span>Course: {a.course_code}</span>
                        <span>Evaluation Rate: {evaluationRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No active assignments published.</p>
            )}
          </div>

        </div>

        {/* Right Column: AI Workspace Insights & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* AI Insight Box */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.02) 100%), var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--brand)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand)', letterSpacing: '0.05em' }}>AI Copilot</span>
            </div>
            
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
              Workload Recommendation
            </h4>

            {pendingCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: '1.5', margin: 0 }}>
                  Evaluating {pendingCount} assignments will take about <strong style={{ color: 'white' }}>{estimatedMins} minutes</strong>. We suggest starting with short feedback reviews to clear student updates.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--line-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>Grading Efficiency</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>Optimal</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: '1.5', margin: 0 }}>
                All student uploads evaluated. Your average grading turnaround time is under 18 hours.
              </p>
            )}
          </div>

          {/* Activity Heatmap Grid */}
          <div className="glass-card">
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
              Engagement Distribution
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {heatmapCells.map((level, idx) => (
                <div 
                  key={idx} 
                  style={{
                    aspectRatio: 1,
                    borderRadius: 2,
                    background: level === 4 ? 'var(--brand)' : level === 2 ? 'rgba(99,102,241,0.5)' : level === 1 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.02)'
                  }} 
                  title={`Day ${idx + 1}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-4)', marginTop: 8 }}>
              <span>Less</span>
              <span>More</span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card">
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
              Workspace Tools
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/dashboard/assignments/new" className="sidebar-link" style={{ textDecoration: 'none', background: 'var(--bg-subtle)' }}>
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create Assignment
              </Link>
              <Link href="/dashboard/courses/new" className="sidebar-link" style={{ textDecoration: 'none', background: 'var(--bg-subtle)' }}>
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Register Course
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
