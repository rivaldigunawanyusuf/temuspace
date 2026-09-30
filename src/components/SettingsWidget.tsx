import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useTranslation } from 'react-i18next';
import { Settings2, Moon, Sun, Languages, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export default function SettingsWidget() {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    zoom,
    setZoom,
    activeFloatingWidget,
    toggleFloatingWidget,
    closeFloatingWidgets,
  } = useAppStore();

  const { t } = useTranslation();
  const open = activeFloatingWidget === 'settings';
  const isMember = useAuthStore((s) => s.activePortal === 'member');

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFloatingWidgets();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, closeFloatingWidgets]);

  return (
    <>
      {/* Backdrop for click outside */}
      {open && (
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

      {/* Settings FAB */}
      <button
        onClick={() => toggleFloatingWidget('settings')}
        className="settings-widget-fab"
        title={open ? 'Tutup Pengaturan' : 'Buka Pengaturan & Aksesibilitas'}
        style={{
          background: open ? '#EF4444' : 'var(--text-primary)',
          color: 'var(--bg-primary)',
        }}
      >
        {open ? <X size={20} /> : <Settings2 size={20} />}
      </button>

      {/* Settings Menu */}
      {open && (
        <div 
          className="settings-widget-menu"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)',
            padding: 16,
            width: 240,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fade-in 0.2s ease-out',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Theme */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 12, borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'light' ? t('lightMode') : t('darkMode')}
            </div>
            <div style={{ width: 32, height: 16, background: theme === 'dark' ? 'var(--accent-blue)' : 'var(--border-medium)', borderRadius: 16, position: 'relative' }}>
              <div style={{ width: 12, height: 12, background: '#fff', borderRadius: '50%', position: 'absolute', top: 1, left: theme === 'dark' ? 18 : 2, transition: 'all 0.2s' }} />
            </div>
          </button>

          {/* Language */}
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 12, borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Languages size={16} />
              {language.toUpperCase()}
            </div>
          </button>

          {/* Accessibility (Zoom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('accessibility')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setZoom(Math.max(0.8, zoom - 0.1))}
                style={{ flex: 1, padding: 8, borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
              >
                <ZoomOut size={16} />
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                style={{ flex: 1, padding: 8, borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .settings-widget-fab {
          position: fixed;
          right: 76px;
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
        .settings-widget-menu {
          position: fixed;
          right: 76px;
          z-index: 499;
          bottom: 80px;
        }
        @media (max-width: 767px) {
          .settings-widget-fab {
            bottom: ${isMember ? '100px' : '24px'};
          }
          .settings-widget-menu {
            bottom: ${isMember ? '156px' : '80px'};
          }
        }
      `}</style>
    </>
  );
}
