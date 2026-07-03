import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'faculty') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    const assignment = db.prepare(`
      SELECT a.*, c.teacher_id FROM assignments a
      JOIN courses c ON a.course_id = c.id WHERE a.id = ?
    `).get(id);

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (Number(assignment.teacher_id) !== Number(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newTitle = `${assignment.title} (Copy)`;
    const newAsmNum = `${assignment.assignment_number || 'ASM'}-DUP`;

    const result = db.prepare(`
      INSERT INTO assignments (
        course_id, title, subject, department, semester, section, assignment_number,
        description, detailed_instructions, supporting_documents, reference_materials,
        due_date, max_marks, created_by, status, priority, estimated_time,
        late_allowed, max_file_size, allowed_file_types
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
    `).run(
      assignment.course_id,
      newTitle,
      assignment.subject,
      assignment.department,
      assignment.semester,
      assignment.section,
      newAsmNum,
      assignment.description,
      assignment.detailed_instructions,
      assignment.supporting_documents,
      assignment.reference_materials,
      assignment.due_date,
      assignment.max_marks,
      user.id,
      assignment.priority,
      assignment.estimated_time,
      assignment.late_allowed,
      assignment.max_file_size,
      assignment.allowed_file_types
    );

    // Record activity log
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'ASSIGNMENT_DUPLICATED', `Duplicated assignment "${assignment.title}" into draft "${newTitle}".`);

    const duplicated = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ assignment: duplicated }, { status: 201 });
  } catch (error) {
    console.error('Duplicate assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
