import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    let stats = {};

    if (user.role === 'faculty') {
      const myCourseIds = db.prepare('SELECT id FROM courses WHERE teacher_id = ?').all(user.id).map(c => c.id);
      const courseIdPlaceholders = myCourseIds.length > 0 ? myCourseIds.map(() => '?').join(',') : '0';

      const totalCourses = myCourseIds.length;
      const totalStudents = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(DISTINCT student_id) as count FROM course_enrollments WHERE course_id IN (${courseIdPlaceholders})`).get(...myCourseIds).count
        : 0;

      const totalAssignments = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM assignments WHERE course_id IN (${courseIdPlaceholders})`).get(...myCourseIds).count
        : 0;

      const activeAssignments = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM assignments WHERE course_id IN (${courseIdPlaceholders}) AND status = 'published' AND due_date > datetime('now')`).get(...myCourseIds).count
        : 0;

      const expiredAssignments = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM assignments WHERE course_id IN (${courseIdPlaceholders}) AND due_date <= datetime('now')`).get(...myCourseIds).count
        : 0;

      const totalSubmissions = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id IN (${courseIdPlaceholders})`).get(...myCourseIds).count
        : 0;

      const pendingSubmissions = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id IN (${courseIdPlaceholders}) AND s.status IN ('submitted', 'pending_review', 'pending')`).get(...myCourseIds).count
        : 0;

      const gradedSubmissions = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id IN (${courseIdPlaceholders}) AND s.status IN ('graded', 'reviewed', 'approved', 'rejected')`).get(...myCourseIds).count
        : 0;

      const lateSubmissions = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id IN (${courseIdPlaceholders}) AND (s.status = 'late_submission' OR s.delay_minutes > 0)`).get(...myCourseIds).count
        : 0;

      const averageMarks = myCourseIds.length > 0
        ? db.prepare(`SELECT AVG(g.marks) as avg FROM grades g JOIN submissions s ON g.submission_id = s.id JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id IN (${courseIdPlaceholders})`).get(...myCourseIds).avg
        : 0;

      const recentSubmissions = myCourseIds.length > 0
        ? db.prepare(`
            SELECT s.*, u.name as student_name, a.title as assignment_title
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            JOIN assignments a ON s.assignment_id = a.id
            WHERE a.course_id IN (${courseIdPlaceholders})
            ORDER BY s.submitted_at DESC LIMIT 5
          `).all(...myCourseIds)
        : [];

      const upcomingDeadlines = myCourseIds.length > 0
        ? db.prepare(`
            SELECT a.*, c.title as course_title, c.code as course_code
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.course_id IN (${courseIdPlaceholders}) AND a.due_date > datetime('now')
            ORDER BY a.due_date ASC LIMIT 5
          `).all(...myCourseIds)
        : [];

      stats = {
        totalCourses,
        totalStudents,
        totalAssignments,
        activeAssignments,
        expiredAssignments,
        totalSubmissions,
        pendingSubmissions,
        gradedSubmissions,
        lateSubmissions,
        averageMarks: averageMarks || 0,
        recentSubmissions,
        upcomingDeadlines
      };
    } else {
      // Student
      const enrolledCourseIds = db.prepare(
        'SELECT course_id FROM course_enrollments WHERE student_id = ?'
      ).all(user.id).map(e => e.course_id);
      const courseIdPlaceholders = enrolledCourseIds.length > 0 ? enrolledCourseIds.map(() => '?').join(',') : '0';

      const totalAssignments = enrolledCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM assignments WHERE course_id IN (${courseIdPlaceholders}) AND status = 'published'`).get(...enrolledCourseIds).count
        : 0;

      const submittedCount = db.prepare('SELECT COUNT(*) as count FROM submissions WHERE student_id = ?').get(user.id).count;
      const lateCount = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE student_id = ? AND (status = 'late_submission' OR delay_minutes > 0)").get(user.id).count;
      const gradedCount = db.prepare("SELECT COUNT(*) as count FROM submissions s JOIN grades g ON s.id = g.submission_id WHERE s.student_id = ? AND g.is_draft = 0").get(user.id).count;
      const averageMarks = db.prepare(`
        SELECT AVG(g.marks) as avg FROM grades g
        JOIN submissions s ON g.submission_id = s.id
        WHERE s.student_id = ? AND g.is_draft = 0
      `).get(user.id).avg;

      const upcomingDeadlines = enrolledCourseIds.length > 0
        ? db.prepare(`
            SELECT a.*, c.title as course_title, c.code as course_code
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.course_id IN (${courseIdPlaceholders})
            AND a.due_date > datetime('now')
            AND a.status = 'published'
            ORDER BY a.due_date ASC LIMIT 5
          `).all(...enrolledCourseIds)
        : [];

      const recentFeedback = db.prepare(`
        SELECT g.*, a.title as assignment_title, u.name as grader_name
        FROM grades g
        JOIN submissions s ON g.submission_id = s.id
        JOIN assignments a ON s.assignment_id = a.id
        JOIN users u ON g.graded_by = u.id
        WHERE s.student_id = ? AND g.is_draft = 0
        ORDER BY g.graded_at DESC LIMIT 3
      `).all(user.id);

      const submissionHistory = db.prepare(`
        SELECT s.*, a.title as assignment_title, g.marks, a.max_marks
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE s.student_id = ?
        ORDER BY s.submitted_at DESC LIMIT 5
      `).all(user.id);

      stats = {
        enrolledCourses: enrolledCourseIds.length,
        totalAssignments,
        submittedCount,
        pendingCount: Math.max(0, totalAssignments - submittedCount),
        gradedCount,
        lateCount,
        averageMarks: averageMarks || 0,
        upcomingDeadlines,
        recentFeedback,
        submissionHistory
      };
    }

    return NextResponse.json({ stats, role: user.role });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
