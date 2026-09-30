/**
 * useResourceStore.ts - LMS Modules & Community Vault (Zustand + persist)
 * 
 * Full CRUD: Create, Read, Update, Delete modules & resources
 * Progress tracking per module
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LMSLesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  completed: boolean;
}

export interface LMSModule {
  id: string;
  title: string;
  description: string;
  category: 'artikel' | 'video' | 'tutorial';
  authorName: string;
  authorAvatar: string;
  duration: string; // e.g., "15 min read" or "32:00"
  thumbnail: string; // emoji placeholder
  content: string; // markdown content or video URL
  progress: number; // 0-100
  totalSections: number;
  completedSections: number;
  lessons?: LMSLesson[];
  tags: string[];
  createdAt: number;
  isPublished: boolean;
}

export type VaultCategory = 'photos' | 'videos' | 'files' | 'links' | 'audio' | 'templates';

export interface VaultResource {
  id: string;
  name: string;
  description: string;
  category: VaultCategory;
  fileUrl: string;
  fileSize: string;
  uploadedBy: string;
  uploadedByAvatar: string;
  uploadedAt: number;
  downloads: number;
  icon: string;
}

// ============================================================
// Seed Data
// ============================================================

const now = Date.now();
const DAY = 86400000;

const SEED_MODULES: LMSModule[] = [
  {
    id: 'mod-001',
    title: 'Pengenalan React Hooks & State Management',
    description: 'Pelajari konsep dasar React Hooks mulai dari useState, useEffect, hingga custom hooks. Cocok untuk pemula yang ingin memahami state management modern.',
    category: 'tutorial',
    authorName: 'Dewi Kartika',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    duration: '25 menit baca',
    thumbnail: '',
    content: '# React Hooks & State Management\n\nReact Hooks adalah fitur yang memungkinkan kita menggunakan state dan lifecycle methods di functional component...',
    progress: 60,
    totalSections: 5,
    completedSections: 3,
    tags: ['react', 'hooks', 'javascript'],
    createdAt: now - 14 * DAY,
    isPublished: true,
  },
  {
    id: 'mod-002',
    title: 'CSS Grid & Flexbox: Layout Modern',
    description: 'Panduan lengkap CSS Grid dan Flexbox untuk membuat layout responsif dan modern. Dari dasar hingga advanced patterns.',
    category: 'video',
    authorName: 'Sinta Rahayu',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    duration: '45:00',
    thumbnail: '',
    content: 'https://youtu.be/ah7XBRpMd7Y?si=5wLq21zN7Y_8GHYv',
    progress: 100,
    totalSections: 8,
    completedSections: 8,
    tags: ['css', 'layout', 'responsive'],
    createdAt: now - 10 * DAY,
    isPublished: true,
  },
  {
    id: 'mod-003',
    title: 'TypeScript untuk Proyek Besar',
    description: 'Cara memanfaatkan TypeScript untuk membangun aplikasi skala besar. Generics, utility types, dan pattern yang sering dipakai di industri.',
    category: 'artikel',
    authorName: 'Farhan Aditya',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    duration: '18 menit baca',
    thumbnail: '',
    content: '# TypeScript untuk Proyek Besar\n\nTypeScript memberikan type safety yang sangat membantu dalam proyek besar...',
    progress: 30,
    totalSections: 6,
    completedSections: 2,
    tags: ['typescript', 'best-practices'],
    createdAt: now - 7 * DAY,
    isPublished: true,
  },
  {
    id: 'mod-004',
    title: 'Git & GitHub Workflow untuk Tim',
    description: 'Strategi branching, code review, dan CI/CD yang efektif untuk kolaborasi tim development. Termasuk tips mengatasi merge conflict.',
    category: 'tutorial',
    authorName: 'Raka Mahendra',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    duration: '20 menit baca',
    thumbnail: '',
    content: '# Git & GitHub Workflow\n\nKetika bekerja dalam tim, workflow Git yang baik sangat krusial...',
    progress: 0,
    totalSections: 4,
    completedSections: 0,
    tags: ['git', 'github', 'kolaborasi'],
    createdAt: now - 5 * DAY,
    isPublished: true,
  },
  {
    id: 'mod-005',
    title: 'Intro to Machine Learning dengan Python',
    description: 'Dasar-dasar machine learning: supervised vs unsupervised learning, model evaluasi, dan hands-on dengan scikit-learn.',
    category: 'video',
    authorName: 'Lina Permata',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    duration: '1:15:00',
    thumbnail: '',
    content: 'https://youtu.be/d-_qOv-WyrM?si=Z68noC4_0nSn401G',
    progress: 0,
    totalSections: 10,
    completedSections: 0,
    tags: ['machine-learning', 'python', 'data-science'],
    createdAt: now - 3 * DAY,
    isPublished: true,
  },
  {
    id: 'mod-006',
    title: 'UI/UX Design Principles untuk Developer',
    description: 'Prinsip desain yang wajib dikuasai developer: hierarki visual, color theory, tipografi, dan spacing. Buat produk yang bukan cuma berfungsi, tapi juga indah.',
    category: 'artikel',
    authorName: 'Sinta Rahayu',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    duration: '12 menit baca',
    thumbnail: '',
    content: '# UI/UX Design Principles\n\nSebagai developer, memahami prinsip desain bisa membuat produk kita jauh lebih baik...',
    progress: 45,
    totalSections: 4,
    completedSections: 2,
    tags: ['design', 'ui-ux', 'tips'],
    createdAt: now - 1 * DAY,
    isPublished: true,
  },
];

const SEED_VAULT: VaultResource[] = [
  { id: 'vault-001', name: 'Brand Guidelines TemuSpace.pdf', description: 'Panduan lengkap branding & visual identity TemuSpace', category: 'files', fileUrl: '#', fileSize: '2.4 MB', uploadedBy: 'Dewi Kartika', uploadedByAvatar: '‍', uploadedAt: now - 10 * DAY, downloads: 34, icon: '' },
  { id: 'vault-002', name: 'Foto Gathering Komunitas Sept 2026', description: 'Dokumentasi gathering komunitas di kampus', category: 'photos', fileUrl: '#', fileSize: '15.2 MB', uploadedBy: 'Yoga Pramana', uploadedByAvatar: '‍', uploadedAt: now - 8 * DAY, downloads: 56, icon: '' },
  { id: 'vault-003', name: 'Rekaman Workshop React Hooks', description: 'Video rekaman workshop React Hooks oleh Dewi', category: 'videos', fileUrl: '#', fileSize: '340 MB', uploadedBy: 'Farhan Aditya', uploadedByAvatar: '‍️', uploadedAt: now - 6 * DAY, downloads: 89, icon: '' },
  { id: 'vault-004', name: 'Template Proposal Proker', description: 'Template proposal program kerja organisasi', category: 'templates', fileUrl: '#', fileSize: '156 KB', uploadedBy: 'Dewi Kartika', uploadedByAvatar: '', uploadedAt: now - 5 * DAY, downloads: 28, icon: '' },
  { id: 'vault-005', name: 'Podcast: Karir di Startup vs Corporate', description: 'Episode 5 podcast komunitas tentang jalur karir', category: 'audio', fileUrl: '#', fileSize: '42 MB', uploadedBy: 'Lina Permata', uploadedByAvatar: '', uploadedAt: now - 4 * DAY, downloads: 67, icon: '' },
  { id: 'vault-006', name: 'Kumpulan Link Resources Web Dev 2026', description: 'Kurasi link terbaik untuk belajar web development', category: 'links', fileUrl: '#', fileSize: '-', uploadedBy: 'Raka Mahendra', uploadedByAvatar: '', uploadedAt: now - 3 * DAY, downloads: 112, icon: '' },
  { id: 'vault-007', name: 'Figma UI Kit - Dark Mode Components', description: 'Komponen Figma siap pakai untuk proyek dark mode', category: 'templates', fileUrl: '#', fileSize: '8.1 MB', uploadedBy: 'Sinta Rahayu', uploadedByAvatar: '', uploadedAt: now - 2 * DAY, downloads: 45, icon: '' },
  { id: 'vault-008', name: 'Cheatsheet: Docker Commands', description: 'Referensi cepat perintah Docker yang sering dipakai', category: 'files', fileUrl: '#', fileSize: '320 KB', uploadedBy: 'Maya Kusuma', uploadedByAvatar: '‍', uploadedAt: now - 1 * DAY, downloads: 91, icon: '' },
];

// ============================================================
// Store
// ============================================================

interface ResourceState {
  modules: LMSModule[];
  vault: VaultResource[];

  // Module CRUD
  addModule: (module: LMSModule) => void;
  updateModule: (id: string, updates: Partial<LMSModule>) => void;
  deleteModule: (id: string) => void;
  updateModuleProgress: (id: string, completedSections: number) => void;
  toggleLessonComplete: (moduleId: string, lessonId: string) => void;

  // Vault CRUD
  addVaultResource: (resource: VaultResource) => void;
  updateVaultResource: (id: string, updates: Partial<VaultResource>) => void;
  deleteVaultResource: (id: string) => void;
  incrementDownload: (id: string) => void;
}

let moduleCounter = 100;
export function generateModuleId(): string {
  return `mod-${Date.now()}-${++moduleCounter}`;
}

let vaultCounter = 100;
export function generateVaultId(): string {
  return `vault-${Date.now()}-${++vaultCounter}`;
}

export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      modules: SEED_MODULES,
      vault: SEED_VAULT,

      addModule: (module) =>
        set((state) => ({ modules: [module, ...state.modules] })),

      updateModule: (id, updates) =>
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deleteModule: (id) =>
        set((state) => ({
          modules: state.modules.filter((m) => m.id !== id),
        })),

      updateModuleProgress: (id, completedSections) =>
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === id
              ? {
                  ...m,
                  completedSections,
                  progress: Math.round((completedSections / m.totalSections) * 100),
                }
              : m
          ),
        })),

      toggleLessonComplete: (moduleId, lessonId) =>
        set((state) => ({
          modules: state.modules.map((m) => {
            if (m.id !== moduleId || !m.lessons) return m;
            const newLessons = m.lessons.map(l => 
              l.id === lessonId ? { ...l, completed: !l.completed } : l
            );
            const completed = newLessons.filter(l => l.completed).length;
            return {
              ...m,
              lessons: newLessons,
              completedSections: completed,
              progress: Math.round((completed / newLessons.length) * 100)
            };
          }),
        })),

      addVaultResource: (resource) =>
        set((state) => ({ vault: [resource, ...state.vault] })),

      updateVaultResource: (id, updates) =>
        set((state) => ({
          vault: state.vault.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      deleteVaultResource: (id) =>
        set((state) => ({
          vault: state.vault.filter((r) => r.id !== id),
        })),

      incrementDownload: (id) =>
        set((state) => ({
          vault: state.vault.map((r) =>
            r.id === id ? { ...r, downloads: r.downloads + 1 } : r
          ),
        })),
    }),
    {
      name: 'temuspace-resources',
      version: 2,
    }
  )
);
