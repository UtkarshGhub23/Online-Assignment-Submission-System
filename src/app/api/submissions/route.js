import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const semester = searchParams.get('semester') || '';
    const department = searchParams.get('department') || '';

    const db = getDb();
    let queryConditions = [];
    let queryParams = [];

    if (user.role === 'faculty') {
      queryConditions.push('c.teacher_id = ?');
      queryParams.push(user.id);
    } else if (user.role === 'student') {
      queryConditions.push('s.student_id = ?');
      queryParams.push(user.id);
    }

    if (search) {
      queryConditions.push('(u.name LIKE ? OR a.title LIKE ? OR s.submission_id LIKE ? OR c.code LIKE ?)');
      const wild = `%${search}%`;
      queryParams.push(wild, wild, wild, wild);
    }

    if (status) {
      queryConditions.push('s.status = ?');
      queryParams.push(status);
    }

    if (semester) {
      queryConditions.push('u.semester = ?');
      queryParams.push(semester);
    }

    if (department) {
      queryConditions.push('u.department = ?');
      queryParams.push(department);
    }

    const whereClause = queryConditions.length > 0 ? 'WHERE ' + queryConditions.join(' AND ') : '';

    const sql = `
      SELECT s.*, u.name as student_name, u.email as student_email, u.enrollment_number,
        a.title as assignment_title, a.max_marks, a.due_date, a.late_allowed,
        c.title as course_title, c.code as course_code,
        g.marks, g.feedback, g.graded_at, g.is_draft
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN grades g ON s.id = g.submission_id
      ${whereClause}
      ORDER BY s.submitted_at DESC
    `;

    const submissions = db.prepare(sql).all(...queryParams);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Submissions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const assignmentId = formData.get('assignment_id');
    const remarks = formData.get('remarks') || '';

    if (!file || !assignmentId) {
      return NextResponse.json(
        { error: 'File and assignment ID are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check assignment details
    const assignment = db.prepare(`
      SELECT a.*, c.title as course_title FROM assignments a
      JOIN courses c ON a.course_id = c.id WHERE a.id = ?
    `).get(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if the assignment is active/published
    if (assignment.status !== 'published') {
      return NextResponse.json({ error: 'This assignment is not accepting submissions.' }, { status: 400 });
    }

    // Check enrollment
    const enrolled = db.prepare(
      'SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?'
    ).get(assignment.course_id, user.id);
    if (!enrolled) {
      return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 403 });
    }

    // File type validation
    const ext = path.extname(file.name).toLowerCase().replace('.', '');
    const allowedStr = assignment.allowed_file_types || '';
    if (allowedStr.trim()) {
      const allowedTypes = allowedStr.split(',').map(t => t.trim().toLowerCase());
      if (!allowedTypes.includes(ext)) {
        return NextResponse.json(
          { error: `File type not allowed. Approved formats: ${assignment.allowed_file_types}` },
          { status: 400 }
        );
      }
    }

    // File size validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const maxBytes = assignment.max_file_size * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return NextResponse.json(
        { error: `File size exceeds the limit of ${assignment.max_file_size}MB.` },
        { status: 400 }
      );
    }

    // Check deadline constraints
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;

    if (isLate && assignment.late_allowed !== 1) {
      return NextResponse.json(
        { error: 'Deadline passed. Late submissions are not allowed for this assignment.' },
        { status: 400 }
      );
    }

    // Check for existing submission
    const existing = db.prepare(
      'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?'
    ).get(assignmentId, user.id);

    if (existing) {
      const isRejectedOrReturned = existing.status === 'rejected' || existing.status === 'returned';

      // Block resubmission after deadline UNLESS the submission was rejected/returned by faculty
      if (isLate && !isRejectedOrReturned) {
        return NextResponse.json(
          { error: 'Cannot replace submission after the deadline.' },
          { status: 400 }
        );
      }

      // If rejected/returned, clear the old grade so faculty can re-evaluate
      if (isRejectedOrReturned) {
        db.prepare('DELETE FROM grades WHERE submission_id = ?').run(existing.id);
      }

      // Delete old file
      try {
        if (fs.existsSync(existing.file_path)) {
          fs.unlinkSync(existing.file_path);
        }
      } catch (err) {
        console.error('Failed to delete old submission file:', err);
      }

      // Save new file
      const uploadsDir = path.join(process.cwd(), 'uploads', String(assignmentId));
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${user.id}_${Date.now()}_${file.name}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const delayMinutes = Math.max(0, Math.floor((now - dueDate) / 60000));
      const subStatus = delayMinutes > 0 ? 'late_submission' : 'submitted';

      db.prepare(`
        UPDATE submissions SET
          file_path = ?, file_name = ?, file_size = ?, submitted_at = CURRENT_TIMESTAMP,
          status = ?, remarks = ?, delay_minutes = ?
        WHERE id = ?
      `).run(filePath, file.name, buffer.length, subStatus, remarks, delayMinutes, existing.id);

      // Record activity
      db.prepare(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
      ).run(user.id, 'SUBMISSION_REPLACED', `Replaced submission file for "${assignment.title}".`);

      // Notify Teacher
      db.prepare(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
      ).run(
        assignment.created_by,
        'Submission Replaced',
        `${user.name} replaced their submission for "${assignment.title}".`,
        'assignment',
        `/dashboard/submissions/${existing.id}`
      );

      return NextResponse.json({ message: 'Submission replaced successfully' });
    } else {
      // Create new submission
      const uploadsDir = path.join(process.cwd(), 'uploads', String(assignmentId));
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${user.id}_${Date.now()}_${file.name}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const delayMinutes = Math.max(0, Math.floor((now - dueDate) / 60000));
      const subStatus = delayMinutes > 0 ? 'late_submission' : 'submitted';
      const submissionUniqueId = 'SUB-' + Math.floor(100000 + Math.random() * 900000);

      const result = db.prepare(`
        INSERT INTO submissions (
          assignment_id, student_id, file_path, file_name, file_size, status, remarks, submission_id, delay_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(assignmentId, user.id, filePath, file.name, buffer.length, subStatus, remarks, submissionUniqueId, delayMinutes);

      // Record activity
      db.prepare(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
      ).run(user.id, 'SUBMISSION_UPLOADED', `Submitted file for "${assignment.title}".`);

      // Notify Teacher
      db.prepare(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
      ).run(
        assignment.created_by,
        'New Submission Received',
        `${user.name} submitted "${assignment.title}"${delayMinutes > 0 ? ' (Late)' : ''}.`,
        'assignment',
        `/dashboard/submissions/${result.lastInsertRowid}`
      );

      // Send confirmation notification to student
      db.prepare(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
      ).run(
        user.id,
        'Submission Successful',
        `Successfully submitted "${assignment.title}". ID: ${submissionUniqueId}.`,
        'success',
        `/dashboard/assignments/${assignmentId}`
      );

      const newSub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);
      return NextResponse.json({ submission: newSub }, { status: 201 });
    }
  } catch (error) {
    console.error('Submissions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
