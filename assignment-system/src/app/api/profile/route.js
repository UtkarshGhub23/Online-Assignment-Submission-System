import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, address, biography, notification_prefs, avatar_url } = await request.json();

    const db = getDb();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.id);

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedName = name || existing.name;
    const updatedPhone = phone ?? existing.phone;
    const updatedAddress = address ?? existing.address;
    const updatedBiography = biography ?? existing.biography;
    const updatedPrefs = notification_prefs ? JSON.stringify(notification_prefs) : existing.notification_prefs;
    const updatedAvatar = avatar_url ?? existing.avatar_url;

    db.prepare(`
      UPDATE users SET
        name = ?, phone = ?, address = ?, biography = ?, notification_prefs = ?, avatar_url = ?
      WHERE id = ?
    `).run(updatedName, updatedPhone, updatedAddress, updatedBiography, updatedPrefs, updatedAvatar, authUser.id);

    // Record activity
    db.prepare(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
    ).run(authUser.id, 'PROFILE_UPDATE', `User ${updatedName} updated their profile settings.`);

    const user = db.prepare('SELECT id, name, email, role, phone, address, biography, department, course, semester, section, avatar_url, notification_prefs FROM users WHERE id = ?').get(authUser.id);

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        ...user,
        notification_prefs: JSON.parse(user.notification_prefs)
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
