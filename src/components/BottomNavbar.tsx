/**
 * BottomNavbar.tsx - 5-tab bottom navigation (always visible)
 * Homepage | Resources | Virtual Room (center circle) | Events | Profile
 */
import { useGameStore } from '../stores/useGameStore';
import { Home, BookOpen, Gamepad2, CalendarDays, User } from 'lucide-react';

type Tab = 'homepage' | 'resources' | 'virtual-room' | 'events' | 'profile';

interface NavItem {
  id: Tab;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'homepage', icon: <Home size={20} />, activeIcon: <Home size={20} strokeWidth={2.5} />, label: 'Beranda' },
  { id: 'resources', icon: <BookOpen size={20} />, activeIcon: <BookOpen size={20} strokeWidth={2.5} />, label: 'Resources' },
  { id: 'virtual-room', icon: <Gamepad2 size={24} />, activeIcon: <Gamepad2 size={24} strokeWidth={2.5} />, label: 'Room' },
  { id: 'events', icon: <CalendarDays size={20} />, activeIcon: <CalendarDays size={20} strokeWidth={2.5} />, label: 'Events' },
  { id: 'profile', icon: <User size={20} />, activeIcon: <User size={20} strokeWidth={2.5} />, label: 'Profil' },
];

import { useTranslation } from 'react-i18next';

export default function BottomNavbar() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const { t } = useTranslation();

  return (
    <div className="portal-nav-wrapper">
      <nav className="portal-nav-container">
        {NAV_ITEMS.map((item) => {
          const isCenter = item.id === 'virtual-room';
          const isActive = activeTab === item.id;

          if (isCenter) {
            return (
              <div key={item.id} className="portal-nav-center">
                <button
                  className="portal-nav-center-btn"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    background: isActive ? 'var(--accent-green)' : 'var(--bg-elevated)',
                    border: `2px solid ${isActive ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                    color: isActive ? '#fff' : 'var(--text-primary)',
                    boxShadow: isActive ? 'var(--shadow-glow-green)' : 'var(--shadow-float)',
                  }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              className="portal-nav-btn"
              onClick={() => setActiveTab(item.id)}
              style={{ color: isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}
            >
              {isActive ? item.activeIcon : item.icon}
              <span className="portal-nav-label" style={{ fontWeight: isActive ? 700 : 500 }}>
                {item.id === 'homepage' ? t('home') : item.id === 'resources' ? t('resources') : item.id === 'virtual-room' ? 'Room' : item.id === 'events' ? t('events') : item.id === 'profile' ? t('profile') : item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
