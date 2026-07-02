import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    let stats = {};

    if (user.role === 'admin') {
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
      const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get().count;
      const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
      const totalAssignments = db.prepare('SELECT COUNT(*) as count FROM assignments').get().count;
      const totalActiveAssignments = db.prepare("SELECT COUNT(*) as count FROM assignments WHERE status = 'published' AND due_date > datetime('now')").get().count;
      const totalSubmittedAssignments = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status IN ('submitted', 'pending_review', 'reviewed', 'approved', 'rejected', 'late_submission')").get().count;
      const pendingSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status IN ('submitted', 'pending_review', 'pending')").get().count;
      const gradedSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status IN ('graded', 'reviewed', 'approved', 'rejected')").get().count;
      const lateSubmissions = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status IN ('late_submission', 'late')").get().count;

      const recentUsers = db.prepare(
        'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
      ).all();

      const recentActivities = db.prepare(`
        SELECT l.*, u.name as user_name, u.role as user_role
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC LIMIT 5
      `).all();

      const submissionsByMonth = db.prepare(`
        SELECT strftime('%Y-%m', submitted_at) as month, COUNT(*) as count
        FROM submissions
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `).all();

      stats = {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalCourses,
        totalAssignments,
        totalActiveAssignments,
        totalSubmittedAssignments,
        pendingSubmissions,
        gradedSubmissions,
        lateSubmissions,
        recentUsers,
        recentActivities,
        submissionsByMonth,
      };
    } else if (user.role === 'teacher') {
      const myCourseIds = db.prepare('SELECT id FROM courses WHERE teacher_id = ?').all(user.id).map(c => c.id);
      const courseIdPlaceholders = myCourseIds.length > 0 ? myCourseIds.map(() => '?').join(',') : '0';

      const totalCourses = myCourseIds.length;
      const totalStudents = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(DISTINCT student_id) as count FROM course_enrollments WHERE course_id IN (${courseIdPlaceholders})`).get(...myCourseIds).count
        : 0;

      const totalAssignments = myCourseIds.length > 0
        ? db.prepare(`SELECT COUNT(*) as count FROM assignments WHERE course_id IN (${courseIdPlaceholders})`).get(...myCourseIds).count
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

      stats = {
        totalCourses,
        totalStudents,
        totalAssignments,
        totalSubmissions,
        pendingSubmissions,
        gradedSubmissions,
        averageMarks: averageMarks || 0,
        recentSubmissions,
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

      stats = {
        enrolledCourses: enrolledCourseIds.length,
        totalAssignments,
        submittedCount,
        pendingCount: Math.max(0, totalAssignments - submittedCount),
        gradedCount,
        averageMarks: averageMarks || 0,
        upcomingDeadlines,
        recentFeedback,
      };
    }

    return NextResponse.json({ stats, role: user.role });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
