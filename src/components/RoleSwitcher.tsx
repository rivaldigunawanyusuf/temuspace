/**
 * RoleSwitcher.tsx - Floating Role Switcher Widget
 * 
 * Always visible when authenticated.
 * Allows users and judges to switch between Member and Admin portals.
 * Coordinates with SettingsWidget so only one floating menu can be open at a time.
 */
import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ArrowLeftRight, Users, Shield, X, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RoleSwitcher() {
  const { currentUser, activePortal, switchPortal, logout } = useAuthStore();
  const {
    activeFloatingWidget,
    toggleFloatingWidget,
    closeFloatingWidgets,
  } = useAppStore();

  const expanded = activeFloatingWidget === 'role';
  const { t } = useTranslation();

  // Close on Escape key press
  useEffect(() => {
    if (!expanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFloatingWidgets();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, closeFloatingWidgets]);

  if (!currentUser) return null;

  const isMember = activePortal === 'member';

  return (
    <>
      {/* Backdrop for click outside */}
      {expanded && (
        <div
          onClick={closeFloatingWidgets}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 490,
            background: 'transparent',
          }}
        />
      )}

      {/* Main FAB */}
      <button
        onClick={() => toggleFloatingWidget('role')}
        className="role-switcher-fab"
        title={expanded ? 'Tutup Switcher' : 'Ganti Portal Peran'}
        style={{
          background: expanded
            ? '#EF4444'
            : isMember
              ? '#8B5CF6'
              : '#3B82F6',
          color: '#F7F9F8',
        }}
      >
        {expanded ? <X size={20} /> : <ArrowLeftRight size={20} />}
      </button>

      {/* Expanded Menu */}
      {expanded && (
        <div 
          className="role-switcher-menu"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)',
            padding: 16,
            width: 240,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fade-in 0.2s ease-out',
          }}
        >
          {/* Current role indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 12,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              {currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:image') ? (
                <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.avatar
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{currentUser.name}</div>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: isMember ? 'var(--accent-green)' : 'var(--accent-terracotta)',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {isMember ? `● ${t('member_portal', 'MEMBER PORTAL')}` : `● ${t('admin_erp', 'ADMIN ERP')}`}
              </div>
            </div>
          </div>

          {/* Switch buttons */}
          <button
            onClick={() => { switchPortal(isMember ? 'admin' : 'member'); closeFloatingWidgets(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 14px',
              background: 'var(--bg-primary)',
              border: `1px solid var(--border-subtle)`,
              borderRadius: 'var(--radius-2xl)',
              color: isMember ? 'var(--accent-terracotta)' : 'var(--accent-green)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = isMember ? 'var(--accent-terracotta)' : 'var(--accent-green)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            {isMember ? <Shield size={16} /> : <Users size={16} />}
            <span style={{ textTransform: 'uppercase' }}>{isMember ? t('admin_erp', 'Admin ERP') : t('member_portal', 'Member Portal')}</span>
            <ArrowLeftRight size={12} style={{ marginLeft: 'auto', opacity: 0.7 }} />
          </button>

          <button
            onClick={() => { logout(); closeFloatingWidgets(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 'var(--radius-2xl)',
              color: '#EF4444',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      )}

      <style>{`
        .role-switcher-fab {
          position: fixed;
          right: 16px;
          z-index: 500;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
          bottom: 24px;
        }
        .role-switcher-menu {
          position: fixed;
          right: 16px;
          z-index: 499;
          bottom: 80px;
        }
        @media (max-width: 767px) {
          .role-switcher-fab {
            bottom: ${isMember ? '100px' : '24px'};
          }
          .role-switcher-menu {
            bottom: ${isMember ? '156px' : '80px'};
          }
        }
      `}</style>
    </>
  );
}
