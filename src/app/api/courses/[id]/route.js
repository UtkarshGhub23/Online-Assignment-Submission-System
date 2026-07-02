import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const course = db.prepare(`
      SELECT c.*, u.name as teacher_name, u.email as teacher_email
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `).get(id);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get enrolled students
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, ce.enrolled_at
      FROM course_enrollments ce
      JOIN users u ON ce.student_id = u.id
      WHERE ce.course_id = ?
      ORDER BY u.name
    `).all(id);

    // Get assignments
    const assignments = db.prepare(`
      SELECT a.*,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count
      FROM assignments a
      WHERE a.course_id = ?
      ORDER BY a.due_date ASC
    `).all(id);

    // Check enrollment for students
    let is_enrolled = false;
    if (user.role === 'student') {
      const enrollment = db.prepare(
        'SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?'
      ).get(id, user.id);
      is_enrolled = !!enrollment;
    }

    return NextResponse.json({
      course: { ...course, students, assignments, is_enrolled },
    });
  } catch (error) {
    console.error('Course GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if (user.role !== 'faculty' || course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description } = await request.json();
    db.prepare('UPDATE courses SET title = ?, description = ? WHERE id = ?')
      .run(title || course.title, description ?? course.description, id);

    const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    return NextResponse.json({ course: updated });
  } catch (error) {
    console.error('Course PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if (user.role !== 'faculty' || course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Course DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
