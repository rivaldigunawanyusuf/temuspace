/**
 * MobileActions.tsx - Mobile Action + Mic buttons
 * Bottom-right, above bottom navbar
 */
import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { Mic, MicOff, Smile, MessageSquare, Hand } from 'lucide-react';

export default function MobileActions() {
  const player = useGameStore((s) => s.player);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const nearbyFurniture = useGameStore((s) => s.nearbyFurniture);
  const [showEmotes, setShowEmotes] = useState(false);
  const [showChats, setShowChats] = useState(false);

  const QUICK_CHATS = ['Hai!', 'Siap!', 'Mantap!', 'BRB', 'OTW', 'Mikir'];
  const EMOTES = ['👍', '❤️', '😂', '👏', '🎉', '🔥'];

  const triggerEmote = (emoji: string) => {
    updatePlayer({ statusBadge: emoji });
    setShowEmotes(false);
    setTimeout(() => {
      const currentState = useGameStore.getState();
      if (currentState.player.statusBadge === emoji) {
        currentState.updatePlayer({ statusBadge: undefined });
      }
    }, 3000);
  };

  const handleAction = () => {
    if (!nearbyFurniture || nearbyFurniture.actionType === 'none') return;
    const f = nearbyFurniture;
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
          const tab = f.actionTarget.replace('/', '') as any;
          useGameStore.getState().setActiveTab(tab || 'resources');
        }
        break;
      case 'emote':
        updatePlayer({ statusBadge: f.actionTarget || '' });
        setTimeout(() => updatePlayer({ statusBadge: undefined }), 8000);
        break;
      case 'modal':
        updatePlayer({ statusBadge: ` ${f.actionLabel || 'Viewing...'}` });
        setTimeout(() => updatePlayer({ statusBadge: undefined }), 5000);
        break;
      case 'interact':
        updatePlayer({ statusBadge: f.actionTarget || ' Interaksi' });
        setTimeout(() => updatePlayer({ statusBadge: undefined }), 5000);
        break;
    }
  };

  return (
    <>
      <div
        className="mobile-only"
        style={{
          position: 'absolute',
          bottom: 164, // Moved up to clear RoleSwitcher
          right: 16,
          zIndex: 'var(--z-joystick)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'auto',
        }}
      >
        {/* Action Button */}
        {nearbyFurniture && nearbyFurniture.actionType !== 'none' && (
          <button
            onClick={handleAction}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.8)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              color: '#FFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Hand size={22} />
          </button>
        )}

        {/* Quick Chat Button */}
        <div style={{ position: 'relative' }}>
          {showChats && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 12,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-xl)',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: 'var(--shadow-lg)',
            }}>
              {QUICK_CHATS.map(msg => (
                <button
                  key={msg}
                  onClick={() => { triggerEmote(msg); setShowChats(false); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#FFF',
                    cursor: 'pointer',
                    padding: 8,
                    borderRadius: 8,
                    textAlign: 'right',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {msg}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { setShowChats(!showChats); setShowEmotes(false); }}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: showChats ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              color: '#FFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none',
              marginBottom: 10
            }}
          >
            <MessageSquare size={22} />
          </button>
        </div>

        {/* Emote Button */}
        <div style={{ position: 'relative' }}>
          {showEmotes && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 12,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-xl)',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: 'var(--shadow-lg)',
            }}>
              {EMOTES.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { triggerEmote(emoji); setShowEmotes(false); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 20,
                    color: '#FFF',
                    cursor: 'pointer',
                    padding: 8,
                    borderRadius: 8,
                    textAlign: 'right'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { setShowEmotes(!showEmotes); setShowChats(false); }}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: showEmotes ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              color: '#FFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none',
            }}
          >
            <Smile size={22} />
          </button>
        </div>

        {/* Mic Button */}
        <button
          onClick={() => updatePlayer({ isMicOn: !player.isMicOn })}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: player.isMicOn
              ? 'rgba(35, 122, 87, 0.5)'
              : 'rgba(0, 0, 0, 0.4)',
            border: `1.5px solid ${
              player.isMicOn
                ? 'rgba(52, 211, 153, 0.4)'
                : 'rgba(255, 255, 255, 0.15)'
            }`,
            color: player.isMicOn ? '#34D399' : '#FFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            boxShadow: player.isMicOn ? '0 0 12px rgba(52, 211, 153, 0.3)' : 'none',
          }}
        >
          {player.isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
