import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    if (id === 'all') {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.id);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, user.id);
    }

    return NextResponse.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Notification read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
