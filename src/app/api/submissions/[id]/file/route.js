import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAuthUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const submission = db.prepare(`
      SELECT s.*, a.course_id, c.teacher_id
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.id = ?
    `).get(id);

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Authorization: only the student who submitted, the course faculty, or admin can download
    if (user.role === 'student' && Number(submission.student_id) !== Number(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const filePath = submission.file_path;

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(submission.file_name).toLowerCase();

    // Map extensions to MIME types
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // For images, display inline; for everything else, offer download
    const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    const disposition = isImage
      ? `inline; filename="${submission.file_name}"`
      : `attachment; filename="${submission.file_name}"`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
