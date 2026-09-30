/**
 * communityUsers.ts
 * Daftar pengguna resmi dan terdaftar di ekosistem TemuSpace.
 * Digunakan untuk dropdown pilihan user pada Kanban, Moderator, Event, LMS, dan Notulensi.
 */

export interface CommunityUser {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'member';
  avatar: string; // Emoji avatar
  avatarUrl: string; // Image avatar
  email: string;
  department: string;
}

export const COMMUNITY_USERS: CommunityUser[] = [
  {
    id: 'user-admin-001',
    name: 'Dewi Kartika',
    username: 'dewikartika',
    role: 'admin',
    avatar: '👩‍💼',
    avatarUrl: 'https://i.pravatar.cc/150?u=Dewi',
    email: 'admin@temuspace.com',
    department: 'Ketua Organisasi',
  },
  {
    id: 'user-member-001',
    name: 'Andi Pratama',
    username: 'andipratama',
    role: 'member',
    avatar: '🧑‍💻',
    avatarUrl: 'https://i.pravatar.cc/150?u=Andi',
    email: 'member@temuspace.com',
    department: 'Full-Stack Developer',
  },
  {
    id: 'user-002',
    name: 'Raka Mahendra',
    username: 'rakamahendra',
    role: 'member',
    avatar: '🧑‍💻',
    avatarUrl: 'https://i.pravatar.cc/150?u=Raka',
    email: 'raka@temuspace.com',
    department: 'Backend Lead',
  },
  {
    id: 'user-003',
    name: 'Sinta Rahayu',
    username: 'sintarahayu',
    role: 'member',
    avatar: '👩‍🎨',
    avatarUrl: 'https://i.pravatar.cc/150?u=Sinta',
    email: 'sinta@temuspace.com',
    department: 'UI/UX & Creative Designer',
  },
  {
    id: 'user-004',
    name: 'Budi Santoso',
    username: 'budisantoso',
    role: 'member',
    avatar: '👨‍💼',
    avatarUrl: 'https://i.pravatar.cc/150?u=Budi',
    email: 'budi@temuspace.com',
    department: 'Product Manager',
  },
  {
    id: 'user-005',
    name: 'Farhan Aditya',
    username: 'farhanaditya',
    role: 'member',
    avatar: '👨‍💻',
    avatarUrl: 'https://i.pravatar.cc/150?u=Farhan',
    email: 'farhan@temuspace.com',
    department: 'Frontend Specialist',
  },
  {
    id: 'user-006',
    name: 'Lina Permata',
    username: 'linapermata',
    role: 'member',
    avatar: '👩‍🔬',
    avatarUrl: 'https://i.pravatar.cc/150?u=Lina',
    email: 'lina@temuspace.com',
    department: 'Data & AI Engineer',
  },
  {
    id: 'user-007',
    name: 'Yoga Pramana',
    username: 'yogapramana',
    role: 'member',
    avatar: '🧑‍🚀',
    avatarUrl: 'https://i.pravatar.cc/150?u=Yoga',
    email: 'yoga@temuspace.com',
    department: 'DevOps & Logistik',
  },
  {
    id: 'user-008',
    name: 'Maya Kusuma',
    username: 'mayakusuma',
    role: 'member',
    avatar: '👩‍💼',
    avatarUrl: 'https://i.pravatar.cc/150?u=Maya',
    email: 'maya@temuspace.com',
    department: 'Sekretaris & Dokumentasi',
  },
  {
    id: 'user-009',
    name: 'Rizky Fadilah',
    username: 'rizkyfadilah',
    role: 'member',
    avatar: '🧑‍🎓',
    avatarUrl: 'https://i.pravatar.cc/150?u=Rizky',
    email: 'rizky@temuspace.com',
    department: 'Mobile Developer',
  },
];

export function getCommunityUserByName(name?: string): CommunityUser | undefined {
  if (!name) return undefined;
  return COMMUNITY_USERS.find(
    (u) => u.name.toLowerCase() === name.trim().toLowerCase(),
  );
}

export function getCommunityUserById(id?: string): CommunityUser | undefined {
  if (!id) return undefined;
  return COMMUNITY_USERS.find((u) => u.id === id);
}

export function getUserAvatar(name?: string): string {
  const user = getCommunityUserByName(name);
  return user ? user.avatar : '👤';
}
