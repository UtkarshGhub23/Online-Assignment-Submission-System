'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // 'student' | 'faculty'
  const [department, setDepartment] = useState('Computer Science');
  const [course, setCourse] = useState('B.Sc. CS');
  const [semester, setSemester] = useState('Semester 1');
  const [section, setSection] = useState('Section A');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password, {
      role,
      department,
      course: role === 'student' ? course : 'N/A',
      semester: role === 'student' ? semester : 'N/A',
      section: role === 'student' ? section : 'N/A'
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ color: 'white', fontWeight: 'bold' }}>AP</div>
          <span className="auth-logo-text">AssignPro</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          padding: '4px',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${role === 'faculty' ? 'btn-primary' : ''}`}
            style={{
              background: role === 'faculty' ? 'var(--gradient-primary)' : 'transparent',
              color: role === 'faculty' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: role === 'faculty' ? 'var(--shadow-sm)' : 'none',
              padding: 'var(--spacing-sm)'
            }}
            onClick={() => setRole('faculty')}
          >
            Faculty Account
          </button>
          <button
            type="button"
            className={`btn btn-sm ${role === 'student' ? 'btn-primary' : ''}`}
            style={{
              background: role === 'student' ? 'var(--gradient-primary)' : 'transparent',
              color: role === 'student' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: role === 'student' ? 'var(--shadow-sm)' : 'none',
              padding: 'var(--spacing-sm)'
            }}
            onClick={() => setRole('student')}
          >
            Student Account
          </button>
        </div>

        <h1 className="auth-title">
          {role === 'faculty' ? 'Register Faculty' : 'Register Student'}
        </h1>
        <p className="auth-subtitle">Create your university portal account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="department">Department</label>
            <select
              id="department"
              className="form-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>

          {role === 'student' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="course">Course</label>
                <select
                  id="course"
                  className="form-select"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                >
                  <option value="B.Sc. CS">B.Sc. CS</option>
                  <option value="M.Sc. IT">M.Sc. IT</option>
                  <option value="B.Tech SE">B.Tech SE</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="semester">Semester</label>
                  <select
                    id="semester"
                    className="form-select"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="section">Section</label>
                  <select
                    id="section"
                    className="form-select"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: 'var(--spacing-md)' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
