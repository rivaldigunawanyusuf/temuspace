/**
 * usePostStore.ts - FYP Posts, Comments, Reactions (Zustand + persist)
 * 
 * Full CRUD: Create, Read, Update, Delete posts and comments
 * Rich seed data themed around a student tech community
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PostReaction {
  type: string;
  count: number;
  reacted: boolean; // current user reacted
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: number;
  replyToId?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  collabAuthorId?: string;
  collabAuthorName?: string;
  collabAuthorAvatar?: string;
  title: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  reactions: PostReaction[];
  upvotes: number;
  upvoted: boolean;
  commentCount: number;
  saved: boolean;
  pinned: boolean;
  timestamp: number;
  isDeleted: boolean;
}

// ============================================================
// Rich Seed Data
// ============================================================

const now = Date.now();
const HOUR = 3600000;
const DAY = 86400000;

const SEED_POSTS: Post[] = [
  {
    id: 'post-001',
    authorId: 'user-admin-001',
    authorName: 'Dewi Kartika',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    title: ' Selamat Datang di TemuSpace v1.0!',
    content: 'Hai semua! Akhirnya platform komunitas kita resmi diluncurkan. TemuSpace hadir sebagai ruang virtual untuk berkolaborasi, belajar, dan berkembang bersama. Jangan lupa eksplor Virtual Room kita ya! ',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['pengumuman', 'temuspace', 'launch'],
    reactions: [
      { type: 'like', count: 34, reacted: false },
      { type: 'love', count: 28, reacted: false },
      { type: 'insight', count: 19, reacted: false },
      { type: 'celebrate', count: 5, reacted: false },
    ],
    upvotes: 47,
    upvoted: false,
    commentCount: 12,
    saved: false,
    pinned: true,
    timestamp: now - 7 * DAY,
    isDeleted: false,
  },
  {
    id: 'post-002',
    authorId: 'user-002',
    authorName: 'Raka Mahendra',
    authorAvatar: 'https://i.pravatar.cc/150?u=Raka',
    title: 'Tips Lolos Hackathon Nasional 2026 ',
    content: 'Sharing pengalaman ikut hackathon kemarin. Yang paling penting: 1) Validasi ide sebelum ngoding, 2) Bagi peran tim dengan jelas, 3) Fokus ke MVP bukan fitur lengkap, 4) Presentasi yang menjual. Semangat buat yang mau ikut kompetisi selanjutnya! ',
    tags: ['hackathon', 'tips', 'kompetisi'],
    reactions: [
      { type: 'like', count: 42, reacted: false },
      { type: 'love', count: 15, reacted: false },
      { type: 'insight', count: 23, reacted: false },
      { type: 'celebrate', count: 8, reacted: false },
    ],
    upvotes: 38,
    upvoted: false,
    commentCount: 8,
    saved: false,
    pinned: false,
    timestamp: now - 5 * DAY,
    isDeleted: false,
  },
  {
    id: 'post-003',
    authorId: 'user-003',
    authorName: 'Sinta Rahayu',
    authorAvatar: 'https://i.pravatar.cc/150?u=Sinta',
    collabAuthorId: 'user-004',
    collabAuthorName: 'Budi Santoso',
    collabAuthorAvatar: 'https://i.pravatar.cc/150?u=Budi',
    title: ' Design System untuk Proyek Open Source',
    content: 'Aku dan Budi baru bikin design system open-source yang bisa dipakai siapa aja. Termasuk komponen button, card, modal, dan color palette dark mode. Cek di tab Resources ya! Feedback sangat ditunggu ',
    tags: ['design-system', 'open-source', 'ui-ux', 'collab'],
    reactions: [
      { type: 'like', count: 29, reacted: false },
      { type: '️', count: 31, reacted: false },
      { type: 'love', count: 18, reacted: false },
      { type: 'insight', count: 14, reacted: false },
    ],
    upvotes: 52,
    upvoted: false,
    commentCount: 15,
    saved: false,
    pinned: false,
    timestamp: now - 3 * DAY,
    isDeleted: false,
  },
  {
    id: 'post-004',
    authorId: 'user-005',
    authorName: 'Farhan Aditya',
    authorAvatar: 'https://i.pravatar.cc/150?u=Farhan',
    title: 'React 20 Sudah Rilis! Apa yang Baru? ',
    content: 'React 20 bawa banyak perubahan besar: Server Components jadi default, Compiler built-in, dan signals API baru. Yang paling keren menurut aku adalah fitur automatic memoization. Udah ada yang coba? Share pengalaman kalian!',
    tags: ['react', 'javascript', 'web-dev'],
    reactions: [
      { type: 'celebrate', count: 45, reacted: false },
      { type: 'like', count: 38, reacted: false },
      { type: 'love', count: 12, reacted: false },
      { type: 'insight', count: 9, reacted: false },
    ],
    upvotes: 61,
    upvoted: false,
    commentCount: 22,
    saved: false,
    pinned: false,
    timestamp: now - 2 * DAY,
    isDeleted: false,
  },
  {
    id: 'post-andi-1',
    authorId: 'user-member-001',
    authorName: 'Andi Pratama',
    authorAvatar: 'https://i.pravatar.cc/150?u=Andi',
    title: 'Review: 3 Bulan Menggunakan Neovim',
    content: 'Setelah sekian lama pakai VSCode, akhirnya aku memutuskan pindah full ke Neovim. Proses blajarnya memang berdarah-darah, tapi sekarang workflow jauh lebih cepat tanpa harus lepas tangan dari keyboard. Ada yang pakai Neovim juga di sini?',
    imageUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    tags: ['tools', 'neovim', 'coding'],
    reactions: [
      { type: 'like', count: 12, reacted: false },
      { type: 'insight', count: 8, reacted: false }
    ],
    upvotes: 24,
    upvoted: true,
    commentCount: 5,
    saved: false,
    pinned: false,
    timestamp: now - 1 * DAY,
    isDeleted: false,
  },
  {
    id: 'post-andi-collab',
    authorId: 'user-005',
    authorName: 'Farhan Aditya',
    authorAvatar: 'https://i.pravatar.cc/150?u=Farhan',
    collabAuthorId: 'user-member-001',
    collabAuthorName: 'Andi Pratama',
    collabAuthorAvatar: 'https://i.pravatar.cc/150?u=Andi',
    title: 'Project Open Source: Mini CLI untuk Deployment',
    content: 'Aku dan Andi baru aja open source sebuah tool CLI kecil yang dibuat pakai Go untuk mempermudah auto-deployment ke VPS. Cukup satu command `deploy up`. Yang mau bantu kontribusi, link repo ada di komentar ya!',
    tags: ['open-source', 'go', 'devops', 'collab'],
    reactions: [
      { type: 'celebrate', count: 30, reacted: false },
      { type: 'love', count: 15, reacted: false }
    ],
    upvotes: 45,
    upvoted: false,
    commentCount: 10,
    saved: true,
    pinned: false,
    timestamp: now - 12 * HOUR,
    isDeleted: false,
  },
  {
    id: 'post-andi-saved',
    authorId: 'user-admin-001',
    authorName: 'Dewi Kartika',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi',
    title: 'Roadmap Belajar Web Security 2026',
    content: 'Banyak yang tanya gimana cara mulai belajar web security. Aku udah rangkum materinya dari basic OWASP Top 10 sampai ke advanced bug bounty tips. Silakan di-save buat referensi belajar teman-teman!',
    tags: ['security', 'roadmap', 'learning'],
    reactions: [
      { type: 'insight', count: 50, reacted: false },
      { type: 'love', count: 20, reacted: false }
    ],
    upvotes: 89,
    upvoted: false,
    commentCount: 14,
    saved: true,
    pinned: false,
    timestamp: now - 4 * DAY,
    isDeleted: false,
  },
  {
    id: 'post-005',
    authorId: 'user-006',
    authorName: 'Lina Permata',
    authorAvatar: 'https://i.pravatar.cc/150?u=Lina',
    title: 'Workshop: Intro to Machine Learning ',
    content: 'Reminder! Workshop ML besok jam 3 sore di Virtual Room TemuSpace zona Townhall. Materi: supervised vs unsupervised learning, hands-on dengan scikit-learn. Bawa laptop yang sudah install Python ya! Link daftar ada di Events.',
    tags: ['workshop', 'machine-learning', 'python'],
    reactions: [
      { type: 'celebrate', count: 33, reacted: false },
      { type: 'like', count: 21, reacted: false },
      { type: 'love', count: 16, reacted: false },
      { type: '️', count: 11, reacted: false },
    ],
    upvotes: 44,
    upvoted: false,
    commentCount: 7,
    saved: false,
    pinned: false,
    timestamp: now - 1 * DAY,
    isDeleted: false,
  },
  {
    id: 'post-006',
    authorId: 'user-007',
    authorName: 'Yoga Pramana',
    authorAvatar: 'https://i.pravatar.cc/150?u=Yoga',
    title: 'Portofolio Web Developer yang Menarik Rekruter ',
    content: 'Setelah apply ke 50+ perusahaan, ini pola yang aku notice: 1) Tampilkan 3-4 proyek terbaik, bukan semua, 2) Live demo > screenshot, 3) Ceritakan problem & solusi, bukan cuma tech stack. Oh ya, dark mode itu nilai plus lho ',
    tags: ['karir', 'portfolio', 'web-dev'],
    reactions: [
      { type: 'insight', count: 56, reacted: false },
      { type: 'celebrate', count: 27, reacted: false },
      { type: 'like', count: 19, reacted: false },
      { type: 'love', count: 15, reacted: false },
    ],
    upvotes: 73,
    upvoted: false,
    commentCount: 18,
    saved: false,
    pinned: false,
    timestamp: now - 18 * HOUR,
    isDeleted: false,
  },
  {
    id: 'post-007',
    authorId: 'user-008',
    authorName: 'Maya Kusuma',
    authorAvatar: 'https://i.pravatar.cc/150?u=Maya',
    collabAuthorId: 'user-002',
    collabAuthorName: 'Raka Mahendra',
    collabAuthorAvatar: 'https://i.pravatar.cc/150?u=Raka',
    title: ' Backend API Komunitas - Progress Update',
    content: 'Update progress API komunitas kita: Auth endpoint , Post CRUD , Event management , File upload  (80%), Notification system . Target selesai minggu depan. Siapa yang mau bantu testing? DM aku ya!',
    tags: ['backend', 'api', 'progress', 'collab'],
    reactions: [
      { type: 'insight', count: 18, reacted: false },
      { type: 'celebrate', count: 24, reacted: false },
      { type: 'like', count: 7, reacted: false },
      { type: 'love', count: 13, reacted: false },
    ],
    upvotes: 35,
    upvoted: false,
    commentCount: 9,
    saved: false,
    pinned: false,
    timestamp: now - 12 * HOUR,
    isDeleted: false,
  },
  {
    id: 'post-008',
    authorId: 'user-009',
    authorName: 'Rizky Fadilah',
    authorAvatar: 'https://i.pravatar.cc/150?u=Rizky',
    title: 'Belajar Rust di 2026, Worth It Gak? ',
    content: 'Setelah 3 bulan belajar Rust, ini pendapatku: memory safety tanpa GC itu game changer, tapi learning curve-nya steep banget. Borrow checker bikin frustasi awal-awal tapi lama-lama paham konsepnya. Cocok untuk yang mau deep dive systems programming.',
    tags: ['rust', 'programming', 'belajar'],
    reactions: [
      { type: 'insight', count: 41, reacted: false },
      { type: '️', count: 33, reacted: false },
      { type: 'celebrate', count: 11, reacted: false },
      { type: 'like', count: 6, reacted: false },
    ],
    upvotes: 49,
    upvoted: false,
    commentCount: 25,
    saved: false,
    pinned: false,
    timestamp: now - 6 * HOUR,
    isDeleted: false,
  },
];

const SEED_COMMENTS: PostComment[] = [
  { id: 'cmt-001', postId: 'post-001', authorId: 'user-002', authorName: 'Raka Mahendra',
    authorAvatar: 'https://i.pravatar.cc/150?u=Raka', text: 'Keren banget! Akhirnya punya platform sendiri ', timestamp: now - 7 * DAY + HOUR },
  { id: 'cmt-002', postId: 'post-001', authorId: 'user-003', authorName: 'Sinta Rahayu',
    authorAvatar: 'https://i.pravatar.cc/150?u=Sinta', text: 'Virtual Room-nya epic! Serasa Gather.town versi kampus ', timestamp: now - 7 * DAY + 2 * HOUR },
  { id: 'cmt-003', postId: 'post-001', authorId: 'user-005', authorName: 'Farhan Aditya',
    authorAvatar: 'https://i.pravatar.cc/150?u=Farhan', text: 'Design-nya clean banget, suka dark mode-nya! ', timestamp: now - 7 * DAY + 3 * HOUR },
  { id: 'cmt-004', postId: 'post-002', authorId: 'user-006', authorName: 'Lina Permata',
    authorAvatar: 'https://i.pravatar.cc/150?u=Lina', text: 'Point no 3 itu bener banget. Dulu kita malah overengineering MVPnya ', timestamp: now - 5 * DAY + HOUR },
  { id: 'cmt-005', postId: 'post-002', authorId: 'user-007', authorName: 'Yoga Pramana',
    authorAvatar: 'https://i.pravatar.cc/150?u=Yoga', text: 'Hackathon mana tuh Rak? Pengen ikut juga next time!', timestamp: now - 5 * DAY + 2 * HOUR },
  { id: 'cmt-006', postId: 'post-003', authorId: 'user-admin-001', authorName: 'Dewi Kartika',
    authorAvatar: 'https://i.pravatar.cc/150?u=Dewi', text: 'Mantap collab-nya! Bisa dipake buat redesign website organisasi ', timestamp: now - 3 * DAY + HOUR },
  { id: 'cmt-007', postId: 'post-004', authorId: 'user-002', authorName: 'Raka Mahendra',
    authorAvatar: 'https://i.pravatar.cc/150?u=Raka', text: 'Automatic memoization bisa bikin React makin ngebut nih! ', timestamp: now - 2 * DAY + HOUR },
  { id: 'cmt-008', postId: 'post-004', authorId: 'user-008', authorName: 'Maya Kusuma',
    authorAvatar: 'https://i.pravatar.cc/150?u=Maya', text: 'Server Components jadi default? Berarti Next.js makin relevan dong', timestamp: now - 2 * DAY + 2 * HOUR },
  { id: 'cmt-009', postId: 'post-005', authorId: 'user-member-001', authorName: 'Andi Pratama',
    authorAvatar: 'https://i.pravatar.cc/150?u=Andi', text: 'Sudah daftar! Excited banget buat workshop-nya ', timestamp: now - 1 * DAY + HOUR },
  { id: 'cmt-010', postId: 'post-006', authorId: 'user-003', authorName: 'Sinta Rahayu',
    authorAvatar: 'https://i.pravatar.cc/150?u=Sinta', text: 'Setuju! Dark mode itu bukan cuma estetika, tapi juga accessibility ', timestamp: now - 16 * HOUR },
  { id: 'cmt-011', postId: 'post-008', authorId: 'user-005', authorName: 'Farhan Aditya',
    authorAvatar: 'https://i.pravatar.cc/150?u=Farhan', text: 'Borrow checker memang pain awalnya, tapi setelah paham jadi addictive ', timestamp: now - 5 * HOUR },
  { id: 'cmt-012', postId: 'post-008', authorId: 'user-009', authorName: 'Rizky Fadilah',
    authorAvatar: 'https://i.pravatar.cc/150?u=Rizky', text: 'Betul! Dan community Rust termasuk yang paling helpful ', timestamp: now - 4 * HOUR },
];

// ============================================================
// Store
// ============================================================

interface PostState {
  posts: Post[];
  comments: PostComment[];

  // Post CRUD
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  toggleUpvote: (id: string) => void;
  toggleReaction: (postId: string, type: PostReaction['type']) => void;
  toggleSave: (id: string) => void;
  togglePin: (id: string) => void;

  // Comment CRUD
  addComment: (comment: PostComment) => void;
  deleteComment: (commentId: string) => void;

  // Helpers
  getPostComments: (postId: string) => PostComment[];
}

let postCounter = 100;
export function generatePostId(): string {
  return `post-${Date.now()}-${++postCounter}`;
}

let commentCounter = 100;
export function generateCommentId(): string {
  return `cmt-${Date.now()}-${++commentCounter}`;
}

export const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      posts: SEED_POSTS.map(p => ({ ...p, commentCount: SEED_COMMENTS.filter(c => c.postId === p.id).length })),
      comments: SEED_COMMENTS,

      addPost: (post) =>
        set((state) => ({ posts: [post, ...state.posts] })),

      updatePost: (id, updates) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
          comments: state.comments.filter((c) => c.postId !== id),
        })),

      toggleUpvote: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? { ...p, upvoted: !p.upvoted, upvotes: p.upvoted ? p.upvotes - 1 : p.upvotes + 1 }
              : p
          ),
        })),

      toggleReaction: (postId, type) =>
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p;
            
            const currentReaction = p.reactions.find(r => r.reacted);
            
            // If clicking the same reaction, just remove it
            if (currentReaction && currentReaction.type === type) {
              return {
                ...p,
                reactions: p.reactions.map(r => 
                  r.type === type ? { ...r, reacted: false, count: r.count - 1 } : r
                )
              };
            }
            
            // Otherwise, swap to the new reaction
            let nextReactions = p.reactions.map(r => 
              r.reacted ? { ...r, reacted: false, count: r.count - 1 } : r
            );
            
            if (nextReactions.some(r => r.type === type)) {
              nextReactions = nextReactions.map(r => 
                r.type === type ? { ...r, reacted: true, count: r.count + 1 } : r
              );
            } else {
              nextReactions = [...nextReactions, { type, count: 1, reacted: true }];
            }
            
            return { ...p, reactions: nextReactions };
          }),
        })),

      toggleSave: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, saved: !p.saved } : p
          ),
        })),

      togglePin: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, pinned: !p.pinned } : p
          ),
        })),

      addComment: (comment) =>
        set((state) => ({
          comments: [...state.comments, comment],
          posts: state.posts.map((p) =>
            p.id === comment.postId ? { ...p, commentCount: p.commentCount + 1 } : p
          ),
        })),

      deleteComment: (commentId) =>
        set((state) => {
          const comment = state.comments.find((c) => c.id === commentId);
          return {
            comments: state.comments.filter((c) => c.id !== commentId),
            posts: comment
              ? state.posts.map((p) =>
                  p.id === comment.postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
                )
              : state.posts,
          };
        }),

      getPostComments: (postId) => {
        return get().comments.filter((c) => c.postId === postId);
      },
    }),
    {
      name: 'temuspace-posts',
      version: 2,
    }
  )
);
