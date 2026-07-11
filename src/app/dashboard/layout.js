'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

/* ══════════════════════════════════════
   SVG ICONS
══════════════════════════════════════ */
const Ico = {
  Dashboard:   () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Courses:     () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Assignments: () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Submissions: () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Grades:      () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  Profile:     () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Plus:        () => <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Bell:        () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Moon:        () => <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Sun:         () => <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>,
  Chevron:     () => <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
  Menu:        () => <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Logout:      () => <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Settings:    () => <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

/* ══════════════════════════════════════
   NAV CONFIG
══════════════════════════════════════ */
const STUDENT_NAV = [
  { href: '/dashboard/student',     label: 'Dashboard',   Icon: Ico.Dashboard },
  { href: '/dashboard/assignments', label: 'Assignments',  Icon: Ico.Assignments },
  { href: '/dashboard/submissions', label: 'My Submissions', Icon: Ico.Submissions },
  { href: '/dashboard/grades',      label: 'Grades',       Icon: Ico.Grades },
];

const FACULTY_NAV = [
  { href: '/dashboard/faculty',     label: 'Dashboard',   Icon: Ico.Dashboard },
  { href: '/dashboard/courses',     label: 'Courses',      Icon: Ico.Courses },
  { href: '/dashboard/assignments', label: 'Assignments',  Icon: Ico.Assignments },
  { href: '/dashboard/submissions', label: 'Submissions',  Icon: Ico.Submissions },
];

const PAGE_META = {
  '/dashboard':             { title: 'Dashboard' },
  '/dashboard/student':     { title: 'Dashboard' },
  '/dashboard/faculty':     { title: 'Dashboard' },
  '/dashboard/courses':     { title: 'Courses' },
  '/dashboard/assignments': { title: 'Assignments' },
  '/dashboard/submissions': { title: 'Submissions' },
  '/dashboard/grades':      { title: 'Grades & Feedback' },
  '/dashboard/profile':     { title: 'Profile' },
  '/dashboard/help':        { title: 'Help & Support' },
};

function getPageTitle(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname].title;
  for (const [key, val] of Object.entries(PAGE_META)) {
    if (pathname.startsWith(key) && key !== '/dashboard') return val.title;
  }
  return 'Dashboard';
}

function isActive(href, pathname) {
  if (href === '/dashboard/student' || href === '/dashboard/faculty') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

/* ══════════════════════════════════════
   COMPONENT
══════════════════════════════════════ */
export default function DashboardLayout({ children }) {
  const { user, loading, logout, verifyEmail } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [notifications,setNotifications]= useState([]);
  const [unread,       setUnread]       = useState(0);
  const [showNotif,    setShowNotif]    = useState(false);
  const [showUser,     setShowUser]     = useState(false);
  const [theme,        setTheme]        = useState('dark');
  const [verifyLoad,   setVerifyLoad]   = useState(false);
  const [verifyDone,   setVerifyDone]   = useState(false);
  const [pageKey,      setPageKey]      = useState(pathname);
  const [showCmd,      setShowCmd]      = useState(false);
  const [cmdQuery,     setCmdQuery]     = useState('');

  const userRef  = useRef(null);
  const notifRef = useRef(null);

  /* theme */
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  /* command palette listener */
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmd(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCmd(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  /* page key */
  useEffect(() => { setPageKey(pathname); }, [pathname]);

  /* auth guard */
  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading, router]);

  /* notifications */
  useEffect(() => { if (user) fetchNotifs(); }, [user]);
  async function fetchNotifs() {
    try {
      const r = await fetch('/api/notifications');
      if (r.ok) { const d = await r.json(); setNotifications(d.notifications); setUnread(d.unread_count); }
    } catch {}
  }
  async function markAllRead() {
    try {
      await fetch('/api/notifications/all/read', { method: 'PUT' });
      setNotifications(p => p.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch {}
  }

  /* click outside */
  useEffect(() => {
    const h = (e) => {
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function handleLogout() { await logout(); router.replace('/login'); }

  async function handleVerify() {
    setVerifyLoad(true);
    const r = await verifyEmail();
    if (r.success) setVerifyDone(true);
    setVerifyLoad(false);
  }

  function timeAgo(dateStr) {
    const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  if (loading || !user) return (
    <div className="loading-container" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
      <p className="loading-text">Loading…</p>
    </div>
  );

  const navItems  = user.role === 'student' ? STUDENT_NAV : FACULTY_NAV;
  const initials  = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-layout-container">
      {/* ════ LEFT SIDEBAR ════ */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Link href={user.role === 'student' ? '/dashboard/student' : '/dashboard/faculty'} className="sidebar-logo">
            <span>AssignPro</span>
          </Link>

          <nav className="sidebar-nav">
            <Link
              href={user.role === 'student' ? '/dashboard/student' : '/dashboard/faculty'}
              className={`sidebar-nav-link ${pathname === '/dashboard/student' || pathname === '/dashboard/faculty' ? 'active' : ''}`}
            >
              <Ico.Dashboard />
              <span>Focus</span>
            </Link>
            {navItems.slice(1).map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`sidebar-nav-link ${isActive(href, pathname) ? 'active' : ''}`}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          {/* Controls */}
          <div className="sidebar-footer-row">
            {/* Search trigger */}
            <button onClick={() => setShowCmd(true)} className="sidebar-action-btn" title="Search (⌘K)">
              <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="sidebar-action-btn" title="Toggle Theme">
              {theme === 'light' ? <Ico.Moon /> : <Ico.Sun />}
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className={`sidebar-action-btn ${showNotif ? 'active' : ''}`} onClick={() => { setShowNotif(v => !v); setShowUser(false); }} title="Notifications">
                <Ico.Bell />
                {unread > 0 && <span style={{
                  position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)'
                }} />}
              </button>
              
              {showNotif && (
                <div className="notification-dropdown" style={{
                  position: 'absolute', bottom: '40px', left: '0', width: '280px',
                  maxHeight: '320px', overflowY: 'auto', background: 'var(--bg-elevated)', border: '1px solid var(--line-dark)',
                  borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', zIndex: 1001
                }}>
                  <div className="notification-dropdown-header" style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Notifications</span>
                    {unread > 0 && <button className="btn btn-sm btn-secondary" onClick={markAllRead} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>Read All</button>}
                  </div>
                  <div className="notification-list" style={{ padding: '4px' }}>
                    {notifications.length === 0 ? (
                      <p style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-4)' }}>No notifications</p>
                    ) : notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => { if (n.link) router.push(n.link); setShowNotif(false); }}
                        style={{ padding: '8px', borderRadius: 'var(--r-md)', cursor: 'pointer', marginBottom: '2px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-1)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={userRef} style={{ position: 'relative' }}>
              <button className="sidebar-profile-avatar" onClick={() => { setShowUser(v => !v); setShowNotif(false); }}>
                {initials}
              </button>
              
              {showUser && (
                <div className="glass-card" style={{
                  position: 'absolute', bottom: '40px', left: '0', width: '180px', padding: '6px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--line-dark)', borderRadius: 'var(--r-xl)', zIndex: 1001
                }}>
                  <div style={{ padding: '6px', borderBottom: '1px solid var(--line)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-1)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-3)', textTransform: 'capitalize' }}>{user.role}</div>
                  </div>
                  <Link href="/dashboard/profile" onClick={() => setShowUser(false)} className="sidebar-link" style={{ textDecoration: 'none', padding: '4px 6px', fontSize: '0.75rem' }}>
                    Settings
                  </Link>
                  <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', textDecoration: 'none', padding: '4px 6px', fontSize: '0.75rem', color: 'var(--danger)', background: 'transparent', border: 'none', textAlign: 'left' }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Command Palette Modal */}
      {showCmd && (() => {
        const allActions = [
          { label: 'Go to Dashboard', path: user.role === 'student' ? '/dashboard/student' : '/dashboard/faculty', keywords: 'home stats analytics dashboard' },
          { label: 'View Assignments', path: '/dashboard/assignments', keywords: 'homework tasks list view' },
          { label: 'View Courses', path: '/dashboard/courses', keywords: 'classes studies list' },
          { label: 'View Grades', path: '/dashboard/grades', keywords: 'marks score reportcard' },
          { label: 'Help Center', path: '/dashboard/help', keywords: 'faq support contact center' },
          { label: 'User Profile Settings', path: '/dashboard/profile', keywords: 'account name credentials pass profile settings' },
        ];
        if (user.role === 'faculty') {
          allActions.push(
            { label: 'Create New Course', path: '/dashboard/courses/new', keywords: 'new class study make create' },
            { label: 'Create New Assignment', path: '/dashboard/assignments/new', keywords: 'new task homework publish create' },
            { label: 'Review Submissions', path: '/dashboard/submissions', keywords: 'grading review marking submissions' }
          );
        } else if (user.role === 'student') {
          allActions.push(
            { label: 'View Submission History', path: '/dashboard/submissions', keywords: 'my uploads files status submissions' }
          );
        }

        const filteredActions = allActions.filter(act => 
          act.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
          act.keywords.toLowerCase().includes(cmdQuery.toLowerCase())
        );

        return (
          <div className="modal-overlay open" onClick={() => setShowCmd(false)} style={{ zIndex: 9999 }}>
            <div className="glass-card" onClick={e => e.stopPropagation()} style={{
              maxWidth: '500px',
              width: '90%',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--line-dark)',
              background: 'var(--bg-elevated)',
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--line)' }}>
                <input
                  type="text"
                  placeholder="Search pages or shortcuts... (Esc to close)"
                  autoFocus
                  value={cmdQuery}
                  onChange={e => setCmdQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-1)',
                    fontSize: '0.9375rem',
                  }}
                />
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                {filteredActions.length === 0 ? (
                  <p style={{ padding: '16px', color: 'var(--text-3)', fontSize: '0.875rem', textAlign: 'center' }}>No shortcuts found</p>
                ) : (
                  filteredActions.map((action) => (
                    <button
                      key={action.path}
                      onClick={() => {
                        router.push(action.path);
                        setShowCmd(false);
                        setCmdQuery('');
                      }}
                      className="sidebar-link"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--r-lg)',
                        color: 'var(--text-2)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 120ms',
                        marginBottom: '2px',
                      }}
                    >
                      <span>{action.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>↳ Enter</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════ MAIN CONTENT ════ */}
      <main className="main-content">
        <div key={pageKey} className="page-sheet">
          {children}
        </div>

        <footer style={{
          marginTop: 24, padding: '16px 0 0',
          borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 8,
          fontSize: '0.75rem', color: 'var(--text-4)',
        }}>
          <span>© {new Date().getFullYear()} AssignPro LMS — All rights reserved.</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>v2.0</span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>All systems operational</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
