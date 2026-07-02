import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No user IDs provided for deletion' }, { status: 400 });
    }

    const db = getDb();
    const deleteStmt = db.prepare('DELETE FROM users WHERE id = ? AND id != ?');

    let deletedCount = 0;

    const runDelete = db.transaction((ids) => {
      for (const id of ids) {
        const res = deleteStmt.run(id, authUser.id);
        if (res.changes > 0) {
          deletedCount++;
        }
      }
    });

    runDelete(userIds);

    // Record activity log
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(authUser.id, 'BULK_DELETE', `Bulk deleted ${deletedCount} users.`);

    return NextResponse.json({
      message: `Bulk delete completed successfully.`,
      deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
