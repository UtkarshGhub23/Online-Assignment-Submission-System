import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'student';
    const isExport = searchParams.get('export') === 'true';

    const db = getDb();
    let data = [];
    let headers = [];
    let filename = `${type}_report.csv`;

    switch (type) {
      case 'student':
        headers = ['ID', 'Name', 'Email', 'Enrollment Number', 'Department', 'Course', 'Semester', 'Section', 'Active', 'Joined On'];
        data = db.prepare(`
          SELECT id, name, email, enrollment_number, department, course, semester, section, active, created_at
          FROM users WHERE role = 'student' ORDER BY name
        `).all().map(u => [
          u.id, u.name, u.email, u.enrollment_number || '', u.department || '', u.course || '', u.semester || '', u.section || '', u.active ? 'Yes' : 'No', u.created_at
        ]);
        break;

      case 'faculty':
        headers = ['ID', 'Name', 'Email', 'Department', 'Active', 'Courses Commenced', 'Joined On'];
        data = db.prepare(`
          SELECT u.id, u.name, u.email, u.department, u.active, u.created_at,
            (SELECT COUNT(*) FROM courses WHERE teacher_id = u.id) as course_count
          FROM users u WHERE u.role = 'faculty' ORDER BY u.name
        `).all().map(u => [
          u.id, u.name, u.email, u.department || '', u.active ? 'Yes' : 'No', u.course_count, u.created_at
        ]);
        break;

      case 'assignment':
        headers = ['ID', 'Title', 'Course Code', 'Course Title', 'Due Date', 'Max Marks', 'Status', 'Priority', 'Late Allowed', 'Created At'];
        data = db.prepare(`
          SELECT a.id, a.title, c.code as course_code, c.title as course_title, a.due_date, a.max_marks, a.status, a.priority, a.late_allowed, a.created_at
          FROM assignments a JOIN courses c ON a.course_id = c.id ORDER BY a.due_date DESC
        `).all().map(a => [
          a.id, a.title, a.course_code, a.course_title, a.due_date, a.max_marks, a.status, a.priority, a.late_allowed ? 'Yes' : 'No', a.created_at
        ]);
        break;

      case 'submission':
        headers = ['Submission ID', 'Assignment', 'Student', 'Course', 'Submitted At', 'Status', 'File Size (KB)', 'Delay (Mins)'];
        data = db.prepare(`
          SELECT s.submission_id, a.title as assignment_title, u.name as student_name, c.code as course_code, s.submitted_at, s.status, s.file_size, s.delay_minutes
          FROM submissions s
          JOIN assignments a ON s.assignment_id = a.id
          JOIN users u ON s.student_id = u.id
          JOIN courses c ON a.course_id = c.id
          ORDER BY s.submitted_at DESC
        `).all().map(s => [
          s.submission_id, s.assignment_title, s.student_name, s.course_code, s.submitted_at, s.status, Math.round(s.file_size / 1024), s.delay_minutes
        ]);
        break;

      case 'marks':
        headers = ['Submission ID', 'Assignment', 'Student', 'Max Marks', 'Obtained Marks', 'Feedback', 'Graded By', 'Graded At'];
        data = db.prepare(`
          SELECT s.submission_id, a.title as assignment_title, su.name as student_name, a.max_marks, g.marks, g.feedback, gu.name as grader_name, g.graded_at
          FROM grades g
          JOIN submissions s ON g.submission_id = s.id
          JOIN assignments a ON s.assignment_id = a.id
          JOIN users su ON s.student_id = su.id
          JOIN users gu ON g.graded_by = gu.id
          ORDER BY g.graded_at DESC
        `).all().map(g => [
          g.submission_id, g.assignment_title, g.student_name, g.max_marks, g.marks, g.feedback || '', g.grader_name, g.graded_at
        ]);
        break;

      case 'department':
        headers = ['Department', 'Students Enrolled', 'Faculty Assigned', 'Active Courses'];
        data = db.prepare(`
          SELECT
            CASE WHEN department IS NULL OR department = '' THEN 'General' ELSE department END as dept,
            SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as student_count,
            SUM(CASE WHEN role = 'faculty' THEN 1 ELSE 0 END) as teacher_count,
            (SELECT COUNT(*) FROM courses WHERE id IN (SELECT id FROM courses) AND teacher_id IN (SELECT id FROM users WHERE department = users.department)) as course_count
          FROM users
          GROUP BY dept
          ORDER BY dept
        `).all().map(d => [
          d.dept, d.student_count, d.teacher_count, d.course_count
        ]);
        break;

      case 'semester':
        headers = ['Semester', 'Students Count', 'Submissions Count', 'Pending Review'];
        data = db.prepare(`
          SELECT
            CASE WHEN semester IS NULL OR semester = '' THEN 'N/A' ELSE semester END as sem,
            COUNT(DISTINCT id) as student_count,
            (SELECT COUNT(*) FROM submissions WHERE student_id IN (SELECT id FROM users WHERE semester = users.semester)) as submission_count,
            (SELECT COUNT(*) FROM submissions WHERE status = 'pending' AND student_id IN (SELECT id FROM users WHERE semester = users.semester)) as pending_count
          FROM users WHERE role = 'student'
          GROUP BY sem
          ORDER BY sem
        `).all().map(s => [
          s.sem, s.student_count, s.submission_count, s.pending_count
        ]);
        break;

      case 'late':
        headers = ['Submission ID', 'Assignment', 'Student', 'Deadline', 'Submitted At', 'Delay (Days)', 'Marks Deducted?'];
        data = db.prepare(`
          SELECT s.submission_id, a.title as assignment_title, u.name as student_name, a.due_date, s.submitted_at, s.delay_minutes
          FROM submissions s
          JOIN assignments a ON s.assignment_id = a.id
          JOIN users u ON s.student_id = u.id
          WHERE s.status = 'late_submission' OR s.delay_minutes > 0
          ORDER BY s.submitted_at DESC
        `).all().map(s => [
          s.submission_id, s.assignment_title, s.student_name, s.due_date, s.submitted_at, (s.delay_minutes / 1440).toFixed(1), s.delay_minutes > 60 ? 'Yes' : 'No'
        ]);
        break;

      case 'activity':
        headers = ['ID', 'User', 'Role', 'Action', 'Details', 'Timestamp'];
        data = db.prepare(`
          SELECT l.id, u.name as user_name, u.role, l.action, l.details, l.created_at
          FROM activity_logs l
          LEFT JOIN users u ON l.user_id = u.id
          ORDER BY l.created_at DESC LIMIT 500
        `).all().map(l => [
          l.id, l.user_name || 'SYSTEM', l.role || 'N/A', l.action, l.details || '', l.created_at
        ]);
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (isExport) {
      // Escape cells for CSV
      const escapedHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`);
      const escapedRows = data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      const csvContent = [escapedHeaders.join(','), ...escapedRows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Return JSON data
    return NextResponse.json({
      type,
      headers,
      rows: data.map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      })
    });
  } catch (error) {
    console.error('Reports generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
