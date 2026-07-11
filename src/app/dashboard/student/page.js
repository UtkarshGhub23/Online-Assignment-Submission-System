'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function StudentDashboardPage() {
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
    if (!authLoading && user?.role === 'student') fetchStats();
  }, [user, authLoading]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) setStats((await res.json()).stats);
    } catch {}
    finally { setLoading(false); }
  }

  function fmtDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (authLoading || (loading && user?.role === 'student')) return (
    <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading your workspace...</p></div>
  );

  if (user?.role !== 'student') return (
    <div style={{ textAlign: 'center', padding: '100px 24px' }}>
      <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto', marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      <h2 style={{ color: 'var(--danger)', marginBottom: 12 }}>Student Account Required</h2>
      <Link href="/dashboard/faculty" className="btn btn-primary">Go to Faculty Workspace</Link>
    </div>
  );

  const averageGrade = stats?.averageMarks ? Math.round(stats.averageMarks) : 0;
  const radius = 54;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (averageGrade / 100) * circumference;

  return (
    <div className="animate-slideUp" style={{ width: '100%' }}>
      
      {/* Editorial Title Block */}
      <div style={{ marginBottom: '48px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Student Workspace
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-4)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            {user?.department || 'Computer Science'} · {user?.semester || 'Semester 1'}
          </span>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: '1.05', color: 'white', margin: 0 }}>
          My Tasks.
        </h1>
        <p style={{ fontSize: '1.0625rem', color: 'var(--text-3)', marginTop: '8px', maxWidth: '600px' }}>
          Good {timeOfDay}, {user?.name.split(' ')[0]}. You have <strong style={{ color: 'white' }}>{stats?.pendingCount} tasks</strong> waiting to be completed.
        </p>
      </div>

      {/* Two-Column Spatial Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="content-grid">
        
        {/* Left Column: Chronological Task Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Action Card 1: Urgent assignments timeline */}
          <div className="glass-card" style={{ padding: '32px !important' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
              Priority Tasks
            </span>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Pending Evaluations
            </h3>

            {stats?.upcomingDeadlines?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.upcomingDeadlines.map(a => {
                  const daysLeftDiff = Math.ceil((new Date(a.due_date) - Date.now()) / 86400000);
                  const isUrgent = daysLeftDiff <= 2;
                  const submitted = stats?.submissionHistory?.some(s => s.assignment_id === a.id);
                  
                  if (submitted) return null; // only show pending here

                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(245,158,11,0.06)', color: 'var(--warning)', borderRadius: 'var(--r-md)', padding: '6px 10px', textAlign: 'center', minWidth: '42px' }}>
                          <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800 }}>{new Date(a.due_date).getDate()}</span>
                          <span style={{ display: 'block', fontSize: '0.625rem', textTransform: 'uppercase' }}>{new Date(a.due_date).toLocaleString('en', { month: 'short' })}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>{a.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{a.course_code}</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isUrgent ? 'var(--warning)' : 'var(--text-4)' }}>
                          {daysLeftDiff === 0 ? 'Due today' : `${daysLeftDiff}d left`}
                        </span>
                        <Link href={`/dashboard/assignments/${a.id}`} className="btn btn-sm btn-gradient" style={{ fontSize: '0.75rem' }}>
                          Open
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No active pending assignments.</p>
            )}
          </div>

          {/* Action Card 2: Submission History */}
          <div className="glass-card" style={{ padding: '32px !important' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
              History
            </span>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Evaluated Work
            </h3>

            {stats?.submissionHistory?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.submissionHistory.slice(0, 4).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-light)' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'white' }}>{s.assignment_title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Submitted {fmtDate(s.submitted_at)}</div>
                    </div>
                    
                    {s.marks !== null ? (
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--success)' }}>
                        {s.marks} / {s.max_marks}
                      </span>
                    ) : (
                      <span className="badge badge-pending" style={{ fontSize: '0.6875rem' }}>
                        Under Review
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No submissions recorded yet.</p>
            )}
          </div>

        </div>

        {/* Right Column: Standing Progress & Faculty Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Grade Standing SVG Circular ring */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', alignSelf: 'flex-start' }}>
              Academic standing
            </h4>

            <div style={{ position: 'relative', width: radius * 2, height: radius * 2, marginBottom: '16px' }}>
              <svg width={radius * 2} height={radius * 2}>
                <circle stroke="var(--bg-muted)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
                <circle stroke="var(--brand)" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className="progress-ring-circle" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white' }}>{averageGrade}%</span>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-4)', textTransform: 'uppercase' }}>Avg</div>
              </div>
            </div>

            <div style={{ width: '100%', borderTop: '1px solid var(--line-light)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-3)' }}>
              <span>Total Uploads</span>
              <span style={{ fontWeight: 700, color: 'white' }}>{stats?.submittedCount ?? 0}</span>
            </div>
          </div>

          {/* Grader Feedback notes */}
          <div className="glass-card">
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
              Grader Remarks
            </h4>

            {stats?.recentFeedback?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recentFeedback.slice(0, 2).map(f => (
                  <div key={f.id} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--line-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>{f.assignment_title}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>{f.marks}%</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontStyle: 'italic', margin: 0 }}>
                      &quot;{f.feedback || 'Excellent submission.'}&quot;
                    </p>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-4)', marginTop: 4, textAlign: 'right' }}>
                      - {f.grader_name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-4)', margin: 0 }}>No comments released yet.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
