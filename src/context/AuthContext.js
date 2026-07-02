'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Session activity checking
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Fetch /me to verify token is still valid. If not, auto-logout
      fetch('/api/auth/me').then(res => {
        if (!res.ok) {
          setUser(null);
          window.location.href = '/login?expired=true';
        }
      });
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password, rememberMe) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const register = async (name, email, password, extraData = {}) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, ...extraData }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const forgotPassword = async (email) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message, link: data.simulated_link };
    }
    return { success: false, error: data.error };
  };

  const resetPassword = async (token, newPassword) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.error };
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.error };
  };

  const verifyEmail = async () => {
    const res = await fetch('/api/auth/verify-email', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      if (user) {
        setUser(prev => ({ ...prev, email_verified: 1 }));
      }
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const updateProfile = async (profileData) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      return { success: true, message: data.message };
    }
    return { success: false, error: data.error };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, fetchUser,
      forgotPassword, resetPassword, changePassword, verifyEmail, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
