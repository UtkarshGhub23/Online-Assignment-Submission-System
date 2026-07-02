import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const semester = searchParams.get('semester') || '';
    const priority = searchParams.get('priority') || '';

    const db = getDb();
    let queryParams = [];
    let queryConditions = [];

    // Filter by Course
    if (courseId) {
      queryConditions.push('a.course_id = ?');
      queryParams.push(courseId);
    }

    // Role-based scoping
    if (user.role === 'faculty') {
      queryConditions.push('c.teacher_id = ?');
      queryParams.push(user.id);
    } else if (user.role === 'student') {
      // Must be enrolled or course must be open to them
      queryConditions.push('ce.student_id = ?');
      queryParams.push(user.id);
      // Students should not see draft assignments
      queryConditions.push("a.status != 'draft'");
    }

    // Search query
    if (search) {
      queryConditions.push('(a.title LIKE ? OR a.subject LIKE ? OR c.code LIKE ? OR c.title LIKE ? OR a.assignment_number LIKE ?)');
      const wild = `%${search}%`;
      queryParams.push(wild, wild, wild, wild, wild);
    }

    // Status filter
    if (status) {
      queryConditions.push('a.status = ?');
      queryParams.push(status);
    }

    // Semester filter
    if (semester) {
      queryConditions.push('a.semester = ?');
      queryParams.push(semester);
    }

    // Priority filter
    if (priority) {
      queryConditions.push('a.priority = ?');
      queryParams.push(priority);
    }

    const whereClause = queryConditions.length > 0 ? 'WHERE ' + queryConditions.join(' AND ') : '';

    let sql = `
      SELECT a.*, c.title as course_title, c.code as course_code, c.teacher_id,
        u.name as teacher_name,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count,
        s.id as submission_id, s.status as submission_status, s.submitted_at,
        g.marks, g.feedback
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
    `;

    if (user.role === 'student') {
      sql += `
        JOIN course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ce.student_id
        LEFT JOIN grades g ON s.id = g.submission_id
      `;
    } else {
      sql += `
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN submissions s ON a.id = s.assignment_id
        LEFT JOIN grades g ON s.id = g.submission_id
      `;
    }

    sql += ` ${whereClause} GROUP BY a.id ORDER BY a.due_date ASC`;

    const assignments = db.prepare(sql).all(...queryParams);
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Assignments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'faculty') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      course_id, title, subject, department, semester, section, assignment_number,
      description, detailed_instructions, supporting_documents, reference_materials,
      due_date, max_marks, status, priority, estimated_time, late_allowed,
      max_file_size, allowed_file_types
    } = body;

    if (!course_id || !title || !due_date) {
      return NextResponse.json(
        { error: 'Course, title, and due date are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check course ownership
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if (course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = db.prepare(`
      INSERT INTO assignments (
        course_id, title, subject, department, semester, section, assignment_number,
        description, detailed_instructions, supporting_documents, reference_materials,
        due_date, max_marks, created_by, status, priority, estimated_time,
        late_allowed, max_file_size, allowed_file_types
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      course_id,
      title,
      subject || 'General',
      department || course.department || 'Computer Science',
      semester || 'Semester 1',
      section || 'Section A',
      assignment_number || 'ASM-' + Math.floor(100 + Math.random() * 900),
      description || '',
      detailed_instructions || '',
      supporting_documents || '',
      reference_materials || '',
      due_date,
      max_marks || 100,
      user.id,
      status || 'published',
      priority || 'medium',
      estimated_time || '2 hours',
      late_allowed ? 1 : 0,
      max_file_size || 10,
      allowed_file_types || 'pdf,doc,docx,zip'
    );

    const newAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);

    // Notify enrolled students if published
    if (newAssignment.status === 'published') {
      const enrolledStudents = db.prepare(
        'SELECT student_id FROM course_enrollments WHERE course_id = ?'
      ).all(course_id);

      const insertNotif = db.prepare(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
      );

      for (const student of enrolledStudents) {
        insertNotif.run(
          student.student_id,
          'New Assignment Published',
          `Assignment "${title}" has been published in ${course.title}.`,
          'assignment',
          `/dashboard/assignments/${newAssignment.id}`
        );
      }
    }

    // Log Activity
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'ASSIGNMENT_CREATED', `Created assignment ${title} for course ${course.title}.`);

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('Assignments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
