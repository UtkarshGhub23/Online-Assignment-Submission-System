'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function ScoreRing({ marks, max, size = 80 }) {
  const pct  = max > 0 ? Math.round((marks / max) * 100) : 0;
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const cx   = size / 2;
  const color = pct >= 80 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626';
  const bg    = pct >= 80 ? '#F0FDF4' : pct >= 50 ? '#FFFBEB' : '#FEF2F2';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size, background: bg, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={5} />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: size === 80 ? '1.25rem' : '0.875rem', color, lineHeight: 1, letterSpacing: '-0.03em' }}>{pct}%</div>
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600 }}>{marks}/{max}</div>
    </div>
  );
}

function PerformanceBanner({ grades }) {
  if (!grades.length) return null;
  const avg = grades.reduce((s, g) => s + (g.marks / g.max_marks) * 100, 0) / grades.length;
  const best = grades.reduce((b, g) => (g.marks / g.max_marks > b.marks / b.max_marks ? g : b), grades[0]);
  const total = grades.reduce((s, g) => s + g.marks, 0);
  const maxTotal = grades.reduce((s, g) => s + g.max_marks, 0);

  return (
    <div style={{
      background: avg >= 80 ? 'linear-gradient(135deg, #16A34A, #4ADE80)' : avg >= 50 ? 'var(--brand-gradient)' : 'linear-gradient(135deg, #DC2626, #F87171)',
      borderRadius: 'var(--r-2xl)', padding: '28px 32px', marginBottom: 28,
      color: 'white', position: 'relative', overflow: 'hidden',
      boxShadow: avg >= 80 ? '0 6px 24px rgba(22,163,74,0.35)' : 'var(--shadow-brand)',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Overall Performance</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }}>{Math.round(avg)}%</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: 4 }}>Average across {grades.length} assignment{grades.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} className="hidden-mobile" />
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Total Score</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>{total}/{maxTotal}</div>
        </div>
        <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} className="hidden-mobile" />
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Best Assignment</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, maxWidth: 200 }}>{best?.assignment_title}</div>
        </div>
      </div>
    </div>
  );
}

export default function GradesPage() {
  const { user } = useAuth();
  const [grades,  setGrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState('date_desc');

  useEffect(() => { fetchGrades(); }, []);

  async function fetchGrades() {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const d = await res.json();
        const graded = (d.submissions || []).filter(s => s.marks !== null && s.is_draft !== 1);
        setGrades(graded);
      }
    } catch {}
    finally { setLoading(false); }
  }

  function fmtDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const sorted = [...grades].sort((a, b) => {
    if (sort === 'score_desc') return (b.marks / b.max_marks) - (a.marks / a.max_marks);
    if (sort === 'score_asc')  return (a.marks / a.max_marks) - (b.marks / b.max_marks);
    if (sort === 'date_asc')   return new Date(a.graded_at) - new Date(b.graded_at);
    return new Date(b.graded_at) - new Date(a.graded_at); // date_desc default
  });

  if (loading) return (
    <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading grades…</p></div>
  );

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>Grades & Feedback</h1>
          <p className="page-header-subtitle">Your assessed assignments, scores, and instructor feedback</p>
        </div>
        <select className="form-select" style={{ width: 180 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="date_desc">Most Recent</option>
          <option value="date_asc">Oldest First</option>
          <option value="score_desc">Highest Score</option>
          <option value="score_asc">Lowest Score</option>
        </select>
      </div>

      <PerformanceBanner grades={grades} />

      {sorted.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ marginBottom: 8, opacity: 0.3 }}>
              <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
            </div>
            <div className="empty-state-title">No grades yet</div>
            <div className="empty-state-text">Your submitted assignments will appear here once your instructor grades them. Keep submitting!</div>
            <Link href="/dashboard/assignments" className="btn btn-primary" style={{ marginTop: 16 }}>View Assignments</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sorted.map((g) => {
            const pct = g.max_marks > 0 ? Math.round((g.marks / g.max_marks) * 100) : 0;
            const pctColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
            const borderColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

            return (
              <div key={g.id} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--line)',
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: 'var(--r-xl)',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                transition: 'box-shadow var(--t-base)',
              }}>
                {/* Score Ring */}
                <div style={{ flexShrink: 0 }}>
                  <ScoreRing marks={g.marks} max={g.max_marks} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    {g.course_code && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--brand)', background: 'var(--brand-50)', padding: '2px 9px', borderRadius: 100 }}>
                        {g.course_code}
                      </span>
                    )}
                    <span className={`badge badge-${pct >= 80 ? 'graded' : pct >= 50 ? 'pending' : 'late'}`}>
                      {pct >= 80 ? 'Excellent' : pct >= 65 ? 'Good' : pct >= 50 ? 'Satisfactory' : 'Needs Improvement'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-1)', lineHeight: 1.3 }}>{g.assignment_title}</h3>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: g.feedback ? 14 : 0 }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Submitted</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>{fmtDate(g.submitted_at)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Graded</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>{fmtDate(g.graded_at)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>Score</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: pctColor }}>{g.marks}/{g.max_marks}</div>
                    </div>
                  </div>

                  {/* Feedback blockquote */}
                  {g.feedback && (
                    <div style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--line)',
                      borderLeft: `3px solid ${pctColor}`,
                      borderRadius: 'var(--r-lg)',
                      padding: '12px 16px',
                    }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', marginBottom: 5 }}>
                        Instructor Feedback
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                        "{g.feedback}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0 }}>
                  <Link href={`/dashboard/assignments/${g.assignment_id}`} className="btn btn-sm btn-secondary">View Assignment</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
