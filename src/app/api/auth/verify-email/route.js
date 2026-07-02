import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(authUser.id);

    // Record activity
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(authUser.id, 'EMAIL_VERIFIED', `User email verified successfully.`);

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
