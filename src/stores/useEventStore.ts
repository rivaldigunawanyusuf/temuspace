/**
 * useEventStore.ts - Events / Style Hub (Zustand + persist)
 * 
 * Full CRUD: Create, Read, Update, Delete events
 * RSVP management, live/upcoming/past filtering
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EventStatus = 'live' | 'upcoming' | 'past';
export type EventLocation = 'virtual-room' | 'online-external' | 'offline';

export type EventFormFieldType = 'text' | 'email' | 'tel' | 'url' | 'select' | 'textarea';

export interface EventFormField {
  id: string;
  label: string;
  type: EventFormFieldType;
  required: boolean;
  options?: string[]; // for select type
}

export interface EventRSVPData {
  userId: string;
  userName: string;
  userAvatar: string;
  answers: Record<string, string>;
  timestamp: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  organizer: string;
  organizerAvatar: string;
  date: string; // ISO date string
  time: string; // e.g. "15:00 - 17:00 WITA"
  status: EventStatus;
  location: EventLocation;
  locationDetail: string; // room zone name, zoom link, or address
  coverEmoji: string;
  capacity: number;
  attendees: number;
  isRSVPed: boolean;
  tags: string[];
  formFields?: EventFormField[];
  rsvpData?: EventRSVPData[];
  createdAt: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

// ============================================================
// Seed Data
// ============================================================

const SEED_EVENTS: EventItem[] = [
  {
    id: 'evt-001',
    title: 'Workshop: Intro to Machine Learning ',
    description: 'Pelajari dasar-dasar ML, supervised vs unsupervised learning, dan hands-on dengan scikit-learn. Bawa laptop yang sudah install Python!',
    organizer: 'Lina Permata',
    organizerAvatar: '‍',
    date: new Date().toISOString().split('T')[0],
    time: '15:00 - 17:00 WITA',
    status: 'live',
    location: 'virtual-room',
    locationDetail: 'Temu Townhall',
    coverEmoji: '',
    capacity: 50,
    attendees: 32,
    isRSVPed: false,
    tags: ['workshop', 'machine-learning', 'python'],
    createdAt: Date.now() - 7 * 86400000,
    approvalStatus: 'approved',
  },
  {
    id: 'evt-002',
    title: 'Code Review Session: React Best Practices ️',
    description: 'Sesi code review bersama untuk membahas best practices React hooks, component design, dan performance optimization.',
    organizer: 'Farhan Aditya',
    organizerAvatar: '‍',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    time: '19:00 - 21:00 WITA',
    status: 'upcoming',
    location: 'virtual-room',
    locationDetail: 'Temu Glass Room',
    coverEmoji: '',
    capacity: 20,
    attendees: 14,
    isRSVPed: true,
    tags: ['code-review', 'react', 'best-practices'],
    createdAt: Date.now() - 3 * 86400000,
    approvalStatus: 'approved',
  },
  {
    id: 'evt-003',
    title: 'Sharing Session: Pengalaman Magang di Startup ',
    description: 'Dengarkan pengalaman dari 3 anggota komunitas yang baru selesai magang di startup unicorn Indonesia. Tips apply, interview, dan survive!',
    organizer: 'Yoga Pramana',
    organizerAvatar: '‍',
    date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    time: '13:00 - 15:00 WITA',
    status: 'upcoming',
    location: 'online-external',
    locationDetail: 'https://meet.google.com/abc-defg-hij',
    coverEmoji: '️',
    capacity: 100,
    attendees: 45,
    isRSVPed: false,
    tags: ['sharing', 'magang', 'karir'],
    createdAt: Date.now() - 2 * 86400000,
    approvalStatus: 'approved',
  },
  {
    id: 'evt-004',
    title: 'Hackathon Internal TemuSpace: Build in 24 Hours ',
    description: 'Hackathon internal komunitas! Bentuk tim 3-4 orang, pilih challenge, dan build solusi dalam 24 jam. Hadiah menarik menanti!',
    organizer: 'Dewi Kartika',
    organizerAvatar: '‍',
    date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    time: '08:00 - 08:00 (24 Jam) WITA',
    status: 'upcoming',
    location: 'offline',
    locationDetail: 'Gedung Informatika Lt. 3, Universitas Udayana',
    coverEmoji: '',
    capacity: 60,
    attendees: 28,
    isRSVPed: false,
    tags: ['hackathon', 'kompetisi', 'team-building'],
    createdAt: Date.now() - 1 * 86400000,
    approvalStatus: 'approved',
  },
  {
    id: 'evt-005',
    title: 'Weekly Standup: Update Proker September ',
    description: 'Standup meeting mingguan untuk update progress program kerja bulan September. Semua divisi wajib hadir.',
    organizer: 'Dewi Kartika',
    organizerAvatar: '‍',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    time: '10:00 - 11:00 WITA',
    status: 'past',
    location: 'virtual-room',
    locationDetail: 'Temu Glass Room',
    coverEmoji: '',
    capacity: 30,
    attendees: 22,
    isRSVPed: true,
    tags: ['meeting', 'standup', 'proker'],
    createdAt: Date.now() - 10 * 86400000,
    approvalStatus: 'approved',
  },
  {
    id: 'evt-006',
    title: 'Workshop: Figma untuk Developer ',
    description: 'Belajar Figma dari perspektif developer. Auto layout, components, variables, dan dev mode. Bikin handoff jadi lebih mulus!',
    organizer: 'Sinta Rahayu',
    organizerAvatar: '‍',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    time: '14:00 - 16:00 WITA',
    status: 'past',
    location: 'virtual-room',
    locationDetail: 'Temu Townhall',
    coverEmoji: '️',
    capacity: 40,
    attendees: 35,
    isRSVPed: true,
    tags: ['workshop', 'figma', 'design'],
    createdAt: Date.now() - 14 * 86400000,
    approvalStatus: 'approved',
  },
  {
    id: 'evt-007',
    title: 'Game Night: Among Us Bareng Komunitas ',
    description: 'Yuk main Among Us bareng! Relax dan have fun setelah seminggu penuh coding. Siapkan mic dan game-nya!',
    organizer: 'Raka Mahendra',
    organizerAvatar: '‍',
    date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    time: '20:00 - 22:00 WITA',
    status: 'upcoming',
    location: 'online-external',
    locationDetail: 'Discord Voice Channel',
    coverEmoji: '',
    capacity: 15,
    attendees: 12,
    isRSVPed: false,
    tags: ['game-night', 'fun', 'community'],
    createdAt: Date.now() - 1 * 86400000,
    approvalStatus: 'approved',
  },
];

// ============================================================
// Store
// ============================================================

interface EventState {
  events: EventItem[];

  addEvent: (event: EventItem) => void;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  approveEvent: (id: string) => void;
  rejectEvent: (id: string) => void;
  toggleRSVP: (id: string, rsvpData?: EventRSVPData) => void;
}

let eventCounter = 100;
export function generateEventId(): string {
  return `evt-${Date.now()}-${++eventCounter}`;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      events: SEED_EVENTS,

      addEvent: (event) =>
        set((state) => ({ events: [event, ...state.events] })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      approveEvent: (id) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, approvalStatus: 'approved' } : e
          ),
        })),

      rejectEvent: (id) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, approvalStatus: 'rejected' } : e
          ),
        })),

      toggleRSVP: (id, rsvpData) =>
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id === id) {
              const isNowRSVPed = !e.isRSVPed;
              const newAttendees = isNowRSVPed ? e.attendees + 1 : Math.max(0, e.attendees - 1);

              let updatedRSVPData = e.rsvpData || [];
              if (isNowRSVPed && rsvpData) {
                updatedRSVPData = [...updatedRSVPData, rsvpData];
              } else if (!isNowRSVPed && rsvpData?.userId) {
                updatedRSVPData = updatedRSVPData.filter(r => r.userId !== rsvpData.userId);
              }

              return {
                ...e,
                isRSVPed: isNowRSVPed,
                attendees: newAttendees,
                rsvpData: updatedRSVPData,
              };
            }
            return e;
          }),
        })),
    }),
    {
      name: 'temuspace-events',
      version: 1,
    }
  )
);
