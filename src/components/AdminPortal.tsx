/**
 * AdminPortal.tsx - Admin ERP Container
 * 
 * Uses collapsible sidebar (no bottom navbar per design spec)
 * Routes between dashboard, room designer, treasury, secretariat,
 * event manager, kanban, LMS studio, moderator
 */
import { useState } from 'react';
import AdminSidebar from './admin/AdminSidebar';
import Dashboard from './admin/Dashboard';
import Treasury from './admin/Treasury';
import Secretariat from './admin/Secretariat';
import EventManager from './admin/EventManager';
import TaskKanban from './admin/TaskKanban';
import LMSStudio from './admin/LMSStudio';
import Moderator from './admin/Moderator';
import RoomDesigner from './RoomDesigner';

import { useNavigate, useLocation } from 'react-router-dom';

export type AdminPage = 'dashboard' | 'room-designer' | 'treasury' | 'secretariat' | 'events' | 'kanban' | 'lms' | 'moderator';

export default function AdminPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const activePage = (pathParts[2] || 'dashboard') as AdminPage;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'room-designer': return <RoomDesigner />;
      case 'treasury': return <Treasury />;
      case 'secretariat': return <Secretariat />;
      case 'events': return <EventManager />;
      case 'kanban': return <TaskKanban />;
      case 'lms': return <LMSStudio />;
      case 'moderator': return <Moderator />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: 'var(--bg-primary)',
      display: 'flex',
    }}>
      <AdminSidebar
        activePage={activePage}
        onNavigate={(page) => { navigate(`/admin/${page}`); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div 
        className="admin-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100dvh',
        }}
      >
        {renderPage()}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <style>{`
        @media (max-width: 768px) {
          .admin-content {
            padding-top: 60px; /* Space for the hamburger menu */
          }
        }
      `}</style>
    </div>
  );
}
