import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'AssignPro — Online Assignment Submission System',
  description: 'A modern Learning Management System for managing courses, assignments, submissions, and grades with role-based access for Admin, Teacher, and Student users.',
  keywords: 'assignment, submission, grading, LMS, education, courses',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-blob-1"></div>
        <div className="bg-blob-2"></div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
