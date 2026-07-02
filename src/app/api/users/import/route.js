import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { users } = await request.json();

    if (!users || !Array.from(users).length) {
      return NextResponse.json({ error: 'No users provided for import' }, { status: 400 });
    }

    const db = getDb();
    const defaultPassword = hashPassword('temp123');

    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const insertStmt = db.prepare(`
      INSERT INTO users (
        name, email, password_hash, role, department, course, semester, section, enrollment_number, active, email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `);

    let importedCount = 0;
    let skippedCount = 0;

    const runImport = db.transaction((userList) => {
      for (const u of userList) {
        if (!u.email || !u.name || !u.role) {
          skippedCount++;
          continue;
        }

        const existing = checkStmt.get(u.email);
        if (existing) {
          skippedCount++;
          continue;
        }

        const enrollment = u.role === 'student' ? (u.enrollment_number || 'STU-' + Math.floor(100000 + Math.random() * 900000)) : null;

        insertStmt.run(
          u.name,
          u.email,
          defaultPassword,
          u.role,
          u.department || 'Computer Science',
          u.course || 'B.Sc. CS',
          u.semester || 'Semester 1',
          u.section || 'Section A',
          enrollment
        );
        importedCount++;
      }
    });

    runImport(users);

    // Record activity log
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(authUser.id, 'BULK_IMPORT', `Bulk imported ${importedCount} users. Skipped ${skippedCount}.`);

    return NextResponse.json({
      message: `Bulk import completed successfully.`,
      imported: importedCount,
      skipped: skippedCount
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
