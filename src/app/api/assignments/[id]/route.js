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

    if (user.role === 'faculty') {
      const targetQuery = assignment.target_students 
        ? assignment.target_students.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      let allStudents = db.prepare(`
        SELECT u.id, u.name, u.email, u.enrollment_number
        FROM course_enrollments ce
        JOIN users u ON ce.student_id = u.id
        WHERE ce.course_id = ?
        AND u.department = ?
        AND u.semester = ?
        AND u.section = ?
      `).all(assignment.course_id, assignment.department, assignment.semester, assignment.section);

      if (targetQuery.length > 0) {
        allStudents = allStudents.filter(s => targetQuery.includes(String(s.id)));
      }

      submissions = allStudents.map(student => {
        const sub = db.prepare(`
          SELECT s.id, s.file_name, s.file_size, s.submitted_at, s.remarks, s.delay_minutes, s.status,
            g.marks, g.feedback, g.graded_at, g.is_draft
          FROM submissions s
          LEFT JOIN grades g ON s.id = g.submission_id
          WHERE s.assignment_id = ? AND s.student_id = ?
        `).get(id, student.id);

        return {
          id: sub?.id || null,
          student_id: student.id,
          student_name: student.name,
          student_email: student.email,
          enrollment_number: student.enrollment_number,
          file_name: sub?.file_name || null,
          file_size: sub?.file_size || null,
          submitted_at: sub?.submitted_at || null,
          remarks: sub?.remarks || '',
          delay_minutes: sub?.delay_minutes || 0,
          status: sub?.status || 'not_started',
          marks: sub?.marks !== undefined && sub?.marks !== null ? sub.marks : null,
          feedback: sub?.feedback || null,
          graded_at: sub?.graded_at || null,
          is_draft: sub?.is_draft || 0
        };
      });
    }

    if (user.role === 'student') {
      const student = db.prepare('SELECT department, course, semester, section FROM users WHERE id = ?').get(user.id);
      const isEnrolled = db.prepare('SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?').get(assignment.course_id, user.id);
      
      const isTargeted = !assignment.target_students || 
                         assignment.target_students.trim() === '' || 
                         assignment.target_students === 'all' || 
                         assignment.target_students.split(',').map(s => s.trim()).includes(String(user.id));

      if (
        !isEnrolled || 
        assignment.status === 'draft' ||
        assignment.department !== student.department ||
        assignment.semester !== student.semester ||
        assignment.section !== student.section ||
        !isTargeted
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

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
    if (user.role !== 'faculty' || Number(assignment.teacher_id) !== Number(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, subject, department, semester, section, assignment_number,
      description, detailed_instructions, supporting_documents, reference_materials,
      due_date, max_marks, status, priority, estimated_time, late_allowed,
      max_file_size, allowed_file_types, target_students
    } = body;

    db.prepare(`
      UPDATE assignments SET
        title = ?, subject = ?, department = ?, semester = ?, section = ?, assignment_number = ?,
        description = ?, detailed_instructions = ?, supporting_documents = ?, reference_materials = ?,
        due_date = ?, max_marks = ?, status = ?, priority = ?, estimated_time = ?,
        late_allowed = ?, max_file_size = ?, allowed_file_types = ?, target_students = ?
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
      target_students ?? assignment.target_students,
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
    if (user.role !== 'faculty' || Number(assignment.teacher_id) !== Number(user.id)) {
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
