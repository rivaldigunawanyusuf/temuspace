/**
 * AdminSidebar.tsx - Collapsible Sidebar for Admin Portal
 * 
 * Desktop: Always visible left sidebar
 * Mobile: Drawer that slides in from left
 */
import type { AdminPage } from '../AdminPortal';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  LayoutDashboard, Map, Wallet, FileText, CalendarDays, KanbanSquare,
  BookOpen, Shield, Menu, X, LogOut, Sparkles, ChevronLeft
} from 'lucide-react';

interface Props {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { key: AdminPage; icon: React.ReactNode; label: string }[] = [
  { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: 'room-designer', icon: <Map size={18} />, label: 'Room Designer' },
  { key: 'treasury', icon: <Wallet size={18} />, label: 'Bendahara' },
  { key: 'secretariat', icon: <FileText size={18} />, label: 'Sekretariat' },
  { key: 'events', icon: <CalendarDays size={18} />, label: 'Event Manager' },
  { key: 'kanban', icon: <KanbanSquare size={18} />, label: 'Kanban & Kalender' },
  { key: 'lms', icon: <BookOpen size={18} />, label: 'LMS Studio' },
  { key: 'moderator', icon: <Shield size={18} />, label: 'Moderator' },
];

export default function AdminSidebar({ activePage, onNavigate, isOpen, onToggle }: Props) {
  const { currentUser, logout } = useAuthStore();

  return (
    <>
      {/* Mobile hamburger */}
      {!isOpen && (
        <button
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 210,
            display: 'none',
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
          className="admin-hamburger"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          height: '100dvh',
          background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 200,
          transform: isOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s ease',
          flexShrink: 0,
        }}
        className="admin-sidebar"
      >
        {/* Brand */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>TemuSpace</div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: 'var(--accent-terracotta)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                ADMIN ERP PANEL
              </div>
            </div>
          </div>
          
          <button 
            className="admin-close-btn" 
            onClick={onToggle} 
            style={{ 
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-xl)', padding: 8, color: 'var(--text-primary)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                background: activePage === key ? 'rgba(59, 130, 246,0.1)' : 'transparent',
                border: activePage === key ? '1px solid rgba(59, 130, 246,0.2)' : '1px solid transparent',
                borderRadius: 'var(--radius-2xl)',
                color: activePage === key ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: activePage === key ? 700 : 500,
                cursor: 'pointer',
                marginBottom: 2,
                textAlign: 'left',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activePage !== key) {
                  e.currentTarget.style.background = 'var(--bg-primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activePage !== key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentUser?.avatar?.startsWith('http') ? (
                <img src={currentUser.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                currentUser?.avatar
              )}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{currentUser?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              width: '100%', padding: '8px 12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 'var(--radius-xl)',
              color: '#EF4444',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Spacer for desktop layout */}
      <div style={{ width: 240, flexShrink: 0 }} className="admin-sidebar-spacer" />

      <style>{`
        @media (max-width: 768px) {
          .admin-hamburger { display: flex !important; }
          .admin-sidebar { 
            transform: translateX(${isOpen ? '0' : '-100%'}); 
            width: 100% !important;
          }
          .admin-sidebar-spacer { display: none !important; }
          .admin-close-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .admin-close-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}
