-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('faculty', 'student')),
  avatar_url TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  biography TEXT DEFAULT NULL,
  department TEXT DEFAULT NULL,
  course TEXT DEFAULT NULL,
  semester TEXT DEFAULT NULL,
  section TEXT DEFAULT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0, 1)),
  verification_token TEXT DEFAULT NULL,
  reset_token TEXT DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  enrollment_number TEXT UNIQUE DEFAULT NULL,
  notification_prefs TEXT NOT NULL DEFAULT '{"email":true,"in_app":true}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  teacher_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(course_id, student_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  subject TEXT DEFAULT NULL,
  department TEXT DEFAULT NULL,
  semester TEXT DEFAULT NULL,
  section TEXT DEFAULT NULL,
  assignment_number TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  detailed_instructions TEXT DEFAULT NULL,
  supporting_documents TEXT DEFAULT NULL,
  reference_materials TEXT DEFAULT NULL,
  due_date DATETIME NOT NULL,
  max_marks INTEGER NOT NULL DEFAULT 100,
  created_by INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'closed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  estimated_time TEXT DEFAULT NULL,
  late_allowed INTEGER NOT NULL DEFAULT 0 CHECK(late_allowed IN (0, 1)),
  max_file_size INTEGER NOT NULL DEFAULT 10,
  allowed_file_types TEXT NOT NULL DEFAULT 'pdf,doc,docx,zip,ppt,pptx,xls,xlsx,png,jpg,jpeg',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('not_started', 'in_progress', 'submitted', 'pending_review', 'reviewed', 'approved', 'rejected', 'late_submission', 'missing_submission')),
  remarks TEXT DEFAULT NULL,
  submission_id TEXT UNIQUE NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(assignment_id, student_id)
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER UNIQUE NOT NULL,
  marks INTEGER NOT NULL,
  feedback TEXT,
  graded_by INTEGER NOT NULL,
  graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_draft INTEGER NOT NULL DEFAULT 0 CHECK(is_draft IN (0, 1)),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error', 'assignment', 'grade', 'enrollment')),
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
  link TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT NULL,
  action TEXT NOT NULL,
  details TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_submission ON grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
