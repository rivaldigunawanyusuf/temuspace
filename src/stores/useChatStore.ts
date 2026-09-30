/**
 * useChatStore.ts - Global Chat & Room Chat state
 * 
 * Features:
 * - Global Chat: visible to everyone with sender location badge
 * - Room Chat: only visible within same roomId
 * - NPC responses (Raka interactive scenario)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ZoneId } from './useGameStore';

export interface ChatMessage {
  id: string;
  sender: string;
  senderZone: ZoneId;
  senderZoneName: string;
  senderEmoji: string;
  text: string;
  timestamp: number;
  isNPC: boolean;
  isSystem: boolean;
  channel: 'global' | 'room';
}

interface ChatState {
  messages: ChatMessage[];
  activeChannel: 'global' | 'room';
  setActiveChannel: (ch: 'global' | 'room') => void;
  addMessage: (msg: ChatMessage) => void;
  unreadGlobal: number;
  unreadRoom: number;
  resetUnread: (channel: 'global' | 'room') => void;
  incrementUnread: (channel: 'global' | 'room') => void;
}

let msgCounter = 0;
export function generateMsgId(): string {
  return `msg-${Date.now()}-${++msgCounter}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [
    {
      id: 'welcome-1',
      sender: 'TemuSpace',
      senderZone: 'zone_corridor',
      senderZoneName: 'System',
      senderEmoji: '',
      text: 'Selamat datang di TemuSpace HQ!  Jelajahi ruangan virtual kami dan berinteraksi dengan anggota komunitas.',
      timestamp: Date.now() - 60000,
      isNPC: false,
      isSystem: true,
      channel: 'global',
    },
    {
      id: 'raka-idle-1',
      sender: 'Raka',
      senderZone: 'zone_lounge',
      senderZoneName: 'Temu Lounge',
      senderEmoji: '',
      text: 'Halo semua! Aku lagi di Lounge nih, ada yang mau ngobrol? ',
      timestamp: Date.now() - 30000,
      isNPC: true,
      isSystem: false,
      channel: 'global',
    },
    {
      id: 'sinta-idle-1',
      sender: 'Sinta',
      senderZone: 'zone_townhall',
      senderZoneName: 'Temu Townhall',
      senderEmoji: '',
      text: 'Saya sedang cek slide presentasi di Townhall untuk update besok ',
      timestamp: Date.now() - 15000,
      isNPC: true,
      isSystem: false,
      channel: 'global',
    },
  ],
  activeChannel: 'global',
  setActiveChannel: (ch) => set({ activeChannel: ch }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  unreadGlobal: 0,
  unreadRoom: 0,
  resetUnread: (channel) =>
    set(channel === 'global' ? { unreadGlobal: 0 } : { unreadRoom: 0 }),
  incrementUnread: (channel) =>
    set((state) =>
      channel === 'global'
        ? { unreadGlobal: state.unreadGlobal + 1 }
        : { unreadRoom: state.unreadRoom + 1 }
    ),
    }),
    {
      name: 'temuspace-chat',
    }
  )
);

// ============================================================
// NPC Response Logic
// ============================================================

const ZONE_NAMES: Record<ZoneId, { name: string; emoji: string }> = {
  zone_meeting_glass: { name: 'Temu Glass Room', emoji: '' },
  zone_lounge: { name: 'Temu Lounge', emoji: '' },
  zone_townhall: { name: 'Temu Townhall', emoji: '' },
  zone_corridor: { name: 'Central Corridor', emoji: '' },
};

export function getZoneDisplay(zoneId: ZoneId) {
  return ZONE_NAMES[zoneId] || { name: zoneId, emoji: '' };
}

/**
 * Check if a message is calling Raka to come to the player's room.
 */
export function isCallingRaka(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes('raka') &&
      (lower.includes('sini') ||
        lower.includes('masuk') ||
        lower.includes('kemari') ||
        lower.includes('join') ||
        lower.includes('panggil') ||
        lower.includes('ke sini') ||
        lower.includes('ke ruangan'))) ||
    lower.includes('panggil raka')
  );
}

/**
 * Generate Raka's response when called
 */
export function getRakaCallResponse(targetZone: ZoneId): string {
  const zone = ZONE_NAMES[targetZone];
  const responses = [
    `Siap! Otw ke ${zone.name} sekarang ‍️`,
    `Oke aku ke sana ya! Menuju ${zone.emoji} ${zone.name}... `,
    `Wait, lagi jalan ke ${zone.name} nih! `,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Get Raka's message when arriving
 */
export function getRakaArrivalMessage(targetZone: ZoneId): string {
  const zone = ZONE_NAMES[targetZone];
  const arrivals = [
    `Sudah sampai di ${zone.emoji} ${zone.name}! Ada apa nih? `,
    `Hadir! Sudah di ${zone.name}. Apa yang mau dibahas? `,
    `Done, aku sudah masuk ${zone.name}. Yuk ngobrol! `,
  ];
  return arrivals[Math.floor(Math.random() * arrivals.length)];
}
