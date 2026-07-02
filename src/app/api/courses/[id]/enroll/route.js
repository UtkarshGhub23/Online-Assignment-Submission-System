import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can enroll' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const existing = db.prepare(
      'SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?'
    ).get(id, user.id);

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
    }

    db.prepare('INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)')
      .run(id, user.id);

    // Notify teacher
    db.prepare(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
    ).run(
      course.teacher_id,
      'New Enrollment',
      `${user.name} has enrolled in ${course.title}.`,
      'enrollment',
      `/dashboard/courses/${id}`
    );

    return NextResponse.json({ message: 'Enrolled successfully' }, { status: 201 });
  } catch (error) {
    console.error('Enroll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
