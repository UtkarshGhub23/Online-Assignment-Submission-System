'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/courses/${data.course.id}`);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slideUp" style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1>Create New Course</h1>
          <p className="page-header-subtitle">Set up a new course for your students</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="code">Course Code</label>
            <input
              id="code"
              type="text"
              className="form-input"
              placeholder="e.g., CS101"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="title">Course Title</label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g., Introduction to Computer Science"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-textarea"
              placeholder="Describe what this course covers..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
