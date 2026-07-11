'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const PRIORITY_MAP = {
  high:   { label: 'High',   cls: 'badge-high',   dot: '#DC2626' },
  medium: { label: 'Medium', cls: 'badge-medium',  dot: '#D97706' },
  low:    { label: 'Low',    cls: 'badge-low',     dot: '#16A34A' },
};

const STATUS_MAP = {
  published: { label: 'Published', cls: 'badge-published' },
  draft:     { label: 'Draft',     cls: 'badge-draft' },
  closed:    { label: 'Closed',    cls: 'badge-closed' },
  archived:  { label: 'Archived',  cls: 'badge-draft' },
};

function ScoreRing({ marks, max }) {
  if (marks == null || max == null) return null;
  const pct = Math.round((marks / max) * 100);
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={54} height={54} viewBox="0 0 54 54">
        <circle cx={27} cy={27} r={r} fill="none" stroke="var(--line)" strokeWidth={4} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 27 27)" />
        <text x={27} y={27} textAnchor="middle" dominantBaseline="central" fill={color} fontWeight="800" fontSize="11" fontFamily="Inter,sans-serif">{pct}%</text>
      </svg>
      <div style={{ fontSize: '0.625rem', color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{marks}/{max}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
      <div style={{ height: 4, background: 'var(--bg-muted)' }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 12 }} />
        <div className="skeleton skeleton-title" style={{ width: '75%' }} />
        <div className="skeleton skeleton-text" style={{ width: '55%' }} />
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 100 }} />
          <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 100 }} />
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--line-light)' }} />
      <div style={{ padding: '12px 20px', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton skeleton-text" style={{ width: '30%', margin: 0 }} />
        <div className="skeleton" style={{ width: 56, height: 28, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [viewMode, setViewMode]       = useState('cards'); // 'cards' | 'table'
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search)         q.append('search', search);
      if (statusFilter)   q.append('status', statusFilter);
      if (priorityFilter) q.append('priority', priorityFilter);
      if (semesterFilter) q.append('semester', semesterFilter);
      const res = await fetch(`/api/assignments?${q}`);
      if (res.ok) setAssignments((await res.json()).assignments);
    } catch {}
    finally { setLoading(false); }
  }, [search, statusFilter, priorityFilter, semesterFilter]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  function fmtDate(d) { return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function isOverdue(d) { return new Date(d) < new Date(); }
  function getDaysLeft(d) {
    const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
    if (diff < 0) return { label: 'Overdue', color: 'var(--danger)' };
    if (diff === 0) return { label: 'Due Today', color: 'var(--warning)' };
    if (diff <= 3) return { label: `${diff}d left`, color: 'var(--warning)' };
    return { label: `${diff}d left`, color: 'var(--text-3)' };
  }

  const STATUS_TABS = ['All', 'Published', 'Draft', 'Closed'];
  const activeTab = statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'All';

  return (
    <div className="animate-slideUp">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Assignments</h1>
          <p className="page-header-subtitle">
            {user?.role === 'student'
              ? 'Browse, download resources, and submit your coursework'
              : 'Manage, publish, and review coursework assignments'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--bg-subtle)' }}>
            {[{ v: 'cards', ico: '⊞' }, { v: 'table', ico: '☰' }].map(({ v, ico }) => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: viewMode === v ? 'var(--brand)' : 'transparent',
                color: viewMode === v ? 'white' : 'var(--text-3)',
                fontSize: '0.875rem', transition: 'all var(--t-fast)',
              }}>{ico}</button>
            ))}
          </div>
          {(user?.role === 'faculty' || user?.role === 'admin') && (
            <Link href="/dashboard/assignments/new" className="btn btn-gradient">
              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Assignment
            </Link>
          )}
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="tab-bar">
        {STATUS_TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab === 'All' ? '' : tab.toLowerCase())}>
            {tab}
            {tab !== 'All' && (
              <span className="tab-count">
                {assignments.filter(a => a.status === tab.toLowerCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="form-input search-input" placeholder="Search assignments…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {[
          { val: priorityFilter, set: setPriorityFilter, opts: [['', 'All Priorities'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] },
          { val: semesterFilter, set: setSemesterFilter, opts: [['', 'All Semesters'], ['Semester 1', 'Sem 1'], ['Semester 2', 'Sem 2'], ['Semester 3', 'Sem 3'], ['Semester 4', 'Sem 4']] },
        ].map(({ val, set, opts }, i) => (
          <select key={i} className="form-select" style={{ width: 'auto', minWidth: 140 }} value={val} onChange={e => set(e.target.value)}>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}

        {(search || statusFilter || priorityFilter || semesterFilter) && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setSemesterFilter(''); }}>
            ✕ Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-3)', flexShrink: 0 }}>
          {loading ? '…' : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={viewMode === 'cards' ? 'content-grid' : ''}>
          {viewMode === 'cards'
            ? [1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)
            : <div className="loading-container"><div className="spinner" /></div>}
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ marginBottom: 8, opacity: 0.3 }}>
              <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto' }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            </div>
            <div className="empty-state-title">No assignments found</div>
            <div className="empty-state-text">
              {search ? `No results for "${search}". Try different search terms.` : 'No assignments match your current filters.'}
            </div>
            {(user?.role === 'faculty' || user?.role === 'admin') && (
              <Link href="/dashboard/assignments/new" className="btn btn-primary" style={{ marginTop: 16 }}>Create First Assignment</Link>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── CARD GRID ── */
        <div className="content-grid">
          {assignments.map(a => {
            const dl = getDaysLeft(a.due_date);
            const prio = PRIORITY_MAP[a.priority] ?? PRIORITY_MAP.medium;
            const stat = STATUS_MAP[a.status] ?? STATUS_MAP.draft;
            return (
              <div key={a.id} className="assignment-card">
                {/* top color stripe by priority */}
                <div style={{ height: 4, background: a.priority === 'high' ? 'linear-gradient(90deg,var(--danger),#F87171)' : a.priority === 'low' ? 'linear-gradient(90deg,var(--success),#4ADE80)' : 'var(--brand-gradient)' }} />
                <div className="assignment-card-body">
                  {/* Code + priority */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    {a.assignment_number && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--brand)', background: 'var(--brand-50)', padding: '2px 8px', borderRadius: 100 }}>
                        #{a.assignment_number}
                      </span>
                    )}
                    <span className={`badge ${prio.cls}`} style={{ marginLeft: 'auto' }}>{prio.label}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 5, color: 'var(--text-1)', lineHeight: 1.35 }}>{a.title}</h3>

                  {/* Course */}
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: 14 }}>
                    {a.subject} · {a.course_code}
                  </p>

                  {/* Badges row */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`badge ${stat.cls}`}>{stat.label}</span>
                    {user?.role === 'student' && a.submission_id ? (
                      <span className={`badge badge-${a.submission_status === 'graded' || a.submission_status === 'approved' ? 'graded' : 'pending'}`}>
                        {a.submission_status?.replace('_', ' ') ?? 'Submitted'}
                      </span>
                    ) : user?.role === 'student' && isOverdue(a.due_date) ? (
                      <span className="badge badge-late">Missing</span>
                    ) : null}
                  </div>

                  {/* Score ring (student, graded) */}
                  {user?.role === 'student' && a.marks !== null && a.marks !== undefined && (
                    <div style={{ marginTop: 14 }}>
                      <ScoreRing marks={a.marks} max={a.max_marks} />
                    </div>
                  )}
                </div>

                <div className="assignment-card-footer">
                  <div>
                    <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: 2 }}>Due</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>{fmtDate(a.due_date)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: dl.color }}>{dl.label}</span>
                    </div>
                    {user?.role !== 'student' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 1 }}>
                        {a.submission_count ?? 0} submission{a.submission_count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <Link href={`/dashboard/assignments/${a.id}`} className="btn btn-sm btn-primary">
                    {user?.role === 'student' && !a.submission_id && !isOverdue(a.due_date) ? 'Submit' : 'View'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Marks</th>
                  <th>Priority</th>
                  {user?.role === 'student' && <th>Submission</th>}
                  {user?.role === 'student' && <th>Grade</th>}
                  {user?.role !== 'student' && <th>Submissions</th>}
                  <th>Status</th>
                  <th>Time Left</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => {
                  const dl = getDaysLeft(a.due_date);
                  const prio = PRIORITY_MAP[a.priority] ?? PRIORITY_MAP.medium;
                  const stat = STATUS_MAP[a.status] ?? STATUS_MAP.draft;
                  return (
                    <tr key={a.id}>
                      <td>
                        {a.assignment_number && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand)', background: 'var(--brand-50)', padding: '2px 7px', borderRadius: 100 }}>
                            {a.assignment_number}
                          </span>
                        )}
                      </td>
                      <td><strong style={{ color: 'var(--text-1)' }}>{a.title}</strong></td>
                      <td className="text-sm">{a.course_code}</td>
                      <td className="text-sm">{fmtDate(a.due_date)}</td>
                      <td className="font-semibold">{a.max_marks}</td>
                      <td><span className={`badge ${prio.cls}`}>{prio.label}</span></td>
                      {user?.role === 'student' && (
                        <td>
                          {a.submission_id
                            ? <span className={`badge badge-${a.submission_status === 'graded' || a.submission_status === 'approved' ? 'graded' : 'pending'}`}>{a.submission_status?.replace('_', ' ') ?? 'Submitted'}</span>
                            : isOverdue(a.due_date)
                              ? <span className="badge badge-late">Missing</span>
                              : <span className="badge badge-draft">Not Started</span>}
                        </td>
                      )}
                      {user?.role === 'student' && (
                        <td>
                          {a.marks != null ? <strong style={{ color: 'var(--success)' }}>{a.marks}/{a.max_marks}</strong> : '—'}
                        </td>
                      )}
                      {user?.role !== 'student' && (
                        <td><strong>{a.submission_count ?? 0}</strong></td>
                      )}
                      <td><span className={`badge ${stat.cls}`}>{stat.label}</span></td>
                      <td><span style={{ fontSize: '0.8125rem', fontWeight: 700, color: dl.color }}>{dl.label}</span></td>
                      <td>
                        <Link href={`/dashboard/assignments/${a.id}`} className="btn btn-sm btn-secondary">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
