/**
 * useAuthStore.ts - Authentication & Role Management
 * 
 * Features:
 * - Login/Logout with localStorage persistence
 * - Quick-Login prefill for judges (member@temuspace.com / admin@temuspace.com)
 * - Role switching (Member ⇄ Admin) without re-login
 * - User profile data
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'member' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  avatar: string;
  bio: string;
  joinDate: string;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
}

const MEMBER_PROFILE: UserProfile = {
  id: 'user-member-001',
  name: 'Andi Pratama',
  username: 'andipratama',
  email: 'member@temuspace.com',
  role: 'member',
  avatar: 'https://i.pravatar.cc/150?u=Andi',
  bio: 'Full-stack developer & UI enthusiast. Aktif di komunitas TemuSpace sejak 2024. ',
  joinDate: '2024-08-15',
  stats: { posts: 24, followers: 156, following: 89 },
};

const ADMIN_PROFILE: UserProfile = {
  id: 'user-admin-001',
  name: 'Dewi Kartika',
  username: 'dewikartika',
  email: 'admin@temuspace.com',
  role: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=Dewi',
  bio: 'Ketua Organisasi TemuSpace. Mengelola komunitas teknologi terbesar di kampus. ',
  joinDate: '2024-01-10',
  stats: { posts: 67, followers: 432, following: 128 },
};

interface AuthState {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  activePortal: 'member' | 'admin';

  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchPortal: (portal: 'member' | 'admin') => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      activePortal: 'member',

      login: (email: string, _password: string) => {
        if (email === 'member@temuspace.com') {
          set({ isAuthenticated: true, currentUser: MEMBER_PROFILE, activePortal: 'member' });
          return true;
        }
        if (email === 'admin@temuspace.com') {
          set({ isAuthenticated: true, currentUser: ADMIN_PROFILE, activePortal: 'admin' });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false, currentUser: null, activePortal: 'member' });
      },

      switchPortal: (portal) => {
        set((state) => {
          if (!state.currentUser) return state;
          const profile = portal === 'admin' ? ADMIN_PROFILE : MEMBER_PROFILE;
          return { activePortal: portal, currentUser: profile };
        });
      },

      updateProfile: (updates) => {
        set((state) => {
          if (!state.currentUser) return state;
          return { currentUser: { ...state.currentUser, ...updates } };
        });
      },
    }),
    {
      name: 'temuspace-auth',
      version: 2,
    }
  )
);
