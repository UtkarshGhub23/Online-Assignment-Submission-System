import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (authUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const db = getDb();
    const user = db.prepare(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?'
    ).get(id);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (authUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { name, email, role } = await request.json();
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?')
      .run(name || user.name, email || user.email, role || user.role, id);

    const updated = db.prepare(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
    ).get(id);

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (authUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    if (Number(id) === authUser.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
