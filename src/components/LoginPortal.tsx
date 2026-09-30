/**
 * LoginPortal.tsx - Authentication Landing Page
 * 
 * Features:
 * - Quick-Login cards for judges (Member & Admin)
 * - Prefilled email/password
 * - Stunning dark HUD design with animations
 */
import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { LogIn, Shield, Users, Sparkles, Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginPortal() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        setError('Email atau password tidak valid.');
      }
      setLoading(false);
    }, 400);
  };

  const quickLogin = (role: 'member' | 'admin') => {
    setLoading(true);
    setError('');
    const em = role === 'member' ? 'member@temuspace.com' : 'admin@temuspace.com';
    const pw = role === 'member' ? 'member123' : 'admin123';
    setEmail(em);
    setPassword(pw);
    setTimeout(() => {
      login(em, pw);
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(35,122,87,0.05) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246,0.05) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      {/* Main Login Card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-3xl)',
        padding: '40px 32px',
        width: '100%',
        maxWidth: 720,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        animation: 'fade-in 0.6s ease-out',
      }}>
        {/* Brand Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '-0.5px',
            }}>
              TemuSpace
            </h1>
          </div>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: 15,
            marginTop: 16,
            maxWidth: 400,
            lineHeight: 1.6,
            marginInline: 'auto'
          }}>
            Platform komunitas open-source dengan Virtual HQ, Social LMS, dan Organization Resource Planner.
          </p>
        </div>

        {/* Quick Login Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          width: '100%',
          marginBottom: 32,
        }}>
          {/* Member Card */}
          <button
            onClick={() => quickLogin('member')}
            disabled={loading}
            style={{
              padding: 24,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-green)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'rgba(35,122,87,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={24} color="var(--accent-green)" />
              </div>
              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>Quick Login</div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}> Member Portal</div>
              </div>
            </div>
            <p style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 20,
              lineHeight: 1.5,
            }}>
              Akses FYP Feed, Resources, Virtual Room, Events, dan Profile.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'var(--accent-green)',
              borderRadius: 'var(--radius-pill)',
              color: '#FFF',
              fontSize: 14,
              fontWeight: 600,
            }}>
              <Zap size={18} />
              Masuk Member
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => quickLogin('admin')}
            disabled={loading}
            style={{
              padding: 24,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'rgba(59, 130, 246,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Shield size={24} color="var(--accent-blue)" />
              </div>
              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent-blue)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>Quick Login</div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}> Admin ERP</div>
              </div>
            </div>
            <p style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 20,
              lineHeight: 1.5,
            }}>
              Akses Dashboard, Treasury, Sekretariat, Kanban, Event Manager.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'var(--accent-blue)',
              borderRadius: 'var(--radius-pill)',
              color: '#FFF',
              fontSize: 14,
              fontWeight: 600,
            }}>
              <Shield size={18} />
              Masuk Admin
            </div>
          </button>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          maxWidth: 400,
          marginBottom: 24,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>atau masuk manual</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleLogin} style={{
          width: '100%',
          maxWidth: 400,
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@temuspace.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-green)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>
          <div style={{ marginBottom: 24, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '14px 44px 14px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-green)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 14,
                top: 38,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-lg)',
              color: '#EF4444',
              fontSize: 13,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: loading ? 'var(--bg-elevated)' : 'var(--accent-green)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              color: loading ? 'var(--text-muted)' : '#FFF',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              opacity: (!email || !password) ? 0.6 : 1,
              boxShadow: (!email || !password || loading) ? 'none' : '0 4px 14px rgba(35,122,87,0.3)',
            }}
          >
            <LogIn size={20} />
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: 32,
        fontSize: 12,
        color: 'var(--text-muted)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        2026 TemuSpace, INVENTION 2026, Universitas Udayana
      </p>
    </div>
  );
}
