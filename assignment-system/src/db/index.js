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
      description, detailed_instructions, due_date, max_marks, created_by,
      status, priority, estimated_time, late_allowed, max_file_size, allowed_file_types
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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

    // 5. Assignments
    const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const futureDate3 = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    // Assignment 1
    insertAssignment.run(
      1, 'Python Programming Lab 1', 'Python Basics', 'Computer Science', 'Semester 3', 'Section A', 'ASM-101',
      'Complete programming exercises covering loops, conditional branches, and basic data collections.',
      '1. Write pure Python code.\n2. Submit a single PDF file with code screenshots and output blocks.\n3. Make sure to comment your functions.',
      null, null, futureDate1, 100, 1, 'published', 'medium', '4 hours', 1, 10, 'pdf,zip'
    );

    // Assignment 2
    insertAssignment.run(
      1, 'Linked Lists and Stacks Implementations', 'Data Structures', 'Computer Science', 'Semester 3', 'Section A', 'ASM-102',
      'Implement singly linked list insertion and deletion along with stack operations.',
      '1. Implement operations without standard list methods.\n2. Add test functions.\n3. Submit a ZIP containing py files.',
      null, null, futureDate2, 150, 1, 'published', 'high', '6 hours', 0, 15, 'zip'
    );

    // Assignment 3
    insertAssignment.run(
      2, 'Portfolio Site Stylesheet', 'HTML/CSS Layouts', 'Computer Science', 'Semester 3', 'Section A', 'ASM-201',
      'Design a personal portfolio mockup using CSS flexbox, grids, and responsive media blocks.',
      '1. Do not use external CSS frameworks.\n2. Design should support desktop and mobile viewport ratios.\n3. Submit zipped html and css source files.',
      null, null, futureDate3, 200, 1, 'published', 'medium', '8 hours', 1, 20, 'zip,rar'
    );

    // Assignment 4 (Past Assignment)
    insertAssignment.run(
      2, 'Grid Mockup Challenge', 'Web Layouts', 'Computer Science', 'Semester 3', 'Section A', 'ASM-202',
      'Recreate the classroom layout grid structure with grid-template areas.',
      '1. Recreate layouts from mockups.\n2. Clean CSS styling.',
      null, null, pastDate, 50, 1, 'published', 'low', '2 hours', 0, 5, 'pdf,png'
    );

    // 6. Notifications
    insertNotification.run(2, 'Welcome', 'Welcome to AssignPro. Browse your courses and profile.', 'info', '/dashboard');
    insertNotification.run(2, 'New Assignment', 'Python Programming Lab 1 has been posted in CS101.', 'assignment', '/dashboard/assignments/1');
    insertNotification.run(3, 'Welcome', 'Welcome to AssignPro. Browse your courses and profile.', 'info', '/dashboard');
    insertNotification.run(1, 'Course Enrollee', 'Alex Thompson has enrolled in Introduction to Computer Science.', 'enrollment', '/dashboard/courses/1');

    // 7. Activity Logs
    insertActivity.run(null, 'SYSTEM_STARTUP', 'System settings configured and seeded successfully with 2-role layout.');
    insertActivity.run(1, 'COURSE_CREATED', 'Dr. Sarah Johnson created WEB201 course.');
    insertActivity.run(2, 'USER_LOGIN', 'Alex Thompson logged in from Chrome browser.');
  });

  seed();
}

export default getDb;
