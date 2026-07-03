'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function NewAssignmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    course_id: searchParams.get('courseId') || '',
    title: '',
    subject: '',
    department: 'Computer Science',
    semester: 'Semester 3',
    section: 'Section A',
    assignment_number: '',
    description: '',
    detailed_instructions: '',
    due_date: '',
    max_marks: 100,
    status: 'published',
    priority: 'medium',
    estimated_time: '4 hours',
    late_allowed: false,
    max_file_size: 10,
    allowed_file_types: 'pdf,doc,docx,zip'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseStudents, setCourseStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (form.course_id) {
      fetchCourseStudents(form.course_id);
    } else {
      setCourseStudents([]);
      setSelectedStudentIds([]);
    }
  }, [form.course_id]);

  const fetchCourseStudents = async (courseId) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourseStudents(data.course.students || []);
        setSelectedStudentIds([]);
      }
    } catch (err) {
      console.error('Failed to fetch course students:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
        if (data.courses.length > 0 && !form.course_id) {
          setForm(prev => ({ ...prev, course_id: data.courses[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          course_id: Number(form.course_id),
          max_marks: Number(form.max_marks),
          max_file_size: Number(form.max_file_size),
          due_date: new Date(form.due_date).toISOString(),
          late_allowed: form.late_allowed ? 1 : 0,
          target_students: selectedStudentIds.length > 0 ? selectedStudentIds.join(',') : ''
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/assignments/${data.assignment.id}`);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slideUp" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1>Create Coursework Assignment</h1>
          <p className="page-header-subtitle">Configure coursework assignments, deadlines, file rules, and grading scopes.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="course">Course Assignment</label>
              <select
                id="course"
                className="form-select text-sm"
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                required
              >
                <option value="">Select a course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="subject">Subject Topic</label>
              <input
                id="subject"
                type="text"
                className="form-input text-sm"
                placeholder="e.g. Data Structures"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Assignment Title</label>
              <input
                id="title"
                type="text"
                className="form-input text-sm"
                placeholder="e.g. Binary Search Tree Operations"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="asmNumber">Assignment ID / Number</label>
              <input
                id="asmNumber"
                type="text"
                className="form-input text-sm"
                placeholder="e.g. ASM-102"
                value={form.assignment_number}
                onChange={(e) => setForm({ ...form, assignment_number: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-sm)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="department">Department</label>
              <select
                id="department"
                className="form-select text-sm"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="semester">Semester</label>
              <select
                id="semester"
                className="form-select text-sm"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
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
                className="form-select text-sm"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="priority">Priority Scope</label>
              <select
                id="priority"
                className="form-select text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Overview Description</label>
            <textarea
              id="description"
              className="form-textarea text-sm"
              placeholder="Provide a brief summary of the assignment task..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="detailedInstructions">Detailed Instructions</label>
            <textarea
              id="detailedInstructions"
              className="form-textarea text-sm"
              placeholder="State clear step-by-step submission steps, grading rubrics, or instructions..."
              value={form.detailed_instructions}
              onChange={(e) => setForm({ ...form, detailed_instructions: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Assign to Specific Students (Optional)</span>
              <span className="text-xs text-muted" style={{ fontWeight: 'normal' }}>Leave empty to assign to everyone in this section</span>
            </label>
            {courseStudents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxHeight: '160px', overflowY: 'auto' }}>
                {courseStudents.map(student => (
                  <label key={student.id} className="flex items-center gap-sm text-sm" style={{ cursor: 'pointer', padding: '0.25rem 0' }}>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds([...selectedStudentIds, student.id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                        }
                      }}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    <span>{student.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-secondary" style={{ padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontStyle: 'italic' }}>
                No students are currently enrolled in this course. They must enroll from their course dashboard.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">Submission Due Date</label>
              <input
                id="dueDate"
                type="datetime-local"
                className="form-input text-sm"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maxMarks">Max Marks</label>
              <input
                id="maxMarks"
                type="number"
                className="form-input text-sm"
                value={form.max_marks}
                onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                required
                min={1}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="estTime">Estimated Workload</label>
              <input
                id="estTime"
                type="text"
                className="form-input text-sm"
                placeholder="e.g. 5 hours"
                value={form.estimated_time}
                onChange={(e) => setForm({ ...form, estimated_time: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="maxFileSize">Max File Size (MB)</label>
              <input
                id="maxFileSize"
                type="number"
                className="form-input text-sm"
                value={form.max_file_size}
                onChange={(e) => setForm({ ...form, max_file_size: e.target.value })}
                required
                min={1}
                max={100}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="allowedTypes">Allowed File Extensions</label>
              <input
                id="allowedTypes"
                type="text"
                className="form-input text-sm"
                placeholder="e.g. pdf,zip,doc,docx"
                value={form.allowed_file_types}
                onChange={(e) => setForm({ ...form, allowed_file_types: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="status">Creation State</label>
              <select
                id="status"
                className="form-select text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="published">Published (Visible immediately)</option>
                <option value="draft">Draft (Stay invisible)</option>
              </select>
            </div>
          </div>

          <div className="form-group flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <input
              type="checkbox"
              id="lateAllowed"
              checked={form.late_allowed}
              onChange={(e) => setForm({ ...form, late_allowed: e.target.checked })}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="lateAllowed" className="text-sm text-secondary" style={{ cursor: 'pointer', select: 'none' }}>
              Allow student submissions after the deadline (Late Submissions)
            </label>
          </div>

          <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Coursework'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    }>
      <NewAssignmentForm />
    </Suspense>
  );
}
