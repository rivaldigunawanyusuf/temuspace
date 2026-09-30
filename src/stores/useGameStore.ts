/**
 * useGameStore.ts - Core game state (Zustand + persist)
 * 
 * Manages: player position, NPCs, room zones, furniture layout,
 * microphone state, online members, and admin room design.
 * 
 * v2: Added zone polygon support, furniture actions, zone CRUD, collision editing
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// Types
// ============================================================

export type Direction = 'down' | 'up' | 'left' | 'right';

export type ZoneId = string; // Now fully dynamic

export interface Position {
  x: number;
  y: number;
}

/** Polygon point for freeform zone shapes */
export interface PolygonPoint {
  x: number;
  y: number;
}

export type ZoneShape = 'rect' | 'polygon';

export interface ZoneBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  emoji: string;
  color: string;
  shape: ZoneShape;
  /** Rectangular bounds (used when shape='rect', also as bounding box for polygon) */
  bounds: ZoneBounds;
  /** Polygon points (used when shape='polygon') */
  polygon: PolygonPoint[];
  isPrivate: boolean;
}

/** Furniture action types */
export type FurnitureActionType = 'none' | 'sit' | 'navigate' | 'modal' | 'emote' | 'interact';

export interface PlacedFurniture {
  instanceId: string;
  furnitureId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  isCollider: boolean;
  /** What happens when player presses Action near this furniture */
  actionType: FurnitureActionType;
  /** Target for action (URL path, modal ID, emote text) */
  actionTarget?: string;
  /** Label shown in the interaction prompt "Press E to ..." */
  actionLabel?: string;
  /** Asset path (individual PNG), if empty uses furnitureId to look up in catalog */
  assetPath?: string;
  /** Z-layer override for rendering order */
  zLayer?: number;
}

export interface NPCState {
  id: string;
  name: string;
  position: Position;
  direction: Direction;
  currentZone: ZoneId | null;
  targetPosition: Position | null;
  isMoving: boolean;
  isSpeaking: boolean;
  animFrame: number;
  color: string; // shirt color for variant
}

export interface PlayerState {
  position: Position;
  direction: Direction;
  currentZone: ZoneId | null;
  isMoving: boolean;
  isMicOn: boolean;
  isSpeakerOn: boolean;
  isSpeaking: boolean;
  animFrame: number;
  name: string;
  avatar: string; // 'raka' or 'sinta'
  scale?: number; // for jokes, allows dynamic character scaling
  /** Current emote/status badge */
  statusBadge?: string;
  /** Currently sitting on a furniture instanceId */
  sittingOn?: string;
}

export type ViewMode = 'virtual-room' | 'room-designer';

export interface GameState {
  // View
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Player
  player: PlayerState;
  updatePlayer: (updates: Partial<PlayerState>) => void;
  
  // NPCs
  npcs: NPCState[];
  updateNPC: (id: string, updates: Partial<NPCState>) => void;
  
  // Zones (CRUD)
  zones: ZoneDefinition[];
  addZone: (zone: ZoneDefinition) => void;
  removeZone: (id: ZoneId) => void;
  updateZone: (id: ZoneId, updates: Partial<ZoneDefinition>) => void;
  setZones: (zones: ZoneDefinition[]) => void;
  
  // Furniture (placed in room)
  furniture: PlacedFurniture[];
  addFurniture: (item: PlacedFurniture) => void;
  removeFurniture: (instanceId: string) => void;
  updateFurniture: (instanceId: string, updates: Partial<PlacedFurniture>) => void;
  setFurniture: (items: PlacedFurniture[]) => void;
  bringFurnitureToFront: (instanceId: string) => void;
  sendFurnitureToBack: (instanceId: string) => void;
  
  // Camera
  camera: { x: number; y: number; zoom: number };
  updateCamera: (updates: Partial<{ x: number; y: number; zoom: number }>) => void;

  // UI state
  isChatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  activeTab: 'homepage' | 'resources' | 'virtual-room' | 'events' | 'profile';
  setActiveTab: (tab: GameState['activeTab']) => void;
  
  // Interaction prompt
  nearbyFurniture: PlacedFurniture | null;
  setNearbyFurniture: (f: PlacedFurniture | null) => void;
  
  // Online members simulation
  onlineCount: number;
}

// ============================================================
// Default Zone Definitions (mapped to hq-map-base.jpeg)
// ============================================================

const MAP_WIDTH = 1400;
const MAP_HEIGHT = 788;

export const DEFAULT_ZONES: ZoneDefinition[] = [
  {
    id: 'zone_meeting_glass',
    name: 'Meeting Room',
    emoji: '💼',
    color: '#34D399',
    shape: 'polygon',
    bounds: { x: 30, y: 210, w: 500, h: 440 },
    polygon: [
      { x: 30, y: 460 },
      { x: 340, y: 210 },
      { x: 530, y: 400 },
      { x: 230, y: 650 }
    ],
    isPrivate: true,
  },
  {
    id: 'zone_lounge',
    name: 'Lounge',
    emoji: '☕',
    color: '#3B82F6',
    shape: 'polygon',
    bounds: { x: 340, y: 125, w: 760, h: 660 },
    polygon: [
      { x: 340, y: 210 },
      { x: 450, y: 125 },
      { x: 670, y: 340 },
      { x: 800, y: 440 },
      { x: 1080, y: 680 },
      { x: 920, y: 780 },
      { x: 660, y: 780 },
      { x: 550, y: 680 },
      { x: 230, y: 650 },
      { x: 530, y: 400 }
    ],
    isPrivate: false,
  },
  {
    id: 'zone_aula',
    name: 'Aula',
    emoji: '🎤',
    color: '#EF4444',
    shape: 'polygon',
    bounds: { x: 670, y: 90, w: 700, h: 610 },
    polygon: [
      { x: 670, y: 340 },
      { x: 1040, y: 90 },
      { x: 1370, y: 350 },
      { x: 1080, y: 680 },
      { x: 800, y: 440 }
    ],
    isPrivate: false,
  }
];

// ============================================================
// Default NPC positions
// ============================================================

const DEFAULT_NPCS: NPCState[] = [
  {
    id: 'raka',
    name: 'Raka',
    position: { x: 650, y: 350 },
    direction: 'down',
    currentZone: 'zone_lounge',
    targetPosition: null,
    isMoving: false,
    isSpeaking: false,
    animFrame: 0,
    color: '#E67E22',
  },
  {
    id: 'nina',
    name: 'Nina',
    position: { x: 1050, y: 250 },
    direction: 'down',
    currentZone: 'zone_aula',
    targetPosition: null,
    isMoving: false,
    isSpeaking: true,
    animFrame: 0,
    color: '#E91E63',
  },
  // {
  //   id: 'budi',
  //   name: 'Budi',
  //   position: { x: 400, y: 580 },
  //   direction: 'right',
  //   currentZone: 'zone_lounge',
  //   targetPosition: null,
  //   isMoving: false,
  //   isSpeaking: false,
  //   animFrame: 0,
  //   color: '#3498DB',
  // },
];

// ============================================================
// Default Furniture
// ============================================================

const DEFAULT_FURNITURE: PlacedFurniture[] = [];

// ============================================================
// Store
// ============================================================

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // View
      viewMode: 'virtual-room',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Player
      player: {
        position: { x: 500, y: 400 },
        direction: 'down',
        currentZone: 'zone_lounge',
        isMoving: false,
        isMicOn: false,
        isSpeakerOn: true,
        isSpeaking: false,
        animFrame: 0,
        name: 'Kamu',
        avatar: 'raka',
        statusBadge: undefined,
        sittingOn: undefined,
      },
      updatePlayer: (updates) =>
        set((state) => ({ player: { ...state.player, ...updates } })),

      // NPCs
      npcs: DEFAULT_NPCS,
      updateNPC: (id, updates) =>
        set((state) => ({
          npcs: state.npcs.map((npc) =>
            npc.id === id ? { ...npc, ...updates } : npc
          ),
        })),

      // Zones (CRUD)
      zones: DEFAULT_ZONES,
      addZone: (zone) =>
        set((state) => ({ zones: [...state.zones, zone] })),
      removeZone: (id) =>
        set((state) => ({ zones: state.zones.filter((z) => z.id !== id) })),
      updateZone: (id, updates) =>
        set((state) => ({
          zones: state.zones.map((z) =>
            z.id === id ? { ...z, ...updates } : z
          ),
        })),
      setZones: (zones) => set({ zones }),

      // Furniture
      furniture: DEFAULT_FURNITURE,
      addFurniture: (item) =>
        set((state) => ({ furniture: [...state.furniture, item] })),
      removeFurniture: (instanceId) =>
        set((state) => ({
          furniture: state.furniture.filter((f) => f.instanceId !== instanceId),
        })),
      updateFurniture: (instanceId, updates) =>
        set((state) => ({
          furniture: state.furniture.map((f) =>
            f.instanceId === instanceId ? { ...f, ...updates } : f
          ),
        })),
      setFurniture: (items) => set({ furniture: items }),
      bringFurnitureToFront: (instanceId) => set((state) => {
        const index = state.furniture.findIndex(f => f.instanceId === instanceId);
        if (index === -1 || index === state.furniture.length - 1) return state; // Already at the front or not found
        const newFurniture = [...state.furniture];
        const item = newFurniture.splice(index, 1)[0];
        newFurniture.push(item);
        return { furniture: newFurniture };
      }),
      sendFurnitureToBack: (instanceId) => set((state) => {
        const index = state.furniture.findIndex(f => f.instanceId === instanceId);
        if (index <= 0) return state; // Already at the back or not found
        const newFurniture = [...state.furniture];
        const item = newFurniture.splice(index, 1)[0];
        newFurniture.unshift(item);
        return { furniture: newFurniture };
      }),

      // Camera
      camera: { x: 0, y: 0, zoom: 1 },
      updateCamera: (updates) =>
        set((state) => ({ camera: { ...state.camera, ...updates } })),

      // UI
      isChatOpen: false,
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      setChatOpen: (open) => set({ isChatOpen: open }),
      activeTab: 'homepage',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Interaction
      nearbyFurniture: null,
      setNearbyFurniture: (f) => set({ nearbyFurniture: f }),

      // Online
      onlineCount: 7,
    }),
    {
      name: 'temuspace-game',
      version: 4, // Bump version without migrate to force clear local storage
      partialize: (state) => ({
        furniture: state.furniture,
        zones: state.zones,
        viewMode: state.viewMode,
      }),
    }
  )
);

// ============================================================
// Helper: Detect which zone a position falls in
// ============================================================

/** Check if a point is inside a polygon (ray casting algorithm) */
export function isPointInPolygon(point: Position, polygon: PolygonPoint[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getZoneAtPosition(
  pos: Position,
  zones: ZoneDefinition[]
): ZoneId | null {
  for (const zone of zones) {
    if (zone.shape === 'polygon' && zone.polygon.length >= 3) {
      if (isPointInPolygon(pos, zone.polygon)) {
        return zone.id;
      }
    } else {
      const b = zone.bounds;
      if (pos.x >= b.x && pos.x < b.x + b.w && pos.y >= b.y && pos.y < b.y + b.h) {
        return zone.id;
      }
    }
  }
  return null; // outside all zones
}

export function getZoneInfo(zoneId: ZoneId, zones: ZoneDefinition[]): ZoneDefinition | undefined {
  return zones.find((z) => z.id === zoneId);
}

/** Check if player is near a furniture item (within interaction range) */
export function getNearbyFurniture(
  pos: Position,
  furniture: PlacedFurniture[],
  range: number = 60
): PlacedFurniture | null {
  let closest: PlacedFurniture | null = null;
  let closestDist = Infinity;

  for (const f of furniture) {
    if (f.actionType === 'none') continue;
    
    // Center of the furniture
    const fx = f.x + f.width / 2;
    const fy = f.y + f.height / 2;
    const dx = pos.x - fx;
    const dy = pos.y - fy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < range && dist < closestDist) {
      closest = f;
      closestDist = dist;
    }
  }
  
  return closest;
}
