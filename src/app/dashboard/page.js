'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user?.role === 'faculty') {
        router.replace('/dashboard/faculty');
      } else if (user?.role === 'student') {
        router.replace('/dashboard/student');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="loading-container" style={{ minHeight: '60vh' }}>
      <div className="spinner"></div>
      <p className="loading-text">Loading dashboard...</p>
    </div>
  );
}
