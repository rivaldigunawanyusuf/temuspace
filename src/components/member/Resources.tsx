/**
 * Resources.tsx - LMS & Community Vault (Member Tab 2)
 * 
 * Features:
 * - LMS modules with progress tracker
 * - Community vault with file categories
 * - Upload new resources
 */
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useResourceStore, generateModuleId, generateVaultId } from '../../stores/useResourceStore';
import { useAuthStore } from '../../stores/useAuthStore';
import type { VaultCategory } from '../../stores/useResourceStore';
import {
  BookOpen, FolderOpen, Search, Plus, X, CheckCircle2, Circle, Download, Trash2,
  Image, Video, FileText, Link2, Headphones, Layout, Upload, ChevronRight, Clock, Send, RotateCcw
} from 'lucide-react';

const VAULT_ICONS: Record<VaultCategory, React.ReactNode> = {
  photos: <Image size={16} color="#34D399" />,
  videos: <Video size={16} color="#8B5CF6" />,
  files: <FileText size={16} color="#3B82F6" />,
  links: <Link2 size={16} color="#F59E0B" />,
  audio: <Headphones size={16} color="#EC4899" />,
  templates: <Layout size={16} color="#3B82F6" />,
};

const VAULT_LABELS: Record<VaultCategory, string> = {
  photos: 'Foto',
  videos: 'Video',
  files: 'Dokumen',
  links: 'Link',
  audio: 'Audio',
  templates: 'Template',
};

export default function Resources() {
  const { t } = useTranslation();
  const { modules, vault, updateModuleProgress, addVaultResource, deleteVaultResource, incrementDownload } = useResourceStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [tab, setTab] = useState<'lms' | 'vault'>('lms');
  const [searchQuery, setSearchQuery] = useState('');
  const [lmsCategory, setLmsCategory] = useState<'all' | 'artikel' | 'video' | 'tutorial'>('all');
  const [activeCategory, setActiveCategory] = useState<VaultCategory | 'all'>('all');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [detailTab, setDetailTab] = useState<'materi' | 'diskusi'>('materi');
  const [discussionInput, setDiscussionInput] = useState('');
  const [moduleDiscussions, setModuleDiscussions] = useState<Record<string, any[]>>({
    'm-1': [{
      id: 1,
      authorName: 'Alex Developer',
      authorAvatar: '👨‍💻',
      text: 'Apakah ada referensi tambahan untuk materi ini? Saya masih sedikit bingung di bagian tengah video.',
      timestamp: Date.now() - 7200000
    }]
  });

  // Migration for local storage data
  useEffect(() => {
    let migrated = false;
    const newModules = modules.map(m => {
      if (!m.lessons || m.lessons.length === 0) {
        migrated = true;
        const generatedLessons = Array.from({ length: m.totalSections }).map((_, i) => ({
          id: `lesson-${m.id}-${i}`,
          title: `Bagian ${i + 1}`,
          videoUrl: i % 2 !== 0 ? 'https://www.youtube.com/embed/xXZwZ0DolJc' : 'https://www.youtube.com/embed/AuaABDWFs_8',
          duration: '15:00',
          completed: i < m.completedSections
        }));
        return { ...m, lessons: generatedLessons };
      }
      return m;
    });
    if (migrated) {
      useResourceStore.setState({ modules: newModules });
    }
  }, [modules]);

  // Upload form
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState<VaultCategory>('files');

  const filteredModules = modules.filter((m) =>
    m.isPublished &&
    (lmsCategory === 'all' || m.category === lmsCategory) &&
    (
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const filteredVault = vault.filter((r) =>
    (activeCategory === 'all' || r.category === activeCategory) &&
    (
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleUpload = () => {
    if (!uploadName.trim() || !currentUser) return;
    addVaultResource({
      id: generateVaultId(),
      name: uploadName,
      description: uploadDesc,
      category: uploadCategory,
      fileUrl: '#',
      fileSize: '~',
      uploadedBy: currentUser.name,
      uploadedByAvatar: currentUser.avatar,
      uploadedAt: Date.now(),
      downloads: 0,
      icon: VAULT_LABELS[uploadCategory] === 'Foto' ? '' : '',
    });
    setUploadName('');
    setUploadDesc('');
    setShowUpload(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', padding: '24px 24px 120px' }}>
      {!expandedModule && (
        <>
          {/* Header */}
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', paddingTop: 8, marginBottom: 16 }}>
            Resources
          </h1>

          {/* Tabs */}
          <div style={{
            display: 'flex',
        gap: 8,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-pill)',
        padding: 6,
        marginBottom: 20,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <button
          onClick={() => setTab('lms')}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: tab === 'lms' ? 'var(--bg-primary)' : 'transparent',
            border: tab === 'lms' ? '1px solid var(--border-subtle)' : '1px solid transparent',
            borderRadius: 'var(--radius-pill)',
            color: tab === 'lms' ? 'var(--accent-green)' : 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: tab === 'lms' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <BookOpen size={18} />
          Modul LMS
        </button>
        <button
          onClick={() => setTab('vault')}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: tab === 'vault' ? 'var(--bg-primary)' : 'transparent',
            border: tab === 'vault' ? '1px solid var(--border-subtle)' : '1px solid transparent',
            borderRadius: 'var(--radius-pill)',
            color: tab === 'vault' ? 'var(--accent-green)' : 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: tab === 'vault' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <FolderOpen size={18} />
          Community Vault
        </button>
      </div>
      </>
      )}

      {/* Search */}
      {!expandedModule && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tab === 'lms' ? 'Cari judul materi, topik, atau tag modul...' : 'Cari berkas vault, pengunggah, atau deskripsi...'}
            style={{
              width: '100%',
              padding: '14px 44px 14px 44px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-green)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
              title="Hapus pencarian"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* LMS Tab */}
      {tab === 'lms' && !expandedModule && (
        <>
          {/* Format / Category Filters */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {[
                { key: 'all', label: 'Semua Format', icon: <BookOpen size={14} /> },
                { key: 'video', label: 'Video Tutorial', icon: <Video size={14} /> },
                { key: 'tutorial', label: 'Tutorial Hands-on', icon: <Layout size={14} /> },
                { key: 'artikel', label: 'Artikel Bacaan', icon: <FileText size={14} /> },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setLmsCategory(item.key as any)}
                  style={{
                    padding: '8px 14px',
                    background: lmsCategory === item.key ? 'var(--accent-green)' : 'var(--bg-elevated)',
                    border: `1px solid ${lmsCategory === item.key ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-pill)',
                    color: lmsCategory === item.key ? '#FFF' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: lmsCategory === item.key ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {(searchQuery || lmsCategory !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setLmsCategory('all'); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
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
                Reset Filter
              </button>
            )}
          </div>

          {filteredModules.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: 'var(--bg-elevated)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-3xl)',
              color: 'var(--text-muted)',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--text-muted)',
              }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Tidak ada modul pembelajaran yang sesuai
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.5 }}>
                Coba gunakan kata kunci pencarian yang berbeda atau ganti filter format untuk menemukan modul yang Anda cari.
              </p>
              {(searchQuery || lmsCategory !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setLmsCategory('all'); }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {filteredModules.map((mod) => (
                <div
                  key={mod.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onClick={() => setExpandedModule(mod.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 'var(--radius-xl)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      flexShrink: 0,
                    }}>
                      {mod.thumbnail ? mod.thumbnail : (
                        mod.category === 'video' ? <Video size={24} color="#8B5CF6" /> :
                        mod.category === 'tutorial' ? <BookOpen size={24} color="var(--accent-green)" /> :
                        <FileText size={24} color="#3B82F6" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: 10,
                          fontWeight: 700,
                          background: mod.category === 'video' ? 'rgba(139,92,246,0.1)' : mod.category === 'tutorial' ? 'rgba(35,122,87,0.1)' : 'rgba(59,130,246,0.1)',
                          color: mod.category === 'video' ? '#8B5CF6' : mod.category === 'tutorial' ? 'var(--accent-green)' : '#3B82F6',
                          textTransform: 'uppercase',
                        }}>
                          {mod.category}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                          <Clock size={12} /> {mod.duration}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>
                        {mod.title}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                        {mod.description.slice(0, 100)}...
                      </p>
                      {/* Progress bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          flex: 1,
                          height: 6,
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-pill)',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          <div style={{
                            width: `${mod.progress}%`,
                            height: '100%',
                            background: mod.progress === 100
                              ? 'var(--accent-green)'
                              : 'var(--accent-blue)',
                            borderRadius: 'var(--radius-pill)',
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: mod.progress === 100 ? 'var(--accent-green)' : 'var(--text-muted)',
                        }}>
                          {mod.progress}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'lms' && expandedModule && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <button 
            onClick={() => setExpandedModule(null)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-pill)', padding: '8px 16px',
              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
              cursor: 'pointer', marginBottom: 16, boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Kembali
          </button>

          {(() => {
            const mod = modules.find(m => m.id === expandedModule);
            if (!mod) return null;
            const lessons = mod.lessons || [];
            const activeLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];

            return (
              <>
                {/* Dummy Video Player */}
                {activeLesson && (
                  <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', marginBottom: 16, borderRadius: 'var(--radius-2xl)', overflow: 'hidden', background: '#000', aspectRatio: '16/9', boxShadow: 'var(--shadow-md)' }}>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={lessons.findIndex(l => l.id === activeLesson.id) % 2 !== 0 ? 'https://www.youtube.com/embed/xXZwZ0DolJc?rel=0' : 'https://www.youtube.com/embed/AuaABDWFs_8?rel=0'} 
                      title={activeLesson.title} 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      style={{ display: 'block' }}
                    ></iframe>
                  </div>
                )}

                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.3 }}>
                  {mod.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, overflow: 'hidden' }}>
                    {mod.authorAvatar?.startsWith('http') || mod.authorAvatar?.startsWith('data:image') ? (
                      <img src={mod.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      mod.authorAvatar || '👤'
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>oleh <strong style={{ color: 'var(--text-primary)' }}>{mod.authorName}</strong></span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {mod.tags.map((t) => (
                    <span key={t} style={{
                      padding: '4px 10px', background: 'rgba(35,122,87,0.1)', borderRadius: 'var(--radius-pill)',
                      color: 'var(--accent-green)', fontSize: 12, fontWeight: 600,
                    }}>#{t}</span>
                  ))}
                </div>
                
                {/* Detail Tabs */}
                <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                  <button 
                    onClick={() => setDetailTab('materi')}
                    style={{ 
                      padding: '8px 4px', 
                      background: 'none', 
                      border: 'none', 
                      borderBottom: detailTab === 'materi' ? '2px solid var(--accent-green)' : '2px solid transparent',
                      color: detailTab === 'materi' ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Materi Pembelajaran
                  </button>
                  <button 
                    onClick={() => setDetailTab('diskusi')}
                    style={{ 
                      padding: '8px 4px', 
                      background: 'none', 
                      border: 'none', 
                      borderBottom: detailTab === 'diskusi' ? '2px solid var(--accent-green)' : '2px solid transparent',
                      color: detailTab === 'diskusi' ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Diskusi
                  </button>
                </div>
                
                {/* Lessons List */}
                {detailTab === 'materi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeIn 0.2s ease-out' }}>
                    {lessons.map((lesson, i) => {
                      const isActive = activeLessonId === lesson.id || (!activeLessonId && i === 0);
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => setActiveLessonId(lesson.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: isActive ? 'rgba(35,122,87,0.1)' : 'var(--bg-primary)',
                            border: `1px solid ${isActive ? 'var(--accent-green)' : 'var(--border-subtle)'}`, 
                            borderRadius: 'var(--radius-xl)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                            {lesson.completed ? <CheckCircle2 size={16} color="var(--accent-green)" /> : <Circle size={16} color="var(--text-muted)" />}
                            <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {lesson.title}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              useResourceStore.getState().toggleLessonComplete(mod.id, lesson.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-pill)',
                              border: 'none',
                              background: lesson.completed ? 'var(--bg-elevated)' : 'var(--accent-green)',
                              color: lesson.completed ? 'var(--text-muted)' : '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {lesson.completed ? t('completed') : t('mark_complete')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Discussion / Comments Section Dummy */}
                {detailTab === 'diskusi' && (
                  <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                        {currentUser?.avatar?.startsWith('http') || currentUser?.avatar?.startsWith('data:image') ? (
                          <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          currentUser?.avatar
                        )}
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                          placeholder={t("write_discussion")}
                          value={discussionInput}
                          onChange={(e) => setDiscussionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && discussionInput.trim()) {
                              const newComment = {
                                id: Date.now(),
                                authorName: currentUser?.name || 'User',
                                authorAvatar: currentUser?.avatar || '👤',
                                text: discussionInput.trim(),
                                timestamp: Date.now()
                              };
                              setModuleDiscussions(prev => ({
                                ...prev,
                                [mod.id]: [newComment, ...(prev[mod.id] || [])]
                              }));
                              setDiscussionInput('');
                            }
                          }}
                          style={{ 
                            width: '100%', 
                            padding: '12px 40px 12px 14px', 
                            borderRadius: 'var(--radius-pill)', 
                            border: '1px solid var(--border-subtle)', 
                            background: 'var(--bg-primary)', 
                            fontSize: 13, 
                            outline: 'none',
                            fontFamily: "'Inter', sans-serif"
                          }}
                        />
                        <button 
                          onClick={() => {
                            if (discussionInput.trim()) {
                              const newComment = {
                                id: Date.now(),
                                authorName: currentUser?.name || 'User',
                                authorAvatar: currentUser?.avatar || '👤',
                                text: discussionInput.trim(),
                                timestamp: Date.now()
                              };
                              setModuleDiscussions(prev => ({
                                ...prev,
                                [mod.id]: [newComment, ...(prev[mod.id] || [])]
                              }));
                              setDiscussionInput('');
                            }
                          }}
                          style={{
                          position: 'absolute',
                          right: 6,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'var(--accent-green)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff'
                        }}>
                          <Send size={14} />
                        </button>
                      </div>
                    </div>

                    {/* New Added Discussions */}
                    {(moduleDiscussions[mod.id] || []).map(comment => (
                      <div key={comment.id} style={{ display: 'flex', gap: 12, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', marginBottom: 12, position: 'relative' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden' }}>
                          {comment.authorAvatar.startsWith('http') || comment.authorAvatar.startsWith('data:image') ? (
                            <img src={comment.authorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : comment.authorAvatar}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{comment.authorName}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Baru saja</span>
                            </div>
                            <button 
                              onClick={() => {
                                setModuleDiscussions(prev => ({
                                  ...prev,
                                  [mod.id]: prev[mod.id].filter(c => c.id !== comment.id)
                                }));
                              }}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Vault Tab */}
      {tab === 'vault' && (
        <div>
          {/* Category filters */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none',  // IE and Edge
            }}>
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {(['all', 'photos', 'videos', 'files', 'links', 'audio', 'templates'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 14px',
                    background: activeCategory === cat ? 'var(--accent-green)' : 'var(--bg-elevated)',
                    border: `1px solid ${activeCategory === cat ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-pill)',
                    color: activeCategory === cat ? '#FFF' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: activeCategory === cat ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat !== 'all' && VAULT_ICONS[cat]}
                  {cat === 'all' ? 'Semua Berkas' : VAULT_LABELS[cat]}
                </button>
              ))}
            </div>

            {(searchQuery || activeCategory !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
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
                Reset Filter
              </button>
            )}
          </div>

          {/* Upload button */}
          <button
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', marginBottom: 16,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-primary)', 
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Upload size={16} />
            Unggah Resource
          </button>

          {showUpload && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}>
              <div style={{ background: 'var(--bg-elevated)', width: '100%', maxWidth: 500, borderRadius: 'var(--radius-3xl)', padding: 24, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Unggah Resource Baru</h2>
                  <button onClick={() => setShowUpload(false)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Nama File</label>
                    <input
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Contoh: Modul Belajar React.pdf"
                      style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Deskripsi</label>
                    <input
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      placeholder="Penjelasan singkat tentang isi file..."
                      style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Kategori File</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as VaultCategory)}
                      style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif" }}
                    >
                      {Object.entries(VAULT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    handleUpload();
                    setShowUpload(false);
                  }} 
                  disabled={!uploadName.trim()} 
                  style={{
                    width: '100%', padding: '14px', background: 'var(--accent-green)', border: 'none', borderRadius: 'var(--radius-pill)',
                    color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: uploadName.trim() ? 1 : 0.6,
                    boxShadow: uploadName.trim() ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  Unggah File
                </button>
              </div>
            </div>
          )}

          {/* Resource list */}
          {filteredVault.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: 'var(--bg-elevated)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-3xl)',
              color: 'var(--text-muted)',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--text-muted)',
              }}>
                <FolderOpen size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Tidak ada berkas vault yang sesuai
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.5 }}>
                Coba gunakan kata kunci pencarian yang berbeda atau pilih kategori Semua Berkas.
              </p>
              {(searchQuery || activeCategory !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
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
            filteredVault.map((r) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-2xl)', padding: '16px', marginBottom: 12,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-xl)', background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {VAULT_ICONS[r.category] || <FileText size={20} color="var(--text-muted)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{r.fileSize}</span>
                    <span style={{ fontSize: 8 }}>•</span>
                    <span>{r.uploadedBy}</span>
                    <span style={{ fontSize: 8 }}>•</span>
                    <span>{r.downloads} unduhan</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => incrementDownload(r.id)}
                    style={{ background: 'rgba(35,122,87,0.1)', border: '1px solid rgba(35,122,87,0.2)', borderRadius: 'var(--radius-pill)', padding: '8px 10px', color: 'var(--accent-green)', cursor: 'pointer' }}
                    title="Unduh"
                  >
                    <Download size={16} />
                  </button>
                  {currentUser && (r.uploadedBy === currentUser.name) && (
                    <button
                      onClick={() => deleteVaultResource(r.id)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', padding: '8px 10px', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
