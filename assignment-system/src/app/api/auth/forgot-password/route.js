import { NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);

    if (!user) {
      // Security practice: do not reveal that user doesn't exist
      return NextResponse.json({
        message: 'If the email exists, a password reset link has been generated.',
        simulated_link: null
      });
    }

    const resetToken = 'RST-' + Math.random().toString(36).substring(2, 15).toUpperCase();
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
      .run(resetToken, expiry, user.id);

    // Record activity
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(user.id, 'PASSWORD_RESET_REQUEST', `Password reset token generated for ${email}.`);

    return NextResponse.json({
      message: 'Password reset link generated successfully.',
      simulated_link: `/login?token=${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
