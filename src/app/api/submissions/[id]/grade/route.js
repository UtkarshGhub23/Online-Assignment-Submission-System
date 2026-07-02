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
    const { marks, feedback, isDraft, decision } = await request.json(); // decision: 'approve' | 'reject' | 'return'

    if (marks === undefined || marks === null) {
      return NextResponse.json({ error: 'Marks are required' }, { status: 400 });
    }

    const db = getDb();

    const submission = db.prepare(`
      SELECT s.*, a.max_marks, a.title as assignment_title, a.course_id
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.id = ?
    `).get(id);

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (marks < 0 || marks > submission.max_marks) {
      return NextResponse.json(
        { error: `Marks must be between 0 and ${submission.max_marks}` },
        { status: 400 }
      );
    }

    // Determine status based on decision
    let submissionStatus = 'reviewed';
    if (decision === 'approve') {
      submissionStatus = 'approved';
    } else if (decision === 'reject') {
      submissionStatus = 'rejected';
    } else if (decision === 'return') {
      submissionStatus = 'returned';
    }

    // Upsert grade
    const existingGrade = db.prepare('SELECT id FROM grades WHERE submission_id = ?').get(id);
    const draftFlag = isDraft ? 1 : 0;

    if (existingGrade) {
      db.prepare(`
        UPDATE grades SET
          marks = ?, feedback = ?, graded_by = ?, is_draft = ?, graded_at = CURRENT_TIMESTAMP
        WHERE submission_id = ?
      `).run(marks, feedback || '', user.id, draftFlag, id);
    } else {
      db.prepare(`
        INSERT INTO grades (submission_id, marks, feedback, graded_by, is_draft)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, marks, feedback || '', user.id, draftFlag);
    }

    // Update submission status
    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(submissionStatus, id);

    // Record activity
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'SUBMISSION_GRADED', `Graded submission for "${submission.assignment_title}". Decision: ${submissionStatus}, Draft: ${isDraft ? 'Yes' : 'No'}.`);

    // Notify student if NOT a draft
    if (!isDraft) {
      let notifTitle = 'Assignment Graded';
      let notifMsg = `Your submission for "${submission.assignment_title}" has been graded: ${marks}/${submission.max_marks}.`;
      let notifType = 'grade';

      if (submissionStatus === 'returned') {
        notifTitle = 'Submission Returned for Correction';
        notifMsg = `Your submission for "${submission.assignment_title}" has been returned for correction. Please review feedback and resubmit.`;
        notifType = 'warning';
      } else if (submissionStatus === 'rejected') {
        notifTitle = 'Submission Rejected';
        notifMsg = `Your submission for "${submission.assignment_title}" has been rejected. Marks: ${marks}/${submission.max_marks}.`;
        notifType = 'error';
      } else if (submissionStatus === 'approved') {
        notifTitle = 'Submission Approved';
        notifMsg = `Your submission for "${submission.assignment_title}" has been approved. Marks: ${marks}/${submission.max_marks}.`;
        notifType = 'success';
      }

      db.prepare(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
      ).run(
        submission.student_id,
        notifTitle,
        notifMsg,
        notifType,
        `/dashboard/assignments/${submission.assignment_id}`
      );
    }

    return NextResponse.json({ message: 'Grading operation successful', marks, feedback, status: submissionStatus });
  } catch (error) {
    console.error('Grade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
