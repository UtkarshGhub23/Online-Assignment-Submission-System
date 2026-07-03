'use client';

import { useState, useEffect } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals / Selected rows
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'student',
    department: 'Computer Science', course: 'B.Sc. CS',
    semester: 'Semester 1', section: 'Section A'
  });

  // Bulk import state
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          name: '', email: '', password: '', role: 'student',
          department: 'Computer Science', course: 'B.Sc. CS',
          semester: 'Semester 1', section: 'Section A'
        });
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess('');

    try {
      let parsed;
      try {
        parsed = JSON.parse(importJson);
        if (!Array.isArray(parsed)) {
          parsed = [parsed];
        }
      } catch (err) {
        setImportError('Invalid JSON format. Please provide a valid JSON array of user objects.');
        return;
      }

      const res = await fetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsed }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportSuccess(data.message + ` Imported: ${data.imported}, Skipped: ${data.skipped}.`);
        setImportJson('');
        fetchUsers();
        setTimeout(() => setShowImportModal(false), 2000);
      } else {
        setImportError(data.error);
      }
    } catch (err) {
      setImportError('Import request failed.');
    }
  };

  const toggleUserActive = async (userObj) => {
    try {
      const targetState = userObj.active === 1 ? 0 : 1;
      const res = await fetch(`/api/users/${userObj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: targetState }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userObj.id ? { ...u, active: targetState } : u));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to change user activation state.');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedUserIds.length} selected users?`)) return;

    try {
      const res = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedUserIds([]);
        fetchUsers();
        alert(data.message || 'Users deleted successfully.');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Bulk delete request failed.');
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (filteredUsers) => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        (u.enrollment_number && u.enrollment_number.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <div>
          <h1>User Directory</h1>
          <p className="page-header-subtitle">Manage, activate, import and export student and faculty accounts.</p>
        </div>
        <div className="flex gap-sm">
          <a href="/api/users/export" className="btn btn-secondary">
            Export Users CSV
          </a>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            Bulk Import Users
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + New User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="glass-card stat-card purple">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Registered Users</div>
        </div>
        <div className="glass-card stat-card cyan">
          <div className="stat-value">{users.filter(u => u.role === 'faculty').length}</div>
          <div className="stat-label">Registered Faculty</div>
        </div>
        <div className="glass-card stat-card blue">
          <div className="stat-value">{users.filter(u => u.role === 'student').length}</div>
          <div className="stat-label">Registered Students</div>
        </div>
        <div className="glass-card stat-card green">
          <div className="stat-value">{users.filter(u => u.active === 1).length}</div>
          <div className="stat-label">Active Profiles</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div className="flex gap-md items-center" style={{ flexWrap: 'wrap' }}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by name, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {['all', 'admin', 'faculty', 'student'].map(r => (
              <button key={r} className={`tab ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {selectedUserIds.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            Delete Selected ({selectedUserIds.length})
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-x-auto" style={{ padding: 'var(--spacing-md)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedUserIds.length === filtered.length}
                  onChange={() => handleSelectAll(filtered)}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th>Name / ID</th>
              <th>Email</th>
              <th>Academic Dept</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.id)}
                    onChange={() => handleSelectUser(u.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td>
                  <div className="flex items-center gap-md">
                    <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{u.name}</strong>
                      <p className="text-xs text-muted" style={{ marginTop: '0.1rem' }}>{u.enrollment_number || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td>{u.email}</td>
                <td className="text-sm">{u.department || 'N/A'}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role.toUpperCase()}</span></td>
                <td>
                  <button
                    className={`badge badge-${u.active === 1 ? 'graded' : 'late'}`}
                    onClick={() => toggleUserActive(u)}
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    {u.active === 1 ? 'ACTIVE' : 'DEACTIVATED'}
                  </button>
                </td>
                <td>{formatDate(u.created_at)}</td>
                <td>
                  <div className="flex gap-sm">
                    <button className="btn btn-sm btn-secondary" onClick={() => {
                      const tempPass = prompt('Enter new password for ' + u.name + ':');
                      if (tempPass) {
                        fetch(`/api/users/${u.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: tempPass }),
                        }).then(res => {
                          if (res.ok) alert('Password updated successfully.');
                          else alert('Update failed.');
                        });
                      }
                    }}>Reset Pass</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Account</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="createName">Full Name</label>
                <input
                  id="createName"
                  type="text"
                  className="form-input text-sm"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="createEmail">Email Address</label>
                <input
                  id="createEmail"
                  type="email"
                  className="form-input text-sm"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="createPassword">Password</label>
                <input
                  id="createPassword"
                  type="password"
                  className="form-input text-sm"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="createRole">Role</label>
                  <select
                    id="createRole"
                    className="form-select text-sm"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="createDept">Department</label>
                  <input
                    id="createDept"
                    type="text"
                    className="form-input text-sm"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  />
                </div>
              </div>

              {createForm.role === 'student' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createCourse">Course</label>
                    <input
                      id="createCourse"
                      type="text"
                      className="form-input text-sm"
                      value={createForm.course}
                      onChange={(e) => setForm({ ...createForm, course: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createSem">Semester</label>
                    <input
                      id="createSem"
                      type="text"
                      className="form-input text-sm"
                      value={createForm.semester}
                      onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createSection">Section</label>
                    <input
                      id="createSection"
                      type="text"
                      className="form-input text-sm"
                      value={createForm.section}
                      onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Accounts</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>✕</button>
            </div>

            {importError && <div className="auth-error">{importError}</div>}
            {importSuccess && <div className="auth-error" style={{ background: 'rgba(5, 150, 105, 0.08)', borderColor: 'rgba(5, 150, 105, 0.15)', color: '#059669' }}>{importSuccess}</div>}

            <form onSubmit={handleImport}>
              <div className="form-group">
                <label className="form-label" htmlFor="importData">JSON User List Array</label>
                <textarea
                  id="importData"
                  className="form-textarea text-sm font-mono"
                  style={{ height: '180px' }}
                  placeholder={'[\n  { "name": "John Doe", "email": "john@university.edu", "role": "student" },\n  { "name": "Prof Smith", "email": "smith@faculty.edu", "role": "faculty" }\n]'}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
