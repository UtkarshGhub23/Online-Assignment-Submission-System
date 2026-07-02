'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, forgotPassword, resetPassword } = useAuth();

  // Auth Mode
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [simulatedLink, setSimulatedLink] = useState('');

  // Reset password states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // General states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(false);

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setExpiredMsg(true);
    }
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password, rememberMe);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setSimulatedLink('');
    setLoading(true);

    const result = await forgotPassword(forgotEmail);
    if (result.success) {
      setForgotSuccess(result.message);
      if (result.link) {
        setSimulatedLink(result.link);
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);

    const result = await resetPassword(resetToken, newPassword);
    if (result.success) {
      setResetSuccess(result.message);
      setTimeout(() => {
        setMode('login');
        router.replace('/login');
      }, 3000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ color: 'white', fontWeight: 'bold' }}>AP</div>
          <span className="auth-logo-text">AssignPro</span>
        </div>

        {expiredMsg && (
          <div className="auth-error" style={{ background: 'rgba(217, 119, 6, 0.08)', borderColor: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}>
            Your session has expired. Please sign in again.
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {mode === 'login' && (
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your portal to continue</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="form-group flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="rememberMe" className="text-sm text-muted" style={{ cursor: 'pointer', select: 'none' }}>
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              Don&apos;t have an account?{' '}
              <Link href="/register">Create one</Link>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Enter your registered email to request recovery link</p>

            {forgotSuccess && (
              <div className="auth-error" style={{ background: 'rgba(5, 150, 105, 0.08)', borderColor: 'rgba(5, 150, 105, 0.15)', color: '#059669' }}>
                {forgotSuccess}
              </div>
            )}

            {simulatedLink && (
              <div style={{ padding: 'var(--spacing-md)', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 'var(--spacing-lg)' }}>
                <p className="text-xs text-muted" style={{ marginBottom: '0.25rem', fontWeight: 600 }}>Simulated recovery link:</p>
                <Link href={simulatedLink} className="text-sm font-semibold" style={{ textDecoration: 'underline' }}>
                  Click here to Reset Password
                </Link>
              </div>
            )}

            <form onSubmit={handleForgot}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgotEmail">Email address</label>
                <input
                  id="forgotEmail"
                  type="email"
                  className="form-input"
                  placeholder="you@university.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? 'Sending request...' : 'Send Recovery Link'}
              </button>
            </form>

            <div className="auth-footer">
              <button
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600 }}
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}

        {mode === 'reset' && (
          <>
            <h1 className="auth-title">Choose New Password</h1>
            <p className="auth-subtitle">Enter a new secure password for your portal</p>

            {resetSuccess && (
              <div className="auth-error" style={{ background: 'rgba(5, 150, 105, 0.08)', borderColor: 'rgba(5, 150, 105, 0.15)', color: '#059669' }}>
                {resetSuccess} Redirecting to login...
              </div>
            )}

            <form onSubmit={handleReset}>
              <div className="form-group">
                <label className="form-label" htmlFor="resetToken">Recovery Token</label>
                <input
                  id="resetToken"
                  type="text"
                  className="form-input"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? 'Updating password...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        <div style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
        }}>
          <p className="text-xs text-muted" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
            Standard Credentials
          </p>
          <div className="text-xs text-muted" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Faculty: teacher@assignsys.com / teacher123</span>
            <span>Student: student@assignsys.com / student123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
