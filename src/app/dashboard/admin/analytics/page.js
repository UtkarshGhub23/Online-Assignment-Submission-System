'use client';

import { useState, useEffect } from 'react';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Report generator state
  const [reportType, setReportType] = useState('student');
  const [reportPreview, setReportPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewReport = async () => {
    setPreviewLoading(true);
    setReportPreview(null);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`);
      if (res.ok) {
        const data = await res.json();
        setReportPreview(data);
      }
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!stats) {
    return <div className="empty-state"><div className="empty-state-title">No analytics data</div></div>;
  }

  const totalSubs = stats.totalSubmissions || 1;
  const pendingPct = Math.round((stats.pendingSubmissions / totalSubs) * 100);
  const gradedPct = Math.round((stats.gradedSubmissions / totalSubs) * 100);
  const latePct = Math.round((stats.lateSubmissions / totalSubs) * 100);

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>System Analytics</h1>
          <p className="page-header-subtitle">Academic portal metrics, user demographics, and report generators.</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card purple">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="glass-card stat-card cyan">
          <div className="stat-value">{stats.totalCourses}</div>
          <div className="stat-label">Active Courses</div>
        </div>
        <div className="glass-card stat-card amber">
          <div className="stat-value">{stats.totalAssignments}</div>
          <div className="stat-label">Total Assignments</div>
        </div>
        <div className="glass-card stat-card green">
          <div className="stat-value">{stats.totalSubmittedAssignments}</div>
          <div className="stat-label">Total Submissions</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        {/* User Breakdown */}
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-xl)' }}>User Demographics</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div>
              <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                <span className="text-sm">Students</span>
                <span className="text-sm font-bold">{stats.totalStudents}</span>
              </div>
              <div className="progress-bar" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{
                  width: `${stats.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0}%`,
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)'
                }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                <span className="text-sm">Teachers</span>
                <span className="text-sm font-bold">{stats.totalTeachers}</span>
              </div>
              <div className="progress-bar" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{
                  width: `${stats.totalUsers > 0 ? (stats.totalTeachers / stats.totalUsers) * 100 : 0}%`,
                  background: 'linear-gradient(135deg, #06b6d4, #22d3ee)'
                }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                <span className="text-sm">Administrators</span>
                <span className="text-sm font-bold">{stats.totalUsers - stats.totalStudents - stats.totalTeachers}</span>
              </div>
              <div className="progress-bar" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{
                  width: `${stats.totalUsers > 0 ? ((stats.totalUsers - stats.totalStudents - stats.totalTeachers) / stats.totalUsers) * 100 : 0}%`,
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Status Distribution */}
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-xl)' }}>Submission Distributions</h3>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
            <div className="text-center">
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `conic-gradient(#fbbf24 0deg, #fbbf24 ${pendingPct * 3.6}deg, var(--bg-glass) ${pendingPct * 3.6}deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: 700
                }}>{pendingPct}%</div>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Pending</p>
            </div>
            <div className="text-center">
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `conic-gradient(#34d399 0deg, #34d399 ${gradedPct * 3.6}deg, var(--bg-glass) ${gradedPct * 3.6}deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: 700
                }}>{gradedPct}%</div>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Graded</p>
            </div>
            <div className="text-center">
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `conic-gradient(#f87171 0deg, #f87171 ${latePct * 3.6}deg, var(--bg-glass) ${latePct * 3.6}deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: 700
                }}>{latePct}%</div>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Late</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div className="flex justify-between items-center" style={{ padding: '0.375rem 0' }}>
              <span className="text-sm">Pending Submissions</span>
              <span className="text-sm font-bold">{stats.pendingSubmissions}</span>
            </div>
            <div className="flex justify-between items-center" style={{ padding: '0.375rem 0' }}>
              <span className="text-sm">Graded Submissions</span>
              <span className="text-sm font-bold">{stats.gradedSubmissions}</span>
            </div>
            <div className="flex justify-between items-center" style={{ padding: '0.375rem 0' }}>
              <span className="text-sm">Late Submissions</span>
              <span className="text-sm font-bold">{stats.lateSubmissions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Center */}
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>University Report Center</h3>
        <p className="text-xs text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Select, preview, and download custom Excel-compatible CSV reports across system parameters.
        </p>

        <div className="flex gap-md items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
          <select
            className="form-select text-sm"
            style={{ width: '250px' }}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="student">Student Registry Report</option>
            <option value="teacher">Faculty Registry Report</option>
            <option value="assignment">Assignment Configurations Report</option>
            <option value="submission">Coursework Submissions Report</option>
            <option value="marks">Grades & Assessments Report</option>
            <option value="department">Academic Departments Report</option>
            <option value="semester">Semester Overview Report</option>
            <option value="late">Late Submissions Report</option>
            <option value="activity">System Audit Activity Report</option>
          </select>

          <button className="btn btn-secondary" onClick={handlePreviewReport} disabled={previewLoading}>
            {previewLoading ? 'Compiling...' : 'Preview Report'}
          </button>

          <a href={`/api/reports?type=${reportType}&export=true`} className="btn btn-primary">
            Download CSV Report
          </a>
        </div>

        {reportPreview && (
          <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Previewing: {reportType.toUpperCase()} ({reportPreview.rows?.length || 0} records)</h4>
            <div className="overflow-x-auto" style={{ maxHeight: '300px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {reportPreview.headers?.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportPreview.rows?.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      {reportPreview.headers?.map((h, i) => (
                        <td key={i} className="text-xs">{String(row[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reportPreview.rows?.length > 10 && (
              <p className="text-xs text-muted" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                Showing first 10 records. Click Download CSV to download full report.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
