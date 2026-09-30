/**
 * useAdminStore.ts - Admin ERP State (Zustand + persist)
 * 
 * Treasury, Secretariat, Kanban Tasks, Calendar
 * All with full CRUD and rich seed data
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// Types
// ============================================================

// Treasury
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
  createdBy: string;
}

export type DuesPeriodType = 'monthly' | 'semester' | 'lifetime';

export interface DuesConfig {
  periodType: DuesPeriodType;
  activePeriod: string; // e.g. "Oktober 2026", "Semester Ganjil 2026/2027", "Seumur Hidup"
  defaultAmount: number; // e.g. 50000
  description: string;
  dueDate?: string;
}

export interface MemberDues {
  memberId: string;
  name: string;
  avatar: string;
  department?: string;
  note?: string; // e.g. 'Tarif Standar', 'Keringanan Mahasiswa', 'Pengurus Inti', 'Bebas Iuran'
  amount: number;
  paidAmount: number;
  lastPaidDate?: string;
}

// Secretariat
export type LetterType = 'incoming' | 'outgoing';

export interface Letter {
  id: string;
  type: LetterType;
  number: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  status: 'draft' | 'sent' | 'received' | 'archived';
  content: string;
}

export interface MeetingMinutes {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  agenda: string;
  decisions: string[];
  actionItems: string[];
  notes: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'baik' | 'perlu servis' | 'rusak-ringan' | 'rusak-berat' | 'rusak';
  location: string;
  lastChecked: string;
}

// Kanban
export type KanbanStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: KanbanStatus;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  assigneeAvatar: string;
  dueDate: string;
  tags: string[];
  createdAt: number;
}

// Calendar
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
  type: 'meeting' | 'deadline' | 'event' | 'reminder';
}

// ============================================================
// Seed Data
// ============================================================

const now = Date.now();
const DAY = 86400000;
const today = new Date().toISOString().split('T')[0];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'trx-001', type: 'income', category: 'Iuran Anggota', description: 'Iuran bulanan September 2026', amount: 2500000, date: '2026-09-01', createdBy: 'Dewi Kartika' },
  { id: 'trx-002', type: 'income', category: 'Sponsorship', description: 'Sponsor hackathon dari PT Tekno Maju', amount: 5000000, date: '2026-09-05', createdBy: 'Dewi Kartika' },
  { id: 'trx-003', type: 'expense', category: 'Event', description: 'Konsumsi Workshop ML (snack & minum)', amount: 750000, date: '2026-09-10', createdBy: 'Dewi Kartika' },
  { id: 'trx-004', type: 'expense', category: 'Operasional', description: 'Domain temuspace.com (1 tahun)', amount: 180000, date: '2026-09-12', createdBy: 'Dewi Kartika' },
  { id: 'trx-005', type: 'income', category: 'Donasi', description: 'Donasi alumni angkatan 2022', amount: 1000000, date: '2026-09-15', createdBy: 'Dewi Kartika' },
  { id: 'trx-006', type: 'expense', category: 'Peralatan', description: 'Beli kabel HDMI & adapter presentasi', amount: 350000, date: '2026-09-18', createdBy: 'Dewi Kartika' },
  { id: 'trx-007', type: 'expense', category: 'Event', description: 'Sertifikat & hadiah hackathon internal', amount: 1200000, date: '2026-09-20', createdBy: 'Dewi Kartika' },
  { id: 'trx-008', type: 'income', category: 'Iuran Anggota', description: 'Iuran tambahan dari anggota baru', amount: 500000, date: '2026-09-25', createdBy: 'Dewi Kartika' },
  { id: 'trx-009', type: 'expense', category: 'Infrastruktur', description: 'VPS hosting bulanan TemuSpace', amount: 250000, date: '2026-09-28', createdBy: 'Dewi Kartika' },
];

export const SEED_DUES_CONFIG: DuesConfig = {
  periodType: 'monthly',
  activePeriod: 'Oktober 2026',
  defaultAmount: 50000,
  description: 'Iuran kas bulanan untuk operasional server, snack & konsumsi rapat mingguan, serta kas darurat kegiatan komunitas.',
  dueDate: 'Batas bayar: Tanggal 10 setiap bulan',
};

const SEED_MEMBER_DUES: MemberDues[] = [
  { memberId: 'user-admin-001', name: 'Dewi Kartika', avatar: '👩‍💼', department: 'Ketua Organisasi', note: 'Pengurus Inti', amount: 50000, paidAmount: 50000, lastPaidDate: '2026-10-01' },
  { memberId: 'user-member-001', name: 'Andi Pratama', avatar: '🧑‍💻', department: 'Full-Stack Developer', note: 'Tarif Standar', amount: 50000, paidAmount: 50000, lastPaidDate: '2026-10-02' },
  { memberId: 'user-002', name: 'Raka Mahendra', avatar: '🧑‍💻', department: 'Backend Lead', note: 'Tarif Standar', amount: 50000, paidAmount: 50000, lastPaidDate: '2026-10-01' },
  { memberId: 'user-003', name: 'Sinta Rahayu', avatar: '👩‍🎨', department: 'UI/UX Designer', note: 'Tarif Standar', amount: 50000, paidAmount: 50000, lastPaidDate: '2026-10-02' },
  { memberId: 'user-004', name: 'Budi Santoso', avatar: '👨‍💼', department: 'Product Manager', note: 'Tarif Standar', amount: 50000, paidAmount: 50000, lastPaidDate: '2026-10-04' },
  { memberId: 'user-005', name: 'Farhan Aditya', avatar: '👨‍💻', department: 'Frontend Specialist', note: 'Tarif Standar', amount: 50000, paidAmount: 20000, lastPaidDate: '2026-10-03' },
  { memberId: 'user-006', name: 'Lina Permata', avatar: '👩‍🔬', department: 'Data & AI Engineer', note: 'Tarif Standar', amount: 50000, paidAmount: 50000, lastPaidDate: '2026-10-05' },
  { memberId: 'user-007', name: 'Yoga Pramana', avatar: '🧑‍🚀', department: 'DevOps & Logistik', note: 'Keringanan Mahasiswa', amount: 35000, paidAmount: 10000, lastPaidDate: '2026-10-06' },
  { memberId: 'user-008', name: 'Maya Kusuma', avatar: '👩‍💼', department: 'Sekretaris', note: 'Tarif Standar', amount: 50000, paidAmount: 50000, lastPaidDate: '2026-10-04' },
  { memberId: 'user-009', name: 'Rizky Fadilah', avatar: '🧑‍🎓', department: 'Mobile Developer', note: 'Keringanan Mahasiswa', amount: 25000, paidAmount: 0 },
];

const SEED_LETTERS: Letter[] = [
  { id: 'ltr-001', type: 'outgoing', number: '001/TS/IX/2026', subject: 'Permohonan Izin Penggunaan Gedung Informatika', from: 'TemuSpace', to: 'Dekan Fakultas Teknik', date: '2026-09-01', status: 'sent', content: 'Dengan hormat, kami dari organisasi TemuSpace ingin mengajukan permohonan izin penggunaan Gedung Informatika Lt. 3...' },
  { id: 'ltr-002', type: 'incoming', number: 'IN-045/FT/IX/2026', subject: 'Persetujuan Penggunaan Gedung', from: 'Dekan Fakultas Teknik', to: 'TemuSpace', date: '2026-09-03', status: 'received', content: 'Merujuk surat nomor 001/TS/IX/2026, dengan ini kami menyetujui...' },
  { id: 'ltr-003', type: 'outgoing', number: '002/TS/IX/2026', subject: 'Proposal Sponsorship Hackathon Internal', from: 'TemuSpace', to: 'PT Tekno Maju', date: '2026-09-05', status: 'sent', content: 'Kepada Yth. HRD PT Tekno Maju, kami mengundang perusahaan Bapak/Ibu untuk menjadi sponsor...' },
  { id: 'ltr-004', type: 'outgoing', number: '003/TS/IX/2026', subject: 'Undangan Pembicara Workshop ML', from: 'TemuSpace', to: 'Dr. Ahmad Fauzi, M.Kom', date: '2026-09-08', status: 'sent', content: 'Yth. Dr. Ahmad Fauzi, dengan ini kami mengundang Bapak sebagai pembicara...' },
  { id: 'ltr-005', type: 'incoming', number: 'SPR-012/TM/IX/2026', subject: 'Konfirmasi Sponsorship', from: 'PT Tekno Maju', to: 'TemuSpace', date: '2026-09-10', status: 'archived', content: 'Dengan senang hati kami menyetujui untuk menjadi sponsor...' },
];

const SEED_MINUTES: MeetingMinutes[] = [
  {
    id: 'mnt-001',
    title: 'Rapat Koordinasi Proker September',
    date: '2026-09-02',
    attendees: ['Dewi Kartika', 'Raka Mahendra', 'Sinta Rahayu', 'Farhan Aditya', 'Lina Permata'],
    agenda: 'Pembahasan program kerja bulan September termasuk hackathon internal dan workshop series.',
    decisions: ['Hackathon dijadwalkan 14 Oktober', 'Workshop ML diadakan 30 September', 'Budget event max 2 juta/kegiatan'],
    actionItems: ['Dewi: Buat proposal sponsorship', 'Raka: Kontak venue hackathon', 'Sinta: Design poster workshop'],
    notes: 'Rapat berjalan lancar. Semua divisi siap dengan timeline.',
  },
  {
    id: 'mnt-002',
    title: 'Evaluasi Workshop Figma & Planning Next Event',
    date: '2026-09-24',
    attendees: ['Dewi Kartika', 'Sinta Rahayu', 'Yoga Pramana', 'Maya Kusuma'],
    agenda: 'Evaluasi workshop Figma dan perencanaan event selanjutnya.',
    decisions: ['Workshop Figma berhasil, peserta puas', 'Buat series workshop "Design for Dev"', 'Game night dijadwalkan tiap Jumat'],
    actionItems: ['Sinta: Siapkan materi Design for Dev part 2', 'Yoga: Setup Discord server untuk game night'],
    notes: 'Feedback peserta sangat positif. Minta diadakan workshop lanjutan.',
  },
];

const SEED_ASSETS: Asset[] = [
  { id: 'ast-001', name: 'Proyektor Epson EB-X51', category: 'Elektronik', quantity: 2, condition: 'baik', location: 'Ruang Sekretariat', lastChecked: '2026-09-15' },
  { id: 'ast-002', name: 'Whiteboard 120x180cm', category: 'Furnitur', quantity: 3, condition: 'baik', location: 'Ruang Rapat', lastChecked: '2026-09-15' },
  { id: 'ast-003', name: 'Kabel HDMI 3m', category: 'Elektronik', quantity: 5, condition: 'baik', location: 'Ruang Sekretariat', lastChecked: '2026-09-18' },
  { id: 'ast-004', name: 'Speaker Portable JBL', category: 'Elektronik', quantity: 1, condition: 'rusak-ringan', location: 'Ruang Sekretariat', lastChecked: '2026-09-20' },
  { id: 'ast-005', name: 'Banner TemuSpace 2x1m', category: 'Merchandise', quantity: 2, condition: 'baik', location: 'Gudang', lastChecked: '2026-09-10' },
  { id: 'ast-006', name: 'Extension Cable 10m', category: 'Elektronik', quantity: 3, condition: 'baik', location: 'Ruang Rapat', lastChecked: '2026-09-15' },
];

const SEED_KANBAN: KanbanTask[] = [
  { id: 'task-001', title: 'Finalisasi website TemuSpace v1.0', description: 'Fix bug terakhir & deploy ke production', status: 'in-progress', priority: 'high', assignee: 'Farhan Aditya', assigneeAvatar: '‍️', dueDate: '2026-10-01', tags: ['dev', 'website'], createdAt: now - 5 * DAY },
  { id: 'task-002', title: 'Desain poster Hackathon Internal', description: 'Buat poster A3 untuk promosi hackathon di kampus', status: 'done', priority: 'medium', assignee: 'Sinta Rahayu', assigneeAvatar: '', dueDate: '2026-09-25', tags: ['design', 'hackathon'], createdAt: now - 7 * DAY },
  { id: 'task-003', title: 'Hubungi sponsor potensial', description: 'Kirim proposal ke 5 perusahaan tech lokal', status: 'in-progress', priority: 'high', assignee: 'Dewi Kartika', assigneeAvatar: '', dueDate: '2026-10-05', tags: ['sponsorship', 'hackathon'], createdAt: now - 4 * DAY },
  { id: 'task-004', title: 'Buat materi workshop Next.js', description: 'Siapkan slide & code sample untuk workshop', status: 'todo', priority: 'medium', assignee: 'Raka Mahendra', assigneeAvatar: '', dueDate: '2026-10-10', tags: ['workshop', 'content'], createdAt: now - 2 * DAY },
  { id: 'task-005', title: 'Setup venue hackathon', description: 'Koordinasi dengan pihak gedung, cek infra listrik & wifi', status: 'todo', priority: 'high', assignee: 'Yoga Pramana', assigneeAvatar: '', dueDate: '2026-10-12', tags: ['logistics', 'hackathon'], createdAt: now - 1 * DAY },
  { id: 'task-006', title: 'Update dokumentasi API', description: 'Tulis docs untuk endpoint baru (events, resources)', status: 'review', priority: 'low', assignee: 'Maya Kusuma', assigneeAvatar: '‍', dueDate: '2026-10-03', tags: ['docs', 'dev'], createdAt: now - 3 * DAY },
  { id: 'task-007', title: 'Rekrut anggota baru semester ganjil', description: 'Buat poster open recruitment & atur jadwal wawancara', status: 'todo', priority: 'medium', assignee: 'Dewi Kartika', assigneeAvatar: '‍', dueDate: '2026-10-15', tags: ['recruitment', 'member'], createdAt: now - 1 * DAY },
  { id: 'task-008', title: 'Audit keuangan Q3 2026', description: 'Rekap laporan keuangan Juli-September 2026', status: 'todo', priority: 'low', assignee: 'Lina Permata', assigneeAvatar: '‍', dueDate: '2026-10-08', tags: ['keuangan', 'audit'], createdAt: now - 1 * DAY },
];

const SEED_CALENDAR: CalendarEvent[] = [
  { id: 'cal-001', title: 'Workshop ML', date: today, time: '15:00', color: '#237A57', type: 'event' },
  { id: 'cal-002', title: 'Code Review Session', date: new Date(Date.now() + 2 * DAY).toISOString().split('T')[0], time: '19:00', color: '#34D399', type: 'event' },
  { id: 'cal-003', title: 'Deadline: Website v1.0', date: '2026-10-01', time: '23:59', color: '#EF4444', type: 'deadline' },
  { id: 'cal-004', title: 'Rapat Mingguan', date: new Date(Date.now() + 7 * DAY).toISOString().split('T')[0], time: '10:00', color: '#3B82F6', type: 'meeting' },
  { id: 'cal-005', title: 'Hackathon Internal', date: new Date(Date.now() + 14 * DAY).toISOString().split('T')[0], time: '08:00', color: '#8B5CF6', type: 'event' },
  { id: 'cal-006', title: 'Game Night', date: new Date(Date.now() + 3 * DAY).toISOString().split('T')[0], time: '20:00', color: '#EC4899', type: 'event' },
  { id: 'cal-007', title: 'Deadline: Proposal Sponsor', date: '2026-10-05', time: '17:00', color: '#EF4444', type: 'deadline' },
  { id: 'cal-008', title: 'Reminder: Bayar VPS', date: '2026-10-28', time: '09:00', color: '#F59E0B', type: 'reminder' },
];

// ============================================================
// Store
// ============================================================

interface AdminState {
  // Treasury
  transactions: Transaction[];
  duesConfig: DuesConfig;
  memberDues: MemberDues[];
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  payDues: (memberId: string, amount: number) => void;
  setDuesConfig: (config: Partial<DuesConfig>) => void;
  updateMemberDuesTarget: (memberId: string, newAmount: number, note?: string) => void;
  updateAllDuesTarget: (newAmount: number) => void;
  resetDuesPeriod: (newPeriod: string) => void;

  // Secretariat
  letters: Letter[];
  minutes: MeetingMinutes[];
  assets: Asset[];
  addLetter: (l: Letter) => void;
  updateLetter: (id: string, updates: Partial<Letter>) => void;
  deleteLetter: (id: string) => void;
  addMinutes: (m: MeetingMinutes) => void;
  updateMinutes: (id: string, updates: Partial<MeetingMinutes>) => void;
  deleteMinutes: (id: string) => void;
  addAsset: (a: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Kanban
  tasks: KanbanTask[];
  addTask: (task: KanbanTask) => void;
  updateTask: (id: string, updates: Partial<KanbanTask>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: KanbanStatus) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;
}

let idCounter = 200;
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // Treasury
      transactions: SEED_TRANSACTIONS,
      duesConfig: SEED_DUES_CONFIG,
      memberDues: SEED_MEMBER_DUES,

      addTransaction: (t) =>
        set((state) => ({ transactions: [t, ...state.transactions] })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      payDues: (memberId, amount) =>
        set((state) => ({
          memberDues: state.memberDues.map((d) =>
            d.memberId === memberId
              ? { ...d, paidAmount: (d.paidAmount || 0) + amount, lastPaidDate: new Date().toISOString().split('T')[0] }
              : d
          ),
        })),
      setDuesConfig: (config) =>
        set((state) => ({
          duesConfig: { ...(state.duesConfig || SEED_DUES_CONFIG), ...config },
        })),
      updateMemberDuesTarget: (memberId, newAmount, note) =>
        set((state) => ({
          memberDues: state.memberDues.map((d) =>
            d.memberId === memberId
              ? {
                  ...d,
                  amount: Math.max(0, newAmount),
                  ...(note !== undefined ? { note } : {}),
                }
              : d
          ),
        })),
      updateAllDuesTarget: (newAmount) =>
        set((state) => ({
          memberDues: state.memberDues.map((d) => ({
            ...d,
            amount: Math.max(0, newAmount),
          })),
        })),
      resetDuesPeriod: (newPeriod) =>
        set((state) => ({
          duesConfig: { ...(state.duesConfig || SEED_DUES_CONFIG), activePeriod: newPeriod },
          memberDues: state.memberDues.map((d) => ({
            ...d,
            paidAmount: 0,
            lastPaidDate: undefined,
          })),
        })),

      // Secretariat
      letters: SEED_LETTERS,
      minutes: SEED_MINUTES,
      assets: SEED_ASSETS,

      addLetter: (l) =>
        set((state) => ({ letters: [l, ...state.letters] })),
      updateLetter: (id, updates) =>
        set((state) => ({
          letters: state.letters.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      deleteLetter: (id) =>
        set((state) => ({
          letters: state.letters.filter((l) => l.id !== id),
        })),

      addMinutes: (m) =>
        set((state) => ({ minutes: [m, ...state.minutes] })),
      updateMinutes: (id, updates) =>
        set((state) => ({
          minutes: state.minutes.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      deleteMinutes: (id) =>
        set((state) => ({
          minutes: state.minutes.filter((m) => m.id !== id),
        })),

      addAsset: (a) =>
        set((state) => ({ assets: [a, ...state.assets] })),
      updateAsset: (id, updates) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        })),

      // Kanban
      tasks: SEED_KANBAN,
      addTask: (task) =>
        set((state) => ({ tasks: [task, ...state.tasks] })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      moveTask: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status } : t
          ),
        })),

      // Calendar
      calendarEvents: SEED_CALENDAR,
      addCalendarEvent: (event) =>
        set((state) => ({ calendarEvents: [...state.calendarEvents, event] })),
      deleteCalendarEvent: (id) =>
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'temuspace-admin',
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;
        const duesConfig = persistedState.duesConfig || SEED_DUES_CONFIG;
        const existingMap = new Map((persistedState.memberDues || []).map((m: any) => [m.memberId, m]));
        const mergedDues = SEED_MEMBER_DUES.map((seed) => {
          const existing = existingMap.get(seed.memberId);
          return existing ? { ...seed, ...existing } : seed;
        });
        return {
          ...persistedState,
          duesConfig,
          memberDues: mergedDues,
        };
      },
    }
  )
);
