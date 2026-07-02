import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, role, department, course, semester, section } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const targetRole = role === 'faculty' ? 'faculty' : 'student';

    const db = getDb();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const password_hash = hashPassword(password);
    const enrollment = targetRole === 'student' ? 'STU-' + Math.floor(100000 + Math.random() * 900000) : 'FAC-' + Math.floor(1000 + Math.random() * 9000);

    const result = db.prepare(
      `INSERT INTO users (
        name, email, password_hash, role, department, course, semester, section, enrollment_number, active, email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`
    ).run(
      name,
      email,
      password_hash,
      targetRole,
      department || 'Computer Science',
      course || (targetRole === 'student' ? 'B.Sc. CS' : 'N/A'),
      semester || (targetRole === 'student' ? 'Semester 1' : 'N/A'),
      section || (targetRole === 'student' ? 'Section A' : 'N/A'),
      enrollment
    );

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Record registration activity
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'USER_REGISTER', `User ${user.name} created account with role ${user.role}.`);

    // Notify other faculty of new registration
    const facultyList = db.prepare("SELECT id FROM users WHERE role = 'faculty'").all();
    for (const fac of facultyList) {
      if (fac.id !== user.id) {
        db.prepare(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)'
        ).run(
          fac.id,
          'New Account Registration',
          `A new user registered: ${user.name} (${user.email}) as a ${user.role}.`,
          'info'
        );
      }
    }

    const token = await createToken(user);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollment_number: user.enrollment_number,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
