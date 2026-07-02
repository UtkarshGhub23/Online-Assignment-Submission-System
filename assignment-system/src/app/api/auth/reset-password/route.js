import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, name, reset_token_expiry FROM users WHERE reset_token = ?').get(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const now = new Date();
    const expiry = new Date(user.reset_token_expiry);
    if (now > expiry) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    const password_hash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?')
      .run(password_hash, user.id);

    // Record activity
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'PASSWORD_RESET_SUCCESS', `Password was reset successfully using token.`);

    return NextResponse.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
