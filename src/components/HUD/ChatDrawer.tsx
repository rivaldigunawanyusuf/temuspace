/**
 * ChatDrawer.tsx - Global Chat & Room Chat with tabs
 * 
 * Features:
 * - Two tabs:  Global Chat &  Room Chat
 * - Location badge on every Global Chat message
 * - "Panggil Raka" quick action button
 * - NPC Raka interactive response system
 */
import { useState, useRef, useEffect } from 'react';
import { useGameStore, getZoneInfo } from '../../stores/useGameStore';
import {
  useChatStore,
  getZoneDisplay,
  isCallingRaka,
  getRakaCallResponse,
  generateMsgId,
  type ChatMessage,
} from '../../stores/useChatStore';
import { Globe, Home, X, Hand, Megaphone, ArrowUp, MapPin, MessageCircle, Search } from 'lucide-react';

export default function ChatDrawer() {
  const [inputText, setInputText] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const player = useGameStore((s) => s.player);
  const zones = useGameStore((s) => s.zones);
  const setChatOpen = useGameStore((s) => s.setChatOpen);
  const isChatOpen = useGameStore((s) => s.isChatOpen);
  const toggleChat = useGameStore((s) => s.toggleChat);
  const updateNPC = useGameStore((s) => s.updateNPC);
  const npcs = useGameStore((s) => s.npcs);

  const messages = useChatStore((s) => s.messages);
  const activeChannel = useChatStore((s) => s.activeChannel);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const addMessage = useChatStore((s) => s.addMessage);
  const unreadGlobal = useChatStore((s) => s.unreadGlobal);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages by channel and search
  const filteredMessages = messages.filter((m) => {
    const channelMatch = activeChannel === 'global' ? m.channel === 'global' : (m.channel === 'room' && m.senderZone === player.currentZone);
    if (!channelMatch) return false;
    if (!chatSearch.trim()) return true;
    return m.text.toLowerCase().includes(chatSearch.toLowerCase()) || m.sender.toLowerCase().includes(chatSearch.toLowerCase());
  });

  const playerZoneInfo = getZoneInfo(player.currentZone, zones);

  // Send message
  const sendMessage = () => {
    if (!inputText.trim()) return;

    const zoneDisplay = getZoneDisplay(player.currentZone || '');
    const msg: ChatMessage = {
      id: generateMsgId(),
      sender: player.name,
      senderZone: player.currentZone || '',
      senderZoneName: zoneDisplay.name,
      senderEmoji: zoneDisplay.emoji,
      text: inputText.trim(),
      timestamp: Date.now(),
      isNPC: false,
      isSystem: false,
      channel: activeChannel,
    };

    addMessage(msg);

    // Check if calling Raka
    if (activeChannel === 'global' && isCallingRaka(inputText)) {
      triggerRakaResponse();
    }

    setInputText('');
  };

  // Trigger Raka response
  const triggerRakaResponse = () => {
    const raka = npcs.find((n) => n.id === 'raka');
    if (!raka) return;

    const rakaZoneDisplay = getZoneDisplay(raka.currentZone || '');
    const targetZone = player.currentZone || '';

    // Raka replies
    setTimeout(() => {
      addMessage({
        id: generateMsgId(),
        sender: 'Raka',
        senderZone: raka.currentZone || '',
        senderZoneName: rakaZoneDisplay.name,
        senderEmoji: rakaZoneDisplay.emoji,
        text: getRakaCallResponse(targetZone),
        timestamp: Date.now(),
        isNPC: true,
        isSystem: false,
        channel: 'global',
      });

      // Move Raka to player's zone
      const targetZoneDef = getZoneInfo(targetZone, zones);
      if (targetZoneDef) {
        const targetPos = {
          x: targetZoneDef.bounds.x + targetZoneDef.bounds.w / 2 + (Math.random() - 0.5) * 40,
          y: targetZoneDef.bounds.y + targetZoneDef.bounds.h / 2 + (Math.random() - 0.5) * 40,
        };
        updateNPC('raka', {
          targetPosition: targetPos,
          isMoving: true,
        });
      }
    }, 800);
  };

  // Quick call Raka button
  const callRaka = () => {
    const zoneDisplay = getZoneDisplay(player.currentZone || '');
    addMessage({
      id: generateMsgId(),
      sender: player.name,
      senderZone: player.currentZone || '',
      senderZoneName: zoneDisplay.name,
      senderEmoji: zoneDisplay.emoji,
      text: ' Panggil Raka ke Ruangan',
      timestamp: Date.now(),
      isNPC: false,
      isSystem: false,
      channel: 'global',
    });
    triggerRakaResponse();
  };


  if (!isChatOpen) {
    return (
      <button
        className="hud-pill animate-slide-up chat-toggle-btn"
        onClick={toggleChat}
        style={{
          position: 'absolute',
          zIndex: 'var(--z-drawer)',
          cursor: 'pointer',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <MessageCircle size={20} color="var(--text-primary)" />
          {unreadGlobal > 0 && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#EF4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {unreadGlobal}
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Chat</span>
      </button>
    );
  }

  return (
    <div
      className="animate-slide-up chat-drawer-panel"
      style={{
        position: 'absolute',
        zIndex: 'var(--z-drawer)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-elevated)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-hud)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Tab buttons */}
          {(['global', 'room'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeChannel === ch
                  ? 'var(--accent-primary)'
                  : 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {ch === 'global' ? <><Globe size={12} /> Global</> : <><Home size={12} /> Room</>}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => {
              if (showSearch) {
                setChatSearch('');
              }
              setShowSearch(!showSearch);
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: showSearch ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            title="Cari pesan"
          >
            <Search size={13} />
          </button>
          <button
            onClick={() => setChatOpen(false)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      {showSearch && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Cari teks atau pengirim..."
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                outline: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
            {chatSearch && (
              <button
                onClick={() => setChatSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {chatSearch && filteredMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
            Tidak ada pesan yang cocok dengan "{chatSearch}"
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender === player.name} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (Global only) */}
      {activeChannel === 'global' && (
        <div style={{
          padding: '4px 12px 6px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
        }}>
          <button
            className="hud-btn"
            onClick={callRaka}
            style={{
              fontSize: 11,
              padding: '5px 10px',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Hand size={12} /> Panggil Raka ke Ruangan</span>
          </button>
          <button
            className="hud-btn"
            style={{
              fontSize: 11,
              padding: '5px 10px',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Megaphone size={12} /> Sapa Semua</span>
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '8px 12px 12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 8,
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={
            activeChannel === 'global'
              ? 'Kirim ke semua orang...'
              : `Chat di ${playerZoneInfo?.name || 'ruangan ini'}...`
          }
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          className="hud-btn hud-btn--accent"
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Message Bubble
// ============================================================

function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  if (msg.isSystem) {
    return (
      <div style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(35, 122, 87, 0.1)',
        border: '1px solid rgba(35, 122, 87, 0.15)',
        fontSize: 12,
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        {msg.text}
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Sender info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
        paddingLeft: isOwn ? 0 : 4,
        paddingRight: isOwn ? 4 : 0,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: msg.isNPC ? '#E67E22' : 'var(--text-primary)',
        }}>
          {msg.sender}
        </span>
        {msg.channel === 'global' && (
          <span className="badge badge--zone" style={{ fontSize: 8 }}>
            {msg.senderEmoji} {msg.senderZoneName}
          </span>
        )}
      </div>

      {/* Message */}
      <div style={{
        padding: '8px 12px',
        borderRadius: isOwn
          ? '14px 14px 4px 14px'
          : '14px 14px 14px 4px',
        background: isOwn
          ? 'var(--accent-primary)'
          : msg.isNPC
            ? 'rgba(230, 126, 34, 0.15)'
            : 'var(--bg-card)',
        border: `1px solid ${
          isOwn
            ? 'transparent'
            : msg.isNPC
              ? 'rgba(230, 126, 34, 0.2)'
              : 'var(--border-subtle)'
        }`,
        maxWidth: '85%',
        fontSize: 13,
        lineHeight: 1.5,
        wordBreak: 'break-word' as const,
      }}>
        {msg.text}
      </div>

      <span style={{
        fontSize: 9,
        color: 'var(--text-muted)',
        marginTop: 2,
        paddingLeft: isOwn ? 0 : 4,
        paddingRight: isOwn ? 4 : 0,
      }}>
        {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}
