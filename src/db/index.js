import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { hashPassword } from '@/lib/auth';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

let db;

export function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database) {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  database.exec(schema);

  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase(database);
  }
}

function seedDatabase(database) {
  const facultyHash = hashPassword('teacher123');
  const studentHash = hashPassword('student123');
  const student2Hash = hashPassword('student123');

  const insertUser = database.prepare(
    `INSERT INTO users (
      name, email, password_hash, role, phone, address, biography,
      department, course, semester, section, active, email_verified, enrollment_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertCourse = database.prepare(
    'INSERT INTO courses (title, description, code, teacher_id) VALUES (?, ?, ?, ?)'
  );

  const insertEnrollment = database.prepare(
    'INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)'
  );

  const insertAssignment = database.prepare(
    `INSERT INTO assignments (
      course_id, title, subject, department, semester, section, assignment_number,
      description, detailed_instructions, supporting_documents, reference_materials,
      due_date, max_marks, created_by,
      status, priority, estimated_time, late_allowed, max_file_size, allowed_file_types
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertNotification = database.prepare(
    'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
  );

  const insertActivity = database.prepare(
    'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
  );

  const insertSetting = database.prepare(
    'INSERT INTO system_settings (key, value) VALUES (?, ?)'
  );

  const seed = database.transaction(() => {
    // 1. Settings
    insertSetting.run('system_name', 'AssignPro University Portal');
    insertSetting.run('allow_registration', '1');
    insertSetting.run('max_upload_limit_mb', '25');

    // 2. Users (Role is CHECK constrained to ('faculty', 'student'))
    // Faculty User (Sarah Johnson)
    insertUser.run(
      'Dr. Sarah Johnson', 'teacher@assignsys.com', facultyHash, 'faculty',
      '+15550101', '456 Faculty Housing, Campus Town', 'Professor of Computer Science with 10 years teaching experience.',
      'Computer Science', 'B.Sc. CS', 'N/A', 'N/A', 1, 1, 'FAC-102'
    );
    // Student User (Alex Thompson)
    insertUser.run(
      'Alex Thompson', 'student@assignsys.com', studentHash, 'student',
      '+15550102', '789 Dormitory Block A, Room 204', 'Undergraduate student majoring in Software Engineering.',
      'Computer Science', 'B.Sc. CS', 'Semester 3', 'Section A', 1, 1, 'STU-2041'
    );
    // Student User (Jamie Rivera)
    insertUser.run(
      'Jamie Rivera', 'student2@assignsys.com', student2Hash, 'student',
      '+15550103', '789 Dormitory Block B, Room 105', 'Junior student focused on database systems and data engineering.',
      'Computer Science', 'B.Sc. CS', 'Semester 3', 'Section B', 1, 1, 'STU-2059'
    );

    // 3. Courses
    insertCourse.run(
      'Introduction to Computer Science',
      'Fundamentals of programming, data structures, and algorithmic logic in Python.',
      'CS101',
      1 // Dr. Sarah Johnson is ID 1
    );
    insertCourse.run(
      'Web Development Fundamentals',
      'Learn HTML, CSS, and modern clientside JavaScript for responsive layout design.',
      'WEB201',
      1
    );
    insertCourse.run(
      'Database Management Systems',
      'Relational modeling, normalization, transaction controls, and SQLite indexing.',
      'DB301',
      1
    );

    // 4. Enrollments
    insertEnrollment.run(1, 2); // Alex in CS101
    insertEnrollment.run(2, 2); // Alex in WEB201
    insertEnrollment.run(1, 3); // Jamie in CS101
    insertEnrollment.run(3, 3); // Jamie in DB301

    // 5. Notifications
    insertNotification.run(2, 'Welcome', 'Welcome to AssignPro. Browse your courses and profile.', 'info', '/dashboard/student');
    insertNotification.run(3, 'Welcome', 'Welcome to AssignPro. Browse your courses and profile.', 'info', '/dashboard/student');

    // 6. Activity Logs
    insertActivity.run(null, 'SYSTEM_STARTUP', 'System settings configured and seeded successfully.');
  });

  seed();
}

export default getDb;
