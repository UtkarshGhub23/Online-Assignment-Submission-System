import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const assignment = db.prepare(`
      SELECT a.*, c.title as course_title, c.code as course_code, c.teacher_id,
        u.name as created_by_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `).get(id);

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    let submissions = [];
    let mySubmission = null;
    let submissionHistory = [];

    if (user.role === 'teacher' || user.role === 'admin') {
      submissions = db.prepare(`
        SELECT s.*, u.name as student_name, u.email as student_email, u.enrollment_number,
          g.marks, g.feedback, g.graded_at, g.is_draft
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE s.assignment_id = ?
        ORDER BY s.submitted_at DESC
      `).all(id);
    }

    if (user.role === 'student') {
      mySubmission = db.prepare(`
        SELECT s.*, g.marks, g.feedback, g.graded_at, g.is_draft
        FROM submissions s
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE s.assignment_id = ? AND s.student_id = ?
      `).get(id, user.id);

      // Submission history (since it is a single submission per student/assignment in submissions table with a UNIQUE constraint,
      // let's display the current submission details as history entries, or we can fetch previous upload files if we wanted to.
      // For standard history, we will list the active submission details).
      if (mySubmission) {
        submissionHistory = [
          {
            id: mySubmission.id,
            file_name: mySubmission.file_name,
            file_size: mySubmission.file_size,
            submitted_at: mySubmission.submitted_at,
            status: mySubmission.status,
            remarks: mySubmission.remarks,
            submission_id: mySubmission.submission_id
          }
        ];
      }
    }

    const enrolledCount = db.prepare(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ?'
    ).get(assignment.course_id);

    return NextResponse.json({
      assignment: {
        ...assignment,
        submissions,
        my_submission: mySubmission,
        submission_history: submissionHistory,
        enrolled_count: enrolledCount.count,
      },
    });
  } catch (error) {
    console.error('Assignment GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const assignment = db.prepare(`
      SELECT a.*, c.teacher_id FROM assignments a
      JOIN courses c ON a.course_id = c.id WHERE a.id = ?
    `).get(id);

    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    if (user.role !== 'admin' && assignment.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, subject, department, semester, section, assignment_number,
      description, detailed_instructions, supporting_documents, reference_materials,
      due_date, max_marks, status, priority, estimated_time, late_allowed,
      max_file_size, allowed_file_types
    } = body;

    db.prepare(`
      UPDATE assignments SET
        title = ?, subject = ?, department = ?, semester = ?, section = ?, assignment_number = ?,
        description = ?, detailed_instructions = ?, supporting_documents = ?, reference_materials = ?,
        due_date = ?, max_marks = ?, status = ?, priority = ?, estimated_time = ?,
        late_allowed = ?, max_file_size = ?, allowed_file_types = ?
      WHERE id = ?
    `).run(
      title || assignment.title,
      subject ?? assignment.subject,
      department ?? assignment.department,
      semester ?? assignment.semester,
      section ?? assignment.section,
      assignment_number ?? assignment.assignment_number,
      description ?? assignment.description,
      detailed_instructions ?? assignment.detailed_instructions,
      supporting_documents ?? assignment.supporting_documents,
      reference_materials ?? assignment.reference_materials,
      due_date || assignment.due_date,
      max_marks || assignment.max_marks,
      status || assignment.status,
      priority || assignment.priority,
      estimated_time ?? assignment.estimated_time,
      late_allowed !== undefined ? (late_allowed ? 1 : 0) : assignment.late_allowed,
      max_file_size || assignment.max_file_size,
      allowed_file_types || assignment.allowed_file_types,
      id
    );

    // Record activity log
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'ASSIGNMENT_UPDATED', `Updated assignment details for "${title || assignment.title}".`);

    // Notify enrolled students of update
    const enrolledStudents = db.prepare(
      'SELECT student_id FROM course_enrollments WHERE course_id = ?'
    ).all(assignment.course_id);

    const insertNotif = db.prepare(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
    );

    for (const student of enrolledStudents) {
      insertNotif.run(
        student.student_id,
        'Assignment Details Updated',
        `The details for assignment "${title || assignment.title}" have been updated.`,
        'assignment',
        `/dashboard/assignments/${id}`
      );
    }

    const updated = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error('Assignment PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const assignment = db.prepare(`
      SELECT a.*, c.teacher_id FROM assignments a
      JOIN courses c ON a.course_id = c.id WHERE a.id = ?
    `).get(id);

    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    if (user.role !== 'admin' && assignment.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM assignments WHERE id = ?').run(id);

    // Record activity log
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'ASSIGNMENT_DELETED', `Deleted assignment "${assignment.title}".`);

    return NextResponse.json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error('Assignment DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
