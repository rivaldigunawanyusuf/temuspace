/**
 * VirtualRoom.tsx - Full Gather.town-style Virtual Room
 * 
 * Features:
 * - Canvas rendering with hq-map-base as background
 * - Character sprite animation (4-directional with walk cycle)
 * - NPC rendering & pathfinding
 * - Room zone detection & spotlight dimming
 * - Keyboard (WASD/Arrows), Click-to-Move, Mobile Joystick
 * - Camera following player with lerp
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import {
  useGameStore,
  getZoneAtPosition,
  getNearbyFurniture,
  type Direction,
  type Position,
  type NPCState,
  type ZoneDefinition,
} from '../stores/useGameStore';
import {
  useChatStore,
  getZoneDisplay,
  isCallingRaka,
  getRakaCallResponse,
  getRakaArrivalMessage,
  generateMsgId,
} from '../stores/useChatStore';
import {
  loadImage,
  removeBackground,
  type SpriteFrame,
} from '../engine/spriteLoader';
import TopLeftHUD from './HUD/TopLeftHUD';
import TopRightHUD from './HUD/TopRightHUD';
import ChatDrawer from './HUD/ChatDrawer';
import BottomControls from './HUD/BottomControls';
import MobileJoystick from './HUD/MobileJoystick';
import MobileActions from './HUD/MobileActions';
import BottomNavbar from './BottomNavbar';

// ============================================================
// Constants
// ============================================================

const PLAYER_SPEED = 3;
const NPC_SPEED = 2;
const TARGET_SPRITE_HEIGHT = 120; // Fixed default height, can be scaled dynamically
const CAMERA_LERP = 0.08;
const ANIM_FRAME_INTERVAL = 150; // ms per frame

const MAP_SRC = '/assets/hq-map-base.jpeg';

// ============================================================
// Component
// ============================================================

export default function VirtualRoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Assets
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const charFramesRef = useRef<Record<string, SpriteFrame[]>>({});
  const charFrameWidthRef = useRef(0);
  const charFrameHeightRef = useRef(0);
  const furnitureImagesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Animation
  const animTimerRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef(0);

  // Input
  const keysRef = useRef<Set<string>>(new Set());
  const joystickVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const clickTargetRef = useRef<Position | null>(null);

  // Camera (mutable for perf, not in React state)
  const camRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Assets loaded
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const avatarId = useGameStore((s) => s.player.avatar);
  const currentFurnitureList = useGameStore((s) => s.furniture);

  // Store selectors
  const player = useGameStore((s) => s.player);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const npcs = useGameStore((s) => s.npcs);
  const updateNPC = useGameStore((s) => s.updateNPC);
  const zones = useGameStore((s) => s.zones);
  const isChatOpen = useGameStore((s) => s.isChatOpen);
  const nearbyFurniture = useGameStore((s) => s.nearbyFurniture);

  // Mutable refs for state in rAF
  const playerRef = useRef(player);
  const npcsRef = useRef(npcs);
  const zonesRef = useRef(zones);
  playerRef.current = player;
  npcsRef.current = npcs;
  zonesRef.current = zones;

  // ============================================================
  // Load Assets
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      try {
        // Load map
        const mapImg = await loadImage(MAP_SRC);
        mapImgRef.current = mapImg;

        const cols = 8;
        const rows = 4;
        const framesMap: Record<string, SpriteFrame[]> = {};

        const loadRowCharacter = async (charId: string) => {
          const charFrames: SpriteFrame[] = [];
          const rowFiles = [`${charId}_row1.png`, `${charId}_row2.png`, `${charId}_row3.png`, `${charId}_row4.png`];
          
          for (let r = 0; r < rows; r++) {
            const rowImg = await loadImage(`/assets/characters/${rowFiles[r]}`);
            const cleanRow = removeBackground(rowImg);
            
            const fw = Math.floor(cleanRow.width / cols);
            const fh = cleanRow.height;
            
            const INSET_X = 6;
            const INSET_TOP = 35;
            const INSET_BOTTOM = 6;
            
            const cropW = fw - (INSET_X * 2);
            const cropH = fh - (INSET_TOP + INSET_BOTTOM);
            
            if (r === 0 && charId === avatarId) {
              charFrameWidthRef.current = cropW;
              charFrameHeightRef.current = cropH;
            }

            for (let c = 0; c < cols; c++) {
              const fc = document.createElement('canvas');
              fc.width = cropW;
              fc.height = cropH;
              const fCtx = fc.getContext('2d')!;
              
              fCtx.drawImage(
                cleanRow, 
                c * fw + INSET_X, INSET_TOP, cropW, cropH, 
                0, 0, cropW, cropH
              );
              charFrames.push({ canvas: fc, width: cropW, height: cropH });
            }
          }
          return charFrames;
        };

        framesMap['raka'] = await loadRowCharacter('raka');
        framesMap['nina'] = await loadRowCharacter('nina');


        charFramesRef.current = framesMap;

        // Load unique furniture assets present in the room
        const uniqueAssetPaths = new Set<string>();
        for (const f of currentFurnitureList) {
          if (f.assetPath) uniqueAssetPaths.add(f.assetPath);
        }

        for (const path of uniqueAssetPaths) {
          if (!furnitureImagesRef.current.has(path)) {
            try {
              const img = await loadImage(path);
              const cleaned = removeBackground(img);
              furnitureImagesRef.current.set(path, cleaned);
            } catch (err) {
              console.warn(`Failed to load furniture asset: ${path}`);
            }
          }
        }

        if (!cancelled) setAssetsLoaded(true);
      } catch (err) {
        console.error('Failed to load assets:', err);
      }
    }

    loadAssets();
    return () => { cancelled = true; };
  }, [avatarId]);

  // ============================================================
  // Get sprite frame index for a direction + anim frame
  // ============================================================

  const getSpriteFrame = useCallback(
    (direction: Direction, animFrame: number, isSitting: boolean = false, isMoving: boolean = false): { frameIndex: number; flipX: boolean } => {
      // Isometric 8x4 Grid Layout (32 frames)
      // Row 1 (0-7): Walk South-East (right) -> Flip for South-West (down)
      // Row 2 (8-15): Walk North-East (up) -> Flip for North-West (left)
      // Row 3 (16-23): Idle & Sit (SE) -> Flip for SW
      // Row 4 (24-31): Idle & Sit (NE) -> Flip for NW
      
      if (isSitting) {
        // We'll put Sitting SE at Row 3, Col 5-8 (index 20-23)
        // Sitting NE at Row 4, Col 5-8 (index 28-31)
        
        // Occasional idle animation logic (mostly stays on frame 0)
        let frame = 0;
        if (!isMoving) {
          const cycle = Date.now() % 5000; // 5-second cycle
          if (cycle > 4000) {
            // Play frames 1, 2, 3 over the last 1 second
            if (cycle < 4333) frame = 1;
            else if (cycle < 4666) frame = 2;
            else frame = 3;
          }
        }

        switch (direction) {
          case 'right': return { frameIndex: 20 + frame, flipX: false }; // SE Sit
          case 'left':  return { frameIndex: 20 + frame, flipX: true };  // SW Sit
          case 'down':  return { frameIndex: 20 + frame, flipX: false }; // SE Sit
          case 'up':    return { frameIndex: 28 + frame, flipX: false }; // NE Sit
          default:      return { frameIndex: 20 + frame, flipX: false };
        }
      }

      if (!isMoving) {
        // Idles
        // We'll put Idle SE at Row 3, Col 1-4 (index 16-19)
        // Idle NE at Row 4, Col 1-4 (index 24-27)
        let frame = 0;
        const cycle = Date.now() % 5000; // 5-second cycle
        if (cycle > 4000) {
          // Play frames 1, 2, 3 over the last 1 second
          if (cycle < 4333) frame = 1;
          else if (cycle < 4666) frame = 2;
          else frame = 3;
        }

        switch (direction) {
          case 'right': return { frameIndex: 16 + frame, flipX: false }; // SE Idle
          case 'left':  return { frameIndex: 16 + frame, flipX: true };  // SW Idle
          case 'down':  return { frameIndex: 16 + frame, flipX: false }; // SE Idle
          case 'up':    return { frameIndex: 24 + frame, flipX: false }; // NE Idle
          default:      return { frameIndex: 16 + frame, flipX: false };
        }
      }

      const frame = animFrame % 8;
      switch (direction) {
        case 'right': return { frameIndex: frame, flipX: false };       // Row 1 (SE Walk)
        case 'left':  return { frameIndex: frame, flipX: true };        // Row 1 flipped (SW Walk)
        case 'down':  return { frameIndex: frame, flipX: false };       // Row 1 (SE Walk)
        case 'up':    return { frameIndex: 8 + frame, flipX: false };   // Row 2 (NE Walk)
        default:      return { frameIndex: 0, flipX: false };
      }
    },
    []
  );

  // ============================================================
  // Keyboard Input
  // ============================================================

  const setNearbyFurniture = useGameStore((s) => s.setNearbyFurniture);
  const furniture = useGameStore((s) => s.furniture);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      // Cancel click-to-move on keyboard input
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        clickTargetRef.current = null;
        // Cancel sitting when moving
        const p = playerRef.current;
        if (p.sittingOn) {
          updatePlayer({ sittingOn: undefined, statusBadge: undefined });
        }
      }
      // Toggle mic with M
      if (e.key.toLowerCase() === 'm') {
        const p = playerRef.current;
        updatePlayer({ isMicOn: !p.isMicOn });
      }
      // Interact with E
      if (e.key.toLowerCase() === 'e') {
        const nearby = useGameStore.getState().nearbyFurniture;
        if (nearby && nearby.actionType !== 'none') {
          handleFurnitureAction(nearby);
        }
      }
      // Jokes: Scale character up and down
      if (e.key === '=' || e.key === '+') {
        const p = playerRef.current;
        updatePlayer({ scale: Math.min(3.0, (p.scale || 1) + 0.2) });
      }
      if (e.key === '-' || e.key === '_') {
        const p = playerRef.current;
        updatePlayer({ scale: Math.max(0.4, (p.scale || 1) - 0.2) });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [updatePlayer]);

  // Handle furniture action
  const handleFurnitureAction = useCallback((f: typeof furniture[number]) => {
    switch (f.actionType) {
      case 'sit': {
        let sitDir: 'down' | 'left' | 'right' | 'up' = 'down';
        if (f.rotation === 90) sitDir = 'left';
        else if (f.rotation === 180) sitDir = 'up';
        else if (f.rotation === 270) sitDir = 'right';

        updatePlayer({ 
          sittingOn: f.instanceId, 
          statusBadge: f.actionLabel || ' Sedang Duduk',
          direction: sitDir
        });
        break;
      }
      case 'navigate':
        if (f.actionTarget) {
          // For SPA, switch tab; for external, could window.open
          const tab = f.actionTarget.replace('/', '') as 'resources' | 'events' | 'profile' | 'homepage';
          useGameStore.getState().setActiveTab(tab || 'resources');
        }
        break;
      case 'emote':
        updatePlayer({ statusBadge: f.actionTarget || '' });
        // Auto-clear after 8 seconds
        setTimeout(() => updatePlayer({ statusBadge: undefined }), 8000);
        break;
      case 'modal':
        // TODO: Open modal dialog (placeholder: show status badge)
        updatePlayer({ statusBadge: ` ${f.actionLabel || 'Viewing...'}` });
        setTimeout(() => updatePlayer({ statusBadge: undefined }), 5000);
        break;
      case 'interact':
        updatePlayer({ statusBadge: f.actionTarget || ' Interaksi' });
        setTimeout(() => updatePlayer({ statusBadge: undefined }), 5000);
        break;
    }
  }, [updatePlayer]);

  // ============================================================
  // Click-to-Move
  // ============================================================

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cam = camRef.current;

      // Convert screen coords to map coords
      const mapX = (e.clientX - rect.left) / cam.zoom + cam.x;
      const mapY = (e.clientY - rect.top) / cam.zoom + cam.y;

      clickTargetRef.current = { x: mapX, y: mapY };

      const p = playerRef.current;
      if (p.sittingOn) {
        updatePlayer({ sittingOn: undefined, statusBadge: undefined });
      }
    },
    [updatePlayer]
  );

  // ============================================================
  // Joystick input handler
  // ============================================================

  const handleJoystickMove = useCallback((vec: { x: number; y: number }) => {
    joystickVecRef.current = vec;
    if (vec.x !== 0 || vec.y !== 0) {
      clickTargetRef.current = null;
      const p = playerRef.current;
      if (p.sittingOn) {
        updatePlayer({ sittingOn: undefined, statusBadge: undefined });
      }
    }
  }, [updatePlayer]);

  // ============================================================
  // NPC Pathfinding (simple direct movement)
  // ============================================================

  const moveNPCToTarget = useCallback(
    (npc: NPCState, dt: number) => {
      if (!npc.targetPosition) return;

      const dx = npc.targetPosition.x - npc.position.x;
      const dy = npc.targetPosition.y - npc.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Arrived
        const zone = getZoneAtPosition(npc.position, zonesRef.current);
        updateNPC(npc.id, {
          targetPosition: null,
          isMoving: false,
          currentZone: zone,
        });

        // If Raka arrived, send arrival message
        if (npc.id === 'raka') {
          const zoneDisplay = getZoneDisplay(zone || '');
          setTimeout(() => {
            useChatStore.getState().addMessage({
              id: generateMsgId(),
              sender: 'Raka',
              senderZone: zone || '',
              senderZoneName: zoneDisplay.name,
              senderEmoji: zoneDisplay.emoji,
              text: getRakaArrivalMessage(zone || ''),
              timestamp: Date.now(),
              isNPC: true,
              isSystem: false,
              channel: 'global',
            });
          }, 500);
        }
        return;
      }

      const speed = NPC_SPEED * dt * 60;
      const nx = npc.position.x + (dx / dist) * speed;
      const ny = npc.position.y + (dy / dist) * speed;

      // Determine direction (with hysteresis to prevent flickering)
      let dir: Direction = npc.direction;
      if (Math.abs(dx) > Math.abs(dy) + 0.1) {
        dir = dx > 0 ? 'right' : 'left';
      } else if (Math.abs(dy) > Math.abs(dx) + 0.1) {
        dir = dy > 0 ? 'down' : 'up';
      }

      // Furniture Collision
      const PLAYER_RAD = 12;
      let collision = false;
      const currentFurnitureList = useGameStore.getState().furniture;
      for (const f of currentFurnitureList) {
        if (f.isCollider) {
          if (
            nx + PLAYER_RAD > f.x - f.width / 2 &&
            nx - PLAYER_RAD < f.x + f.width / 2 &&
            ny + PLAYER_RAD > f.y - f.height / 2 &&
            ny - PLAYER_RAD < f.y + f.height / 2
          ) {
            collision = true;
            break;
          }
        }
      }

      if (collision) {
        // Abort pathfinding to prevent getting stuck
        const zone = getZoneAtPosition(npc.position, zonesRef.current);
        updateNPC(npc.id, {
          targetPosition: null,
          isMoving: false,
          currentZone: zone,
        });
        return;
      }

      const zone = getZoneAtPosition({ x: nx, y: ny }, zonesRef.current);

      updateNPC(npc.id, {
        position: { x: nx, y: ny },
        direction: dir,
        isMoving: true,
        currentZone: zone,
        animFrame: (npc.animFrame + 1) % 8,
      });
    },
    [updateNPC]
  );

  // ============================================================
  // Main Game Loop
  // ============================================================

  useEffect(() => {
    if (!assetsLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let prevTime = performance.now();

    function gameLoop(timestamp: number) {
      const dt = Math.min((timestamp - prevTime) / 1000, 0.05);
      prevTime = timestamp;

      // Resize canvas
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width = w + 'px';
          canvas.style.height = h + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      }

      const p = playerRef.current;
      const cam = camRef.current;
      const currentZones = zonesRef.current;
      const currentNpcs = npcsRef.current;

      // ---- PLAYER MOVEMENT ----
      let dx = 0;
      let dy = 0;
      const keys = keysRef.current;
      const joy = joystickVecRef.current;

      // Keyboard
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      // Joystick
      if (Math.abs(joy.x) > 0.1 || Math.abs(joy.y) > 0.1) {
        dx += joy.x;
        dy += joy.y;
      }

      // Click-to-move
      const clickTarget = clickTargetRef.current;
      if (clickTarget && dx === 0 && dy === 0) {
        const cdx = clickTarget.x - p.position.x;
        const cdy = clickTarget.y - p.position.y;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cdist > 5) {
          dx = cdx / cdist;
          dy = cdy / cdist;
        } else {
          clickTargetRef.current = null;
        }
      }

      // Normalize
      const len = Math.sqrt(dx * dx + dy * dy);
      let isMoving = false;
      let newDir = p.direction;
      let newPos = { ...p.position };

      if (len > 0.1) {
        const ndx = dx / len;
        const ndy = dy / len;
        newPos = {
          x: p.position.x + ndx * PLAYER_SPEED * dt * 60,
          y: p.position.y + ndy * PLAYER_SPEED * dt * 60,
        };
        isMoving = true;

        // Determine direction (with hysteresis)
        if (Math.abs(ndx) > Math.abs(ndy) + 0.1) {
          newDir = ndx > 0 ? 'right' : 'left';
        } else if (Math.abs(ndy) > Math.abs(ndx) + 0.1) {
          newDir = ndy > 0 ? 'down' : 'up';
        }
      }

      // Clamp to map bounds (restricted to prevent walking on walls)
      const mapW = mapImgRef.current?.width || 1400;
      const mapH = mapImgRef.current?.height || 788;
      newPos.x = Math.max(50, Math.min(mapW - 50, newPos.x));
      newPos.y = Math.max(120, Math.min(mapH - 50, newPos.y));

      // Furniture Collision
      const PLAYER_RAD = 12;
      for (const f of currentFurnitureList) {
        if (f.isCollider) {
          const fMinX = f.x - f.width / 2;
          const fMaxX = f.x + f.width / 2;
          const fMinY = f.y - f.height / 2;
          const fMaxY = f.y + f.height / 2;

          if (
            newPos.x + PLAYER_RAD > fMinX &&
            newPos.x - PLAYER_RAD < fMaxX &&
            newPos.y + PLAYER_RAD > fMinY &&
            newPos.y - PLAYER_RAD < fMaxY
          ) {
            // Revert movement
            newPos = { ...p.position };
            isMoving = false;
            if (clickTargetRef.current) clickTargetRef.current = null;
            break;
          }
        }
      }

      // Zone detection (NavMesh)
      let newZone = getZoneAtPosition(newPos, currentZones);

      if (newZone === null) {
        // Prevent walking outside zones
        newPos = { ...p.position };
        newZone = p.currentZone;
        isMoving = false;
        if (clickTargetRef.current) clickTargetRef.current = null;
      }

      // Anim timer
      animTimerRef.current += dt * 1000;
      let newAnimFrame = p.animFrame;
      if (isMoving) {
        if (animTimerRef.current > ANIM_FRAME_INTERVAL) {
          newAnimFrame = (p.animFrame + 1) % 8;
          animTimerRef.current = 0;
        }
      }

      // Update player state
      if (
        isMoving !== p.isMoving ||
        newDir !== p.direction ||
        newPos.x !== p.position.x ||
        newPos.y !== p.position.y ||
        newZone !== p.currentZone ||
        newAnimFrame !== p.animFrame
      ) {
        updatePlayer({
          position: newPos,
          direction: newDir,
          isMoving,
          currentZone: newZone,
          animFrame: newAnimFrame,
        });
      }

      // ---- NEARBY FURNITURE DETECTION ----
      const currentFurniture = useGameStore.getState().furniture;
      const nearby = getNearbyFurniture(newPos, currentFurniture, 60);
      const prevNearby = useGameStore.getState().nearbyFurniture;
      if (nearby?.instanceId !== prevNearby?.instanceId) {
        setNearbyFurniture(nearby);
      }

      // ---- NPC MOVEMENT ----
      for (const npc of currentNpcs) {
        if (npc.targetPosition) {
          moveNPCToTarget(npc, dt);
        }
      }

      // ---- CAMERA ----
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const targetCamX = newPos.x - screenW / (2 * cam.zoom);
      const targetCamY = newPos.y - screenH / (2 * cam.zoom);
      cam.x += (targetCamX - cam.x) * CAMERA_LERP;
      cam.y += (targetCamY - cam.y) * CAMERA_LERP;

      // Clamp camera
      cam.x = Math.max(0, Math.min(mapW - screenW / cam.zoom, cam.x));
      cam.y = Math.max(0, Math.min(mapH - screenH / cam.zoom, cam.y));

      // ---- RENDER ----
      ctx.clearRect(0, 0, screenW, screenH);
      ctx.save();
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      // Layer 1: Map Background
      if (mapImgRef.current) {
        ctx.drawImage(mapImgRef.current, 0, 0);
      }

      // Layer 2 & 3: Dimming and borders removed as requested.

      // Layer 4: Y-sort all characters (player + NPCs)
      interface Renderable {
        y: number;
        render: () => void;
      }

      const renderables: Renderable[] = [];

      // Player renderable
      renderables.push({
        y: newPos.y,
        render: () => {
            drawCharacter(
              ctx,
              newPos,
              newDir,
              newAnimFrame,
              isMoving,
              p.isMicOn,
              p.isSpeaking,
              p.name,
              newZone,
              newZone,
              true,
              undefined,
              p.sittingOn !== undefined,
              p.statusBadge,
              p.avatar
            );
        },
      });

      // NPC renderables
      for (const npc of currentNpcs) {
        const npcCopy = { ...npc };
        renderables.push({
          y: npc.position.y,
          render: () => {
            drawCharacter(
              ctx,
              npcCopy.position,
              npcCopy.direction,
              npcCopy.animFrame,
              npcCopy.isMoving,
              false,
              npcCopy.isSpeaking,
              npcCopy.name,
              npcCopy.currentZone,
              newZone,
              false,
              npcCopy.color,
              false,
              npcCopy.statusBadge,
              npcCopy.id
            );
          },
        });
      }

      // Furniture renderables
      for (const f of currentFurnitureList) {
        if (f.assetPath) {
          const img = furnitureImagesRef.current.get(f.assetPath);
          if (img) {
            // Put rugs and stage on the absolute bottom layer so characters walk ON them
            const isFloorLayer = f.furnitureId.includes('rug') || f.furnitureId.includes('stage');
            renderables.push({
              y: isFloorLayer ? -100000 : f.y + f.height - 10,
              render: () => {
                ctx.save();
                ctx.globalAlpha = 1.0;
                ctx.translate(f.x + f.width / 2, f.y + f.height / 2);
                
                // If the image width is approximately 4x its height, it's a 4-direction spritesheet
                const isSpriteSheet = img.width >= img.height * 3.0 && img.width <= img.height * 5.0;
                
                if (isSpriteSheet) {
                  const frameWidth = img.width / 4;
                  // Map rotation to frame index (0: SE, 90: SW, 180: NW, 270: NE)
                  let frameIdx = 0;
                  if (f.rotation === 90) frameIdx = 1;
                  else if (f.rotation === 180) frameIdx = 2;
                  else if (f.rotation === 270) frameIdx = 3;
                  
                  const imgRatio = frameWidth / img.height;
                  let drawW = f.width;
                  let drawH = f.width / imgRatio;
                  
                  // If drawH is too small, fallback to f.height
                  if (drawH < f.height) {
                     drawH = f.height;
                     drawW = f.height * imgRatio;
                  }

                  ctx.drawImage(
                    img,
                    frameIdx * frameWidth, 0, frameWidth, img.height,
                    -drawW / 2, (f.height / 2) - drawH, drawW, drawH
                  );
                } else {
                  // Fallback for single-image (legacy) furniture
                  ctx.rotate((f.rotation * Math.PI) / 180);
                  
                  const imgRatio = img.width / img.height;
                  let drawW = f.width;
                  let drawH = f.width / imgRatio;
                  if (drawH < f.height) {
                     drawH = f.height;
                     drawW = f.height * imgRatio;
                  }
                  
                  // For legacy, draw centered (since we rotated)
                  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                }
                
                ctx.restore();
              },
            });
          }
        }
      }

      // Sort by Y (painter's algorithm)
      renderables.sort((a, b) => a.y - b.y);
      for (const r of renderables) {
        r.render();
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(gameLoop);
    }

    // Character drawing helper
    function drawCharacter(
      ctx: CanvasRenderingContext2D,
      pos: Position,
      dir: Direction,
      animFrame: number,
      isMoving: boolean,
      isMicOn: boolean,
      isSpeaking: boolean,
      name: string,
      charZone: string | null,
      playerZone: string | null,
      isPlayer: boolean,
      tintColor?: string,
      isSitting?: boolean,
      statusBadge?: string,
      avatarId: string = 'raka'
    ) {
      const framesMap = charFramesRef.current;
      const frames = framesMap[avatarId] || framesMap['raka'] || [];
      if (frames.length === 0) return;

      const fw = charFrameWidthRef.current;
      const fh = charFrameHeightRef.current;
      const charScale = isPlayer ? (playerRef.current.scale || 1) : 1;
      const scale = (TARGET_SPRITE_HEIGHT * charScale) / fh;
      const sw = fw * scale;
      const sh = fh * scale;

      // Get sprite frame
      const { frameIndex, flipX } = getSpriteFrame(dir, animFrame, isSitting || false, isMoving);
      const frame = frames[frameIndex];
      if (!frame) return;

      // Define direction-specific offsets (X and Y) to center the character on the shadow perfectly
      let offsetX = 0;
      let offsetY = 0;

      // Adjust these values based on where the sprite's feet naturally fall
      if (dir === 'down') {
        offsetX = 0;
        offsetY = sh * 0.12; 
      } else if (dir === 'up') {
        offsetX = 0;
        offsetY = sh * 0.12;
      } else if (dir === 'left') {
        offsetX = sw * 0.05; // shift right slightly
        offsetY = sh * 0.12;
      } else if (dir === 'right') {
        offsetX = -sw * 0.05; // shift left slightly
        offsetY = sh * 0.12;
      }

      const drawX = pos.x - sw / 2 + offsetX;
      const drawY = pos.y - sh + offsetY;

      // Draw shadow exactly at pos.y
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, sw * 0.35, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Voice ring (if speaking and same zone)
      if (isSpeaking && charZone === playerZone) {
        const ringTime = Date.now() / 500;
        const ringScale = 1 + Math.sin(ringTime) * 0.15;
        ctx.save();
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4 + Math.sin(ringTime) * 0.2;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y - sh / 2 + 10, sw * 0.5 * ringScale, sh * 0.45 * ringScale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Mic ring for player
      if (isPlayer && isMicOn) {
        ctx.save();
        const micRingTime = Date.now() / 400;
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y - sh / 2 + 10, sw * 0.45, sh * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw sprite
      ctx.save();
      if (flipX) {
        ctx.translate(pos.x + offsetX, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(frame.canvas, -sw / 2, 0, sw, sh);
      } else {
        ctx.drawImage(frame.canvas, drawX, drawY, sw, sh);
      }

      ctx.restore();

      // Nameplate
      ctx.save();
      ctx.font = '700 10px "Silkscreen", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      const nameY = drawY - 8;

      // Background pill for name
      const nameWidth = ctx.measureText(name).width + 12;
      ctx.fillStyle = isPlayer ? 'rgba(35, 122, 87, 0.85)' : 'rgba(27, 32, 30, 0.85)';
      ctx.beginPath();
      const pillX = pos.x - nameWidth / 2;
      const pillH = 16;
      const pillY = nameY - pillH + 2;
      const pillR = 4;
      ctx.moveTo(pillX + pillR, pillY);
      ctx.lineTo(pillX + nameWidth - pillR, pillY);
      ctx.quadraticCurveTo(pillX + nameWidth, pillY, pillX + nameWidth, pillY + pillR);
      ctx.lineTo(pillX + nameWidth, pillY + pillH - pillR);
      ctx.quadraticCurveTo(pillX + nameWidth, pillY + pillH, pillX + nameWidth - pillR, pillY + pillH);
      ctx.lineTo(pillX + pillR, pillY + pillH);
      ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR);
      ctx.lineTo(pillX, pillY + pillR);
      ctx.quadraticCurveTo(pillX, pillY, pillX + pillR, pillY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#F7F9F8';
      ctx.fillText(name, pos.x, nameY + 1);
      ctx.restore();

      // Emote / Status Badge
      if (statusBadge) {
        ctx.save();
        ctx.font = '24px "Silkscreen", monospace'; // large emoji/text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // Bounce animation
        const bounce = Math.sin(Date.now() / 150) * 4;
        const emoteY = pillY - 4 + bounce;
        
        // Emote Shadow/Outline for better visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(statusBadge, pos.x, emoteY + 2);
        
        ctx.fillStyle = '#FFF';
        ctx.fillText(statusBadge, pos.x, emoteY);
        ctx.restore();
      }

      // "Beda Ruangan" badge if different zone
      if (!isPlayer && charZone !== playerZone) {
        ctx.save();
        ctx.font = '9px "Silkscreen", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
        ctx.fillText(' Beda Ruangan', pos.x, drawY - 22 - (statusBadge ? 28 : 0));
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [assetsLoaded, updatePlayer, moveNPCToTarget, getSpriteFrame, updateNPC]);

  // ============================================================
  // Mouse wheel zoom
  // ============================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      cam.zoom = Math.max(0.5, Math.min(3, cam.zoom + zoomDelta));
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // ============================================================
  // Loading screen
  // ============================================================

  if (!assetsLoaded) {
    return (
      <div
        style={{
          width: '100%',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#121514',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #237A57',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span
          style={{
            color: '#9CA3AF',
            fontFamily: "'Silkscreen', monospace",
            fontSize: 14,
          }}
        >
          Memuat TemuSpace HQ...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: '#121514',
        touchAction: 'none',
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      />

      {/* HUD Overlays */}
      <TopLeftHUD />
      <TopRightHUD />
      <ChatDrawer />
      <BottomControls />

      {/* Interaction Prompt */}
      {nearbyFurniture && nearbyFurniture.actionType !== 'none' && (
        <div className="desktop-only" style={{
          position: 'absolute',
          bottom: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          background: 'rgba(18, 21, 20, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
          animation: 'fadeIn 0.2s ease-out',
          pointerEvents: 'none',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 6,
            background: '#3B82F6',
            color: '#121514',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: 'var(--font-ui)',
          }}>
            E
          </span>
          <span style={{
            color: '#F7F9F8',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
          }}>
            {nearbyFurniture.actionLabel || 'Interaksi'}
          </span>
        </div>
      )}

      {/* Mobile Controls */}
      <MobileJoystick onMove={handleJoystickMove} />
      <MobileActions />

      {/* Mobile Bottom Navbar */}
      <BottomNavbar />

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

