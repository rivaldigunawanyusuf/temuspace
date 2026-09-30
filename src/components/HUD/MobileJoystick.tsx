/**
 * MobileJoystick.tsx - Virtual Analog Joystick
 * 
 * Touch-based joystick in bottom-left corner (above bottom navbar).
 * Uses touch events with atan2 for direction calculation.
 * Design: Translucent circle per design.md specs.
 */
import { useRef, useCallback, useEffect, useState } from 'react';

interface MobileJoystickProps {
  onMove: (vec: { x: number; y: number }) => void;
}

const JOYSTICK_SIZE = 112; // w-28 = 7rem = 112px
const KNOB_SIZE = 44;
const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

export default function MobileJoystick({ onMove }: MobileJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activeTouchRef = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      activeTouchRef.current = touch.identifier;
      setIsActive(true);
      processTouch(touch);
    },
    []
  );

  const processTouch = useCallback(
    (touch: Touch) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > MAX_DISTANCE) {
        dx = (dx / dist) * MAX_DISTANCE;
        dy = (dy / dist) * MAX_DISTANCE;
      }

      setKnobPos({ x: dx, y: dy });
      onMove({
        x: dx / MAX_DISTANCE,
        y: dy / MAX_DISTANCE,
      });
    },
    [onMove]
  );

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (activeTouchRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchRef.current) {
          e.preventDefault();
          processTouch(e.changedTouches[i]);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (activeTouchRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchRef.current) {
          activeTouchRef.current = null;
          setIsActive(false);
          setKnobPos({ x: 0, y: 0 });
          onMove({ x: 0, y: 0 });
          break;
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove, processTouch]);

  return (
    <>
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        className="mobile-only"
        style={{
          position: 'absolute',
          bottom: 120, // moved up to not overlap with BottomNavbar
          left: 16,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          background: isActive
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(0, 0, 0, 0.3)',
          border: `1.5px solid ${isActive ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
          zIndex: 'var(--z-joystick)',
          touchAction: 'none',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        {/* Knob */}
        <div
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: '50%',
            background: isActive
              ? 'rgba(52, 211, 153, 0.6)'
              : 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isActive ? 'none' : 'transform 0.2s ease-out',
            boxShadow: isActive ? '0 0 10px rgba(52, 211, 153, 0.3)' : 'none',
          }}
        />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
