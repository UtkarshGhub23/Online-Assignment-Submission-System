'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const NAV_ITEMS = {
  common: [
    { href: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
    { href: '/dashboard/courses', label: 'Courses', icon: 'Courses' },
    { href: '/dashboard/assignments', label: 'Assignments', icon: 'Assignments' },
    { href: '/dashboard/submissions', label: 'Submissions', icon: 'Submissions' },
  ],
  admin: [
    { href: '/dashboard/admin/users', label: 'User Management', icon: 'Users' },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: 'Analytics' },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, loading, logout, verifyEmail } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState('light');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.notification-wrapper')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/all/read', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleVerifyEmail = async () => {
    setVerifyLoading(true);
    const res = await verifyEmail();
    if (res.success) {
      setVerifySuccess(true);
    } else {
      alert('Verification failed');
    }
    setVerifyLoading(false);
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.includes('/courses')) return 'Courses';
    if (pathname.includes('/assignments')) return 'Assignments';
    if (pathname.includes('/submissions')) return 'Submissions';
    if (pathname.includes('/admin/users')) return 'User Management';
    if (pathname.includes('/admin/analytics')) return 'Analytics';
    return 'Dashboard';
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'Dashboard':
        return (
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'Courses':
        return (
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'Assignments':
        return (
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Submissions':
        return (
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        );
      case 'Users':
        return (
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'Analytics':
        return (
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading || !user) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ color: 'white', fontWeight: 'bold' }}>AP</div>
          <span className="sidebar-logo-text">AssignPro</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main Menu</div>
            {NAV_ITEMS.common.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon">{renderIcon(item.icon)}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {user.role === 'admin' && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Administration</div>
              {NAV_ITEMS.admin.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sidebar-link-icon">{renderIcon(item.icon)}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {(user.role === 'teacher' || user.role === 'admin') && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Quick Actions</div>
              <Link
                href="/dashboard/courses/new"
                className="sidebar-link"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon" style={{ fontSize: 16, fontWeight: 'bold' }}>+</span>
                <span>Create Course</span>
              </Link>
              <Link
                href="/dashboard/assignments/new"
                className="sidebar-link"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon" style={{ fontSize: 16, fontWeight: 'bold' }}>+</span>
                <span>Create Assignment</span>
              </Link>
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-section-title">Support</div>
            <Link href="/dashboard/help" className={`sidebar-link ${pathname === '/dashboard/help' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <span className="sidebar-link-icon">?</span>
              <span>Help Center</span>
            </Link>
            <Link href="/dashboard/profile" className={`sidebar-link ${pathname === '/dashboard/profile' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <span className="sidebar-link-icon">⚙</span>
              <span>Profile Settings</span>
            </Link>
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button
            className="btn-icon btn-secondary"
            onClick={handleLogout}
            title="Logout"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h2 className="topbar-title">{getPageTitle()}</h2>
        </div>

        <div className="topbar-right">
          {user.role === 'student' && user.email_verified !== 1 && !verifySuccess && (
            <button
              onClick={handleVerifyEmail}
              disabled={verifyLoading}
              className="btn btn-sm btn-secondary animate-pulse"
              style={{ background: 'rgba(217, 119, 6, 0.08)', color: '#d97706', borderColor: 'rgba(217, 119, 6, 0.2)' }}
            >
              {verifyLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          )}

          {verifySuccess && (
            <span className="badge badge-graded" style={{ fontSize: '0.75rem' }}>Email Verified</span>
          )}

          <button
            className="notification-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            style={{ marginRight: 4 }}
          >
            {theme === 'light' ? (
              <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </button>

          <span className={`badge badge-${user.role}`}>{user.role}</span>

          <div className="notification-wrapper" style={{ position: 'relative' }}>
            <button
              className="notification-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
              }}
            >
              <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button className="btn btn-sm btn-secondary" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <p className="text-muted text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => {
                          if (n.link) router.push(n.link);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-message">{n.message}</div>
                        <div className="notification-item-time">{formatTime(n.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content animate-fadeIn">
        {children}
      </main>
    </>
  );
}
