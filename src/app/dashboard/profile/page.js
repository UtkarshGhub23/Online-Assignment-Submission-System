'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileSettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    biography: user?.biography || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || ''
  });

  const [notificationForm, setNotificationForm] = useState({
    email: user?.notification_prefs?.email !== false,
    in_app: user?.notification_prefs?.in_app !== false
  });

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status banners
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: '', type: '' });

    const res = await updateProfile({
      ...profileForm,
      notification_prefs: notificationForm
    });

    if (res.success) {
      setProfileMsg({ text: 'Profile settings saved successfully.', type: 'success' });
    } else {
      setProfileMsg({ text: res.error || 'Failed to save changes.', type: 'error' });
    }
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMsg({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match.', type: 'error' });
      setPassLoading(false);
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPassMsg({ text: 'Password changed successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassMsg({ text: res.error || 'Password update failed.', type: 'error' });
    }
    setPassLoading(false);
  };

  return (
    <div className="animate-slideUp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'start' }}>
      {/* Left Column: Personal info */}
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Profile Details</h2>
        <p className="text-xs text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Update your contact details, academic assignments configuration, and biografical statement.
        </p>

        {profileMsg.text && (
          <div className="auth-error" style={{
            background: profileMsg.type === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: profileMsg.type === 'success' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: profileMsg.type === 'success' ? '#059669' : '#dc2626'
          }}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              className="form-input text-sm"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="userRoleLabel">System Role</label>
              <input
                id="userRoleLabel"
                type="text"
                className="form-input text-sm"
                value={user?.role?.toUpperCase() || ''}
                disabled
                style={{ background: 'rgba(0,0,0,0.02)', color: 'var(--text-tertiary)' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="userEnrollment">Enrollment Number</label>
              <input
                id="userEnrollment"
                type="text"
                className="form-input text-sm"
                value={user?.enrollment_number || 'N/A'}
                disabled
                style={{ background: 'rgba(0,0,0,0.02)', color: 'var(--text-tertiary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="userEmailReadOnly">Email</label>
              <input
                id="userEmailReadOnly"
                type="email"
                className="form-input text-sm"
                value={profileForm.email}
                disabled
                style={{ background: 'rgba(0,0,0,0.02)', color: 'var(--text-tertiary)' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="text"
                className="form-input text-sm"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
          </div>

          {user?.role === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', fontWeight: 600 }}>Dept</label>
                <span className="text-xs font-semibold">{user.department}</span>
              </div>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', fontWeight: 600 }}>Course</label>
                <span className="text-xs font-semibold">{user.course}</span>
              </div>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', fontWeight: 600 }}>Semester</label>
                <span className="text-xs font-semibold">{user.semester}</span>
              </div>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', fontWeight: 600 }}>Section</label>
                <span className="text-xs font-semibold">{user.section}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              className="form-input text-sm"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="biography">Biography</label>
            <textarea
              id="biography"
              className="form-textarea text-sm"
              value={profileForm.biography}
              onChange={(e) => setProfileForm({ ...profileForm, biography: e.target.value })}
              rows={3}
            />
          </div>

          <h3 style={{ fontSize: '0.9375rem', marginBottom: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>Notification Preferences</h3>
          <div className="form-group flex-col gap-sm" style={{ display: 'flex', marginBottom: 'var(--spacing-lg)' }}>
            <label className="flex items-center gap-sm text-sm" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notificationForm.email}
                onChange={(e) => setNotificationForm({ ...notificationForm, email: e.target.checked })}
              />
              Receive notifications via email
            </label>
            <label className="flex items-center gap-sm text-sm" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notificationForm.in_app}
                onChange={(e) => setNotificationForm({ ...notificationForm, in_app: e.target.checked })}
              />
              Receive notifications in-app (topbar bell)
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Right Column: Security/Password info */}
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Change Password</h2>
        <p className="text-xs text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Ensure your account password contains at least 6 characters and is updated regularly.
        </p>

        {passMsg.text && (
          <div className="auth-error" style={{
            background: passMsg.type === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: passMsg.type === 'success' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: passMsg.type === 'success' ? '#059669' : '#dc2626'
          }}>
            {passMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              className="form-input text-sm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="form-input text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={passLoading}>
            {passLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
