/**
 * LMSStudio.tsx - LMS & Resource Studio (Admin)
 * 
 * Full CRUD for LMS Modules and Vault Files:
 * - Tab 1: Modul LMS (Add, Edit, Delete with confirmation, Publish/Draft toggle, Preview)
 * - Tab 2: Vault Files (Add, Edit, Delete with confirmation, Category filter, Search, Preview)
 * - Search & Filter by category (Dokumen, Template, Foto, Video, Audio, Link)
 * - Stat overview cards
 * - Toast notifications
 */
import { useState, useMemo, useEffect } from 'react';
import {
  useResourceStore,
  generateModuleId,
  generateVaultId,
} from '../../stores/useResourceStore';
import type { LMSModule, VaultResource, VaultCategory } from '../../stores/useResourceStore';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  BookOpen, FolderOpen, Plus, X, Trash2, Edit3, Eye, EyeOff, Search,
  Download, FileText, Layout, Image as ImageIcon, Video, Headphones, Link2,
  ExternalLink, Check, AlertCircle, AlertTriangle, Layers, Calendar, Clock,
  ArrowUpDown, User, CheckCircle2
} from 'lucide-react';
import { COMMUNITY_USERS, getCommunityUserByName } from '../../data/communityUsers';

const VAULT_CATEGORIES: { key: VaultCategory; label: string; icon: string; color: string }[] = [
  { key: 'files', label: 'Dokumen', icon: '📄', color: '#3B82F6' },
  { key: 'templates', label: 'Template', icon: '📐', color: '#8B5CF6' },
  { key: 'photos', label: 'Foto', icon: '🖼️', color: '#34D399' },
  { key: 'videos', label: 'Video', icon: '🎬', color: '#EC4899' },
  { key: 'audio', label: 'Audio', icon: '🎙️', color: '#F59E0B' },
  { key: 'links', label: 'Link Web', icon: '🔗', color: '#10B981' },
];

export default function LMSStudio() {
  const {
    modules,
    vault,
    addModule,
    updateModule,
    deleteModule,
    addVaultResource,
    updateVaultResource,
    deleteVaultResource,
  } = useResourceStore();
  const { currentUser } = useAuthStore();

  const [tab, setTab] = useState<'modules' | 'vault'>('vault');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState<VaultCategory | 'all'>('all');
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<'all' | 'artikel' | 'video' | 'tutorial'>('all');

  // Module Form Modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleEditingId, setModuleEditingId] = useState<string | null>(null);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mCategory, setMCategory] = useState<'artikel' | 'video' | 'tutorial'>('artikel');
  const [mAuthorName, setMAuthorName] = useState('Dewi Kartika');
  const [mDuration, setMDuration] = useState('');
  const [mSections, setMSections] = useState('4');
  const [mTags, setMTags] = useState('');
  const [mContent, setMContent] = useState('');

  // Vault Form Modal
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultEditingId, setVaultEditingId] = useState<string | null>(null);
  const [vName, setVName] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vCategory, setVCategory] = useState<VaultCategory>('files');
  const [vFileSize, setVFileSize] = useState('1.5 MB');
  const [vFileUrl, setVFileUrl] = useState('#');
  const [vIcon, setVIcon] = useState('📄');
  const [vUploadedBy, setVUploadedBy] = useState('Dewi Kartika');
  const [vDownloads, setVDownloads] = useState('0');

  // Delete Confirmation Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'module' | 'vault'; id: string; name: string } | null>(null);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVaultDetail, setSelectedVaultDetail] = useState<VaultResource | null>(null);
  const [selectedModuleDetail, setSelectedModuleDetail] = useState<LMSModule | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Filtered Vault Files
  const filteredVault = useMemo(() => {
    return vault.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        vaultCategoryFilter === 'all' || r.category === vaultCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [vault, searchQuery, vaultCategoryFilter]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        moduleCategoryFilter === 'all' || m.category === moduleCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [modules, searchQuery, moduleCategoryFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalModules = modules.length;
    const publishedModules = modules.filter((m) => m.isPublished).length;
    const totalVaultFiles = vault.length;
    const totalDownloads = vault.reduce((sum, v) => sum + v.downloads, 0);
    return { totalModules, publishedModules, totalVaultFiles, totalDownloads };
  }, [modules, vault]);

  // Open Add Module
  const handleOpenAddModule = () => {
    setModuleEditingId(null);
    setMTitle('');
    setMDesc('');
    setMCategory('artikel');
    setMAuthorName(currentUser?.name || 'Dewi Kartika');
    setMDuration('15 menit baca');
    setMSections('4');
    setMTags('programming, web-dev');
    setMContent('');
    setShowModuleModal(true);
  };

  // Open Edit Module
  const handleOpenEditModule = (m: LMSModule) => {
    setModuleEditingId(m.id);
    setMTitle(m.title);
    setMDesc(m.description);
    setMCategory(m.category);
    setMAuthorName(m.authorName || 'Dewi Kartika');
    setMDuration(m.duration);
    setMSections(String(m.totalSections));
    setMTags(m.tags.join(', '));
    setMContent(m.content || '');
    setShowModuleModal(true);
  };

  // Submit Module
  const handleSubmitModule = () => {
    if (!mTitle.trim()) {
      showToast('Judul modul wajib diisi!', 'error');
      return;
    }
    const authorUser = getCommunityUserByName(mAuthorName);
    const data = {
      title: mTitle.trim(),
      description: mDesc.trim(),
      category: mCategory,
      authorName: mAuthorName || 'Dewi Kartika',
      authorAvatar: authorUser ? (authorUser.avatarUrl || authorUser.avatar) : (currentUser?.avatar || 'https://i.pravatar.cc/150?u=Dewi'),
      duration: mDuration || '15 menit',
      thumbnail: mCategory === 'video' ? '🎬' : mCategory === 'tutorial' ? '💻' : '📖',
      content: mContent.trim(),
      progress: 0,
      totalSections: parseInt(mSections) || 4,
      completedSections: 0,
      tags: mTags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      isPublished: true,
    };
    if (moduleEditingId) {
      updateModule(moduleEditingId, data);
      showToast('✏️ Modul LMS berhasil diperbarui!');
    } else {
      addModule({ id: generateModuleId(), ...data });
      showToast('✅ Modul LMS baru berhasil ditambahkan!');
    }
    setShowModuleModal(false);
  };

  // Open Add Vault Resource
  const handleOpenAddVault = () => {
    setVaultEditingId(null);
    setVName('');
    setVDesc('');
    setVCategory('files');
    setVFileSize('1.2 MB');
    setVFileUrl('#');
    setVIcon('📄');
    setVUploadedBy(currentUser?.name || 'Dewi Kartika');
    setVDownloads('0');
    setShowVaultModal(true);
  };

  // Open Edit Vault Resource
  const handleOpenEditVault = (r: VaultResource) => {
    setVaultEditingId(r.id);
    setVName(r.name);
    setVDesc(r.description);
    setVCategory(r.category);
    setVFileSize(r.fileSize);
    setVFileUrl(r.fileUrl || '#');
    setVIcon(r.icon || '📄');
    setVUploadedBy(r.uploadedBy);
    setVDownloads(String(r.downloads));
    setShowVaultModal(true);
  };

  // Change category helper for Vault form (also changes default icon)
  const handleSelectVaultCategory = (cat: VaultCategory) => {
    setVCategory(cat);
    const catItem = VAULT_CATEGORIES.find((c) => c.key === cat);
    if (catItem) {
      setVIcon(catItem.icon);
      if (cat === 'links') setVFileSize('-');
      else if (cat === 'templates') setVFileSize('5.4 MB');
      else if (cat === 'photos') setVFileSize('12.5 MB');
      else if (cat === 'videos') setVFileSize('150 MB');
      else if (cat === 'audio') setVFileSize('35 MB');
    }
  };

  // Submit Vault Resource
  const handleSubmitVault = () => {
    if (!vName.trim()) {
      showToast('Nama file / resource wajib diisi!', 'error');
      return;
    }
    const data: Omit<VaultResource, 'id'> = {
      name: vName.trim(),
      description: vDesc.trim() || 'Resource untuk komunitas TemuSpace',
      category: vCategory,
      fileUrl: vFileUrl.trim() || '#',
      fileSize: vCategory === 'links' ? '-' : (vFileSize.trim() || '1.0 MB'),
      uploadedBy: vUploadedBy.trim() || (currentUser?.name || 'Dewi Kartika'),
      uploadedByAvatar: '👤',
      uploadedAt: Date.now(),
      downloads: parseInt(vDownloads) || 0,
      icon: vIcon || '📄',
    };

    if (vaultEditingId) {
      updateVaultResource(vaultEditingId, data);
      showToast('✏️ File Vault berhasil diperbarui!');
    } else {
      addVaultResource({ id: generateVaultId(), ...data });
      showToast('✅ File baru berhasil ditambahkan ke Vault!');
    }
    setShowVaultModal(false);
  };

  // Trigger Delete Confirmation
  const handleTriggerDelete = (type: 'module' | 'vault', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'module') {
      deleteModule(deleteTarget.id);
      showToast(`🗑️ Modul "${deleteTarget.name}" telah dihapus!`, 'info');
    } else {
      deleteVaultResource(deleteTarget.id);
      showToast(`🗑️ File Vault "${deleteTarget.name}" telah dihapus!`, 'info');
    }
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const getCategoryBadge = (cat: VaultCategory) => {
    const item = VAULT_CATEGORIES.find((c) => c.key === cat) || VAULT_CATEGORIES[0];
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        background: `${item.color}18`,
        color: item.color,
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}>
        {item.icon} {item.label}
      </span>
    );
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
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'info' ? <Trash2 size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 2, display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
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
            <BookOpen size={13} />
            Edukasi & Repositori Komunitas
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            LMS & Resource Studio
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Pusat pengelolaan modul belajar LMS dan aset berkas bersama di Community Vault.
          </p>
        </div>

        {/* Primary Action Button */}
        <div>
          {tab === 'modules' ? (
            <button
              onClick={handleOpenAddModule}
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
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Modul LMS
            </button>
          ) : (
            <button
              onClick={handleOpenAddVault}
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
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah File Vault
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 20,
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
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Modul LMS</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.totalModules}</div>
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
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Modul Dipublikasikan</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.publishedModules}</div>
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
            <FolderOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Berkas Vault</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.totalVaultFiles}</div>
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
            background: 'rgba(139, 92, 246, 0.1)',
            color: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Download size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total Unduhan Komunitas</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.totalDownloads}</div>
          </div>
        </div>
      </div>

      {/* Main Tabs (Modul LMS vs Vault Files) */}
      <div style={{
        display: 'flex',
        gap: 6,
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-sm)',
        borderRadius: 'var(--radius-2xl)',
        padding: 5,
        marginBottom: 16,
      }}>
        <button
          onClick={() => { setTab('modules'); setSearchQuery(''); }}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: tab === 'modules' ? 'var(--accent-terracotta)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            color: tab === 'modules' ? '#FFFFFF' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen size={16} /> Modul LMS ({modules.length})
        </button>

        <button
          onClick={() => { setTab('vault'); setSearchQuery(''); }}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: tab === 'vault' ? 'var(--accent-terracotta)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            color: tab === 'vault' ? '#FFFFFF' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <FolderOpen size={16} /> Vault Files ({vault.length})
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Search */}
        <div style={{
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
            placeholder={
              tab === 'vault'
                ? 'Cari nama file, deskripsi, atau pengunggah...'
                : 'Cari judul materi, deskripsi, atau tag modul...'
            }
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

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Kategori:</span>
          {tab === 'vault' ? (
            <>
              <button
                onClick={() => setVaultCategoryFilter('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: vaultCategoryFilter === 'all' ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                  border: `1px solid ${vaultCategoryFilter === 'all' ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                  color: vaultCategoryFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Semua ({vault.length})
              </button>
              {VAULT_CATEGORIES.map((cat) => {
                const count = vault.filter((r) => r.category === cat.key).length;
                const isActive = vaultCategoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setVaultCategoryFilter(cat.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: isActive ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                      border: `1px solid ${isActive ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label} ({count})</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {(['all', 'artikel', 'video', 'tutorial'] as const).map((cat) => {
                const isActive = moduleCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setModuleCategoryFilter(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: isActive ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                      border: `1px solid ${isActive ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat === 'all' ? `Semua (${modules.length})` : cat}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: Modul LMS List                                        */}
      {/* ============================================================ */}
      {tab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredModules.length === 0 ? (
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-3xl)',
              padding: '40px 20px',
              textAlign: 'center',
            }}>
              <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Tidak Ada Modul Ditemukan
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Tidak ada modul yang sesuai dengan pencarian atau filter yang aktif.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setModuleCategoryFilter('all'); }}
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
                Reset Filter
              </button>
            </div>
          ) : (
            filteredModules.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-2xl)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}>
                    {m.thumbnail || '📖'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 700, color: 'var(--accent-terracotta)' }}>{m.category}</span>
                      <span>• {m.duration}</span>
                      <span>• {m.totalSections} bagian</span>
                      <span>• Oleh {m.authorName}</span>
                    </div>
                  </div>
                </div>

                {/* Manage Buttons for LMS Module */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Toggle Published */}
                  <button
                    onClick={() => {
                      updateModule(m.id, { isPublished: !m.isPublished });
                      showToast(m.isPublished ? 'Modul diubah ke status Draft' : 'Modul berhasil Dipublikasikan');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 10px',
                      background: m.isPublished ? 'rgba(35, 122, 87, 0.1)' : 'var(--bg-primary)',
                      border: `1px solid ${m.isPublished ? 'rgba(35, 122, 87, 0.3)' : 'var(--border-medium)'}`,
                      borderRadius: 'var(--radius-lg)',
                      color: m.isPublished ? 'var(--accent-green)' : 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title={m.isPublished ? 'Dipublikasikan (Klik untuk sembunyikan)' : 'Draft (Klik untuk tayangkan)'}
                  >
                    {m.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    {m.isPublished ? 'Live' : 'Draft'}
                  </button>

                  {/* Detail */}
                  <button
                    onClick={() => {
                      setSelectedModuleDetail(m);
                      setDetailModalOpen(true);
                    }}
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
                    }}
                  >
                    <BookOpen size={12} color="var(--accent-blue)" />
                    Detail
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditModule(m)}
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
                    }}
                  >
                    <Edit3 size={12} color="var(--accent-green)" />
                    Edit
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleTriggerDelete('module', m.id, m.title)}
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
                    }}
                  >
                    <Trash2 size={13} />
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: Vault Files List (Full Management)                    */}
      {/* ============================================================ */}
      {tab === 'vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredVault.length === 0 ? (
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-3xl)',
              padding: '40px 20px',
              textAlign: 'center',
            }}>
              <FolderOpen size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Tidak Ada File Vault Ditemukan
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Tidak ada file berkas yang sesuai dengan kriteria pencarian Anda.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setVaultCategoryFilter('all'); }}
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
                Reset Filter
              </button>
            </div>
          ) : (
            filteredVault.map((r) => (
              <div
                key={r.id}
                style={{
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-2xl)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}>
                    {r.icon || '📄'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {r.name}
                      </span>
                      {getCategoryBadge(r.category)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>Ukuran: <strong>{r.fileSize}</strong></span>
                      <span>• {r.downloads} unduhan</span>
                      <span>• Diunggah oleh {r.uploadedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Proper Manage Buttons for Vault Files (Detail, Edit, Delete) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Detail */}
                  <button
                    onClick={() => {
                      setSelectedVaultDetail(r);
                      setDetailModalOpen(true);
                    }}
                    title="Lihat Detail File"
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
                    }}
                  >
                    <Eye size={12} color="var(--accent-blue)" />
                    Detail
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditVault(r)}
                    title="Edit File Vault"
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
                    }}
                  >
                    <Edit3 size={12} color="var(--accent-green)" />
                    Edit
                  </button>

                  {/* Delete with Confirmation */}
                  <button
                    onClick={() => handleTriggerDelete('vault', r.id, r.name)}
                    title="Hapus File Vault"
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
                    }}
                  >
                    <Trash2 size={13} />
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: Tambah / Edit File Vault                            */}
      {/* ============================================================ */}
      {showVaultModal && (
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
            maxWidth: 580,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}>
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
                  {vaultEditingId ? <Edit3 size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {vaultEditingId ? 'Edit File Vault' : 'Tambah File ke Community Vault'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {vaultEditingId ? 'Perbarui informasi dan tautan berkas' : 'Unggah dokumen, template, tautan atau media bersama'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVaultModal(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nama File */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Nama File / Resource *
                </label>
                <input
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="Cth: Brand Guidelines TemuSpace.pdf"
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

              {/* Kategori Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Kategori Berkas *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {VAULT_CATEGORIES.map((cat) => {
                    const isSelected = vCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleSelectVaultCategory(cat.key)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-lg)',
                          background: isSelected ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-primary)',
                          border: `1px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                          color: isSelected ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          justifyContent: 'center',
                        }}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ukuran File & Emoji Icon */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Ukuran File (Contoh: 2.4 MB, 500 KB, atau - jika link)
                  </label>
                  <input
                    value={vFileSize}
                    onChange={(e) => setVFileSize(e.target.value)}
                    placeholder="2.4 MB"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Emoji Icon
                  </label>
                  <input
                    value={vIcon}
                    onChange={(e) => setVIcon(e.target.value)}
                    placeholder="📄"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 18,
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* URL File / Tautan Unduh */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  URL File / Tautan Unduh (Google Drive, Figma, GitHub, dll.)
                </label>
                <input
                  value={vFileUrl}
                  onChange={(e) => setVFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... atau https://figma.com/..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Deskripsi Berkas
                </label>
                <textarea
                  value={vDesc}
                  onChange={(e) => setVDesc(e.target.value)}
                  placeholder="Jelaskan isi file, panduan penggunaan, atau catatan penting lainnya..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Pengunggah & Unduhan */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Nama Pengunggah (Uploader)
                  </label>
                  <select
                    value={vUploadedBy}
                    onChange={(e) => setVUploadedBy(e.target.value)}
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
                        {u.avatar} {u.name} — {u.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Jumlah Unduhan
                  </label>
                  <input
                    type="number"
                    value={vDownloads}
                    onChange={(e) => setVDownloads(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
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
                onClick={() => setShowVaultModal(false)}
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
                onClick={handleSubmitVault}
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
                {vaultEditingId ? 'Simpan Perubahan' : 'Tambahkan ke Vault'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: Tambah / Edit Modul LMS                             */}
      {/* ============================================================ */}
      {showModuleModal && (
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
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}>
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
                  {moduleEditingId ? <Edit3 size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {moduleEditingId ? 'Edit Modul LMS' : 'Tambah Modul Pembelajaran LMS'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Kelola silabus modul kursus dan materi belajar komunitas
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModuleModal(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Judul Modul *
                </label>
                <input
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="Cth: Pengenalan React Hooks & State Management"
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

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Format / Tipe Modul
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['artikel', 'video', 'tutorial'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setMCategory(c)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: mCategory === c ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                        border: `1px solid ${mCategory === c ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-lg)',
                        color: mCategory === c ? '#FFFFFF' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Instruktur / Penulis Modul
                </label>
                <select
                  value={mAuthorName}
                  onChange={(e) => setMAuthorName(e.target.value)}
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
                      {u.avatar} {u.name} — {u.department}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Estimasi Durasi
                  </label>
                  <input
                    value={mDuration}
                    onChange={(e) => setMDuration(e.target.value)}
                    placeholder="Cth: 25 menit baca"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Jumlah Bagian / Sesi
                  </label>
                  <input
                    type="number"
                    value={mSections}
                    onChange={(e) => setMSections(e.target.value)}
                    placeholder="4"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Tags (Pisahkan koma)
                </label>
                <input
                  value={mTags}
                  onChange={(e) => setMTags(e.target.value)}
                  placeholder="react, hooks, javascript"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Tautan Video (YouTube) atau URL Materi
                </label>
                <input
                  value={mContent}
                  onChange={(e) => setMContent(e.target.value)}
                  placeholder="https://youtu.be/... atau link markdown"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Deskripsi Singkat
                </label>
                <textarea
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  placeholder="Ringkasan apa yang akan dipelajari di modul ini..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

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
                onClick={() => setShowModuleModal(false)}
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
                onClick={handleSubmitModule}
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
                {moduleEditingId ? 'Simpan Perubahan' : 'Tambah Modul'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: Konfirmasi Hapus (Delete Confirmation Dialog)       */}
      {/* ============================================================ */}
      {deleteModalOpen && deleteTarget && (
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
              {deleteTarget.type === 'vault' ? 'Hapus File Vault Ini?' : 'Hapus Modul LMS Ini?'}
            </h3>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Apakah Anda yakin ingin menghapus{' '}
              <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget.name}"</strong>?
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
                <strong>Peringatan:</strong> Berkas/materi ini akan dihapus secara permanen dan tidak dapat diakses lagi oleh anggota komunitas.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
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
      {/* MODAL 4: Detail / Preview Modal                              */}
      {/* ============================================================ */}
      {detailModalOpen && (selectedVaultDetail || selectedModuleDetail) && (
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
            maxWidth: 540,
            borderRadius: 'var(--radius-3xl)',
            padding: 24,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>
                  {selectedVaultDetail ? selectedVaultDetail.icon : selectedModuleDetail?.thumbnail}
                </span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedVaultDetail ? selectedVaultDetail.name : selectedModuleDetail?.title}
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ID: {selectedVaultDetail ? selectedVaultDetail.id : selectedModuleDetail?.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedVaultDetail(null);
                  setSelectedModuleDetail(null);
                }}
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

            {selectedVaultDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {getCategoryBadge(selectedVaultDetail.category)}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• Ukuran: {selectedVaultDetail.fileSize}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {selectedVaultDetail.downloads} kali diunduh</span>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-xl)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Deskripsi:</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedVaultDetail.description || 'Tidak ada deskripsi tambahan.'}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Diunggah oleh: <strong style={{ color: 'var(--text-primary)' }}>{selectedVaultDetail.uploadedBy}</strong>
                </div>

                {selectedVaultDetail.fileUrl && selectedVaultDetail.fileUrl !== '#' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: 'var(--accent-blue)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    <Link2 size={14} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedVaultDetail.fileUrl}
                    </span>
                    <a
                      href={selectedVaultDetail.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent-blue)', display: 'flex' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {selectedModuleDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(217, 119, 6, 0.1)',
                    color: 'var(--accent-terracotta)',
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}>
                    {selectedModuleDetail.category}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {selectedModuleDetail.duration}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {selectedModuleDetail.totalSections} bagian</span>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-xl)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Deskripsi Modul:</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedModuleDetail.description}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedModuleDetail.tags.map((t, idx) => (
                    <span key={idx} style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--accent-blue)',
                      fontWeight: 700,
                    }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => {
                  if (selectedVaultDetail) {
                    const r = selectedVaultDetail;
                    setDetailModalOpen(false);
                    handleOpenEditVault(r);
                  } else if (selectedModuleDetail) {
                    const m = selectedModuleDetail;
                    setDetailModalOpen(false);
                    handleOpenEditModule(m);
                  }
                }}
                style={{
                  padding: '8px 14px',
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
                <Edit3 size={13} /> Edit
              </button>

              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedVaultDetail(null);
                  setSelectedModuleDetail(null);
                }}
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
    </div>
  );
}
