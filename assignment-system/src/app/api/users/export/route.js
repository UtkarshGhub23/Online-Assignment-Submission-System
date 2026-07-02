import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const db = getDb();
    const users = db.prepare(`
      SELECT id, name, email, role, department, course, semester, section, enrollment_number, active, email_verified, created_at
      FROM users
      ORDER BY role, name
    `).all();

    // Generate CSV
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Department', 'Course', 'Semester', 'Section', 'Enrollment Number', 'Active', 'Email Verified', 'Created At'];
    const rows = users.map(u => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      u.role,
      `"${(u.department || '').replace(/"/g, '""')}"`,
      `"${(u.course || '').replace(/"/g, '""')}"`,
      u.semester || '',
      u.section || '',
      u.enrollment_number || '',
      u.active ? 'Yes' : 'No',
      u.email_verified ? 'Yes' : 'No',
      u.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users_export.csv"',
      },
    });
  } catch (error) {
    console.error('Export users error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
