'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div style={{
      background: '#09090B',
      color: '#F3F4F6',
      minHeight: '100vh',
      fontFamily: '"Inter", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Glow Effects */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.03) 70%, transparent 100%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.04) 0%, rgba(99,102,241,0.02) 70%, transparent 100%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />

      {/* Floating Header */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: 'white',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8125rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          }}>AP</div>
          <span style={{ fontSize: '1.0625rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>AssignPro</span>
        </div>
        
        <div>
          {loading ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Connecting...</span>
          ) : user ? (
            <Link href="/dashboard" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--r-lg)', padding: '8px 16px', fontSize: '0.875rem', fontWeight: 600 }}>
              Enter Workspace
            </Link>
          ) : (
            <Link href="/login" className="btn btn-gradient" style={{ borderRadius: 'var(--r-lg)', padding: '8px 20px', fontSize: '0.875rem', fontWeight: 600 }}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px 120px', position: 'relative', zIndex: 5 }}>
        
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 80px' }} className="animate-slideUp">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 'var(--r-full)', padding: '6px 14px', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366F1' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818CF8', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Introducing Workspace 2.0</span>
          </div>
          
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            lineHeight: '1.08',
            letterSpacing: '-0.05em',
            marginBottom: '20px',
            color: '#FFFFFF',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            The productivity platform for modern academics.
          </h1>
          
          <p style={{
            fontSize: '1.125rem',
            lineHeight: '1.6',
            color: '#9CA3AF',
            marginBottom: '32px',
          }}>
            Forget generic administration portals. Experience an assignment operating system inspired by Stripe and Linear, custom-tailored for elite students and faculty.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            {user ? (
              <Link href="/dashboard" className="btn btn-gradient" style={{ padding: '12px 28px', fontSize: '0.9375rem', borderRadius: 'var(--r-xl)', fontWeight: 600 }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-gradient" style={{ padding: '12px 28px', fontSize: '0.9375rem', borderRadius: 'var(--r-xl)', fontWeight: 600 }}>
                  Enter Workspace
                </Link>
                <Link href="/register" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px 28px', fontSize: '0.9375rem', borderRadius: 'var(--r-xl)', fontWeight: 600 }}>
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Bento Grid Mockup */}
        <div className="bento-container" style={{ marginTop: '40px' }} className="animate-slideUp">
          
          {/* Card 1: Interactive Ring Mockup */}
          <div className="glass-card bento-span-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '24px', alignSelf: 'flex-start' }}>Performance Tracking</h3>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg width="100" height="100">
                <circle stroke="rgba(255,255,255,0.04)" fill="transparent" strokeWidth="6" r="42" cx="50" cy="50" />
                <circle stroke="#6366F1" fill="transparent" strokeWidth="6" strokeDasharray="263" strokeDashoffset="45" strokeLinecap="round" r="42" cx="50" cy="50" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, color: 'white' }}>83%</div>
            </div>
            <div style={{ marginTop: '24px', fontSize: '0.75rem', color: '#6B7280', textAlign: 'center' }}>Live Class Progress Analytics</div>
          </div>

          {/* Card 2: Immersive Features showcase */}
          <div className="glass-card bento-span-2" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.1)', color: '#A78BFA', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 'var(--r-sm)', marginBottom: '16px' }}>
                Unified Calendar
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Never miss an evaluation cycle.
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#9CA3AF', lineHeight: '1.5', margin: 0 }}>
                A context-aware calendar and activity feed maps out submission lifecycles dynamically, ensuring alignment across academic departments.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
            </div>
          </div>

          {/* Card 3: Command Center info */}
          <div className="glass-card bento-span-2" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(20,184,166,0.1)', color: '#2DD4BF', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 'var(--r-sm)', marginBottom: '16px' }}>
                Quick Navigation
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Access shortcuts via Command Search.
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#9CA3AF', lineHeight: '1.5', margin: 0 }}>
                Press <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.6875rem' }}>⌘K</kbd> anywhere on the dashboard to immediately open shortcut controls, navigate courses, view profiles, and submit assignments.
              </p>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '24px' }}>Inspired by Apple and Raycast workflows.</div>
          </div>

          {/* Card 4: Heatmap grid preview */}
          <div className="glass-card bento-span-1" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '16px' }}>Activity Grid</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                {Array.from({ length: 40 }).map((_, idx) => (
                  <div key={idx} style={{
                    aspectRatio: 1,
                    borderRadius: '2px',
                    background: idx % 6 === 0 ? '#6366F1' : idx % 9 === 0 ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.03)'
                  }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '16px' }}>Continuous Engagement Logs</div>
          </div>

        </div>

      </main>

      {/* Modern Status Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '32px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#6B7280',
        position: 'relative',
        zIndex: 10,
      }}>
        <span>AssignPro LMS. Crafted for elite workflows.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
          <span style={{ color: '#10B981', fontWeight: 600 }}>All Services Operational</span>
        </div>
      </footer>
    </div>
  );
}
