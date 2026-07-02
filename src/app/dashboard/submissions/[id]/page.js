'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState('');

  // Grading form states
  const [gradeForm, setGradeForm] = useState({
    marks: '',
    feedback: '',
    decision: 'approve', // 'approve' | 'reject' | 'return'
    isDraft: false
  });

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/submissions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);
        if (data.submission.marks !== null && data.submission.marks !== undefined) {
          setGradeForm({
            marks: data.submission.marks,
            feedback: data.submission.feedback || '',
            decision: data.submission.status === 'approved' ? 'approve' :
                      data.submission.status === 'rejected' ? 'reject' :
                      data.submission.status === 'returned' ? 'return' : 'approve',
            isDraft: data.submission.is_draft === 1
          });
        }
      } else {
        router.push('/dashboard/submissions');
      }
    } catch (err) {
      console.error('Failed to fetch submission:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setGrading(true);
    setError('');

    try {
      const res = await fetch(`/api/submissions/${id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marks: Number(gradeForm.marks),
          feedback: gradeForm.feedback,
          decision: gradeForm.decision,
          isDraft: gradeForm.isDraft
        }),
      });

      if (res.ok) {
        fetchSubmission();
        alert(gradeForm.isDraft ? 'Draft grade saved successfully.' : 'Grades published successfully.');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Grading request failed.');
    } finally {
      setGrading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!submission) {
    return <div className="empty-state"><div className="empty-state-title">Submission not found</div></div>;
  }

  const isGraded = submission.marks !== null && submission.marks !== undefined;
  const isDraftGrade = submission.is_draft === 1;

  // Percentage calculations (only if published or teacher viewing)
  const showMarks = !isDraftGrade || user?.role !== 'student';
  const percentage = isGraded && showMarks ? Math.round((submission.marks / submission.max_marks) * 100) : null;

  return (
    <div className="animate-slideUp">
      <div className="glass-card detail-header" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
        <h1>Submission Assessment</h1>
        <div className="detail-meta">
          <span className="detail-meta-item">Assignment: <strong>{submission.assignment_title}</strong></span>
          <span className="detail-meta-item">Course Code: <strong>{submission.course_code} — {submission.course_title}</strong></span>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 'var(--spacing-lg)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
        {/* Left Column: Submission Details */}
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Submission Information</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div>
              <span className="text-xs text-muted">Unique Submission ID</span>
              <p className="text-sm font-semibold">{submission.submission_id}</p>
            </div>

            <div>
              <span className="text-xs text-muted">Student Details</span>
              <div className="flex items-center gap-md" style={{ marginTop: '0.25rem' }}>
                <div className="sidebar-avatar" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                  {submission.student_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{submission.student_name}</p>
                  <p className="text-xs text-secondary">{submission.student_email} (ID: {submission.enrollment_number || 'N/A'})</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted">File Submitted</span>
              <p className="text-sm font-semibold" style={{ marginTop: '0.25rem' }}>
                <Link href={`/api/submissions/${submission.id}`} className="text-sm font-semibold" style={{ textDecoration: 'underline' }}>
                  📄 {submission.file_name}
                </Link>
                <span className="text-xs text-muted" style={{ marginLeft: '0.5rem' }}>
                  ({Math.round(submission.file_size / 1024)} KB)
                </span>
              </p>
            </div>

            <div>
              <span className="text-xs text-muted">Submitted Date/Time</span>
              <p className="text-sm font-semibold" style={{ marginTop: '0.25rem' }}>{formatDate(submission.submitted_at)}</p>
            </div>

            <div>
              <span className="text-xs text-muted">Deadline Target</span>
              <p className="text-sm font-semibold" style={{ marginTop: '0.25rem' }}>{formatDate(submission.due_date)}</p>
            </div>

            <div>
              <span className="text-xs text-muted">Workflow Status</span>
              <div style={{ marginTop: '0.25rem' }}>
                <span className={`badge badge-${submission.status === 'graded' || submission.status === 'approved' ? 'graded' : submission.status === 'rejected' ? 'late' : 'pending'}`}>
                  {submission.status.toUpperCase().replace('_', ' ')}
                </span>
                {submission.delay_minutes > 0 && (
                  <span className="badge badge-late" style={{ marginLeft: '0.5rem' }}>
                    Late by {Math.round(submission.delay_minutes / 60)} hours
                  </span>
                )}
              </div>
            </div>

            {submission.remarks && (
              <div>
                <span className="text-xs text-muted">Student Remarks</span>
                <p className="text-sm text-secondary" style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                  {submission.remarks}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assessment Result / Form */}
        <div>
          {/* Released Grade Display */}
          {percentage !== null && showMarks && (
            <div className="glass-card stat-card green" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3>Published Assessment</h3>
                {isDraftGrade && <span className="badge badge-pending">Draft Grade</span>}
              </div>
              <div className="text-center">
                <div className="stat-value" style={{ fontSize: '2.5rem' }}>
                  {submission.marks} / {submission.max_marks}
                </div>
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <div className="progress-bar" style={{ height: '8px' }}>
                    <div className="progress-bar-fill" style={{
                      width: `${percentage}%`,
                      background: percentage >= 80 ? 'var(--gradient-success)' :
                        percentage >= 50 ? 'var(--gradient-primary)' :
                          'linear-gradient(135deg, #ef4444, #dc2626)'
                    }}></div>
                  </div>
                  <p className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>Overall Score: {percentage}%</p>
                </div>
              </div>
              {submission.feedback && (
                <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span className="text-xs text-muted" style={{ display: 'block', fontWeight: 600 }}>Feedback Remarks:</span>
                  <p className="text-sm text-secondary" style={{ marginTop: '0.25rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                    &quot;{submission.feedback}&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Assessment Editor for Instructors */}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <div className="grade-form">
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                {isGraded ? 'Update Assessment' : 'Evaluate Submission'}
              </h3>

              <form onSubmit={handleGradeSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="marks">
                    Marks (Out of {submission.max_marks})
                  </label>
                  <div className="flex items-center gap-md">
                    <input
                      id="marks"
                      type="range"
                      className="grade-slider"
                      min={0}
                      max={submission.max_marks}
                      value={gradeForm.marks || 0}
                      onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      max={submission.max_marks}
                      value={gradeForm.marks}
                      onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                      required
                      style={{ width: '80px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="decision">Submission Decision</label>
                  <select
                    id="decision"
                    className="form-select text-sm"
                    value={gradeForm.decision}
                    onChange={(e) => setGradeForm({ ...gradeForm, decision: e.target.value })}
                  >
                    <option value="approve">Approve Submission</option>
                    <option value="reject">Reject Submission</option>
                    <option value="return">Return for Correction</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="feedback">Written Feedback</label>
                  <textarea
                    id="feedback"
                    className="form-textarea text-sm"
                    placeholder="Enter rubric details or specific correction notes..."
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="form-group flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <input
                    type="checkbox"
                    id="saveDraft"
                    checked={gradeForm.isDraft}
                    onChange={(e) => setGradeForm({ ...gradeForm, isDraft: e.target.checked })}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor="saveDraft" className="text-sm text-secondary" style={{ cursor: 'pointer', select: 'none' }}>
                    Save as Draft (Do not release marks/notifications to student yet)
                  </label>
                </div>

                <button type="submit" className="btn btn-success w-full" disabled={grading}>
                  {grading ? 'Processing...' : isGraded ? 'Update Assessment' : 'Publish Grade'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
