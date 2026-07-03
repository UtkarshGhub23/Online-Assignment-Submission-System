import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const submission = db.prepare(`
      SELECT s.*, u.name as student_name, u.email as student_email,
        a.title as assignment_title, a.description as assignment_description,
        a.max_marks, a.due_date, a.course_id,
        c.title as course_title, c.code as course_code,
        g.marks, g.feedback, g.graded_at, g.is_draft, gu.name as graded_by_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN grades g ON s.id = g.submission_id
      LEFT JOIN users gu ON g.graded_by = gu.id
      WHERE s.id = ?
    `).get(id);

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Authorization check
    if (user.role === 'student' && Number(submission.student_id) !== Number(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Submission GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
