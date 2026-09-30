/**
 * RoomDesigner.tsx - Admin Isometric Room Designer (v2)
 * 
 * Features:
 * - Canvas with grid overlay for furniture placement
 * - Sidebar catalog with individual asset PNGs
 * - Drag-and-drop, rotate, delete furniture
 * - Furniture Action editor (sit, navigate, modal, emote)
 * - Zone CRUD: Add, Edit Name/Color/Privacy, Delete zones
 * - Zone Shape: Rectangle + Polygon pen tool
 * - Collision toggle per furniture
 * - Template presets
 * - Save to localStorage (syncs with Virtual Room)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useGameStore,
  type PlacedFurniture,
  type ZoneDefinition,
  type ZoneId,
  type ZoneShape,
  type PolygonPoint,
  type FurnitureActionType,
  DEFAULT_ZONES
} from '../stores/useGameStore';
import { loadImage, removeBackground } from '../engine/spriteLoader';
import {
  Grid3x3, Eye, EyeOff, Save, Check, ChevronLeft, ChevronRight,
  Plus, Minus, Trash2, RotateCw, Shield, ShieldOff, Move, Pen, Square,
  Pentagon, Lock, Unlock, Palette, Edit3, Armchair, BookOpen,
  Monitor, Coffee, Presentation, Zap, MousePointer, X, ArrowUpToLine, ArrowDownToLine,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const MAP_SRC = '/assets/hq-map-base.jpeg';
const GRID_SIZE = 32;

interface FurnitureCatalogItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
  defaultAction: FurnitureActionType;
  defaultActionLabel?: string;
  defaultActionTarget?: string;
  defaultCollider: boolean;
  /** If asset PNG exists at this path, use it; otherwise use a colored box */
  assetPath?: string;
}

const CATALOG: FurnitureCatalogItem[] = [
  // Meeting Room
  // { id: 'meeting-table', name: 'Meja Rapat', icon: <Square size={16} />, defaultWidth: 160, defaultHeight: 100, defaultAction: 'none', defaultCollider: true, assetPath: '/assets/furniture/meeting-table.jpeg' },
  { id: 'office-chair', name: 'Kursi Kantor', icon: <Armchair size={16} />, defaultWidth: 40, defaultHeight: 40, defaultAction: 'sit', defaultActionLabel: 'Duduk di Kursi', defaultCollider: false, assetPath: '/assets/furniture/office-chair-4dir.jpeg' },
  // { id: 'whiteboard', name: 'Papan Tulis', icon: <Edit3 size={16} />, defaultWidth: 80, defaultHeight: 100, defaultAction: 'modal', defaultActionLabel: 'Lihat Papan Tulis', defaultActionTarget: 'whiteboard', defaultCollider: true, assetPath: '/assets/furniture/whiteboard.jpeg' },
  // { id: 'presentation-screen', name: 'Layar Presentasi', icon: <Presentation size={16} />, defaultWidth: 100, defaultHeight: 80, defaultAction: 'modal', defaultActionLabel: 'Lihat Presentasi', defaultActionTarget: 'presentation', defaultCollider: true, assetPath: '/assets/furniture/presentation-screen.jpeg' },
  
  // Lounge
  // { id: 'beanbag-orange', name: 'Beanbag Oranye', icon: <Armchair size={16} />, defaultWidth: 56, defaultHeight: 48, defaultAction: 'sit', defaultActionLabel: 'Duduk Santai', defaultCollider: false, assetPath: '/assets/furniture/beanbag-orange.jpeg' },
  // { id: 'beanbag-teal', name: 'Beanbag Teal', icon: <Armchair size={16} />, defaultWidth: 56, defaultHeight: 48, defaultAction: 'sit', defaultActionLabel: 'Duduk Santai', defaultCollider: false, assetPath: '/assets/furniture/beanbag-teal.jpeg' },
  // { id: 'beanbag-green', name: 'Beanbag Hijau', icon: <Armchair size={16} />, defaultWidth: 56, defaultHeight: 48, defaultAction: 'sit', defaultActionLabel: 'Duduk Santai', defaultCollider: false, assetPath: '/assets/furniture/beanbag-green.jpeg' },
  // { id: 'bookshelf', name: 'Rak Buku', icon: <BookOpen size={16} />, defaultWidth: 80, defaultHeight: 100, defaultAction: 'navigate', defaultActionLabel: 'Buka Resources', defaultActionTarget: '/resources', defaultCollider: true, assetPath: '/assets/furniture/bookshelf.jpeg' },
  // { id: 'coffee-machine', name: 'Mesin Kopi', icon: <Coffee size={16} />, defaultWidth: 48, defaultHeight: 64, defaultAction: 'emote', defaultActionLabel: 'Bikin Kopi', defaultActionTarget: ' Sedang Ngopi', defaultCollider: true, assetPath: '/assets/furniture/coffee-machine.jpeg' },
  // { id: 'coffee-table', name: 'Meja Kopi', icon: <Square size={16} />, defaultWidth: 60, defaultHeight: 40, defaultAction: 'none', defaultCollider: true, assetPath: '/assets/furniture/coffee-table.jpeg' },
  // { id: 'ethnic-rug', name: 'Karpet Etnik', icon: <Square size={16} />, defaultWidth: 120, defaultHeight: 80, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/furniture/ethnic-rug.jpeg' },

  // Townhall
  // { id: 'podium', name: 'Podium', icon: <Presentation size={16} />, defaultWidth: 48, defaultHeight: 72, defaultAction: 'emote', defaultActionLabel: 'Mulai Presentasi', defaultActionTarget: ' Sedang Presentasi', defaultCollider: true, assetPath: '/assets/furniture/podium.jpeg' },
  // { id: 'audience-chair-row', name: 'Kursi Auditorium', icon: <Armchair size={16} />, defaultWidth: 120, defaultHeight: 40, defaultAction: 'sit', defaultActionLabel: 'Duduk Menonton', defaultCollider: false, assetPath: '/assets/furniture/audience-chair-row.jpeg' },
  // { id: 'wooden-stage', name: 'Panggung Kayu', icon: <Square size={16} />, defaultWidth: 200, defaultHeight: 120, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/furniture/wooden-stage.jpeg' },
  // { id: 'large-display-screen', name: 'Layar Besar', icon: <Monitor size={16} />, defaultWidth: 160, defaultHeight: 100, defaultAction: 'modal', defaultActionLabel: 'Lihat Pengumuman', defaultActionTarget: 'updates', defaultCollider: true, assetPath: '/assets/furniture/large-display-screen.jpeg' },
  
  // Structure
  // { id: 'glass-wall-straight', name: 'Dinding Kaca', icon: <Square size={16} />, defaultWidth: 96, defaultHeight: 16, defaultAction: 'none', defaultCollider: true, assetPath: '/assets/structure/glass-wall-straight.jpeg' },
  // { id: 'glass-wall-corner', name: 'Sudut Kaca', icon: <Square size={16} />, defaultWidth: 64, defaultHeight: 64, defaultAction: 'none', defaultCollider: true, assetPath: '/assets/structure/glass-wall-corner.jpeg' },
  // { id: 'glass-door-open', name: 'Pintu Kaca (Buka)', icon: <Square size={16} />, defaultWidth: 64, defaultHeight: 16, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/structure/glass-door-open.jpeg' },
  // { id: 'glass-door-closed', name: 'Pintu Kaca (Tutup)', icon: <Square size={16} />, defaultWidth: 64, defaultHeight: 16, defaultAction: 'none', defaultCollider: true, assetPath: '/assets/structure/glass-door-closed.jpeg' },

  // Decoration
  // { id: 'monstera-large', name: 'Monstera L', icon: <Square size={16} />, defaultWidth: 48, defaultHeight: 64, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/monstera-large.jpeg' },
  // { id: 'monstera-medium', name: 'Monstera M', icon: <Square size={16} />, defaultWidth: 40, defaultHeight: 52, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/monstera-medium.jpeg' },
  // { id: 'monstera-small', name: 'Monstera S', icon: <Square size={16} />, defaultWidth: 32, defaultHeight: 40, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/monstera-small.jpeg' },
  // { id: 'standing-lamp', name: 'Lampu Berdiri', icon: <Square size={16} />, defaultWidth: 24, defaultHeight: 72, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/standing-lamp.jpeg' },
  // { id: 'snake-plant', name: 'Lidah Mertua', icon: <Square size={16} />, defaultWidth: 32, defaultHeight: 60, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/snake-plant.jpeg' },
  // { id: 'small-potted-plant', name: 'Tanaman Meja', icon: <Square size={16} />, defaultWidth: 16, defaultHeight: 24, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/small-potted-plant.jpeg' },
  // { id: 'wall-frame-chart', name: 'Bingkai Diagram', icon: <Square size={16} />, defaultWidth: 48, defaultHeight: 48, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/wall-frame-chart.jpeg' },
  // { id: 'wall-clock', name: 'Jam Dinding', icon: <Square size={16} />, defaultWidth: 32, defaultHeight: 32, defaultAction: 'none', defaultCollider: false, assetPath: '/assets/decoration/wall-clock.jpeg' },

  // Electronics & Office
  // { id: 'laptop-open', name: 'Laptop', icon: <Monitor size={16} />, defaultWidth: 32, defaultHeight: 28, defaultAction: 'emote', defaultActionLabel: 'Mulai Coding', defaultActionTarget: ' Sedang Coding', defaultCollider: false, assetPath: '/assets/furniture/laptop-open.jpeg' },
  // { id: 'desktop-computer', name: 'Desktop PC', icon: <Monitor size={16} />, defaultWidth: 56, defaultHeight: 48, defaultAction: 'emote', defaultActionLabel: 'Mulai Kerja', defaultActionTarget: ' Sedang Kerja', defaultCollider: true, assetPath: '/assets/furniture/desktop-computer.jpeg' },
  // { id: 'reception-desk', name: 'Meja Resepsionis', icon: <Square size={16} />, defaultWidth: 120, defaultHeight: 80, defaultAction: 'modal', defaultActionLabel: 'Info', defaultActionTarget: 'info', defaultCollider: true, assetPath: '/assets/furniture/reception-desk.jpeg' },
];

const ZONE_PRESET_COLORS = [
  '#237A57', '#34D399', '#3B82F6', '#9CA3AF', '#E91E63',
  '#3498DB', '#E67E22', '#8B5CF6', '#EF4444', '#06B6D4',
];

// ============================================================
// Component
// ============================================================

export default function RoomDesigner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<'furniture' | 'zone' | 'collision'>('furniture');
  const [showGrid, setShowGrid] = useState(true);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ instanceId: string; offsetX: number; offsetY: number } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, instanceId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Zone editing
  const [selectedZoneId, setSelectedZoneId] = useState<ZoneId | null>(null);
  const [zoneDrawMode, setZoneDrawMode] = useState<'select' | 'rect' | 'pen'>('select');
  const [tempRectStart, setTempRectStart] = useState<Position | null>(null);
  const [tempRectEnd, setTempRectEnd] = useState<Position | null>(null);
  const [tempPolygonPoints, setTempPolygonPoints] = useState<PolygonPoint[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#237A57');
  const [editingZoneField, setEditingZoneField] = useState<{ zoneId: string; field: 'name' } | null>(null);
  const [editingZoneValue, setEditingZoneValue] = useState('');

  // Furniture action editing
  const [editingAction, setEditingAction] = useState(false);

  // Assets
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const furnitureImagesRef = useRef<Map<string, HTMLCanvasElement | HTMLImageElement>>(new Map());

  // Store
  const furniture = useGameStore((s) => s.furniture);
  const addFurniture = useGameStore((s) => s.addFurniture);
  const removeFurniture = useGameStore((s) => s.removeFurniture);
  const updateFurniture = useGameStore((s) => s.updateFurniture);
  const setFurniture = useGameStore((s) => s.setFurniture);
  const bringFurnitureToFront = useGameStore((s) => s.bringFurnitureToFront);
  const sendFurnitureToBack = useGameStore((s) => s.sendFurnitureToBack);
  const zones = useGameStore((s) => s.zones);
  const addZone = useGameStore((s) => s.addZone);
  const removeZone = useGameStore((s) => s.removeZone);
  const updateZone = useGameStore((s) => s.updateZone);

  // The Sims style placement state
  const [placingItem, setPlacingItem] = useState<FurnitureCatalogItem | null>(null);
  const [placingRotation, setPlacingRotation] = useState<number>(0);
  const mousePosRef = useRef<Position>({ x: 0, y: 0 });

  // Camera
  const camRef = useRef({ x: 0, y: 0, zoom: 1 });
  const rafRef = useRef(0);

  // ============================================================
  // Load Assets
  // ============================================================

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const mapImg = await loadImage(MAP_SRC);
      mapImgRef.current = mapImg;

      // Try loading individual furniture PNGs
      for (const item of CATALOG) {
        if (item.assetPath) {
          try {
            const img = await loadImage(item.assetPath);
            // Attempt chroma-key for green bg or white bg
            const cleaned = removeBackground(img);
            furnitureImagesRef.current.set(item.id, cleaned);
          } catch {
            // Asset doesn't exist yet - will use placeholder
          }
        }
      }

      if (!cancelled) setAssetsLoaded(true);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // Render Loop
  // ============================================================

  useEffect(() => {
    if (!assetsLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function render() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas!.width !== w * dpr || canvas!.height !== h * dpr) {
        canvas!.width = w * dpr;
        canvas!.height = h * dpr;
        canvas!.style.width = w + 'px';
        canvas!.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cam = camRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      // Map
      if (mapImgRef.current) {
        ctx.drawImage(mapImgRef.current, 0, 0);
      }

      // Grid
      if (showGrid) {
        const mapW = mapImgRef.current?.width || 1400;
        const mapH = mapImgRef.current?.height || 788;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= mapW; x += GRID_SIZE) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapH); ctx.stroke();
        }
        for (let y = 0; y <= mapH; y += GRID_SIZE) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapW, y); ctx.stroke();
        }
      }

      // Zone overlays
      for (const zone of zones) {
        const isSelected = selectedZoneId === zone.id;
        ctx.save();

        if (zone.shape === 'polygon' && zone.polygon.length >= 3) {
          // Draw polygon zone
          ctx.beginPath();
          ctx.moveTo(zone.polygon[0].x, zone.polygon[0].y);
          for (let i = 1; i < zone.polygon.length; i++) {
            ctx.lineTo(zone.polygon[i].x, zone.polygon[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = zone.color + (isSelected ? '40' : '25');
          ctx.fill();
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.setLineDash(isSelected ? [] : [6, 4]);
          ctx.stroke();

          // Draw polygon vertices when selected
          if (isSelected) {
            for (const pt of zone.polygon) {
              ctx.fillStyle = zone.color;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        } else {
          // Draw rect zone
          const b = zone.bounds;
          ctx.fillStyle = zone.color + (isSelected ? '40' : '25');
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.setLineDash(isSelected ? [] : [6, 4]);
          ctx.strokeRect(b.x, b.y, b.w, b.h);

          // Resize handles when selected
          if (isSelected) {
            const handles = [
              { x: b.x, y: b.y }, { x: b.x + b.w, y: b.y },
              { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h },
            ];
            for (const h of handles) {
              ctx.fillStyle = zone.color;
              ctx.beginPath();
              ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        }

        ctx.setLineDash([]);

        // Zone label
        const labelX = zone.shape === 'polygon' && zone.polygon.length > 0
          ? zone.polygon.reduce((s, p) => s + p.x, 0) / zone.polygon.length
          : zone.bounds.x + 8;
        const labelY = zone.shape === 'polygon' && zone.polygon.length > 0
          ? zone.polygon.reduce((s, p) => s + p.y, 0) / zone.polygon.length
          : zone.bounds.y + 18;

        ctx.font = '700 11px "Silkscreen", monospace';
        ctx.fillStyle = zone.color;
        ctx.textAlign = zone.shape === 'polygon' ? 'center' : 'left';
        ctx.fillText(`${zone.emoji} ${zone.name}`, labelX, labelY);
        if (zone.isPrivate) {
          ctx.fillText('', labelX + (zone.shape === 'polygon' ? 0 : ctx.measureText(`${zone.emoji} ${zone.name}`).width + 6), labelY);
        }

        ctx.restore();
      }

      // Temp drawing (new zone rect/polygon)
      if (zoneDrawMode === 'rect' && tempRectStart && tempRectEnd) {
        ctx.save();
        const rx = Math.min(tempRectStart.x, tempRectEnd.x);
        const ry = Math.min(tempRectStart.y, tempRectEnd.y);
        const rw = Math.abs(tempRectEnd.x - tempRectStart.x);
        const rh = Math.abs(tempRectEnd.y - tempRectStart.y);
        ctx.fillStyle = newZoneColor + '30';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = newZoneColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (zoneDrawMode === 'pen' && tempPolygonPoints.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tempPolygonPoints[0].x, tempPolygonPoints[0].y);
        for (let i = 1; i < tempPolygonPoints.length; i++) {
          ctx.lineTo(tempPolygonPoints[i].x, tempPolygonPoints[i].y);
        }
        ctx.strokeStyle = newZoneColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        for (const pt of tempPolygonPoints) {
          ctx.fillStyle = newZoneColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Furniture
      for (const item of furniture) {
        const sprite = furnitureImagesRef.current.get(item.furnitureId);

        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);

        if (sprite) {
          const isSpriteSheet = sprite.width >= sprite.height * 3.0 && sprite.width <= sprite.height * 5.0;
          if (isSpriteSheet) {
            const frameWidth = sprite.width / 4;
            let frameIdx = 0;
            if (item.rotation === 90) frameIdx = 1;
            else if (item.rotation === 180) frameIdx = 2;
            else if (item.rotation === 270) frameIdx = 3;

            const imgRatio = frameWidth / sprite.height;
            let drawW = item.width;
            let drawH = item.width / imgRatio;
            if (drawH < item.height) {
               drawH = item.height;
               drawW = item.height * imgRatio;
            }

            // Restore rotation to 0 because we draw the pre-rotated frame
            ctx.rotate((-item.rotation * Math.PI) / 180);

            ctx.drawImage(
              sprite,
              frameIdx * frameWidth, 0, frameWidth, sprite.height,
              -drawW / 2, (item.height / 2) - drawH, drawW, drawH
            );
          } else {
            const imgRatio = sprite.width / sprite.height;
            let drawW = item.width;
            let drawH = item.width / imgRatio;
            if (drawH < item.height) {
               drawH = item.height;
               drawW = item.height * imgRatio;
            }
            ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
          }
        } else {
          // Placeholder box
          const cat = CATALOG.find(c => c.id === item.furnitureId);
          ctx.fillStyle = item.isCollider ? 'rgba(239, 68, 68, 0.2)' : 'rgba(35, 122, 87, 0.2)';
          ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
          ctx.strokeStyle = item.isCollider ? 'rgba(239, 68, 68, 0.5)' : 'rgba(35, 122, 87, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-item.width / 2, -item.height / 2, item.width, item.height);
          ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#F7F9F8';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cat?.name || item.name, 0, 0);
        }

        // Selection outline
        if (selectedFurnitureId === item.instanceId) {
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(-item.width / 2 - 3, -item.height / 2 - 3, item.width + 6, item.height + 6);
          ctx.setLineDash([]);
        }

        // Collision indicator
        if (item.isCollider && activeMode === 'collision') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(-item.width / 2, -item.height / 2, item.width, item.height);
        }

        // Action indicator
        if (item.actionType !== 'none') {
          ctx.fillStyle = '#3B82F6';
          ctx.beginPath();
          ctx.arc(item.width / 2 + 2, -item.height / 2 - 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '600 8px sans-serif';
          ctx.fillStyle = '#121514';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('E', item.width / 2 + 2, -item.height / 2 - 2);
        }

        ctx.restore();
      }

      // Render placing "phantom" furniture
      if (placingItem) {
        const item = placingItem;
        const sprite = furnitureImagesRef.current.get(item.id);
        const mousePos = mousePosRef.current;

        ctx.save();
        ctx.translate(mousePos.x + item.defaultWidth / 2, mousePos.y + item.defaultHeight / 2);
        ctx.globalAlpha = 0.6; // semi-transparent

        // Draw selection box / footprint
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fillRect(-item.defaultWidth / 2, -item.defaultHeight / 2, item.defaultWidth, item.defaultHeight);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-item.defaultWidth / 2, -item.defaultHeight / 2, item.defaultWidth, item.defaultHeight);
        ctx.setLineDash([]);

        ctx.rotate((placingRotation * Math.PI) / 180);

        if (sprite) {
          const isSpriteSheet = sprite.width >= sprite.height * 3.0 && sprite.width <= sprite.height * 5.0;
          if (isSpriteSheet) {
            const frameWidth = sprite.width / 4;
            let frameIdx = 0;
            if (placingRotation === 90) frameIdx = 1;
            else if (placingRotation === 180) frameIdx = 2;
            else if (placingRotation === 270) frameIdx = 3;

            const imgRatio = frameWidth / sprite.height;
            let drawW = item.defaultWidth;
            let drawH = item.defaultWidth / imgRatio;
            if (drawH < item.defaultHeight) {
               drawH = item.defaultHeight;
               drawW = item.defaultHeight * imgRatio;
            }

            ctx.rotate((-placingRotation * Math.PI) / 180);

            ctx.drawImage(
              sprite,
              frameIdx * frameWidth, 0, frameWidth, sprite.height,
              -drawW / 2, (item.defaultHeight / 2) - drawH, drawW, drawH
            );
          } else {
            const imgRatio = sprite.width / sprite.height;
            let drawW = item.defaultWidth;
            let drawH = item.defaultWidth / imgRatio;
            if (drawH < item.defaultHeight) {
               drawH = item.defaultHeight;
               drawW = item.defaultHeight * imgRatio;
            }
            ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
          }
        }
        ctx.restore();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [assetsLoaded, furniture, zones, showGrid, selectedFurnitureId, selectedZoneId, activeMode, zoneDrawMode, tempRectStart, tempRectEnd, tempPolygonPoints, newZoneColor]);

  // ============================================================
  // Coordinate helper
  // ============================================================

  const screenToMap = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cam = camRef.current;
    return {
      x: (clientX - rect.left) / cam.zoom + cam.x,
      y: (clientY - rect.top) / cam.zoom + cam.y,
    };
  }, []);

  // ============================================================
  // Mouse Interactions
  // ============================================================

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (activeMode !== 'furniture') return;
    const pos = screenToMap(e.clientX, e.clientY);
    for (let i = furniture.length - 1; i >= 0; i--) {
      const f = furniture[i];
      if (pos.x >= f.x && pos.x <= f.x + f.width && pos.y >= f.y && pos.y <= f.y + f.height) {
        setSelectedFurnitureId(f.instanceId);
        setContextMenu({ x: e.clientX, y: e.clientY, instanceId: f.instanceId });
        return;
      }
    }
    setContextMenu(null);
  }, [furniture, activeMode, screenToMap]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (contextMenu) setContextMenu(null);

      // Ignore if panning (middle mouse or Space+Click)
      if (e.button === 1 || window.__isSpacePressed) return;

      const pos = screenToMap(e.clientX, e.clientY);

      // If we are currently placing a new item from catalog
      if (placingItem) {
        const instanceId = `${placingItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        addFurniture({
          instanceId,
          furnitureId: placingItem.id,
          name: placingItem.name,
          x: mousePosRef.current.x,
          y: mousePosRef.current.y,
          width: placingItem.defaultWidth,
          height: placingItem.defaultHeight,
          rotation: placingRotation,
          isCollider: placingItem.defaultCollider,
          actionType: placingItem.defaultAction,
          actionLabel: placingItem.defaultActionLabel,
          actionTarget: placingItem.defaultActionTarget,
          assetPath: placingItem.assetPath,
        });
        setSelectedFurnitureId(instanceId);
        setPlacingItem(null);
        setPlacingRotation(0);
        return;
      }

      if (activeMode === 'furniture') {
        for (let i = furniture.length - 1; i >= 0; i--) {
          const f = furniture[i];
          if (pos.x >= f.x && pos.x <= f.x + f.width && pos.y >= f.y && pos.y <= f.y + f.height) {
            setSelectedFurnitureId(f.instanceId);
            setDragging({ instanceId: f.instanceId, offsetX: pos.x - f.x, offsetY: pos.y - f.y });
            return;
          }
        }
        setSelectedFurnitureId(null);
        setEditingAction(false);
      }

      if (activeMode === 'zone') {
        if (zoneDrawMode === 'rect') {
          setTempRectStart(pos);
          setTempRectEnd(pos);
        } else if (zoneDrawMode === 'pen') {
          // Add polygon point
          // Double-click near first point to close
          if (tempPolygonPoints.length >= 3) {
            const first = tempPolygonPoints[0];
            const dx = pos.x - first.x;
            const dy = pos.y - first.y;
            if (Math.sqrt(dx * dx + dy * dy) < 15) {
              // Close polygon - create zone
              finishPolygonZone();
              return;
            }
          }
          setTempPolygonPoints(prev => [...prev, pos]);
        } else {
          // Select mode: click on zone
          let found = false;
          for (const zone of zones) {
            const b = zone.bounds;
            if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
              setSelectedZoneId(zone.id);
              found = true;
              break;
            }
          }
          if (!found) setSelectedZoneId(null);
        }
      }

      if (activeMode === 'collision') {
        for (let i = furniture.length - 1; i >= 0; i--) {
          const f = furniture[i];
          if (pos.x >= f.x && pos.x <= f.x + f.width && pos.y >= f.y && pos.y <= f.y + f.height) {
            // Toggle collision on click
            updateFurniture(f.instanceId, { isCollider: !f.isCollider });
            setSelectedFurnitureId(f.instanceId);
            return;
          }
        }
      }
    },
    [furniture, activeMode, zoneDrawMode, zones, screenToMap, updateFurniture, tempPolygonPoints, placingItem, placingRotation, addFurniture]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToMap(e.clientX, e.clientY);
      
      // Always track snapped mouse pos for placing
      mousePosRef.current = {
        x: showGrid ? Math.round(pos.x / GRID_SIZE) * GRID_SIZE : pos.x,
        y: showGrid ? Math.round(pos.y / GRID_SIZE) * GRID_SIZE : pos.y
      };

      if (dragging) {
        const snappedX = showGrid ? Math.round((pos.x - dragging.offsetX) / GRID_SIZE) * GRID_SIZE : pos.x - dragging.offsetX;
        const snappedY = showGrid ? Math.round((pos.y - dragging.offsetY) / GRID_SIZE) * GRID_SIZE : pos.y - dragging.offsetY;
        updateFurniture(dragging.instanceId, { x: snappedX, y: snappedY });
      }

      if (activeMode === 'zone' && zoneDrawMode === 'rect' && tempRectStart) {
        setTempRectEnd(pos);
      }
    },
    [dragging, showGrid, screenToMap, updateFurniture, activeMode, zoneDrawMode, tempRectStart]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(null);
    }

    if (activeMode === 'zone' && zoneDrawMode === 'rect' && tempRectStart && tempRectEnd) {
      const rx = Math.min(tempRectStart.x, tempRectEnd.x);
      const ry = Math.min(tempRectStart.y, tempRectEnd.y);
      const rw = Math.abs(tempRectEnd.x - tempRectStart.x);
      const rh = Math.abs(tempRectEnd.y - tempRectStart.y);

      if (rw > 20 && rh > 20) {
        // Create new rect zone
        const id = `zone_${Date.now()}`;
        addZone({
          id,
          name: newZoneName || `Zona ${zones.length + 1}`,
          emoji: '',
          color: newZoneColor,
          shape: 'rect',
          bounds: { x: Math.round(rx), y: Math.round(ry), w: Math.round(rw), h: Math.round(rh) },
          polygon: [],
          isPrivate: false,
        });
        setSelectedZoneId(id);
        setNewZoneName('');
      }

      setTempRectStart(null);
      setTempRectEnd(null);
    }
  }, [dragging, activeMode, zoneDrawMode, tempRectStart, tempRectEnd, addZone, newZoneName, newZoneColor, zones.length]);

  // Finish polygon zone
  const finishPolygonZone = useCallback(() => {
    if (tempPolygonPoints.length < 3) return;

    const id = `zone_${Date.now()}`;
    // Calculate bounding box
    const xs = tempPolygonPoints.map(p => p.x);
    const ys = tempPolygonPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    addZone({
      id,
      name: newZoneName || `Zona ${zones.length + 1}`,
      emoji: '',
      color: newZoneColor,
      shape: 'polygon',
      bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
      polygon: [...tempPolygonPoints],
      isPrivate: false,
    });
    setSelectedZoneId(id);
    setTempPolygonPoints([]);
    setNewZoneName('');
    setZoneDrawMode('select');
  }, [tempPolygonPoints, addZone, newZoneName, newZoneColor, zones.length]);

  // ============================================================
  // Add furniture from catalog
  // ============================================================

  const addFromCatalog = useCallback(
    (catalogItem: FurnitureCatalogItem) => {
      setPlacingItem(catalogItem);
      setPlacingRotation(0);
      setActiveMode('furniture');
      setSidebarOpen(false); // Hide sidebar to give clear view for placing
    },
    []
  );

  // Actions on selected furniture
  const rotateFurniture = () => {
    if (!selectedFurnitureId) return;
    const f = furniture.find(f => f.instanceId === selectedFurnitureId);
    if (f) updateFurniture(selectedFurnitureId, { rotation: (f.rotation + 90) % 360 });
  };

  const deleteFurniture = () => {
    if (!selectedFurnitureId) return;
    removeFurniture(selectedFurnitureId);
    setSelectedFurnitureId(null);
    setEditingAction(false);
  };

  const toggleCollision = () => {
    if (!selectedFurnitureId) return;
    const f = furniture.find(f => f.instanceId === selectedFurnitureId);
    if (f) updateFurniture(selectedFurnitureId, { isCollider: !f.isCollider });
  };

  // Save design
  const saveDesign = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // ============================================================
  // Zoom with wheel
  // ============================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      cam.zoom = Math.max(0.3, Math.min(3, cam.zoom + (e.deltaY > 0 ? -0.1 : 0.1)));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Keyboard shortcuts (e.g. rotation during placement)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      // Rotate if placing an item
      if (placingItem && (e.key === 'r' || e.key === 'R')) {
        setPlacingRotation(prev => (prev + 90) % 360);
      }
      // Cancel placement with Escape
      if (placingItem && e.key === 'Escape') {
        setPlacingItem(null);
        setSidebarOpen(true);
      }

      // Furniture resizing shortcuts
      if (selectedFurnitureId && (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '_')) {
        const f = furniture.find(f => f.instanceId === selectedFurnitureId);
        if (f) {
          const delta = (e.key === '=' || e.key === '+') ? 1 : -1;
          const newW = Math.max(1, f.gridWidth + delta);
          const newH = Math.max(1, f.gridHeight + delta);
          updateFurniture(selectedFurnitureId, { gridWidth: newW, gridHeight: newH });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [placingItem, selectedFurnitureId, furniture, updateFurniture]);

  // Pan with middle mouse or Space + Left click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let isPanning = false;
    let lastX = 0, lastY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        window.__isSpacePressed = true;
        canvas.style.cursor = 'grab';
      }
    };
    
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        window.__isSpacePressed = false;
        canvas.style.cursor = 'default';
        isPanning = false;
      }
    };

    const onDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && window.__isSpacePressed)) { 
        isPanning = true; 
        lastX = e.clientX; 
        lastY = e.clientY; 
        e.preventDefault(); 
        if (window.__isSpacePressed) canvas.style.cursor = 'grabbing';
      }
    };
    
    const onMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const cam = camRef.current;
      cam.x -= (e.clientX - lastX) / cam.zoom;
      cam.y -= (e.clientY - lastY) / cam.zoom;
      lastX = e.clientX; lastY = e.clientY;
    };
    
    const onUp = () => { 
      isPanning = false; 
      if (window.__isSpacePressed && canvas) canvas.style.cursor = 'grab';
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Selected furniture data
  const selectedFurniture = selectedFurnitureId ? furniture.find(f => f.instanceId === selectedFurnitureId) : null;
  const selectedZone = selectedZoneId ? zones.find(z => z.id === selectedZoneId) : null;

  // ============================================================
  // Loading
  // ============================================================

  if (!assetsLoaded) {
    return (
      <div style={{
        width: '100%', height: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-primary)', gap: 16, flexDirection: 'column',
      }}>
        <div style={{
          width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: '#9CA3AF', fontFamily: "'Silkscreen', monospace", fontSize: 14 }}>
          Memuat Room Designer...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div style={{ width: '100%', height: '100dvh', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setDragging(null); }}
        onContextMenu={handleContextMenu}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          cursor: dragging ? 'grabbing' : zoneDrawMode === 'pen' ? 'crosshair' : zoneDrawMode === 'rect' ? 'crosshair' : 'default',
        }}
      />

      {/* Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hud-pill"
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 200, cursor: 'pointer', padding: '8px 14px', gap: 6, display: 'flex', alignItems: 'center' }}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />} Designer
      </button>

      {/* Top-right tools */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 200, display: 'flex', gap: 6 }}>
        <button className={`hud-btn ${showGrid ? 'hud-btn--accent' : ''}`} onClick={() => setShowGrid(!showGrid)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Grid3x3 size={14} /> Grid
        </button>
        <button className="hud-btn hud-btn--danger" onClick={() => {
          if (confirm('Reset zona ke default? Ini akan mengganti zona yang Anda gambar dengan bawaan sistem.')) {
            useGameStore.getState().setZones(DEFAULT_ZONES);
            alert('Zona di-reset! Silakan kembali ke Virtual Room untuk melihat default zona baru.');
          }
        }} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Trash2 size={14} /> Reset Zones
        </button>
        <button className="hud-btn hud-btn--gold" onClick={saveDesign} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Save size={14} /> Simpan
          {isSaved && (
            <span style={{ position: 'absolute', top: -8, right: -8, background: '#34D399', color: '#121514', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Check size={8} /> Tersimpan!
            </span>
          )}
        </button>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          style={{
            position: 'absolute', top: 50, left: 12, bottom: 12, width: 300, zIndex: 200,
            background: 'var(--bg-elevated)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-hud)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Mode tabs */}
          <div style={{ padding: '12px 12px 8px', display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)' }}>
            {([
              { key: 'furniture' as const, icon: <Armchair size={12} />, label: 'Furnitur' },
              { key: 'zone' as const, icon: <Pentagon size={12} />, label: 'Zona' },
              { key: 'collision' as const, icon: <Shield size={12} />, label: 'Collision' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveMode(tab.key); setEditingAction(false); }}
                style={{
                  flex: 1, padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none',
                  background: activeMode === tab.key ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {/* ============ FURNITURE MODE ============ */}
            {activeMode === 'furniture' && (
              <>
                <SectionHeader icon={<Armchair size={12} />} label="Katalog Aset" />
                <input
                  type="text"
                  placeholder="Cari furnitur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)',
                    color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-ui)',
                    marginBottom: 12, outline: 'none',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                  {CATALOG.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addFromCatalog(item)}
                      style={{
                        padding: '10px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer',
                        textAlign: 'center', fontFamily: 'var(--font-ui)', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      }}
                    >
                      {item.icon}
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{item.name}</span>
                      {item.defaultAction !== 'none' && (
                        <span style={{ fontSize: 8, color: '#3B82F6', fontWeight: 700 }}>
                           {item.defaultAction.toUpperCase()}
                        </span>
                      )}
                    </button>
                  ))}
                  {CATALOG.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 11 }}>
                      Tidak ditemukan
                    </div>
                  )}
                </div>

                {/* Selected Furniture Quick Actions */}
                {selectedFurniture && (
                  <div style={{ marginTop: 24, padding: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{selectedFurniture.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Properti Furnitur Terpilih</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({ x: rect.left - 260, y: rect.top, instanceId: selectedFurniture.instanceId });
                        }}
                        style={{ padding: '6px 12px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit3 size={12} />
                        Edit Options
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ ZONE MODE ============ */}
            {activeMode === 'zone' && (
              <>
                <SectionHeader icon={<Pentagon size={12} />} label="Zone Drawing Tool" />

                {/* Draw mode selector */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {([
                    { key: 'select' as const, icon: <MousePointer size={12} />, label: 'Select' },
                    { key: 'rect' as const, icon: <Square size={12} />, label: 'Kotak' },
                    { key: 'pen' as const, icon: <Pen size={12} />, label: 'Polygon' },
                  ]).map(tool => (
                    <button
                      key={tool.key}
                      onClick={() => { setZoneDrawMode(tool.key); setTempPolygonPoints([]); setTempRectStart(null); }}
                      style={{
                        flex: 1, padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none',
                        background: zoneDrawMode === tool.key ? 'var(--accent-primary)' : 'var(--bg-card)',
                        color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                      }}
                    >
                      {tool.icon} {tool.label}
                    </button>
                  ))}
                </div>

                {/* New zone settings (for rect/pen modes) */}
                {(zoneDrawMode === 'rect' || zoneDrawMode === 'pen') && (
                  <div style={{ padding: 10, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nama Zona Baru</label>
                    <input
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      placeholder="Nama zona..."
                      style={inputStyle}
                    />
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: 8, marginBottom: 4 }}>Warna</label>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {ZONE_PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNewZoneColor(c)}
                          style={{
                            width: 24, height: 24, borderRadius: '50%', border: newZoneColor === c ? '2px solid #fff' : '1px solid var(--border-subtle)',
                            background: c, cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                      {zoneDrawMode === 'rect'
                        ? ' Klik & seret pada kanvas untuk menggambar zona kotak.'
                        : ' Klik pada kanvas untuk menambah titik polygon. Klik dekat titik pertama untuk menutup.'}
                    </p>
                    {zoneDrawMode === 'pen' && tempPolygonPoints.length >= 3 && (
                      <button
                        onClick={finishPolygonZone}
                        className="hud-btn hud-btn--accent"
                        style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        <Check size={12} /> Tutup Polygon ({tempPolygonPoints.length} titik)
                      </button>
                    )}
                  </div>
                )}

                {/* Existing zones list */}
                <SectionHeader icon={<Palette size={12} />} label="Daftar Zona" />
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    onClick={() => { setSelectedZoneId(zone.id); setZoneDrawMode('select'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 6,
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${selectedZoneId === zone.id ? zone.color : 'var(--border-subtle)'}`,
                      background: selectedZoneId === zone.id ? `${zone.color}22` : 'var(--bg-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: zone.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingZoneField?.zoneId === zone.id && editingZoneField.field === 'name' ? (
                        <input
                          autoFocus
                          value={editingZoneValue}
                          onChange={(e) => setEditingZoneValue(e.target.value)}
                          onBlur={() => { updateZone(zone.id, { name: editingZoneValue }); setEditingZoneField(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { updateZone(zone.id, { name: editingZoneValue }); setEditingZoneField(null); } }}
                          style={{ ...inputStyle, padding: '2px 6px', fontSize: 11 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{zone.emoji} {zone.name}</div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {zone.shape === 'polygon' ? <Pentagon size={8} /> : <Square size={8} />}
                        {zone.shape} • {zone.isPrivate ? 'Private' : 'Public'}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Selected zone actions */}
                {selectedZone && (
                  <div style={{ marginTop: 8, padding: 10, background: 'rgba(59, 130, 246,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246,0.3)' }}>
                    <SectionHeader icon={<Edit3 size={12} />} label={`Edit: ${selectedZone.name}`} color="#3B82F6" />
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <SmallBtn
                        icon={<Edit3 size={12} />} label="Rename"
                        onClick={() => { setEditingZoneField({ zoneId: selectedZone.id, field: 'name' }); setEditingZoneValue(selectedZone.name); }}
                      />
                      <SmallBtn
                        icon={selectedZone.isPrivate ? <Lock size={12} /> : <Unlock size={12} />}
                        label={selectedZone.isPrivate ? 'Private' : 'Public'}
                        onClick={() => updateZone(selectedZone.id, { isPrivate: !selectedZone.isPrivate })}
                      />
                      <SmallBtn
                        icon={<Trash2 size={12} />} label="Hapus"
                        onClick={() => { removeZone(selectedZone.id); setSelectedZoneId(null); }}
                        danger
                      />
                    </div>
                    {/* Color picker */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                      {ZONE_PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => updateZone(selectedZone.id, { color: c })}
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            border: selectedZone.color === c ? '2px solid #fff' : '1px solid var(--border-subtle)',
                            background: c, cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ COLLISION MODE ============ */}
            {activeMode === 'collision' && (
              <>
                <SectionHeader icon={<Shield size={12} />} label="Collision Editor" />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Klik langsung pada furnitur di kanvas untuk toggle collision.
                  Merah = Solid (tidak bisa dilewati). Hijau = Walkable.
                </p>
                {furniture.length === 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                    Belum ada furnitur. Tambahkan dari tab Furnitur terlebih dahulu.
                  </p>
                )}
                {furniture.map((f) => (
                  <div
                    key={f.instanceId}
                    onClick={() => {
                      updateFurniture(f.instanceId, { isCollider: !f.isCollider });
                      setSelectedFurnitureId(f.instanceId);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', marginBottom: 4, borderRadius: 'var(--radius-md)',
                      border: `1px solid ${selectedFurnitureId === f.instanceId ? '#3B82F6' : 'var(--border-subtle)'}`,
                      background: selectedFurnitureId === f.instanceId ? 'rgba(59, 130, 246,0.1)' : 'var(--bg-card)',
                      cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: f.isCollider ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)',
                      color: f.isCollider ? '#EF4444' : '#34D399',
                    }}>
                      {f.isCollider ? <Shield size={8} /> : <ShieldOff size={8} />}
                      {f.isCollider ? 'SOLID' : 'WALKABLE'}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
      {/* Context Menu Overlay */}
      {contextMenu && selectedFurniture && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(contextMenu.x, window.innerWidth - 260),
            top: Math.min(contextMenu.y, window.innerHeight - 300),
            background: 'rgba(18, 21, 20, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-xl)',
            padding: 16,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            zIndex: 1000,
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent clicking inside menu from closing it
          onContextMenu={(e) => e.preventDefault()}
        >
          <SectionHeader icon={<Edit3 size={12} />} label={`Edit: ${selectedFurniture.name}`} color="#3B82F6" />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SmallBtn icon={<RotateCw size={12} />} label="Putar" onClick={() => { rotateFurniture(); }} />
            <SmallBtn
              icon={selectedFurniture.isCollider ? <Shield size={12} /> : <ShieldOff size={12} />}
              label={selectedFurniture.isCollider ? 'Solid' : 'Walk'}
              onClick={() => { toggleCollision(); }}
            />
            <SmallBtn icon={<ArrowUpToLine size={12} />} label="Maju" onClick={() => { bringFurnitureToFront(selectedFurniture.instanceId); }} />
            <SmallBtn icon={<ArrowDownToLine size={12} />} label="Mundur" onClick={() => { sendFurnitureToBack(selectedFurniture.instanceId); }} />
            <SmallBtn icon={<Trash2 size={12} />} label="Hapus" onClick={() => { deleteFurniture(); setContextMenu(null); }} danger />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Lebar</label>
              <input 
                type="number" 
                value={selectedFurniture.width} 
                onChange={(e) => updateFurniture(selectedFurniture.instanceId, { width: parseInt(e.target.value) || 20 })} 
                style={inputStyle} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Panjang</label>
              <input 
                type="number" 
                value={selectedFurniture.height} 
                onChange={(e) => updateFurniture(selectedFurniture.instanceId, { height: parseInt(e.target.value) || 20 })} 
                style={inputStyle} 
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <SmallBtn 
                icon={<Minus size={12} />} 
                label="" 
                onClick={() => {
                  updateFurniture(selectedFurniture.instanceId, {
                    width: Math.max(10, Math.round(selectedFurniture.width * 0.9)),
                    height: Math.max(10, Math.round(selectedFurniture.height * 0.9))
                  });
                }} 
              />
              <SmallBtn 
                icon={<Plus size={12} />} 
                label="" 
                onClick={() => {
                  updateFurniture(selectedFurniture.instanceId, {
                    width: Math.round(selectedFurniture.width * 1.1),
                    height: Math.round(selectedFurniture.height * 1.1)
                  });
                }} 
              />
            </div>
          </div>

          <button
            onClick={() => setEditingAction(!editingAction)}
            style={{
              width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
              color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Zap size={12} /> Edit Action: {selectedFurniture.actionType}
          </button>

          {editingAction && (
            <div style={{ padding: 8, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Tipe Action</label>
              <select
                value={selectedFurniture.actionType}
                onChange={(e) => updateFurniture(selectedFurniture.instanceId, { actionType: e.target.value as FurnitureActionType })}
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-ui)',
                }}
              >
                <option value="none">None</option>
                <option value="sit">Duduk (Sit)</option>
                <option value="navigate">Navigate (Buka halaman)</option>
                <option value="modal">Modal (Buka popup)</option>
                <option value="emote">Emote (Status badge)</option>
                <option value="interact">Interact (Custom)</option>
              </select>

              {selectedFurniture.actionType !== 'none' && (
                <>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: 8, marginBottom: 4 }}>Label</label>
                  <input
                    value={selectedFurniture.actionLabel || ''}
                    onChange={(e) => updateFurniture(selectedFurniture.instanceId, { actionLabel: e.target.value })}
                    placeholder="Press E to..."
                    style={inputStyle}
                  />

                  {(selectedFurniture.actionType === 'navigate' || selectedFurniture.actionType === 'modal' || selectedFurniture.actionType === 'emote') && (
                    <>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: 8, marginBottom: 4 }}>
                        {selectedFurniture.actionType === 'navigate' ? 'URL Path' : selectedFurniture.actionType === 'emote' ? 'Status Text' : 'Modal ID'}
                      </label>
                      <input
                        value={selectedFurniture.actionTarget || ''}
                        onChange={(e) => updateFurniture(selectedFurniture.instanceId, { actionTarget: e.target.value })}
                        placeholder={selectedFurniture.actionType === 'navigate' ? '/resources' : selectedFurniture.actionType === 'emote' ? ' Sedang Ngopi' : 'whiteboard'}
                        style={inputStyle}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
  color: '#FFFFFF', fontSize: 11, fontFamily: 'var(--font-ui)', outline: 'none',
};

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <h4 style={{
      fontSize: 11, fontWeight: 700, color: color || 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {icon} {label}
    </h4>
  );
}

function SmallBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      className="hud-btn"
      onClick={onClick}
      style={{
        fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4,
        ...(danger ? { background: 'rgba(239,68,68,0.2)', color: '#EF4444' } : {}),
      }}
    >
      {icon} {label}
    </button>
  );
}
