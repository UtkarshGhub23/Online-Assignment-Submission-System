import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    let courses;

    if (user.role === 'admin') {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name,
          (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count,
          (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        ORDER BY c.created_at DESC
      `).all();
    } else if (user.role === 'teacher') {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name,
          (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count,
          (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
      `).all(user.id);
    } else {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name,
          (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count,
          (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.student_id = ?
        ORDER BY c.created_at DESC
      `).all(user.id);

      // Mark enrolled courses
      const enrolledIds = db.prepare(
        'SELECT course_id FROM course_enrollments WHERE student_id = ?'
      ).all(user.id).map(e => e.course_id);

      courses = courses.map(c => ({
        ...c,
        is_enrolled: enrolledIds.includes(c.id),
      }));
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Courses GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, code } = await request.json();

    if (!title || !code) {
      return NextResponse.json({ error: 'Title and code are required' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM courses WHERE code = ?').get(code);
    if (existing) {
      return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
    }

    const result = db.prepare(
      'INSERT INTO courses (title, description, code, teacher_id) VALUES (?, ?, ?, ?)'
    ).run(title, description || '', code.toUpperCase(), user.id);

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Courses POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
