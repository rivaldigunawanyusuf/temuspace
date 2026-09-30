/**
 * BottomControls.tsx - Desktop floating control dock
 * Centered at bottom: Mic, Speaker, Emote, Interact, Exit
 */
import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { Mic, MicOff, Volume2, VolumeX, Smile, MessageSquare, LogOut, Plus, Minus } from 'lucide-react';

export default function BottomControls() {
  const player = useGameStore((s) => s.player);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const [showEmotes, setShowEmotes] = useState(false);
  const [showChats, setShowChats] = useState(false);

  const QUICK_CHATS = ['Hai!', 'Siap!', 'Mantap!', 'BRB', 'OTW', 'Mikir'];
  const EMOTES = ['👍', '❤️', '😂', '👏', '🎉', '🔥'];

  const toggleMic = () => {
    updatePlayer({ isMicOn: !player.isMicOn });
  };

  const toggleSpeaker = () => {
    updatePlayer({ isSpeakerOn: !player.isSpeakerOn });
  };

  const triggerEmote = (emoji: string) => {
    updatePlayer({ statusBadge: emoji });
    setShowEmotes(false);
    setTimeout(() => {
      // Only clear if it's still this emote
      const currentState = useGameStore.getState();
      if (currentState.player.statusBadge === emoji) {
        currentState.updatePlayer({ statusBadge: undefined });
      }
    }, 3000);
  };

  return (
    <div
      className="desktop-only"
      style={{
        position: 'absolute',
        bottom: 120, // increased to not overlap with BottomNavbar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-hud)',
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        background: 'var(--bg-elevated)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-pill)',

        boxShadow: 'var(--shadow-hud)',
        pointerEvents: 'auto',
      }}
    >
      {/* Mic Toggle */}
      <ControlButton
        icon={player.isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        label={player.isMicOn ? 'Mic On' : 'Mic Off'}
        isActive={player.isMicOn}
        onClick={toggleMic}
        shortcut="M"
      />

      {/* Speaker */}
      <ControlButton
        icon={player.isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        label={player.isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
        isActive={player.isSpeakerOn}
        onClick={toggleSpeaker}
      />

      {/* Emote */}
      <div style={{ position: 'relative' }}>
        <ControlButton 
          icon={<Smile size={18} />} 
          label="Emote" 
          isActive={showEmotes}
          onClick={() => { setShowEmotes(!showEmotes); setShowChats(false); }} 
        />
        
        {showEmotes && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 12,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 8,
            display: 'flex',
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
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Chat */}
      <div style={{ position: 'relative' }}>
        <ControlButton 
          icon={<MessageSquare size={18} />} 
          label="Chat" 
          isActive={showChats}
          onClick={() => { setShowChats(!showChats); setShowEmotes(false); }} 
        />
        
        {showChats && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 12,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: 'var(--shadow-lg)',
            width: 120,
          }}>
            {QUICK_CHATS.map(msg => (
              <button
                key={msg}
                onClick={() => { triggerEmote(msg); setShowChats(false); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                  textAlign: 'left',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {msg}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scale Down */}
      <ControlButton icon={<Minus size={18} />} label="Mengecil (-)" shortcut="-" onClick={() => updatePlayer({ scale: Math.max(0.4, (player.scale || 1) - 0.2) })} />
      
      {/* Scale Up */}
      <ControlButton icon={<Plus size={18} />} label="Membesar (+)" shortcut="+" onClick={() => updatePlayer({ scale: Math.min(3.0, (player.scale || 1) + 0.2) })} />

      {/* Exit Room */}
      <ControlButton icon={<LogOut size={18} />} label="Keluar" isDanger onClick={() => useGameStore.getState().setActiveTab('homepage')} />

      <style>{`
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function ControlButton({
  icon,
  label,
  isActive,
  isDanger,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDanger?: boolean;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '8px 14px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        background: isActive
          ? 'var(--accent-green)'
          : isDanger
            ? 'rgba(239, 68, 68, 0.1)'
            : 'var(--bg-card)',
        color: isActive ? '#FFFFFF' : isDanger ? '#EF4444' : 'var(--text-primary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
        transition: 'all 0.2s',
        boxShadow: isActive ? 'var(--shadow-glow-green)' : 'none',
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#FFFFFF' : isDanger ? '#EF4444' : 'var(--text-muted)' }}>
        {label}
      </span>
    </button>
  );
}
