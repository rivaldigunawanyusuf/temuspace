/**
 * TopRightHUD.tsx - Chat Toggle + Online Members Pill
 */
import { useGameStore } from '../../stores/useGameStore';
import { Radio } from 'lucide-react';

export default function TopRightHUD() {
  const onlineCount = useGameStore((s) => s.onlineCount);

  return (
    <div style={{
      position: 'absolute',
      top: 'var(--hud-padding)',
      right: 'var(--hud-padding)',
      zIndex: 'var(--z-hud)',
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start',
      pointerEvents: 'auto',
    }}>
      {/* Online Members */}
      <div className="hud-pill" style={{ gap: 6 }}>
        <Radio size={12} color="#34D399" />
        <span style={{ fontSize: 11, fontWeight: 600 }}>
          {onlineCount} online
        </span>
      </div>
    </div>
  );
}
