/**
 * App.tsx - Root component with Auth Router
 * 
 * Routes:
 * - Not authenticated → LoginPortal
 * - Authenticated as Member → MemberPortal (5 tabs + Virtual Room)
 * - Authenticated as Admin → AdminPortal (ERP sidebar)
 * 
 * Includes floating Role Switcher widget
 */
import { useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import LoginPortal from './components/LoginPortal';
import LandingPage from './components/LandingPage';
import MemberPortal from './components/MemberPortal';
import AdminPortal from './components/AdminPortal';
import RoleSwitcher from './components/RoleSwitcher';
import SettingsWidget from './components/SettingsWidget';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { useGameStore } from './stores/useGameStore';
import { useAdminStore } from './stores/useAdminStore';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activePortal = useAuthStore((s) => s.activePortal);
  const activeTab = useGameStore((s) => s.activeTab);
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize theme from store
  useEffect(() => {
    const { theme, zoom, language } = useAppStore.getState();
    document.documentElement.setAttribute('data-theme', theme);
    (document.documentElement.style as any).zoom = zoom;
    if ((document.documentElement.style as any).zoom !== String(zoom) && (document.documentElement.style as any).zoom !== zoom) {
      document.body.style.transform = `scale(${zoom})`;
      document.body.style.transformOrigin = 'top center';
    }
    import('./i18n').then((i18n) => i18n.default.changeLanguage(language));
  }, []);

  // Sync state to URL
  useEffect(() => {
    if (!isAuthenticated) {
      if (showLogin) {
        if (location.pathname !== '/login') navigate('/login', { replace: true });
      } else {
        if (location.pathname !== '/') navigate('/', { replace: true });
      }
    } else {
      if (activePortal === 'admin') {
        if (!location.pathname.startsWith('/admin')) {
          navigate('/admin/dashboard', { replace: true });
        }
      } else {
        const target = `/m/${activeTab}`;
        if (location.pathname !== target) {
          navigate(target, { replace: true });
        }
      }
    }
  }, [isAuthenticated, activePortal, activeTab, showLogin]);

  // Sync URL to state on load
  useEffect(() => {
    const path = location.pathname;
    if (path === '/login') {
      setShowLogin(true);
    } else if (path === '/') {
      setShowLogin(false);
    } else if (path.startsWith('/m/')) {
      const tab = path.replace('/m/', '');
      if (['homepage', 'resources', 'virtual-room', 'events', 'profile'].includes(tab)) {
        useGameStore.getState().setActiveTab(tab as any);
        if (activePortal !== 'member') useAuthStore.getState().switchPortal('member');
      } else {
        navigate('/', { replace: true });
      }
    } else if (path.startsWith('/admin/')) {
      const tab = path.replace('/admin/', '');
      if (['dashboard', 'room-designer', 'treasury', 'secretariat', 'events', 'kanban', 'lms', 'moderator'].includes(tab)) {
        if (activePortal !== 'admin') useAuthStore.getState().switchPortal('admin');
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [location.pathname, activePortal, navigate]);

  // Not logged in → show Landing Page or Login Portal
  if (!isAuthenticated) {
    if (showLogin) {
      return <LoginPortal />;
    }
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  return (
    <>
      {/* Main Portal */}
      {activePortal === 'admin' ? <AdminPortal /> : <MemberPortal />}

      {/* Floating Widgets */}
      <RoleSwitcher />
      <SettingsWidget />
    </>
  );
}
