/**
 * Profile.tsx - Instagram-Style Profile (Member Tab 5)
 * 
 * Features:
 * - Stats: posts, followers, following
 * - Tabs: My Posts, Collab Posts, Saved Items
 * - Settings modal (edit profile & avatar)
 */
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePostStore } from '../../stores/usePostStore';
import {
  Settings, Grid3X3, Users, Bookmark, BookmarkCheck, Edit3, X, Save, Camera, LogOut,
  ArrowBigUp, MessageCircle, Send, SmilePlus, ThumbsUp, Heart, Lightbulb, PartyPopper,
  Search, RotateCcw
} from 'lucide-react';

const REACTION_ICONS: Record<string, React.ReactNode> = {
  'like': <ThumbsUp size={16} fill="currentColor" strokeWidth={2} />,
  'love': <Heart size={16} fill="currentColor" strokeWidth={2} />,
  'insight': <Lightbulb size={16} fill="currentColor" strokeWidth={2} />,
  'celebrate': <PartyPopper size={16} fill="currentColor" strokeWidth={2} />
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}j`;
  return `${Math.floor(diff / 86400000)}h`;
}

const AVATAR_OPTIONS = ['👨‍💻', '👩‍💻', '🚀', '☕️', '💡', '🔥', '🤓', '😎', '🎨', '🎧', '🎮', '🪴'];

export default function Profile() {
  const { t } = useTranslation();
  const { currentUser, updateProfile, logout } = useAuthStore();
  const { posts, toggleUpvote, addComment, getPostComments } = usePostStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'collabs' | 'saved'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'media' | 'text'>('all');
  const [networkSearch, setNetworkSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showNetworkModal, setShowNetworkModal] = useState<'followers' | 'following' | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [hoveredReactionPost, setHoveredReactionPost] = useState<string | null>(null);
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());

  if (!currentUser) return null;

  const myPosts = posts.filter((p) => p.authorId === currentUser.id || p.collabAuthorId === currentUser.id);
  const collabPosts = posts.filter((p) =>
    p.collabAuthorId && (p.authorId === currentUser.id || p.collabAuthorId === currentUser.id)
  );
  const savedPosts = posts.filter((p) => p.saved);

  const rawPosts = activeTab === 'posts' ? myPosts : activeTab === 'collabs' ? collabPosts : savedPosts;
  const filteredPosts = rawPosts.filter((p) => {
    const matchesSearch = !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesType = postTypeFilter === 'all' ||
      (postTypeFilter === 'media' ? !!p.imageUrl : !p.imageUrl);
    return matchesSearch && matchesType;
  });

  const handleSaveSettings = () => {
    updateProfile({
      name: editName,
      bio: editBio,
      avatar: editAvatar,
    });
    setShowSettings(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 16px 0' }}>
      {/* Profile Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingTop: 8,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
          @{currentUser.username}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)',
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: '#FEE2E2',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-pill)',
              color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Avatar & Info */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 28, alignItems: 'center',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-3xl)', padding: 24, boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: 'var(--radius-full)',
          background: 'var(--bg-primary)',
          border: '4px solid var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, flexShrink: 0,
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}>
          {currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:image') ? (
            <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            currentUser.avatar
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {currentUser.name}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            {currentUser.bio}
          </p>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, fontSize: 14, color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>{posts.filter(p => p.authorId === currentUser.id || p.collabAuthorId === currentUser.id).length}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Posts</span>
            </div>
            <div 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowNetworkModal('followers')}
            >
              <strong style={{ fontSize: 16 }}>{currentUser.stats.followers}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Followers</span>
            </div>
            <div 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowNetworkModal('following')}
            >
              <strong style={{ fontSize: 16 }}>{currentUser.stats.following}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 20,
      }}>
        {([
          { key: 'posts', icon: <Grid3X3 size={18} />, label: 'Postingan' },
          { key: 'collabs', icon: <Users size={18} />, label: 'Collab' },
          { key: 'saved', icon: <Bookmark size={18} />, label: 'Tersimpan' },
        ] as const).map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 0',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === key ? 'var(--text-primary)' : 'transparent'}`,
              color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'posts' ? 'Cari judul, topik, atau isi postingan...' :
              activeTab === 'collabs' ? 'Cari postingan kolaborasi...' :
              'Cari postingan tersimpan...'
            }
            style={{
              width: '100%',
              padding: '10px 36px 10px 38px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              boxShadow: 'var(--shadow-sm)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
              }}
              title="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type Filter Chips */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'media', label: '📸 Foto' },
            { key: 'text', label: '📝 Teks' },
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setPostTypeFilter(type.key as any)}
              style={{
                padding: '7px 12px',
                background: postTypeFilter === type.key ? 'var(--accent-green)' : 'var(--bg-elevated)',
                border: `1px solid ${postTypeFilter === type.key ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-pill)',
                color: postTypeFilter === type.key ? '#FFF' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: postTypeFilter === type.key ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {type.label}
            </button>
          ))}

          {(searchQuery || postTypeFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setPostTypeFilter('all'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Post Grid or Empty State */}
      {filteredPosts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'var(--bg-elevated)',
          border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-3xl)',
          color: 'var(--text-muted)',
          marginBottom: 32,
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: 'var(--text-muted)',
          }}>
            <Grid3X3 size={22} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Tidak ada postingan yang sesuai
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 340, margin: '0 auto 16px', lineHeight: 1.5 }}>
            {searchQuery || postTypeFilter !== 'all'
              ? 'Coba ganti kata kunci pencarian atau ubah filter tipe postingan.'
              : activeTab === 'posts' ? 'Anda belum memiliki postingan.'
              : activeTab === 'collabs' ? 'Belum ada postingan kolaborasi.'
              : 'Belum ada item tersimpan.'}
          </p>
          {(searchQuery || postTypeFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setPostTypeFilter('all'); }}
              style={{
                padding: '8px 18px',
                background: 'var(--accent-green)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Filter & Pencarian
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              style={{
                aspectRatio: '1',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              {post.imageUrl ? (
                 <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                 <div style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
                   <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</div>
                   <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>{post.content}</div>
                 </div>
              )}
              
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '12px 16px',
                background: post.imageUrl ? 'linear-gradient(transparent, rgba(0,0,0,0.8))' : 'var(--bg-elevated)',
                color: post.imageUrl ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 12,
                fontSize: 12, fontWeight: 700,
                borderTop: post.imageUrl ? 'none' : '1px solid var(--border-subtle)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>▲ {post.upvotes}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>💬 {post.commentCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Detail Modal (Instagram-style) */}
      {selectedPost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(248, 246, 240, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 600, padding: '16px',
          animation: 'fade-in 0.2s ease-out'
        }} onClick={() => setSelectedPost(null)}>
          <div
            style={{
              background: 'var(--bg-card)',
              width: '100%', maxWidth: 500, maxHeight: '80vh',
              borderRadius: 'var(--radius-3xl)',
              boxShadow: 'var(--shadow-floating)',
              display: 'flex', flexDirection: 'column',
              animation: 'slide-up 0.3s ease-out',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden' }}>
                  {selectedPost.authorAvatar.startsWith('http') ? (
                    <img src={selectedPost.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    selectedPost.authorAvatar
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedPost.authorName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(selectedPost.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ background: 'var(--bg-elevated)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: 'var(--text-primary)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{selectedPost.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{selectedPost.content}</p>
              
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {selectedPost.tags.map((tag: string) => (
                    <span key={tag} style={{ padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>#{tag}</span>
                  ))}
                </div>
              )}

              {selectedPost.imageUrl && (
                <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                  <img src={selectedPost.imageUrl} alt="Post Attachment" style={{ width: '100%', display: 'block' }} />
                </div>
              )}
            </div>

            {/* Interactive Footer & Comments */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
              {/* Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Upvote */}
                  <button
                    onClick={() => {
                      toggleUpvote(selectedPost.id);
                      setSelectedPost({ ...selectedPost, upvoted: !selectedPost.upvoted, upvotes: selectedPost.upvoted ? selectedPost.upvotes - 1 : selectedPost.upvotes + 1 });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px',
                      background: selectedPost.upvoted ? 'rgba(35,122,87,0.1)' : 'var(--bg-primary)',
                      border: `1px solid ${selectedPost.upvoted ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-pill)',
                      color: selectedPost.upvoted ? 'var(--accent-green)' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ArrowBigUp size={18} fill={selectedPost.upvoted ? 'var(--accent-green)' : 'none'} strokeWidth={selectedPost.upvoted ? 2 : 1.5} />
                    {selectedPost.upvotes}
                  </button>

                  <div 
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={() => setHoveredReactionPost(selectedPost.id)}
                    onMouseLeave={() => setHoveredReactionPost(null)}
                  >
                    {/* Reactions */}
                    <button
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px',
                        background: 'none', border: 'none',
                        color: selectedPost.reactions.some((r: any) => r.reacted) ? 'var(--accent-green)' : 'var(--text-muted)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {selectedPost.reactions.find((r: any) => r.reacted) ? (
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          {REACTION_ICONS[selectedPost.reactions.find((r: any) => r.reacted)!.type] || <ThumbsUp size={16} />}
                        </span>
                      ) : (
                        <SmilePlus size={18} />
                      )}
                      <span>Reaksi</span>
                    </button>
                    
                    {/* Reactions Popover */}
                    {hoveredReactionPost === selectedPost.id && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: 0, paddingBottom: 8, zIndex: 10
                      }}>
                        <div style={{
                          display: 'flex', gap: 4, background: 'var(--bg-primary)',
                          padding: '6px 8px', borderRadius: 'var(--radius-full)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)',
                        }}>
                          {['like', 'love', 'insight', 'celebrate'].map(type => (
                            <button
                              key={type}
                              style={{
                                width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-secondary)',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.2) translateY(-4px)';
                                e.currentTarget.style.color = 'var(--accent-green)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                            >
                              {REACTION_ICONS[type]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reaction Summary display */}
                    {selectedPost.reactions.reduce((sum: number, r: any) => sum + r.count, 0) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', marginLeft: 4 }}>
                          {selectedPost.reactions.filter((r: any) => r.count > 0).slice(0, 3).map((r: any, idx: number) => (
                            <span key={r.type} style={{ marginLeft: -4, background: 'var(--bg-primary)', borderRadius: '50%', padding: 2, display: 'flex' }}>
                              {REACTION_ICONS[r.type]}
                            </span>
                          ))}
                        </div>
                        {selectedPost.reactions.reduce((sum: number, r: any) => sum + r.count, 0)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Comments count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                    <MessageCircle size={18} />
                    <span>{selectedPost.commentCount}</span>
                  </div>

                  {/* Save */}
                  <button
                    onClick={() => {
                      // We don't toggleSave directly since the function in usePostStore updates global state, we just need local state sync too
                      setSelectedPost({ ...selectedPost, saved: !selectedPost.saved });
                    }}
                    style={{
                      padding: '6px 10px', background: 'none', border: 'none',
                      color: selectedPost.saved ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer',
                    }}
                  >
                    <Bookmark size={20} fill={selectedPost.saved ? 'currentColor' : 'none'} strokeWidth={selectedPost.saved ? 2 : 1.5} />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div style={{ padding: '16px 20px', maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {getPostComments(selectedPost.id).length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>{t("no_comments")}</div>
                ) : (
                  getPostComments(selectedPost.id).filter(c => !c.replyToId).map(cmt => (
                    <div key={cmt.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {cmt.authorAvatar.startsWith('http') ? (
                            <img src={cmt.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: 18 }}>{cmt.authorAvatar}</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{cmt.authorName}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(cmt.timestamp)}</span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            {cmt.text}
                          </p>
                          
                          <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center' }}>
                            <button 
                              onClick={() => setReplyingTo({ id: cmt.id, name: cmt.authorName })}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                            >
                              Balas
                            </button>
                            {currentUser && (cmt.authorId === currentUser.id) && (
                              <button onClick={() => deleteComment(cmt.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {getPostComments(selectedPost.id).filter(r => r.replyToId === cmt.id).map(reply => (
                        <div key={reply.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12, marginLeft: 48 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            {reply.authorAvatar.startsWith('http') ? <img src={reply.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : reply.authorAvatar}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{reply.authorName}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(reply.timestamp)}</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{reply.text}</p>
                            
                            {currentUser && (reply.authorId === currentUser.id) && (
                              <button onClick={() => deleteComment(reply.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, marginTop: 4 }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
                {replyingTo && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Membalas <strong>@{replyingTo.name}</strong></span>
                    <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder={replyingTo ? `Balas @${replyingTo.name}...` : t("write_comment")}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentInput.trim()) {
                        addComment({
                          id: `comment-${Date.now()}`,
                          postId: selectedPost.id,
                          authorId: currentUser.id,
                          authorName: currentUser.name,
                          authorAvatar: currentUser.avatar,
                          text: commentInput.trim(),
                          timestamp: Date.now(),
                          replyToId: replyingTo?.id
                        });
                        setCommentInput('');
                        setReplyingTo(null);
                        setSelectedPost({ ...selectedPost, commentCount: selectedPost.commentCount + 1 });
                      }
                    }}
                    style={{
                      flex: 1, padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (commentInput.trim()) {
                        addComment({
                          id: `comment-${Date.now()}`,
                          postId: selectedPost.id,
                          authorId: currentUser.id,
                          authorName: currentUser.name,
                          authorAvatar: currentUser.avatar,
                          text: commentInput.trim(),
                          timestamp: Date.now(),
                          replyToId: replyingTo?.id
                        });
                        setCommentInput('');
                        setReplyingTo(null);
                        setSelectedPost({ ...selectedPost, commentCount: selectedPost.commentCount + 1 });
                      }
                    }}
                    style={{
                      padding: '0 20px', background: 'var(--accent-green)', border: 'none',
                      borderRadius: 'var(--radius-pill)', color: '#FFF', cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: 16,
        }} onClick={() => setShowSettings(false)}>
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-3xl)',
              padding: 32,
              width: '100%',
              maxWidth: 400,
              animation: 'fade-in 0.3s ease-out',
              boxShadow: 'var(--shadow-float)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Avatar picker */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Avatar
              </label>
              
              {/* Custom Upload */}
              <div style={{ marginBottom: 12 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setEditAvatar(ev.target.result as string);
                        }
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                  id="avatarUpload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatarUpload" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  <Camera size={16} /> Upload Photo
                </label>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {/* Default Unsplash Avatar Option */}
                <button
                  onClick={() => setEditAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80')}
                  style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-xl)',
                    border: editAvatar.includes('unsplash') ? '2px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer', overflow: 'hidden', padding: 0,
                  }}
                >
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" alt="Unsplash" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
                {/* Emoji Avatars */}
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    onClick={() => setEditAvatar(av)}
                    style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-xl)',
                      background: editAvatar === av ? 'rgba(35,122,87,0.1)' : 'var(--bg-elevated)',
                      border: editAvatar === av ? '2px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                      fontSize: 24, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: editAvatar === av ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Nama</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 15, outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'vertical',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            <button
              onClick={handleSaveSettings}
              style={{
                width: '100%', padding: '14px 20px',
                background: 'var(--accent-green)',
                border: 'none', borderRadius: 'var(--radius-pill)',
                color: '#FFF', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Save size={18} />
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Network Modal (Followers/Following) */}
      {showNetworkModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 20
          }}
          onClick={() => setShowNetworkModal(null)}
        >
          <div
            style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-3xl)',
              width: '100%', maxWidth: 400, overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex', flexDirection: 'column',
              maxHeight: '80vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {showNetworkModal}
              </h2>
              <button onClick={() => { setShowNetworkModal(null); setNetworkSearch(''); }} style={{ background: 'var(--bg-primary)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            
            {/* Network search input */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={networkSearch}
                  onChange={(e) => setNetworkSearch(e.target.value)}
                  placeholder={`Cari nama atau username ${showNetworkModal}...`}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 34px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 12,
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
                {networkSearch && (
                  <button
                    onClick={() => setNetworkSearch('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(() => {
                const totalCount = showNetworkModal === 'followers' ? currentUser.stats.followers : currentUser.stats.following;
                const userList = Array.from({ length: totalCount }).map((_, i) => ({
                  id: i,
                  name: `User ${i + 1}`,
                  username: `user${i + 1}`,
                })).filter(u =>
                  !networkSearch.trim() ||
                  u.name.toLowerCase().includes(networkSearch.toLowerCase()) ||
                  u.username.toLowerCase().includes(networkSearch.toLowerCase())
                );

                if (userList.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                      Tidak ada pengguna yang cocok dengan "{networkSearch}"
                    </div>
                  );
                }

                return userList.map((u) => {
                  const i = u.id;
                  const isFollowedBack = followedUsers.has(i);
                  const isFollowersTab = showNetworkModal === 'followers';
                  const buttonText = isFollowersTab ? (isFollowedBack ? 'Following' : 'Follow Back') : 'Following';
                  
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <img src={`https://i.pravatar.cc/150?u=user-${showNetworkModal}-${i}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isFollowersTab && !isFollowedBack) {
                            setFollowedUsers(prev => new Set(prev).add(i));
                            updateProfile({
                              stats: {
                                ...currentUser.stats,
                                following: currentUser.stats.following + 1
                              }
                            });
                          }
                        }}
                        style={{
                          padding: '6px 16px', background: (isFollowersTab && !isFollowedBack) ? 'var(--accent-blue)' : 'var(--bg-primary)',
                          border: (isFollowersTab && !isFollowedBack) ? 'none' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-pill)', color: (isFollowersTab && !isFollowedBack) ? '#FFF' : 'var(--text-primary)',
                          fontSize: 13, fontWeight: 700, cursor: (isFollowersTab && !isFollowedBack) ? 'pointer' : 'default'
                        }}>
                        {buttonText}
                      </button>
                    </div>
                  );
                });
              })()}
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Menampilkan {networkSearch ? 'hasil pencarian' : `${showNetworkModal === 'followers' ? currentUser.stats.followers : currentUser.stats.following} dari ${showNetworkModal === 'followers' ? currentUser.stats.followers : currentUser.stats.following}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
