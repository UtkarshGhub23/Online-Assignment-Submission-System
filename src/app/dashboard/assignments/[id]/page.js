'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'submit' | 'delete' | 'duplicate' | 'archive' | 'close' | 'publish'
  const fileInputRef = useRef(null);

  // Edit Assignment Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [courseStudents, setCourseStudents] = useState([]);
  const [editForm, setEditForm] = useState({
    title: '',
    subject: '',
    department: '',
    semester: '',
    section: '',
    assignment_number: '',
    description: '',
    detailed_instructions: '',
    due_date: '',
    max_marks: 100,
    priority: 'medium',
    estimated_time: '',
    late_allowed: false,
    max_file_size: 10,
    allowed_file_types: ''
  });
  const [editSelectedStudentIds, setEditSelectedStudentIds] = useState([]);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  useEffect(() => {
    if (!assignment) return;

    const timer = setInterval(() => {
      const total = Date.parse(assignment.due_date) - Date.parse(new Date());
      if (total <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        clearInterval(timer);
      } else {
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        setTimeLeft({ days, hours, minutes, seconds, total });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assignment]);

  const fetchAssignment = async () => {
    try {
      const res = await fetch(`/api/assignments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignment(data.assignment);
      } else {
        router.push('/dashboard/assignments');
      }
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Check size
    const limitBytes = assignment.max_file_size * 1024 * 1024;
    if (file.size > limitBytes) {
      alert(`File size exceeds the limit of ${assignment.max_file_size}MB.`);
      return;
    }

    // Check type
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedStr = assignment.allowed_file_types || '';
    if (allowedStr.trim()) {
      const allowed = allowedStr.split(',').map(t => t.trim().toLowerCase());
      if (!allowed.includes(ext)) {
        alert(`Invalid format. Allowed formats: ${assignment.allowed_file_types}`);
        return;
      }
    }

    setSelectedFile(file);
  };

  const executeConfirmAction = async () => {
    setShowConfirm(false);
    if (confirmAction === 'submit') {
      await executeSubmit();
    } else if (confirmAction === 'delete') {
      await executeDelete();
    } else if (confirmAction === 'duplicate') {
      await executeDuplicate();
    } else if (confirmAction === 'archive') {
      await executeUpdateStatus('archived');
    } else if (confirmAction === 'close') {
      await executeUpdateStatus('closed');
    } else if (confirmAction === 'publish') {
      await executeUpdateStatus('published');
    }
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('assignment_id', id);
      formData.append('remarks', remarks);

      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        setRemarks('');
        fetchAssignment();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/assignments');
      }
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const executeDuplicate = async () => {
    try {
      const res = await fetch(`/api/assignments/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/assignments/${data.assignment.id}`);
      }
    } catch (err) {
      alert('Duplication failed');
    }
  };

  const executeUpdateStatus = async (newStatus) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAssignment();
      }
    } catch (err) {
      alert('Status change failed');
    }
  };

  const handleOpenEdit = async () => {
    if (!assignment) return;
    setEditForm({
      title: assignment.title,
      subject: assignment.subject || '',
      department: assignment.department || 'Computer Science',
      semester: assignment.semester || 'Semester 3',
      section: assignment.section || 'Section A',
      assignment_number: assignment.assignment_number || '',
      description: assignment.description || '',
      detailed_instructions: assignment.detailed_instructions || '',
      due_date: new Date(assignment.due_date).toISOString().slice(0, 16),
      max_marks: assignment.max_marks || 100,
      priority: assignment.priority || 'medium',
      estimated_time: assignment.estimated_time || '',
      late_allowed: assignment.late_allowed === 1,
      max_file_size: assignment.max_file_size || 10,
      allowed_file_types: assignment.allowed_file_types || ''
    });

    const parsedTargets = assignment.target_students
      ? assignment.target_students.split(',').map(s => Number(s.trim())).filter(Boolean)
      : [];
    setEditSelectedStudentIds(parsedTargets);

    try {
      const res = await fetch(`/api/courses/${assignment.course_id}`);
      if (res.ok) {
        const data = await res.json();
        setCourseStudents(data.course.students || []);
      }
    } catch (err) {
      console.error('Failed to load course students for edit:', err);
    }
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          max_marks: Number(editForm.max_marks),
          max_file_size: Number(editForm.max_file_size),
          due_date: new Date(editForm.due_date).toISOString(),
          late_allowed: editForm.late_allowed ? 1 : 0,
          target_students: editSelectedStudentIds.length > 0 ? editSelectedStudentIds.join(',') : ''
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchAssignment();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update assignment');
      }
    } catch (err) {
      alert('Error updating assignment');
    }
  };

  const triggerAction = (actionName) => {
    setConfirmAction(actionName);
    setShowConfirm(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!assignment) {
    return <div className="empty-state"><div className="empty-state-title">Assignment not found</div></div>;
  }

  return (
    <div className="animate-slideUp">
      {/* Assignment Header */}
      <div className="glass-card detail-header" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <div>
            <span className="course-card-code" style={{ marginRight: '0.5rem' }}>{assignment.assignment_number}</span>
            <span className={`badge badge-${assignment.priority === 'high' ? 'late' : assignment.priority === 'medium' ? 'pending' : 'graded'}`} style={{ fontSize: '0.7rem' }}>
              {assignment.priority.toUpperCase()} PRIORITY
            </span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>{assignment.title}</h1>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
              Subject: {assignment.subject} | Course: {assignment.course_code} — {assignment.course_title}
            </p>
          </div>
          <div className="flex gap-sm">
            {(user?.role === 'faculty' || user?.role === 'admin') && (
              <>
                {assignment.status === 'draft' && (
                  <button className="btn btn-sm btn-success" onClick={() => triggerAction('publish')}>Publish</button>
                )}
                {assignment.status === 'published' && (
                  <button className="btn btn-sm btn-secondary" onClick={() => triggerAction('close')}>Close</button>
                )}
                <button className="btn btn-sm btn-primary" onClick={handleOpenEdit}>Edit Details</button>
                <button className="btn btn-sm btn-secondary" onClick={() => triggerAction('duplicate')}>Duplicate</button>
                {assignment.status !== 'archived' && (
                  <button className="btn btn-sm btn-secondary" onClick={() => triggerAction('archive')}>Archive</button>
                )}
                <button className="btn btn-sm btn-danger" onClick={() => triggerAction('delete')}>Delete</button>
              </>
            )}
          </div>
        </div>

        <div className="detail-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
          <div>
            <span className="text-xs text-muted">Department / Semester</span>
            <p className="text-sm font-semibold">{assignment.department} — {assignment.semester}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Section</span>
            <p className="text-sm font-semibold">{assignment.section}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Instructor</span>
            <p className="text-sm font-semibold">{assignment.created_by_name}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Maximum Marks</span>
            <p className="text-sm font-semibold">{assignment.max_marks}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Estimated Completion Time</span>
            <p className="text-sm font-semibold">{assignment.estimated_time || 'N/A'}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Late Submission Allowed</span>
            <p className="text-sm font-semibold">{assignment.late_allowed ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Max File Size / Allowed Types</span>
            <p className="text-sm font-semibold">{assignment.max_file_size}MB / {assignment.allowed_file_types}</p>
          </div>
          <div>
            <span className="text-xs text-muted">Submission Deadline</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent-primary-light)' }}>{formatDate(assignment.due_date)}</p>
          </div>
        </div>

        {assignment.description && (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <span className="text-xs text-muted">Description</span>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{assignment.description}</p>
          </div>
        )}

        {assignment.detailed_instructions && (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <span className="text-xs text-muted">Detailed Instructions</span>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{assignment.detailed_instructions}</p>
          </div>
        )}
      </div>

      {/* Countdown Timer for Students */}
      {user?.role === 'student' && !assignment.my_submission && (
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)', background: timeLeft.total === 0 ? 'rgba(239, 68, 68, 0.04)' : 'rgba(99, 102, 241, 0.04)', borderColor: timeLeft.total === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)' }}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Remaining Submission Time:</span>
            {timeLeft.total > 0 ? (
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <span className="badge badge-graded" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>{timeLeft.days}d</span>
                <span className="badge badge-graded" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>{timeLeft.hours}h</span>
                <span className="badge badge-graded" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>{timeLeft.minutes}m</span>
                <span className="badge badge-graded" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>{timeLeft.seconds}s</span>
              </div>
            ) : (
              <span className="badge badge-late" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>Deadline Passed</span>
            )}
          </div>
        </div>
      )}

      {/* Student: Submission form */}
      {user?.role === 'student' && (
        !assignment.my_submission ||
        (assignment.my_submission && new Date() < new Date(assignment.due_date)) ||
        (assignment.my_submission && (assignment.my_submission.status === 'rejected' || assignment.my_submission.status === 'returned'))
      ) && (
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
          <h3>
            {!assignment.my_submission
              ? 'Submit Assignment'
              : assignment.my_submission.status === 'rejected'
                ? '🔄 Resubmit Assignment (Rejected)'
                : assignment.my_submission.status === 'returned'
                  ? '🔄 Resubmit Assignment (Returned for Correction)'
                  : 'Replace Your Submission'}
          </h3>
          {(assignment.my_submission?.status === 'rejected' || assignment.my_submission?.status === 'returned') && (
            <div style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'rgba(239, 68, 68, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent-danger)', marginBottom: '0.25rem' }}>
                Faculty Feedback:
              </p>
              <p className="text-xs text-secondary" style={{ fontStyle: 'italic' }}>
                {assignment.my_submission.feedback || 'No feedback provided. Please review requirements and resubmit.'}
              </p>
            </div>
          )}
          <p className="text-xs text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
            Upload assignment files before the due date. Drag and drop files directly or click browse.
          </p>

          <div
            className={`file-upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <div className="upload-icon" style={{ opacity: 0.6, fontSize: '2rem' }}>📁</div>
            {selectedFile ? (
              <div>
                <p className="upload-text" style={{ color: 'var(--accent-success)' }}>
                  Selected File: {selectedFile.name}
                </p>
                <p className="upload-hint">Size: {formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <div>
                <p className="upload-text">Click or drag files here to select submission file</p>
                <p className="upload-hint">Max file size allowed: {assignment.max_file_size}MB</p>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
            <label className="form-label" htmlFor="submissionRemarks">Remarks (Optional)</label>
            <textarea
              id="submissionRemarks"
              className="form-textarea text-sm"
              placeholder="Enter comments or submission remarks for the instructor..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>

          {selectedFile && (
            <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedFile(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => triggerAction('submit')} disabled={submitting}>
                {submitting ? 'Uploading...' : 'Submit Coursework'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Student: Current active submission & grading results */}
      {user?.role === 'student' && assignment.my_submission && (
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Active Coursework Submission</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div>
              <span className="text-xs text-muted">Submission ID</span>
              <p className="text-sm font-semibold">{assignment.my_submission.submission_id}</p>
            </div>
            <div>
              <span className="text-xs text-muted">File Submitted</span>
              <p className="text-sm font-semibold">📄 {assignment.my_submission.file_name}</p>
            </div>
            <div>
              <span className="text-xs text-muted">Submission Date/Time</span>
              <p className="text-sm font-semibold">{formatDate(assignment.my_submission.submitted_at)}</p>
            </div>
            <div>
              <span className="text-xs text-muted">Workflow Status</span>
              <div>
                <span className={`badge badge-${assignment.my_submission.status === 'graded' || assignment.my_submission.status === 'approved' ? 'graded' : assignment.my_submission.status === 'rejected' ? 'late' : 'pending'}`}>
                  {assignment.my_submission.status.toUpperCase().replace('_', ' ')}
                </span>
              </div>
            </div>
            {assignment.my_submission.marks !== null && assignment.my_submission.marks !== undefined && !assignment.my_submission.is_draft && (
              <div>
                <span className="text-xs text-muted">Marks Released</span>
                <p className="stat-value" style={{ fontSize: '1.25rem' }}>
                  {assignment.my_submission.marks} / {assignment.max_marks}
                </p>
              </div>
            )}
          </div>

          {assignment.my_submission.remarks && (
            <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
              <span className="text-xs text-muted">My Submission Remarks:</span>
              <p className="text-xs text-secondary" style={{ marginTop: '0.1rem' }}>{assignment.my_submission.remarks}</p>
            </div>
          )}

          {assignment.my_submission.feedback && !assignment.my_submission.is_draft && (
            <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span className="text-xs text-muted" style={{ display: 'block', fontWeight: 600 }}>Instructor Assessment & Feedback</span>
              <p className="text-sm text-secondary" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>&quot;{assignment.my_submission.feedback}&quot;</p>
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: '0.5rem', textAlign: 'right' }}>
                Reviewed on {formatDate(assignment.my_submission.graded_at)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Teacher: Enrolled Submissions table */}
      {(user?.role === 'faculty' || user?.role === 'admin') && (
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Submissions Registry ({assignment.submissions?.length || 0} / {assignment.enrolled_count})</h3>
          {assignment.submissions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Enrollment No</th>
                    <th>Student Name</th>
                    <th>Submitted File</th>
                    <th>Submitted At</th>
                    <th>Workflow Status</th>
                    <th>Remarks</th>
                    <th>Grade / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.submissions.map((sub) => (
                    <tr key={sub.id || `not-sub-${sub.student_id}`}>
                      <td><span className="course-card-code" style={{ fontSize: '0.625rem' }}>{sub.enrollment_number || 'N/A'}</span></td>
                      <td>
                        <div className="flex items-center gap-sm">
                          <div className="sidebar-avatar" style={{ width: 24, height: 24, fontSize: '0.7rem' }}>{sub.student_name?.charAt(0)}</div>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{sub.student_name}</span>
                        </div>
                      </td>
                      <td className="text-xs font-medium">
                        {sub.id ? (
                          <Link href={`/api/submissions/${sub.id}/file`} target="_blank" className="text-xs font-semibold" style={{ textDecoration: 'underline' }}>
                            📄 {sub.file_name}
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Not Submitted</span>
                        )}
                      </td>
                      <td className="text-xs">{formatDate(sub.submitted_at)}</td>
                      <td>
                        <span className={`badge badge-${
                          sub.status === 'graded' || sub.status === 'approved' ? 'graded' :
                          sub.status === 'rejected' ? 'late' :
                          sub.status === 'returned' ? 'pending' :
                          sub.status === 'not_started' ? 'secondary' : 'pending'
                        }`}>
                          {sub.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-xs text-secondary" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.remarks || '—'}
                      </td>
                      <td>
                        {sub.id ? (
                          <Link href={`/dashboard/submissions/${sub.id}`} className="btn btn-sm btn-primary">
                            {sub.marks !== null && !sub.is_draft ? `Review (${sub.marks})` : 'Grade'}
                          </Link>
                        ) : (
                          <button className="btn btn-sm btn-secondary" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                            Grade
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-title">No submissions compiled</div>
              <div className="empty-state-text">Enrolled students have not submitted coursework files.</div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Action</h3>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--spacing-xl)', lineHeight: 1.5 }}>
              Are you sure you want to {confirmAction} this assignment entry? This action is permanent and will affect the student dashboard registry.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={executeConfirmAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Assignment Details</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ marginTop: 'var(--spacing-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editTitle">Assignment Title</label>
                  <input
                    id="editTitle"
                    type="text"
                    className="form-input text-sm"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editSubject">Subject Topic</label>
                  <input
                    id="editSubject"
                    type="text"
                    className="form-input text-sm"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-xs)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editDept">Department</label>
                  <select
                    id="editDept"
                    className="form-select text-xs"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editSem">Semester</label>
                  <select
                    id="editSem"
                    className="form-select text-xs"
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editSec">Section</label>
                  <select
                    id="editSec"
                    className="form-select text-xs"
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editDesc">Description</label>
                <textarea
                  id="editDesc"
                  className="form-textarea text-xs"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editInstr">Detailed Instructions</label>
                <textarea
                  id="editInstr"
                  className="form-textarea text-xs"
                  value={editForm.detailed_instructions}
                  onChange={(e) => setEditForm({ ...editForm, detailed_instructions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Specific Students (Optional)</label>
                {courseStudents.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--spacing-xs)', padding: 'var(--spacing-sm)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', maxHeight: '100px', overflowY: 'auto' }}>
                    {courseStudents.map(student => (
                      <label key={student.id} className="flex items-center gap-xs text-xs" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editSelectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditSelectedStudentIds([...editSelectedStudentIds, student.id]);
                            } else {
                              setEditSelectedStudentIds(editSelectedStudentIds.filter(id => id !== student.id));
                            }
                          }}
                          style={{ width: 'auto' }}
                        />
                        <span>{student.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No students enrolled in this course.</p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editDueDate">Due Date</label>
                  <input
                    id="editDueDate"
                    type="datetime-local"
                    className="form-input text-xs"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editMaxMarks">Max Marks</label>
                  <input
                    id="editMaxMarks"
                    type="number"
                    className="form-input text-xs"
                    value={editForm.max_marks}
                    onChange={(e) => setEditForm({ ...editForm, max_marks: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editPriority">Priority</label>
                  <select
                    id="editPriority"
                    className="form-select text-xs"
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editFileTypes">Allowed File Extensions</label>
                  <input
                    id="editFileTypes"
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. pdf,zip,png"
                    value={editForm.allowed_file_types}
                    onChange={(e) => setEditForm({ ...editForm, allowed_file_types: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.25rem' }}>
                  <label className="flex items-center gap-sm text-xs" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.late_allowed}
                      onChange={(e) => setEditForm({ ...editForm, late_allowed: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    <span>Allow Late Submissions</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
