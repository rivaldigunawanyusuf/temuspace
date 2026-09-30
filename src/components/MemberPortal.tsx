/**
 * MemberPortal.tsx - Container for Member Portal (5 tabs)
 * 
 * Wraps the 5 bottom nav pages: Homepage, Resources, Virtual Room, Events, Profile
 * Virtual Room is shown full-screen when active
 */
import { useGameStore } from '../stores/useGameStore';
import Homepage from './member/Homepage';
import Resources from './member/Resources';
import Events from './member/Events';
import Profile from './member/Profile';
import VirtualRoom from './VirtualRoom';
import BottomNavbar from './BottomNavbar';

export default function MemberPortal() {
  const activeTab = useGameStore((s) => s.activeTab);

  // Virtual Room is full-screen without standard layout
  if (activeTab === 'virtual-room') {
    return (
      <div style={{ width: '100%', height: '100dvh', position: 'relative' }}>
        <VirtualRoom />
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="portal-layout" style={{
      width: '100%',
      background: 'var(--bg-primary)',
    }}>
      {/* Page Content */}
      <div className="portal-content">
        {activeTab === 'homepage' && <Homepage />}
        {activeTab === 'resources' && <Resources />}
        {activeTab === 'events' && <Events />}
        {activeTab === 'profile' && <Profile />}
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
}
