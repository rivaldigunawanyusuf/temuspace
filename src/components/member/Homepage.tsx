/**
 * Homepage.tsx - Community FYP & Search (Member Tab 1)
 *
 * Features:
 * - Search bar (search posts by title/content/tags)
 * - Create new post form (with collab post support)
 * - Feed with upvote, reactions, comments, save, pin
 * - Full CRUD: create, edit, delete posts & comments
 */
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  usePostStore,
  generatePostId,
  generateCommentId,
} from "../../stores/usePostStore";
import { useAuthStore } from "../../stores/useAuthStore";
import type {
  Post,
  PostComment,
  PostReaction,
} from "../../stores/usePostStore";
import {
  Pin,
  MoreHorizontal,
  Trash2,
  Edit3,
  X,
  Send,
  Image,
  Users,
  ChevronDown,
  ChevronUp,
  SmilePlus,
  ThumbsUp,
  Heart,
  Lightbulb,
  PartyPopper,
  Plus,
  Search,
  ArrowBigUp,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  Filter,
  RotateCcw,
} from "lucide-react";

const REACTION_ICONS: Record<string, React.ReactNode> = {
  like: <ThumbsUp size={16} fill="currentColor" strokeWidth={2} />,
  love: <Heart size={16} fill="currentColor" strokeWidth={2} />,
  insight: <Lightbulb size={16} fill="currentColor" strokeWidth={2} />,
  celebrate: <PartyPopper size={16} fill="currentColor" strokeWidth={2} />,
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export default function Homepage() {
  const { t } = useTranslation();
  const {
    posts,
    comments,
    addPost,
    updatePost,
    deletePost,
    toggleUpvote,
    toggleReaction,
    toggleSave,
    togglePin,
    addComment,
    deleteComment,
  } = usePostStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [expandedReactionsPost, setExpandedReactionsPost] = useState<
    string | null
  >(null);
  const [reactionsTab, setReactionsTab] = useState<string>("all");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Create post state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isCollab, setIsCollab] = useState(false);
  const [collabName, setCollabName] = useState("");

  // Edit post state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Auto-fix empty reactions in localStorage (migration)
  useEffect(() => {
    posts.forEach((post) => {
      const hasEmpty = post.reactions.some((r) => !r.type);
      if (hasEmpty) {
        const fixedReactions = post.reactions.filter((r) => r.type); // remove empty ones
        usePostStore.setState((state) => ({
          posts: state.posts.map((p) =>
            p.id === post.id ? { ...p, reactions: fixedReactions } : p,
          ),
        }));
      }
    });
  }, [posts]);

  // Comment state
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [hoveredReactionPost, setHoveredReactionPost] = useState<string | null>(
    null,
  );

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (filterTag === "pinned" && !p.pinned) return false;
    if (filterTag === "collab" && !p.collabAuthorName) return false;
    if (filterTag !== "all" && filterTag !== "pinned" && filterTag !== "collab") {
      if (!p.tags.some((t) => t.toLowerCase() === filterTag.toLowerCase())) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.authorName.toLowerCase().includes(q)
    );
  });

  // Sort: pinned first, then by timestamp
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.timestamp - a.timestamp;
  });

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newContent.trim() || !currentUser) return;
    const post: Post = {
      id: generatePostId(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      ...(isCollab && collabName
        ? {
            collabAuthorId: `collab-${Date.now()}`,
            collabAuthorName: collabName,
            collabAuthorAvatar: "",
          }
        : {}),
      title: newTitle,
      content: newContent,
      imageUrl: newImageUrl || undefined,
      tags: newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      reactions: [
        { type: "like", count: 0, reacted: false },
        { type: "love", count: 0, reacted: false },
        { type: "insight", count: 0, reacted: false },
        { type: "celebrate", count: 0, reacted: false },
      ],
      upvotes: 0,
      upvoted: false,
      commentCount: 0,
      saved: false,
      pinned: false,
      timestamp: Date.now(),
      isDeleted: false,
    };
    addPost(post);
    setNewTitle("");
    setNewContent("");
    setNewImageUrl("");
    setNewTags("");
    setIsCollab(false);
    setCollabName("");
    setShowCreateForm(false);
  };

  const handleEditPost = (postId: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    updatePost(postId, { title: editTitle, content: editContent, imageUrl: editImageUrl || undefined });
    setEditingPost(null);
  };

  const startEditing = (post: Post) => {
    setEditingPost(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImageUrl(post.imageUrl || "");
    setMenuOpen(null);
  };

  const handleAddComment = (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text || !currentUser) return;
    const comment: PostComment = {
      id: generateCommentId(),
      postId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text,
      timestamp: Date.now(),
      replyToId: replyingTo?.id,
    };
    addComment(comment);
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    setReplyingTo(null);
  };

  const postComments = (postId: string) =>
    comments.filter((c) => c.postId === postId);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 16px 0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingTop: 8,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--text-primary)",
          }}
        >
          {t("home")}
        </h1>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "var(--accent-green)",
            border: "none",
            borderRadius: "var(--radius-pill)",
            color: "#FFF",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Plus size={16} />
          {t("create_post")}
        </button>
      </div>

      {/* Search Bar & Filter Chips */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            style={{
              width: "100%",
              padding: "12px 42px 12px 44px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-pill)",
              color: "var(--text-primary)",
              fontSize: 14,
              outline: "none",
              fontFamily: "'Inter', sans-serif",
              boxShadow: "var(--shadow-sm)",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-green)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
              title="Hapus pencarian"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {(
            [
              { key: "all", label: "Semua" },
              { key: "pinned", label: "📌 Disematkan" },
              { key: "collab", label: "🤝 Kolaborasi" },
              { key: "showcase", label: "Showcase" },
              { key: "tutorial", label: "Tutorial" },
              { key: "diskusi", label: "Diskusi" },
              { key: "pengumuman", label: "Pengumuman" },
              { key: "open-source", label: "Open-Source" },
            ] as const
          ).map(({ key, label }) => {
            const isSel = filterTag === key;
            return (
              <button
                key={key}
                onClick={() => setFilterTag(key)}
                style={{
                  padding: "5px 13px",
                  background: isSel ? "var(--accent-green)" : "var(--bg-elevated)",
                  border: `1px solid ${isSel ? "var(--accent-green)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-pill)",
                  color: isSel ? "#FFF" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  boxShadow: isSel ? "var(--shadow-sm)" : "none",
                }}
              >
                {label}
              </button>
            );
          })}

          {(searchQuery || filterTag !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterTag("all");
              }}
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                color: "var(--accent-green)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 8px",
                whiteSpace: "nowrap",
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-3xl)",
              padding: 24,
              width: "100%",
              maxWidth: 600,
              animation: "fade-in 0.3s ease-out",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {t("create_post")}
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("post_title")}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 600,
                outline: "none",
                marginBottom: 12,
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={t("post_body")}
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                marginBottom: 12,
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6,
              }}
            />
            <input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Link Gambar (Opsional)"
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
                marginBottom: 12,
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder={t("post_tags")}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                color: "var(--text-muted)",
                fontSize: 13,
                outline: "none",
                marginBottom: 16,
                fontFamily: "'Inter', sans-serif",
              }}
            />

            {/* Collab Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setIsCollab(!isCollab)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: isCollab
                    ? "rgba(59, 130, 246,0.1)"
                    : "var(--bg-primary)",
                  border: `1px solid ${isCollab ? "var(--accent-blue)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-pill)",
                  color: isCollab ? "var(--accent-blue)" : "var(--text-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <Users size={16} />
                {t("collab_post")}
              </button>
              {isCollab && (
                <input
                  value={collabName}
                  onChange={(e) => setCollabName(e.target.value)}
                  placeholder={t("collab_name")}
                  style={{
                    flex: 1,
                    padding: "8px 14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--accent-blue)",
                    borderRadius: "var(--radius-pill)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              )}
            </div>

            <button
              onClick={() => {
                handleCreatePost();
                setShowCreateForm(false);
              }}
              disabled={!newTitle.trim() || !newContent.trim()}
              style={{
                width: "100%",
                padding: "12px 20px",
                background:
                  !newTitle.trim() || !newContent.trim()
                    ? "var(--bg-primary)"
                    : "var(--accent-green)",
                border: "none",
                borderRadius: "var(--radius-pill)",
                color:
                  !newTitle.trim() || !newContent.trim()
                    ? "var(--text-muted)"
                    : "#FFF",
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  !newTitle.trim() || !newContent.trim()
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: !newTitle.trim() || !newContent.trim() ? 0.6 : 1,
                boxShadow:
                  !newTitle.trim() || !newContent.trim()
                    ? "none"
                    : "var(--shadow-sm)",
              }}
            >
              <Send size={18} />
              {t("submit_post")}
            </button>
          </div>
        </div>
      )}

      {/* Post Feed */}
      {sortedPosts.map((post) => (
        <div
          key={post.id}
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${post.pinned ? "var(--accent-blue)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-2xl)",
            padding: 20,
            marginBottom: 16,
            position: "relative",
            boxShadow: "var(--shadow-sm)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          {/* Pinned badge */}
          {post.pinned && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                background: "rgba(59, 130, 246,0.1)",
                border: "1px solid rgba(59, 130, 246,0.2)",
                borderRadius: "var(--radius-pill)",
                color: "var(--accent-blue)",
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <Pin size={12} />
              DISEMATKAN
            </div>
          )}

          {/* Author */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    overflow: "hidden",
                    zIndex: 2,
                  }}
                >
                  {post.authorAvatar.startsWith("http") ? (
                    <img
                      src={post.authorAvatar}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    post.authorAvatar
                  )}
                </div>
                {post.collabAuthorName && post.collabAuthorAvatar && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--bg-primary)",
                      border: "2px solid var(--bg-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      overflow: "hidden",
                      marginLeft: -12,
                      zIndex: 1,
                    }}
                  >
                    {post.collabAuthorAvatar.startsWith("http") ? (
                      <img
                        src={post.collabAuthorAvatar}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      post.collabAuthorAvatar
                    )}
                  </div>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {post.authorName}
                  {post.collabAuthorName && (
                    <span
                      style={{ color: "var(--accent-blue)", fontWeight: 600 }}
                    >
                      {" "}
                      × {post.collabAuthorName}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {timeAgo(post.timestamp)}
                </div>
              </div>
            </div>
            {/* Menu */}
            {currentUser &&
              (post.authorId === currentUser.id ||
                currentUser.role === "admin") && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === post.id ? null : post.id)
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {menuOpen === post.id && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 32,
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xl)",
                        padding: 6,
                        zIndex: 50,
                        minWidth: 140,
                        boxShadow: "var(--shadow-lg)",
                      }}
                    >
                      <button
                        onClick={() => startEditing(post)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "10px 12px",
                          background: "none",
                          border: "none",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          cursor: "pointer",
                          borderRadius: "var(--radius-lg)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(0,0,0,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          deletePost(post.id);
                          setMenuOpen(null);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "10px 12px",
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          fontSize: 13,
                          cursor: "pointer",
                          borderRadius: "var(--radius-lg)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(239,68,68,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <Trash2 size={16} /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Content */}
          <>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              {post.title}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              {post.content}
            </p>
            {post.imageUrl && (
              <div
                style={{
                  marginBottom: 14,
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <img
                  src={post.imageUrl}
                  alt="Attachment"
                  style={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
          </>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 10px",
                    background: "var(--bg-primary)",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: 12,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Upvote */}
              <button
                onClick={() => toggleUpvote(post.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: post.upvoted
                    ? "rgba(35,122,87,0.1)"
                    : "var(--bg-primary)",
                  border: `1px solid ${post.upvoted ? "var(--accent-green)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-pill)",
                  color: post.upvoted
                    ? "var(--accent-green)"
                    : "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ArrowBigUp
                  size={18}
                  fill={post.upvoted ? "var(--accent-green)" : "none"}
                  strokeWidth={post.upvoted ? 2 : 1.5}
                />
                {post.upvotes}
              </button>

              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={() => setHoveredReactionPost(post.id)}
                onMouseLeave={() => setHoveredReactionPost(null)}
              >
                {/* Main Reaction Button */}
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    background: "none",
                    border: "none",
                    color: post.reactions.some((r) => r.reacted)
                      ? "var(--accent-green)"
                      : "var(--text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: post.reactions.some((r) => r.reacted)
                      ? 600
                      : 500,
                  }}
                  onClick={() =>
                    toggleReaction(
                      post.id,
                      post.reactions.find((r) => r.reacted)?.type || "",
                    )
                  }
                >
                  {post.reactions.find((r) => r.reacted) ? (
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {REACTION_ICONS[
                        post.reactions.find((r) => r.reacted)!.type
                      ] || <ThumbsUp size={16} />}
                    </span>
                  ) : (
                    <SmilePlus size={18} />
                  )}
                  <span style={{ whiteSpace: "nowrap" }}>Reaksi</span>
                </button>

                {/* Aggregated Reactions (LinkedIn Style) */}
                {(() => {
                  const activeReactions = post.reactions
                    .filter((r) => r.count > 0)
                    .sort((a, b) => b.count - a.count);
                  const totalCount = activeReactions.reduce(
                    (sum, r) => sum + r.count,
                    0,
                  );
                  if (totalCount === 0) return null;

                  return (
                    <button
                      onClick={() => {
                        setExpandedReactionsPost(post.id);
                        setReactionsTab("all");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-pill)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        marginLeft: 4, // Added to prevent overlap
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--bg-elevated)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "var(--bg-primary)")
                      }
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {activeReactions.slice(0, 3).map((r, i) => (
                          <div
                            key={r.type}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-subtle)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: i > 0 ? -6 : 0,
                              zIndex: 3 - i,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {REACTION_ICONS[r.type] || <ThumbsUp size={12} />}
                          </div>
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        {totalCount}
                      </span>
                    </button>
                  );
                })()}

                {/* Reaction Picker Popup with invisible bridge */}
                {hoveredReactionPost === post.id && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      paddingBottom: 8,
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        background: "var(--bg-card)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-pill)",
                        boxShadow: "var(--shadow-float)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        gap: 8,
                        animation: "slide-up 0.2s ease-out",
                      }}
                    >
                      {Object.keys(REACTION_ICONS).map((type) => (
                        <button
                          key={type}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReaction(post.id, type);
                            setHoveredReactionPost(null);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 4,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.2)";
                            e.currentTarget.style.color = "var(--accent-green)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                          }}
                        >
                          {REACTION_ICONS[type]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Comments toggle */}
              <button
                onClick={() =>
                  setExpandedPost(expandedPost === post.id ? null : post.id)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                <MessageCircle size={18} />
                {comments.filter((c) => c.postId === post.id).length}
              </button>

              {/* Save */}
              <button
                onClick={() => toggleSave(post.id)}
                style={{
                  padding: "6px 10px",
                  background: "none",
                  border: "none",
                  color: post.saved
                    ? "var(--accent-blue)"
                    : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <Bookmark
                  size={20}
                  fill={post.saved ? "currentColor" : "none"}
                  strokeWidth={post.saved ? 2 : 1.5}
                />
              </button>
            </div>
          </div>
        </div>
      ))}

      {sortedPosts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            color: "var(--text-muted)",
            fontSize: 14,
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-3xl)",
            border: "1px dashed var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Search size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Tidak ada postingan ditemukan
          </div>
          <div style={{ fontSize: 13, maxWidth: 360, margin: "0 auto 14px" }}>
            {searchQuery || filterTag !== "all"
              ? "Coba sesuaikan kata kunci pencarian atau ubah filter tag."
              : "Belum ada postingan komunitas. Jadilah yang pertama!"}
          </div>
          {(searchQuery || filterTag !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterTag("all");
              }}
              style={{
                padding: "8px 16px",
                background: "var(--accent-green)",
                border: "none",
                borderRadius: "var(--radius-pill)",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Comments Modal (Instagram-style) */}
      {expandedPost && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(248, 246, 240, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 600,
            padding: "16px",
            animation: "fade-in 0.2s ease-out",
          }}
          onClick={() => {
            setExpandedPost(null);
            setReplyingTo(null);
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              width: "100%",
              maxWidth: 600,
              height: "80vh",
              borderRadius: "var(--radius-3xl)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-floating)",
              animation: "slide-up 0.3s ease-out",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  textAlign: "center",
                  flex: 1,
                }}
              >
                Komentar (
                {comments.filter((c) => c.postId === expandedPost).length})
              </h3>
              <button
                onClick={() => {
                  setExpandedPost(null);
                  setReplyingTo(null);
                }}
                style={{
                  background: "var(--bg-elevated)",
                  border: "none",
                  borderRadius: "50%",
                  padding: 8,
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {postComments(expandedPost).length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "var(--text-muted)",
                  }}
                >
                  {t("no_comments")}
                </div>
              ) : (
                postComments(expandedPost)
                  .filter((c) => !c.replyToId)
                  .map((cmt) => (
                    <div key={cmt.id} style={{ marginBottom: 16 }}>
                      {/* Parent Comment */}
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "var(--bg-elevated)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                          }}
                        >
                          {cmt.authorAvatar.startsWith("http") ? (
                            <img
                              src={cmt.authorAvatar}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            cmt.authorAvatar
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                              }}
                            >
                              {cmt.authorName}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {timeAgo(cmt.timestamp)}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                              lineHeight: 1.5,
                            }}
                          >
                            {cmt.text}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              marginTop: 4,
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={() =>
                                setReplyingTo({
                                  id: cmt.id,
                                  name: cmt.authorName,
                                })
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Balas
                            </button>
                            {currentUser && cmt.authorId === currentUser.id && (
                              <button
                                onClick={() => deleteComment(cmt.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  padding: 2,
                                }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies (1 level deep) */}
                      {postComments(expandedPost)
                        .filter((r) => r.replyToId === cmt.id)
                        .map((reply) => (
                          <div
                            key={reply.id}
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "flex-start",
                              marginTop: 12,
                              marginLeft: 48,
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                overflow: "hidden",
                                background: "var(--bg-elevated)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                              }}
                            >
                              {reply.authorAvatar.startsWith("http") ? (
                                <img
                                  src={reply.authorAvatar}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                reply.authorAvatar
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginBottom: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {reply.authorName}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {timeAgo(reply.timestamp)}
                                </span>
                              </div>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-secondary)",
                                  lineHeight: 1.5,
                                }}
                              >
                                {reply.text}
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  marginTop: 4,
                                  alignItems: "center",
                                }}
                              >
                                {currentUser &&
                                  reply.authorId === currentUser.id && (
                                    <button
                                      onClick={() => deleteComment(reply.id)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        padding: 2,
                                      }}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))
              )}
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border-subtle)",
                background: "var(--bg-primary)",
              }}
            >
              {replyingTo && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    Membalas <strong>@{replyingTo.name}</strong>
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={commentTexts[expandedPost] || ""}
                  onChange={(e) =>
                    setCommentTexts((prev) => ({
                      ...prev,
                      [expandedPost]: e.target.value,
                    }))
                  }
                  placeholder={
                    replyingTo
                      ? `Balas @${replyingTo.name}...`
                      : t("write_comment")
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment(expandedPost);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-pill)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <button
                  onClick={() => handleAddComment(expandedPost)}
                  style={{
                    padding: "0 20px",
                    background: "var(--accent-green)",
                    border: "none",
                    borderRadius: "var(--radius-pill)",
                    color: "#FFF",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactions Modal (LinkedIn-style) */}
      {expandedReactionsPost &&
        (() => {
          const post = posts.find((p) => p.id === expandedReactionsPost);
          if (!post) return null;

          const activeReactions = post.reactions
            .filter((r) => r.count > 0)
            .sort((a, b) => b.count - a.count);
          const totalCount = activeReactions.reduce(
            (sum, r) => sum + r.count,
            0,
          );

          // Generate fake users based on count to simulate list
          const getFakeUsers = (type: string, count: number) => {
            return Array.from({ length: Math.min(count, 15) }).map((_, i) => ({
              id: `${type}-${i}`,
              name: [
                "Dewi Kartika",
                "Raka Mahendra",
                "Sinta Rahayu",
                "Farhan Aditya",
                "Lina Permata",
                "Yoga Pramana",
                "Maya Kusuma",
                "Rizky Fadilah",
                "Andi Pratama",
                "Budi Santoso",
              ][(i + type.charCodeAt(0)) % 10],
              avatar: ["‍", "‍", "‍", "‍", "‍", "‍", "‍", "‍", "", ""][
                (i + type.charCodeAt(0)) % 10
              ],
              role: [
                "Software Engineer",
                "Product Designer",
                "Data Scientist",
                "Frontend Dev",
                "Backend Dev",
                "Student",
                "UI/UX",
              ][(i + type.charCodeAt(0)) % 7],
              type,
            }));
          };

          const allFakeReactors = activeReactions.flatMap((r) =>
            getFakeUsers(r.type, r.count),
          );
          const displayReactors =
            reactionsTab === "all"
              ? allFakeReactors
              : allFakeReactors.filter((u) => u.type === reactionsTab);

          return (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(248, 246, 240, 0.6)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 600,
                padding: "16px",
                animation: "fade-in 0.2s ease-out",
              }}
              onClick={() => setExpandedReactionsPost(null)}
            >
              <div
                style={{
                  background: "var(--bg-card)",
                  width: "100%",
                  maxWidth: 500,
                  height: "70vh",
                  borderRadius: "var(--radius-3xl)",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "var(--shadow-floating)",
                  animation: "slide-up 0.3s ease-out",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    Reaksi
                  </h3>
                  <button
                    onClick={() => setExpandedReactionsPost(null)}
                    style={{
                      background: "var(--bg-elevated)",
                      border: "none",
                      borderRadius: "50%",
                      padding: 8,
                      cursor: "pointer",
                      color: "var(--text-primary)",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border-subtle)",
                    overflowX: "auto",
                  }}
                >
                  <button
                    onClick={() => setReactionsTab("all")}
                    style={{
                      padding: "6px 12px",
                      background:
                        reactionsTab === "all"
                          ? "var(--accent-blue)"
                          : "var(--bg-elevated)",
                      border: "none",
                      borderRadius: "var(--radius-pill)",
                      color:
                        reactionsTab === "all"
                          ? "#FFF"
                          : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Semua {totalCount}
                  </button>
                  {activeReactions.map((r) => (
                    <button
                      key={r.type}
                      onClick={() => setReactionsTab(r.type)}
                      style={{
                        padding: "6px 12px",
                        background:
                          reactionsTab === r.type
                            ? "var(--accent-blue)"
                            : "var(--bg-elevated)",
                        border: "none",
                        borderRadius: "var(--radius-pill)",
                        color:
                          reactionsTab === r.type
                            ? "#FFF"
                            : "var(--text-secondary)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center" }}>
                        {REACTION_ICONS[r.type]}
                      </span>{" "}
                      <span>{r.count}</span>
                    </button>
                  ))}
                </div>

                {/* List */}
                <div
                  style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}
                >
                  {displayReactors.map((user, i) => (
                    <div
                      key={user.id + i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "var(--bg-elevated)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                          }}
                        >
                          {user.avatar}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "var(--bg-card)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div
                            style={{ transform: "scale(0.7)", display: "flex" }}
                          >
                            {REACTION_ICONS[user.type]}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {user.name}
                        </div>
                        <div
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {user.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Edit Post Modal */}
      {editingPost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              width: "100%",
              maxWidth: 560,
              borderRadius: "var(--radius-3xl)",
              padding: 24,
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Edit Post
              </h2>
              <button
                onClick={() => setEditingPost(null)}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input
                placeholder={t("post_title_ph")}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  color: "var(--text-primary)",
                  fontSize: 15,
                  fontWeight: 600,
                  outline: "none",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <textarea
                placeholder={t("post_content_ph")}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <input
                placeholder="Link Gambar (Opsional)"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Inter', sans-serif",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={() => setEditingPost(null)}
                  style={{
                    padding: "10px 20px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-pill)",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => handleEditPost(editingPost)}
                  style={{
                    padding: "10px 20px",
                    background: "var(--accent-blue)",
                    border: "none",
                    borderRadius: "var(--radius-pill)",
                    color: "#FFF",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t("save_changes")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
