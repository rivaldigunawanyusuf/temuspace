/**
 * TopLeftHUD.tsx - Brand mark + Room Location Pill
 * Shows current zone, lock icon for private zones, people count
 */
import { useGameStore, getZoneInfo } from '../../stores/useGameStore';
import { Lock, Unlock, Users, Hexagon, Sparkle } from 'lucide-react';

export default function TopLeftHUD() {
  const player = useGameStore((s) => s.player);
  const zones = useGameStore((s) => s.zones);
  const npcs = useGameStore((s) => s.npcs);
  const updatePlayer = useGameStore((s) => s.updatePlayer);

  const currentZone = getZoneInfo(player.currentZone, zones);
  const peopleInZone = npcs.filter((n) => n.currentZone === player.currentZone).length + 1;

  return (
    <div style={{
      position: 'absolute',
      top: 'var(--hud-padding)',
      left: 'var(--hud-padding)',
      zIndex: 'var(--z-hud)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'auto',
    }}>
      {/* Brand */}
      <div className="hud-pill" style={{ gap: 8, padding: '8px 14px' }}>

        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>
          TemuSpace
        </span>
      </div>

      {/* Room Location Pill */}
      {currentZone && (
        <div className="hud-pill" style={{
          gap: 6,
          background: currentZone.isPrivate
            ? 'rgba(35, 122, 87, 0.15)'
            : 'var(--bg-elevated)',
          borderColor: currentZone.isPrivate
            ? 'rgba(35, 122, 87, 0.3)'
            : 'var(--border-subtle)',
        }}>
          {currentZone.isPrivate
            ? <Lock size={12} color={currentZone.color} />
            : <Unlock size={12} color={currentZone.color} />
          }
          <span className="pixel-text" style={{
            fontSize: 11,
            color: currentZone.color,
            fontWeight: 700,
          }}>
            {currentZone.name}
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            color: 'var(--text-muted)',
          }}>
            <Users size={10} />
            {peopleInZone}
          </span>
        </div>
      )}

      {/* Character Selector */}
      <div className="hud-pill mobile-hidden" style={{ padding: '4px 8px', gap: 6, display: 'flex' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Avatar:</span>
        <select
          value={player.avatar || 'raka'}
          onChange={(e) => updatePlayer({ avatar: e.target.value })}
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 4,
            fontSize: 11,
            padding: '2px 4px',
            outline: 'none',
          }}
        >
          <option value="raka">Raka (Cowok)</option>

          <option value="nina">Nina (Cewek Baru)</option>
        </select>
      </div>
      
      <style>{`
        @media (max-width: 767px) {
          .mobile-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
