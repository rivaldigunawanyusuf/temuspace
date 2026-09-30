/**
 * Moderator.tsx - Community Moderator Panel (Admin)
 * 
 * Comprehensive Community Management:
 * - Full CRUD for Posts (Add, Edit, Delete with proper confirmation modal)
 * - Pin/Unpin posts with instant visual feedback
 * - Search, Filter, Sort, and Batch Multi-Select operations
 * - Post Details & Comments Moderation (view and remove abusive comments)
 * - Real-time Virtual Room Members Monitoring (teleport zones, warn, mute)
 * - Virtual Room Broadcast Announcement Modal
 * - Sleek Toast Notifications
 */
import { useState, useMemo, useEffect } from 'react';
import { usePostStore, generatePostId, generateCommentId } from '../../stores/usePostStore';
import type { Post, PostComment } from '../../stores/usePostStore';
import { useGameStore } from '../../stores/useGameStore';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  Shield, Pin, PinOff, Trash2, Edit3, Plus, Search, X, Check,
  Eye, MapPin, Radio, Megaphone, AlertTriangle, TrendingUp, MessageSquare,
  Sparkles, Clock, CheckSquare, Square, CornerDownRight, Volume2,
  VolumeX, Send, UserCheck, AlertCircle, ArrowUpDown, ChevronDown,
  Layers, ExternalLink, Image as ImageIcon, Heart, RefreshCw
} from 'lucide-react';
import { COMMUNITY_USERS, getCommunityUserByName } from '../../data/communityUsers';

type FilterType = 'all' | 'pinned' | 'popular' | 'hasComments' | 'collab';
type SortType = 'newest' | 'oldest' | 'upvotes' | 'comments' | 'title';

const ZONE_NAMES: Record<string, { label: string; coords: { x: number; y: number } }> = {
  zone_meeting_glass: { label: 'Temu Glass Room', coords: { x: 250, y: 400 } },
  zone_lounge: { label: 'Temu Lounge', coords: { x: 650, y: 350 } },
  zone_townhall: { label: 'Temu Townhall', coords: { x: 1050, y: 350 } },
  zone_corridor: { label: 'Central Corridor', coords: { x: 500, y: 250 } },
};

const PRESET_TAGS = [
  'pengumuman', 'tutorial', 'showcase', 'diskusi',
  'tips', 'hackathon', 'open-source', 'design-system', 'web-dev'
];

const PRESET_IMAGES = [
  { label: 'Workspace', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { label: 'Code & Dev', url: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { label: 'Discussion', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { label: 'Hackathon', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
];

function getRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 30) return `${diffDay} hari yang lalu`;
  return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Moderator() {
  const { posts, comments, togglePin, deletePost, addPost, updatePost, addComment, deleteComment, getPostComments } = usePostStore();
  const { npcs, player, updateNPC, updatePlayer } = useGameStore();
  const { currentUser } = useAuthStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  // Modals State
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAuthorName, setFormAuthorName] = useState('Dewi Kartika');
  const [formAuthorAvatar, setFormAuthorAvatar] = useState('https://i.pravatar.cc/150?u=Dewi');
  const [formCollabName, setFormCollabName] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPinned, setFormPinned] = useState(false);

  // Delete Confirmation Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Detail & Comments Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailPostId, setSelectedDetailPostId] = useState<string | null>(null);
  const [moderatorCommentText, setModeratorCommentText] = useState('');

  // Virtual Room Moderation Modals & State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [teleportMember, setTeleportMember] = useState<{ id: string; name: string; isPlayer: boolean; currentZone: string } | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Simulated online members with safe and attractive avatars
  const onlineMembers = useMemo(() => [
    {
      id: 'player',
      name: player.name || 'Kamu',
      avatarEmoji: '👨‍💻',
      avatarUrl: player.avatar ? `https://i.pravatar.cc/150?u=${player.avatar}` : 'https://i.pravatar.cc/150?u=player',
      zone: player.currentZone || 'zone_corridor',
      isPlayer: true,
      isMicOn: player.isMicOn,
      isSpeaking: player.isSpeaking,
    },
    ...npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      avatarEmoji: npc.id === 'raka' ? '🧑‍💼' : npc.id === 'nina' ? '👩‍🎨' : '🧑‍💻',
      avatarUrl: `https://i.pravatar.cc/150?u=${npc.name}`,
      zone: npc.currentZone || 'zone_corridor',
      isPlayer: false,
      isMicOn: false,
      isSpeaking: npc.isSpeaking,
    })),
  ], [npcs, player]);

  // Filtered and Sorted Posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        (p.collabAuthorName && p.collabAuthorName.toLowerCase().includes(q)) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Filter pills
    if (activeFilter === 'pinned') {
      result = result.filter((p) => p.pinned);
    } else if (activeFilter === 'popular') {
      result = result.filter((p) => p.upvotes >= 30);
    } else if (activeFilter === 'hasComments') {
      result = result.filter((p) => p.commentCount > 5);
    } else if (activeFilter === 'collab') {
      result = result.filter((p) => Boolean(p.collabAuthorName));
    }

    // Sorting
    result.sort((a, b) => {
      // Pinned always on top if default sort, otherwise respect criteria
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      if (sortBy === 'comments') return b.commentCount - a.commentCount;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [posts, searchQuery, activeFilter, sortBy]);

  // Metrics
  const metrics = useMemo(() => {
    const totalPosts = posts.length;
    const pinnedPosts = posts.filter((p) => p.pinned).length;
    const totalInteractions = posts.reduce((acc, p) => acc + p.upvotes + p.commentCount, 0);
    const activeVirtual = onlineMembers.length;
    return { totalPosts, pinnedPosts, totalInteractions, activeVirtual };
  }, [posts, onlineMembers]);

  // Selected post for detail modal
  const activeDetailPost = useMemo(() => {
    if (!selectedDetailPostId) return null;
    return posts.find((p) => p.id === selectedDetailPostId) || null;
  }, [posts, selectedDetailPostId]);

  const detailComments = useMemo(() => {
    if (!selectedDetailPostId) return [];
    return getPostComments(selectedDetailPostId);
  }, [getPostComments, selectedDetailPostId, comments]);

  // Open Form for Adding New Post
  const handleOpenAddModal = () => {
    setModalMode('create');
    setEditingPostId(null);
    setFormTitle('');
    setFormContent('');
    setFormAuthorName(currentUser?.name || 'Dewi Kartika');
    setFormAuthorAvatar(currentUser?.avatar || 'https://i.pravatar.cc/150?u=Dewi');
    setFormCollabName('');
    setFormTags('pengumuman, komunitas');
    setFormImageUrl('');
    setFormPinned(false);
    setPostModalOpen(true);
  };

  // Open Form for Editing Existing Post
  const handleOpenEditModal = (post: Post) => {
    setModalMode('edit');
    setEditingPostId(post.id);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormAuthorName(post.authorName);
    setFormAuthorAvatar(post.authorAvatar);
    setFormCollabName(post.collabAuthorName || '');
    setFormTags(post.tags.join(', '));
    setFormImageUrl(post.imageUrl || '');
    setFormPinned(post.pinned);
    setPostModalOpen(true);
  };

  // Submit Form (Create or Update)
  const handleSavePost = () => {
    if (!formTitle.trim()) {
      showToast('Judul postingan wajib diisi!', 'error');
      return;
    }
    if (!formContent.trim()) {
      showToast('Isi konten postingan wajib diisi!', 'error');
      return;
    }

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (modalMode === 'create') {
      const newPost: Post = {
        id: generatePostId(),
        authorId: currentUser?.id || 'user-admin-001',
        authorName: formAuthorName.trim() || 'Dewi Kartika',
        authorAvatar: formAuthorAvatar || 'https://i.pravatar.cc/150?u=Dewi',
        collabAuthorName: formCollabName.trim() || undefined,
        collabAuthorAvatar: formCollabName.trim() ? `https://i.pravatar.cc/150?u=${formCollabName}` : undefined,
        title: formTitle.trim(),
        content: formContent.trim(),
        imageUrl: formImageUrl.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : ['komunitas'],
        reactions: [
          { type: 'like', count: 0, reacted: false },
          { type: 'love', count: 0, reacted: false },
          { type: 'insight', count: 0, reacted: false },
        ],
        upvotes: 0,
        upvoted: false,
        commentCount: 0,
        saved: false,
        pinned: formPinned,
        timestamp: Date.now(),
        isDeleted: false,
      };

      addPost(newPost);
      showToast('✅ Postingan baru berhasil dipublikasikan!');
    } else if (editingPostId) {
      updatePost(editingPostId, {
        title: formTitle.trim(),
        content: formContent.trim(),
        authorName: formAuthorName.trim(),
        authorAvatar: formAuthorAvatar,
        collabAuthorName: formCollabName.trim() || undefined,
        collabAuthorAvatar: formCollabName.trim() ? `https://i.pravatar.cc/150?u=${formCollabName}` : undefined,
        tags: parsedTags,
        imageUrl: formImageUrl.trim() || undefined,
        pinned: formPinned,
      });
      showToast('✏️ Postingan berhasil diperbarui!');
    }

    setPostModalOpen(false);
  };

  // Trigger Delete Confirmation Modal
  const handleTriggerDelete = (post: Post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  // Confirm Single Post Deletion
  const handleConfirmDelete = () => {
    if (!postToDelete) return;
    deletePost(postToDelete.id);
    setSelectedPostIds((prev) => prev.filter((id) => id !== postToDelete.id));
    if (selectedDetailPostId === postToDelete.id) {
      setDetailModalOpen(false);
      setSelectedDetailPostId(null);
    }
    showToast(`🗑️ Postingan "${postToDelete.title}" telah dihapus!`, 'info');
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  // Toggle Single Post Pin
  const handleTogglePin = (id: string, currentPinned: boolean) => {
    togglePin(id);
    showToast(currentPinned ? '📌 Sematan postingan telah dilepas' : '📌 Postingan berhasil disematkan ke atas feed');
  };

  // Multi-Select Handling
  const handleSelectAll = () => {
    if (selectedPostIds.length === filteredPosts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filteredPosts.map((p) => p.id));
    }
  };

  const handleToggleSelectPost = (id: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Pin / Unpin
  const handleBulkPin = (pinValue: boolean) => {
    selectedPostIds.forEach((id) => {
      const p = posts.find((item) => item.id === id);
      if (p && p.pinned !== pinValue) {
        togglePin(id);
      }
    });
    showToast(`📌 ${selectedPostIds.length} postingan berhasil di-${pinValue ? 'sematkan' : 'lepas sematan'}`);
    setSelectedPostIds([]);
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    const count = selectedPostIds.length;
    selectedPostIds.forEach((id) => deletePost(id));
    setSelectedPostIds([]);
    setBulkDeleteModalOpen(false);
    showToast(`🗑️ ${count} postingan terpilih berhasil dihapus!`, 'info');
  };

  // Moderator add reply comment
  const handleAddModeratorComment = () => {
    if (!selectedDetailPostId || !moderatorCommentText.trim()) return;
    const newComment: PostComment = {
      id: generateCommentId(),
      postId: selectedDetailPostId,
      authorId: currentUser?.id || 'user-admin-001',
      authorName: `${currentUser?.name || 'Dewi Kartika'} (Moderator)`,
      authorAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=Dewi',
      text: moderatorCommentText.trim(),
      timestamp: Date.now(),
    };
    addComment(newComment);
    setModeratorCommentText('');
    showToast('💬 Tanggapan moderator berhasil ditambahkan');
  };

  // Delete abusive comment
  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
    showToast('🗑️ Komentar berhasil dimoderasi & dihapus', 'info');
  };

  // Teleport member to zone
  const handleTeleport = (targetZone: string) => {
    if (!teleportMember) return;
    const zoneInfo = ZONE_NAMES[targetZone];
    if (!zoneInfo) return;

    if (teleportMember.isPlayer) {
      updatePlayer({ currentZone: targetZone, position: zoneInfo.coords });
    } else {
      updateNPC(teleportMember.id, { currentZone: targetZone, position: zoneInfo.coords });
    }

    showToast(`📍 ${teleportMember.name} dipindahkan ke ${zoneInfo.label}`);
    setTeleportMember(null);
  };

  // Send Broadcast Announcement
  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) {
      showToast('Pesan pengumuman tidak boleh kosong!', 'error');
      return;
    }
    showToast(`📢 Pengumuman Virtual Room: "${broadcastMessage}"`, 'info');
    setBroadcastMessage('');
    setBroadcastModalOpen(false);
  };

  // Quick tag click helper
  const handleTogglePresetTag = (tag: string) => {
    const currentTags = formTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    if (currentTags.includes(tag)) {
      setFormTags(currentTags.filter((t) => t !== tag).join(', '));
    } else {
      setFormTags([...currentTags, tag].join(', '));
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 960, margin: '0 auto', fontFamily: 'var(--font-ui)' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? 'var(--accent-terracotta)' : 'var(--accent-green)',
          color: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: 13,
          fontWeight: 700,
          animation: 'slideInRight 0.25s ease-out',
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'info' ? <Megaphone size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 2, display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(217,119,6,0.1)',
            color: 'var(--accent-terracotta)',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: 6,
          }}>
            <Shield size={13} />
            Moderator Command Center
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Community Moderator
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Pusat kendali konten feed, moderasi postingan & komentar, serta pemantauan Virtual Room secara menyeluruh.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setBroadcastModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xl)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
            }}
          >
            <Radio size={14} color="var(--accent-terracotta)" />
            Broadcast Room
          </button>

          <button
            onClick={handleOpenAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              background: 'var(--accent-terracotta)',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
              transition: 'transform 0.1s ease',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Tambah Postingan Baru
          </button>
        </div>
      </div>

      {/* Metrics Overview Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          padding: '14px 16px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Postingan</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.totalPosts}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          padding: '14px 16px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(217, 119, 6, 0.1)',
            color: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Pin size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Disematkan (Pinned)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.pinnedPosts}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          padding: '14px 16px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Interaksi Komunitas</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.totalInteractions}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          padding: '14px 16px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(35, 122, 87, 0.1)',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent-green)',
              boxShadow: '0 0 10px #34D399',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Virtual Room Aktif</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {metrics.activeVirtual} <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Online Members in Virtual Room Card */}
      <div style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-3xl)',
        padding: '18px 20px',
        marginBottom: 28,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent-green)',
              boxShadow: '0 0 8px #34D399',
            }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Online di Virtual Room ({onlineMembers.length})
            </h2>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Live status & pengelolaan anggota di ruang virtual
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onlineMembers.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: m.isPlayer ? 'rgba(35, 122, 87, 0.06)' : 'var(--bg-primary)',
                border: `1px solid ${m.isPlayer ? 'rgba(35, 122, 87, 0.2)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-xl)',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                }}>
                  {m.avatarEmoji}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.name}
                    {m.isPlayer && (
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(35,122,87,0.12)',
                        color: 'var(--accent-green)',
                        fontWeight: 700,
                      }}>
                        Anda (Admin)
                      </span>
                    )}
                    {m.isSpeaking && (
                      <span style={{
                        fontSize: 9,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#EF4444',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}>
                        <Volume2 size={10} /> Berbicara
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ID: {m.id}
                  </div>
                </div>
              </div>

              {/* Zone Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(35,122,87,0.1)',
                  color: 'var(--accent-green)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <MapPin size={11} />
                  {ZONE_NAMES[m.zone]?.label || m.zone}
                </span>

                {/* Moderator Actions on Member */}
                <button
                  onClick={() => setTeleportMember({ id: m.id, name: m.name, isPlayer: m.isPlayer, currentZone: m.zone })}
                  title="Pindahkan ke zona lain"
                  style={{
                    padding: '5px 10px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <MapPin size={12} color="var(--accent-blue)" />
                  Pindahkan
                </button>

                <button
                  onClick={() => showToast(`⚠️ Peringatan dikirimkan ke ${m.name}`, 'info')}
                  title="Kirim peringatan ketertiban"
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(217, 119, 6, 0.08)',
                    border: '1px solid rgba(217, 119, 6, 0.25)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--accent-terracotta)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={12} />
                  Peringatan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Moderation Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} color="var(--accent-terracotta)" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Moderasi Postingan Komunitas ({filteredPosts.length})
          </h2>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: 'var(--accent-terracotta)',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Plus size={14} />
          Tambah Postingan
        </button>
      </div>

      {/* Search, Filter Tabs & Sort Controls */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Search Bar + Sort Dropdown */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            minWidth: 260,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '8px 12px',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, penulis, tag, atau isi konten..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xl)',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="upvotes">Upvotes Terbanyak</option>
              <option value="comments">Komentar Terbanyak</option>
              <option value="title">Judul (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Filter:</span>
          {([
            { key: 'all' as FilterType, label: `Semua (${posts.length})` },
            { key: 'pinned' as FilterType, label: `📌 Disematkan (${metrics.pinnedPosts})` },
            { key: 'popular' as FilterType, label: '🔥 Populer (>30 Upvotes)' },
            { key: 'hasComments' as FilterType, label: '💬 Banyak Diskusi' },
            { key: 'collab' as FilterType, label: '🤝 Kolaborasi' },
          ]).map(({ key, label }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: isActive ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                  border: `1px solid ${isActive ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Operations Toolbar */}
      {selectedPostIds.length > 0 && (
        <div style={{
          background: 'rgba(217, 119, 6, 0.08)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
          borderRadius: 'var(--radius-2xl)',
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleSelectAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {selectedPostIds.length === filteredPosts.length ? (
                <CheckSquare size={16} color="var(--accent-terracotta)" />
              ) : (
                <Square size={16} color="var(--text-muted)" />
              )}
              {selectedPostIds.length} postingan dipilih
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleBulkPin(true)}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Pin size={12} />
              Sematkan Semua
            </button>

            <button
              onClick={() => handleBulkPin(false)}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <PinOff size={12} />
              Lepas Sematan
            </button>

            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              style={{
                padding: '6px 12px',
                background: '#EF4444',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Trash2 size={12} />
              Hapus Terpilih
            </button>

            <button
              onClick={() => setSelectedPostIds([])}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Post List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredPosts.length === 0 ? (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-3xl)',
            padding: '48px 20px',
            textAlign: 'center',
          }}>
            <Search size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Tidak Ada Postingan Ditemukan
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px' }}>
              Tidak ada postingan yang sesuai dengan kata kunci pencarian atau filter yang aktif saat ini.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
              style={{
                padding: '8px 16px',
                background: 'var(--accent-terracotta)',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Filter & Pencarian
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isSelected = selectedPostIds.includes(post.id);
            return (
              <div
                key={post.id}
                style={{
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-sm)',
                  border: `1px solid ${post.pinned ? 'rgba(217, 119, 6, 0.35)' : isSelected ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-2xl)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'border-color 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Post Item Top Row: Select, Author, Date, Pinned Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <button
                      onClick={() => handleToggleSelectPost(post.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      title="Pilih postingan"
                    >
                      {isSelected ? (
                        <CheckSquare size={18} color="var(--accent-terracotta)" />
                      ) : (
                        <Square size={18} color="var(--text-muted)" />
                      )}
                    </button>

                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      flexShrink: 0,
                    }}>
                      {post.authorAvatar.startsWith('http') ? (
                        <img src={post.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        post.authorAvatar || '👤'
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {post.authorName}
                        </span>
                        {post.collabAuthorName && (
                          <span style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(217, 119, 6, 0.1)',
                            color: 'var(--accent-terracotta)',
                            fontWeight: 700,
                          }}>
                            Collab: {post.collabAuthorName}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          • {getRelativeTime(post.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pinned Badge */}
                  {post.pinned && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(217, 119, 6, 0.12)',
                      color: 'var(--accent-terracotta)',
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}>
                      <Pin size={10} /> Disematkan
                    </span>
                  )}
                </div>

                {/* Post Item Middle: Title, Content snippet, Tags */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: '0 0 6px 0',
                      lineHeight: 1.35,
                    }}>
                      {post.title}
                    </h3>
                    <p style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      margin: '0 0 10px 0',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {post.content}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {post.tags.map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'var(--accent-blue)',
                              background: 'rgba(59, 130, 246, 0.08)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail if imageUrl */}
                  {post.imageUrl && (
                    <div style={{
                      width: 72,
                      height: 72,
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <img
                        src={post.imageUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                {/* Post Item Bottom: Stats & PROPER MANAGE BUTTONS */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 10,
                  marginTop: 4,
                  flexWrap: 'wrap',
                  gap: 10,
                }}>
                  {/* Left: Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                      <TrendingUp size={12} color="var(--accent-terracotta)" />
                      ▲ {post.upvotes} Upvotes
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                      <MessageSquare size={12} color="var(--accent-blue)" />
                      {post.commentCount} Komentar
                    </span>
                  </div>

                  {/* Right: Proper Manage Buttons (Detail, Edit, Pin/Unpin, Delete) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* View Details / Comments */}
                    <button
                      onClick={() => {
                        setSelectedDetailPostId(post.id);
                        setDetailModalOpen(true);
                      }}
                      title="Lihat Detail & Komentar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <Eye size={12} color="var(--accent-blue)" />
                      Detail
                    </button>

                    {/* Edit Post */}
                    <button
                      onClick={() => handleOpenEditModal(post)}
                      title="Edit Postingan"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <Edit3 size={12} color="var(--accent-green)" />
                      Edit
                    </button>

                    {/* Pin/Unpin */}
                    <button
                      onClick={() => handleTogglePin(post.id, post.pinned)}
                      title={post.pinned ? 'Lepas Sematan' : 'Sematkan ke Atas'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: post.pinned ? 'rgba(217, 119, 6, 0.1)' : 'var(--bg-primary)',
                        border: `1px solid ${post.pinned ? 'rgba(217, 119, 6, 0.3)' : 'var(--border-medium)'}`,
                        borderRadius: 'var(--radius-lg)',
                        color: post.pinned ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {post.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                      {post.pinned ? 'Unpin' : 'Pin'}
                    </button>

                    {/* Delete with Proper Confirmation */}
                    <button
                      onClick={() => handleTriggerDelete(post)}
                      title="Hapus Postingan Secara Permanen"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 'var(--radius-lg)',
                        color: '#EF4444',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: Tambah / Edit Postingan                             */}
      {/* ============================================================ */}
      {postModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(217, 119, 6, 0.12)',
                  color: 'var(--accent-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {modalMode === 'create' ? <Plus size={18} /> : <Edit3 size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {modalMode === 'create' ? 'Tambah Postingan Baru' : 'Edit Postingan Komunitas'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {modalMode === 'create' ? 'Buat pengumuman atau konten diskusi resmi untuk feed komunitas' : 'Perbarui data postingan feed'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPostModalOpen(false)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Judul */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Judul Postingan *
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Cth: Tips Lolos Hackathon Nasional 2026..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Author & Collab Author */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Nama Penulis (Author)
                  </label>
                  <select
                    value={formAuthorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormAuthorName(val);
                      const u = getCommunityUserByName(val);
                      if (u) {
                        setFormAuthorAvatar(u.avatarUrl || u.avatar);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 600,
                      outline: 'none',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {COMMUNITY_USERS.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.avatar} {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Penulis Kolaborasi (Opsional)
                  </label>
                  <select
                    value={formCollabName}
                    onChange={(e) => setFormCollabName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: formCollabName ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: 600,
                      outline: 'none',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">(Tanpa Kolaborator)</option>
                    {COMMUNITY_USERS.filter((u) => u.name !== formAuthorName).map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.avatar} {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags & Quick Tag Chips */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Kategori & Tags (Pisahkan dengan koma)
                </label>
                <input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Cth: pengumuman, tips, hackathon"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    marginBottom: 8,
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = formTags.toLowerCase().includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTogglePresetTag(tag)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-primary)',
                          border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                          color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        +{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Image URL with Presets */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  URL Gambar Sampul / Banner (Opsional)
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-xl)',
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {/* Preset image suggestions */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Preset Cepat:</span>
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setFormImageUrl(img.url)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: formImageUrl === img.url ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        color: formImageUrl === img.url ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Konten Postingan */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Isi Konten Postingan *
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tuliskan isi postingan komunitas, pembaruan, atau materi yang ingin disampaikan..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Pinned Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: formPinned ? 'rgba(217, 119, 6, 0.08)' : 'var(--bg-primary)',
                border: `1px solid ${formPinned ? 'rgba(217, 119, 6, 0.3)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Sematkan Postingan di Atas Feed (Pinned)
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Postingan akan selalu berada di posisi paling atas tab Beranda untuk semua anggota
                  </div>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 22,
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 16,
            }}>
              <button
                type="button"
                onClick={() => setPostModalOpen(false)}
                style={{
                  padding: '9px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePost}
                style={{
                  padding: '9px 20px',
                  background: 'var(--accent-terracotta)',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                }}
              >
                {modalMode === 'create' ? 'Publikasikan Postingan' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: Konfirmasi Hapus Postingan (Proper Delete Dialog)    */}
      {/* ============================================================ */}
      {deleteModalOpen && postToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            width: '100%',
            maxWidth: 460,
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Hapus Postingan Ini?
            </h3>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Apakah Anda yakin ingin menghapus postingan{' '}
              <strong style={{ color: 'var(--text-primary)' }}>"{postToDelete.title}"</strong> karya{' '}
              <span style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>{postToDelete.authorName}</span>?
            </p>

            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-xl)',
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 12,
              color: '#EF4444',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Tindakan Permanen:</strong> Seluruh data postingan beserta {postToDelete.commentCount} komentar di dalamnya akan dihapus dan tidak dapat dikembalikan.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setDeleteModalOpen(false); setPostToDelete(null); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                }}
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: Konfirmasi Hapus Massal (Bulk Delete Dialog)        */}
      {/* ============================================================ */}
      {bulkDeleteModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            width: '100%',
            maxWidth: 460,
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Hapus {selectedPostIds.length} Postingan Terpilih?
            </h3>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
              Anda akan menghapus sebanyak <strong>{selectedPostIds.length} postingan</strong> secara sekaligus. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setBulkDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>

              <button
                onClick={handleConfirmBulkDelete}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: Detail Postingan & Moderasi Komentar                 */}
      {/* ============================================================ */}
      {detailModalOpen && activeDetailPost && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: activeDetailPost.pinned ? 'rgba(217, 119, 6, 0.15)' : 'var(--bg-primary)',
                  color: activeDetailPost.pinned ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 800,
                }}>
                  {activeDetailPost.pinned ? '📌 Postingan Disematkan' : 'Postingan Reguler'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ID: {activeDetailPost.id}
                </span>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Author info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}>
                <img src={activeDetailPost.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeDetailPost.authorName}
                  {activeDetailPost.collabAuthorName && (
                    <span style={{ color: 'var(--accent-terracotta)', fontWeight: 600, fontSize: 12, marginLeft: 6 }}>
                      • Collab: {activeDetailPost.collabAuthorName}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Dipublikasikan: {new Date(activeDetailPost.timestamp).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Post Title & Content */}
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
              {activeDetailPost.title}
            </h2>

            {activeDetailPost.imageUrl && (
              <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: 16, maxHeight: 260, border: '1px solid var(--border-subtle)' }}>
                <img src={activeDetailPost.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              marginBottom: 16,
              background: 'var(--bg-primary)',
              padding: 14,
              borderRadius: 'var(--radius-xl)',
            }}>
              {activeDetailPost.content}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {activeDetailPost.tags.map((t, idx) => (
                <span key={idx} style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent-blue)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                }}>
                  #{t}
                </span>
              ))}
            </div>

            {/* Comments Moderation Section */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <MessageSquare size={16} color="var(--accent-blue)" />
                Moderasi Komentar ({detailComments.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 14 }}>
                {detailComments.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
                    Belum ada komentar pada postingan ini.
                  </div>
                ) : (
                  detailComments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--border-subtle)',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: 'var(--bg-elevated)',
                        }}>
                          <img src={c.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {c.authorName}{' '}
                            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
                              • {getRelativeTime(c.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {c.text}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        title="Hapus komentar ini"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Moderator Reply Comment */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={moderatorCommentText}
                  onChange={(e) => setModeratorCommentText(e.target.value)}
                  placeholder="Tulis tanggapan atau catatan moderator..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddModeratorComment();
                  }}
                />
                <button
                  onClick={handleAddModeratorComment}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--accent-terracotta)',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Send size={13} /> Kirim
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEditModal(activeDetailPost);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Edit3 size={13} /> Edit Post Ini
              </button>

              <button
                onClick={() => setDetailModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  background: 'var(--accent-terracotta)',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: Broadcast Pengumuman Virtual Room                   */}
      {/* ============================================================ */}
      {broadcastModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            width: '100%',
            maxWidth: 480,
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={20} color="var(--accent-terracotta)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Siarkan Pengumuman Virtual Room
                </h3>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Pesan ini akan disiarkan ke seluruh member yang saat ini berada di ruang virtual TemuSpace.
            </p>

            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Cth: Workshop akan dimulai 10 menit lagi di Zona Townhall, harap segera merapat..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xl)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                marginBottom: 16,
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSendBroadcast}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: 'var(--accent-terracotta)',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Siarkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: Pindahkan Zona Member Virtual Room                   */}
      {/* ============================================================ */}
      {teleportMember && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            width: '100%',
            maxWidth: 420,
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Pindahkan {teleportMember.name} ke Zona:
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Pilih ruangan tujuan di Virtual Room:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {Object.entries(ZONE_NAMES).map(([zoneKey, { label }]) => (
                <button
                  key={zoneKey}
                  onClick={() => handleTeleport(zoneKey)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-xl)',
                    background: teleportMember.currentZone === zoneKey ? 'rgba(35, 122, 87, 0.12)' : 'var(--bg-primary)',
                    border: `1px solid ${teleportMember.currentZone === zoneKey ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="var(--accent-green)" />
                    {label}
                  </span>
                  {teleportMember.currentZone === zoneKey && (
                    <span style={{ fontSize: 10, color: 'var(--accent-green)', fontWeight: 800 }}>Lokasi Saat Ini</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setTeleportMember(null)}
              style={{
                width: '100%',
                padding: '9px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xl)',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
