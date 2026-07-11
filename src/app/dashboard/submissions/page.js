'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const STATUS_TABS = [
  { key: '',                label: 'All',          icon: <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
  { key: 'pending',         label: 'Pending',       icon: <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'submitted',       label: 'Submitted',     icon: <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> },
  { key: 'graded',          label: 'Graded',        icon: <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'late_submission', label: 'Late',          icon: <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
  { key: 'approved',        label: 'Approved',      icon: <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

const STATUS_STYLE = {
  pending:         { cls: 'badge-pending',  label: 'Pending' },
  submitted:       { cls: 'badge-student',  label: 'Submitted' },
  graded:          { cls: 'badge-graded',   label: 'Graded' },
  reviewed:        { cls: 'badge-graded',   label: 'Reviewed' },
  approved:        { cls: 'badge-approved', label: 'Approved' },
  late_submission: { cls: 'badge-late',     label: 'Late' },
  rejected:        { cls: 'badge-late',     label: 'Rejected' },
};

const PAGE_SIZE = 10;

function AvatarInitials({ name, size = 36 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const colors = ['#5B73F5','#16A34A','#D97706','#DC2626','#7C3AED','#0D9488','#DB2777'];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: 9,
      background: colors[idx], color: 'white',
      fontSize: size * 0.34, fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, letterSpacing: '-0.01em',
    }}>{initials}</div>
  );
}

function timeAgo(dateStr) {
  const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [activeTab,   setActiveTab]   = useState('');
  const [semester,    setSemester]    = useState('');
  const [dept,        setDept]        = useState('');
  const [page,        setPage]        = useState(1);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search)    q.append('search', search);
      if (activeTab) q.append('status', activeTab);
      if (semester)  q.append('semester', semester);
      if (dept)      q.append('department', dept);
      const res = await fetch(`/api/submissions?${q}`);
      if (res.ok) { const d = await res.json(); setSubmissions(d.submissions || []); }
    } catch {}
    finally { setLoading(false); setPage(1); }
  }, [search, activeTab, semester, dept]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  /* counts per tab */
  const counts = {};
  STATUS_TABS.forEach(t => { counts[t.key] = t.key === '' ? submissions.length : submissions.filter(s => s.status === t.key).length; });

  /* pagination */
  const total = submissions.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paginated  = submissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pending = submissions.filter(s => s.status === 'pending' || s.status === 'submitted').length;

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>Coursework Submissions</h1>
          <p className="page-header-subtitle">
            {user?.role === 'student'
              ? 'Track your submission history and grades'
              : 'Review student submissions and publish grades'}
          </p>
        </div>
        {/* pending review badge for faculty */}
        {user?.role !== 'student' && pending > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px',
            background: 'var(--warning-bg)', border: '1px solid rgba(217,119,6,0.2)',
            borderLeft: '4px solid var(--warning)', borderRadius: 'var(--r-lg)',
            fontSize: '0.875rem', fontWeight: 600, color: '#92400E',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {pending} awaiting review
            </span>
          </div>
        )}
      </div>

      {/* ── Status Tabs ── */}
      <div className="tab-bar">
        {STATUS_TABS.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            <span>{t.icon}</span> {t.label}
            <span className="tab-count">{t.key === '' ? total : submissions.filter(s => s.status === t.key).length}</span>
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="form-input search-input" placeholder="Search by student, assignment…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {user?.role !== 'student' && (
          <>
            <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={semester} onChange={e => setSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {['Semester 1','Semester 2','Semester 3','Semester 4'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={dept} onChange={e => setDept(e.target.value)}>
              <option value="">All Departments</option>
              {['Computer Science','Information Technology','Electronics','Mechanical','Civil'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </>
        )}

        {(search || semester || dept) && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearch(''); setSemester(''); setDept(''); }}>✕ Clear</button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-3)', flexShrink: 0 }}>
          {loading ? '…' : `${total} result${total !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* ── Table / Empty ── */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading submissions…</p></div>
      ) : paginated.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ marginBottom: 8, opacity: 0.3 }}>
              <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto' }}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5a2 2 0 012-2h2a2 2 0 001.414-.586L10.828 12a2 2 0 011.414-.586h1.518a2 2 0 011.414.586l1.414 1.414A2 2 0 0018 14h2z" /></svg>
            </div>
            <div className="empty-state-title">No submissions found</div>
            <div className="empty-state-text">
              {search ? `No results for "${search}".` : 'There are no submissions matching your filters.'}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {user?.role !== 'student' && <th>Student</th>}
                    <th>Assignment</th>
                    <th>Course</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(s => {
                    const ss = STATUS_STYLE[s.status] ?? { cls: 'badge-draft', label: s.status };
                    const isGraded = s.marks !== null && s.is_draft !== 1;
                    const pct = isGraded && s.max_marks > 0 ? Math.round((s.marks / s.max_marks) * 100) : null;
                    return (
                      <tr key={s.id}>
                        {user?.role !== 'student' && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <AvatarInitials name={s.student_name} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-1)' }}>{s.student_name}</div>
                                {s.enrollment_number && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{s.enrollment_number}</div>}
                              </div>
                            </div>
                          </td>
                        )}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.assignment_title}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand)', background: 'var(--brand-50)', padding: '2px 7px', borderRadius: 100 }}>
                            {s.course_code}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{fmtDate(s.submitted_at)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>{timeAgo(s.submitted_at)}</div>
                        </td>
                        <td><span className={`badge ${ss.cls}`}>{ss.label}</span></td>
                        <td>
                          {isGraded && pct !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ color: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', fontSize: '0.9375rem' }}>
                                {s.marks}<span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '0.8125rem' }}>/{s.max_marks}</span>
                              </strong>
                              <div style={{ width: 48, height: 4, background: 'var(--bg-muted)', borderRadius: 100, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 100 }} />
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-4)', fontSize: '0.875rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/dashboard/assignments/${s.assignment_id}`} className="btn btn-sm btn-secondary">View</Link>
                            {user?.role !== 'student' && s.file_url && (
                              <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" title="Download submission">
                                <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="btn btn-sm btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
