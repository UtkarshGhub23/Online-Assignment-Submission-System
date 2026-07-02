import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getDb();
    const users = db.prepare(
      'SELECT id, name, email, role, avatar_url, created_at FROM users ORDER BY created_at DESC'
    ).all();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const password_hash = hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, password_hash, role);

    const newUser = db.prepare(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
