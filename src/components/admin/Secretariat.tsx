/**
 * Secretariat.tsx - Sekretaris Module (Admin)
 * 
 * Full CRUD:
 * 1. Letters (Surat Masuk & Keluar) - Add, Edit, Delete, List
 * 2. Meeting Minutes (Notulensi Rapat) - Add, Edit, Delete, List with attendee user selector
 * 3. Assets (Inventaris) - Add, Edit, Delete, List
 */
import { useState } from 'react';
import { useAdminStore, generateId } from '../../stores/useAdminStore';
import type { Letter, MeetingMinutes, Asset } from '../../stores/useAdminStore';
import {
  Mail, MailOpen, FileText, Package, Plus, X, Trash2, Edit3, Save,
  Users, Check, Clock, Calendar, CheckSquare, ListOrdered,
  Search, Filter, RotateCcw
} from 'lucide-react';
import { COMMUNITY_USERS, getCommunityUserByName } from '../../data/communityUsers';

export default function Secretariat() {
  const {
    letters, minutes, assets,
    addLetter, updateLetter, deleteLetter,
    addMinutes, updateMinutes, deleteMinutes,
    addAsset, updateAsset, deleteAsset
  } = useAdminStore();

  const [tab, setTab] = useState<'letters' | 'minutes' | 'assets'>('minutes');

  // ===================== Letters State =====================
  const [showLetterForm, setShowLetterForm] = useState(false);
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [lType, setLType] = useState<'incoming' | 'outgoing'>('outgoing');
  const [lNumber, setLNumber] = useState('');
  const [lSubject, setLSubject] = useState('');
  const [lFrom, setLFrom] = useState('TemuSpace');
  const [lTo, setLTo] = useState('');
  const [lContent, setLContent] = useState('');

  // ===================== Minutes State =====================
  const [showMinuteForm, setShowMinuteForm] = useState(false);
  const [editingMinuteId, setEditingMinuteId] = useState<string | null>(null);
  const [mTitle, setMTitle] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mAgenda, setMAgenda] = useState('');
  const [mAttendees, setMAttendees] = useState<string[]>(['Dewi Kartika', 'Raka Mahendra', 'Sinta Rahayu']);
  const [mDecisions, setMDecisions] = useState('');
  const [mActionItems, setMActionItems] = useState('');

  // ===================== Asset State =====================
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [aName, setAName] = useState('');
  const [aCategory, setACategory] = useState('');
  const [aQty, setAQty] = useState('1');
  const [aLocation, setALocation] = useState('');
  const [aCondition, setACondition] = useState<'baik' | 'perlu servis' | 'rusak-ringan' | 'rusak' | 'rusak-berat'>('baik');

  // ===================== Search & Filter States =====================
  // 1. Notulensi (Minutes)
  const [minuteSearch, setMinuteSearch] = useState('');
  const [minuteAttendeeFilter, setMinuteAttendeeFilter] = useState('all');

  // 2. Surat (Letters)
  const [letterSearch, setLetterSearch] = useState('');
  const [letterTypeFilter, setLetterTypeFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');
  const [letterStatusFilter, setLetterStatusFilter] = useState<'all' | 'draft' | 'sent' | 'received'>('all');

  // 3. Inventaris (Assets)
  const [assetSearch, setAssetSearch] = useState('');
  const [assetConditionFilter, setAssetConditionFilter] = useState<'all' | 'baik' | 'perlu servis' | 'rusak-ringan' | 'rusak'>('all');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('all');

  // Computed Filtered Lists
  const filteredMinutes = minutes.filter((m) => {
    if (minuteAttendeeFilter !== 'all' && !m.attendees.includes(minuteAttendeeFilter)) return false;
    if (!minuteSearch.trim()) return true;
    const q = minuteSearch.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.agenda || '').toLowerCase().includes(q) ||
      (m.decisions || '').toLowerCase().includes(q) ||
      (m.actionItems || '').toLowerCase().includes(q) ||
      m.attendees.some((a) => a.toLowerCase().includes(q))
    );
  });

  const filteredLetters = letters.filter((l) => {
    if (letterTypeFilter !== 'all' && l.type !== letterTypeFilter) return false;
    if (letterStatusFilter !== 'all' && l.status !== letterStatusFilter) return false;
    if (!letterSearch.trim()) return true;
    const q = letterSearch.toLowerCase();
    return (
      l.subject.toLowerCase().includes(q) ||
      l.number.toLowerCase().includes(q) ||
      l.from.toLowerCase().includes(q) ||
      l.to.toLowerCase().includes(q) ||
      (l.content || '').toLowerCase().includes(q)
    );
  });

  const filteredAssets = assets.filter((a) => {
    if (assetConditionFilter !== 'all') {
      const cond = (a.condition || '').toLowerCase();
      if (assetConditionFilter === 'rusak') {
        // Filter 'rusak' mencakup semua kondisi rusak (rusak, rusak-ringan, rusak-berat)
        if (!cond.includes('rusak')) return false;
      } else if (assetConditionFilter === 'rusak-ringan') {
        if (cond !== 'rusak-ringan') return false;
      } else if (assetConditionFilter === 'perlu servis') {
        if (cond !== 'perlu servis' && !cond.includes('servis')) return false;
      } else if (assetConditionFilter === 'baik') {
        if (cond !== 'baik') return false;
      } else {
        if (cond !== assetConditionFilter) return false;
      }
    }
    if (assetCategoryFilter !== 'all' && a.category !== assetCategoryFilter) return false;
    if (!assetSearch.trim()) return true;
    const q = assetSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q) ||
      (a.condition || '').toLowerCase().includes(q)
    );
  });

  const uniqueAssetCategories = Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));

  // ===================== Letter Handlers =====================
  const openAddLetter = () => {
    setEditingLetterId(null);
    setLType('outgoing');
    setLNumber(`${letters.length + 1}/TS/X/2026`);
    setLSubject('');
    setLFrom('TemuSpace');
    setLTo('');
    setLContent('');
    setShowLetterForm(true);
  };

  const startEditLetter = (l: Letter) => {
    setEditingLetterId(l.id);
    setLType(l.type);
    setLNumber(l.number);
    setLSubject(l.subject);
    setLFrom(l.from);
    setLTo(l.to);
    setLContent(l.content);
    setShowLetterForm(true);
  };

  const handleSaveLetter = () => {
    if (!lSubject.trim()) return;
    const payload = {
      type: lType,
      number: lNumber || `${letters.length + 1}/TS/X/2026`,
      subject: lSubject.trim(),
      from: lFrom || 'TemuSpace',
      to: lTo.trim() || (lType === 'outgoing' ? 'Instansi Eksternal' : 'Sekretariat TemuSpace'),
      date: new Date().toISOString().split('T')[0],
      status: (lType === 'outgoing' ? 'draft' : 'received') as Letter['status'],
      content: lContent.trim(),
    };

    if (editingLetterId) {
      updateLetter(editingLetterId, payload);
    } else {
      addLetter({
        id: generateId('ltr'),
        ...payload,
      });
    }

    setEditingLetterId(null);
    setShowLetterForm(false);
  };

  // ===================== Minutes Handlers =====================
  const openAddMinute = () => {
    setEditingMinuteId(null);
    setMTitle('');
    setMDate(new Date().toISOString().split('T')[0]);
    setMAgenda('');
    setMAttendees(['Dewi Kartika', 'Raka Mahendra', 'Sinta Rahayu']);
    setMDecisions('');
    setMActionItems('');
    setShowMinuteForm(true);
  };

  const startEditMinute = (m: MeetingMinutes) => {
    setEditingMinuteId(m.id);
    setMTitle(m.title);
    setMDate(m.date);
    setMAgenda(m.agenda);
    setMAttendees(m.attendees || []);
    setMDecisions((m.decisions || []).join('\n'));
    setMActionItems((m.actionItems || []).join('\n'));
    setShowMinuteForm(true);
  };

  const handleSaveMinute = () => {
    if (!mTitle.trim()) return;
    const payload = {
      title: mTitle.trim(),
      date: mDate,
      agenda: mAgenda.trim() || 'Pembahasan rutin program kerja',
      attendees: mAttendees.length > 0 ? mAttendees : ['Dewi Kartika'],
      decisions: mDecisions.split('\n').map((s) => s.trim()).filter(Boolean),
      actionItems: mActionItems.split('\n').map((s) => s.trim()).filter(Boolean),
      notes: '',
    };

    if (editingMinuteId) {
      updateMinutes(editingMinuteId, payload);
    } else {
      addMinutes({
        id: generateId('min'),
        ...payload,
      });
    }

    setEditingMinuteId(null);
    setShowMinuteForm(false);
  };

  const toggleAttendee = (userName: string) => {
    setMAttendees((prev) =>
      prev.includes(userName) ? prev.filter((n) => n !== userName) : [...prev, userName]
    );
  };

  // ===================== Asset Handlers =====================
  const openAddAsset = () => {
    setEditingAssetId(null);
    setAName('');
    setACategory('Elektronik');
    setAQty('1');
    setALocation('Ruang Sekretariat');
    setACondition('baik');
    setShowAssetForm(true);
  };

  const startEditAsset = (a: Asset) => {
    setEditingAssetId(a.id);
    setAName(a.name);
    setACategory(a.category);
    setAQty(String(a.quantity));
    setALocation(a.location);
    setACondition(a.condition);
    setShowAssetForm(true);
  };

  const handleSaveAsset = () => {
    if (!aName.trim()) return;
    const payload = {
      name: aName.trim(),
      category: aCategory || 'Umum',
      quantity: parseInt(aQty) || 1,
      condition: aCondition,
      location: aLocation || 'Ruang Sekretariat',
      lastChecked: new Date().toISOString().split('T')[0],
    };

    if (editingAssetId) {
      updateAsset(editingAssetId, payload);
    } else {
      addAsset({
        id: generateId('ast'),
        ...payload,
      });
    }

    setEditingAssetId(null);
    setShowAssetForm(false);
  };

  const tabs = [
    { key: 'minutes' as const, label: 'Notulensi', icon: <FileText size={15} />, count: minutes.length },
    { key: 'letters' as const, label: 'Surat', icon: <Mail size={15} />, count: letters.length },
    { key: 'assets' as const, label: 'Inventaris', icon: <Package size={15} />, count: assets.length },
  ];

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          Modul Sekretariat
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Pusat administrasi, notulensi rapat, arsip persuratan, dan inventaris barang TemuSpace
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        padding: 5,
        marginBottom: 20
      }}>
        {tabs.map(({ key, label, icon, count }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setShowMinuteForm(false);
                setShowLetterForm(false);
                setShowAssetForm(false);
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: isActive ? 'var(--accent-terracotta)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              {icon}
              <span>{label}</span>
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                color: isActive ? 'var(--bg-primary)' : 'var(--text-muted)',
                fontWeight: 700
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===================== TAB: NOTULENSI RAPAT ===================== */}
      {tab === 'minutes' && (
        <div>
          {/* Header & Add Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--accent-terracotta)" />
                Notulensi Rapat
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {minutes.length} sesi rapat tercatat • Dokumentasi agenda dan action items
              </p>
            </div>
            <button
              onClick={() => {
                if (showMinuteForm) {
                  setShowMinuteForm(false);
                  setEditingMinuteId(null);
                } else {
                  openAddMinute();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                background: showMinuteForm ? '#EF4444' : 'var(--accent-terracotta)',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                color: '#FFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              {showMinuteForm ? <X size={15} /> : <Plus size={15} />}
              {showMinuteForm ? (editingMinuteId ? 'Batal Edit' : 'Batal') : 'Tambah Notulensi'}
            </button>
          </div>

          {/* Minute Form (Create / Edit) */}
          {showMinuteForm && (
            <div style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--accent-terracotta)',
              borderRadius: 'var(--radius-2xl)',
              padding: 20,
              marginBottom: 20,
              animation: 'fadeIn 0.2s ease-in'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {editingMinuteId ? '✏️ Edit Notulensi Rapat' : '📝 Buat Notulensi Rapat Baru'}
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  * Kolom bertanda bintang wajib diisi
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Judul Rapat *
                  </label>
                  <input
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="Contoh: Rapat Koordinasi Hackathon & Proker Q4"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="date"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Agenda Rapat
                </label>
                <input
                  value={mAgenda}
                  onChange={(e) => setMAgenda(e.target.value)}
                  placeholder="Ringkasan topik atau agenda yang dibahas..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                />
              </div>

              {/* Attendee Selector from COMMUNITY_USERS */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Pilih Peserta Rapat ({mAttendees.length} dipilih dari {COMMUNITY_USERS.length} anggota)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setMAttendees(COMMUNITY_USERS.map((u) => u.name))}
                      style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--accent-terracotta)', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Pilih Semua
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--border-subtle)' }}>•</span>
                    <button
                      type="button"
                      onClick={() => setMAttendees([])}
                      style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  maxHeight: 140,
                  overflowY: 'auto',
                  padding: 8,
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {COMMUNITY_USERS.map((user) => {
                    const isSelected = mAttendees.includes(user.name);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAttendee(user.name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-pill)',
                          border: isSelected ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(52,211,153,0.15)' : 'var(--bg-elevated)',
                          color: isSelected ? 'var(--accent-green)' : 'var(--text-secondary)',
                          fontSize: 11,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{user.avatar}</span>
                        <span>{user.name}</span>
                        {isSelected ? <Check size={12} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Keputusan / Kesimpulan Rapat (1 baris per poin)
                  </label>
                  <textarea
                    value={mDecisions}
                    onChange={(e) => setMDecisions(e.target.value)}
                    placeholder="Contoh:&#10;Disetujui anggaran hackathon 5 juta&#10;Workshop ML diundur ke 30 Oktober"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Action Items / Tindak Lanjut (1 baris per poin)
                  </label>
                  <textarea
                    value={mActionItems}
                    onChange={(e) => setMActionItems(e.target.value)}
                    placeholder="Contoh:&#10;Farhan: Selesaikan deploy server v1&#10;Dewi: Kontak 3 sponsor utama"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xl)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMinuteForm(false);
                    setEditingMinuteId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveMinute}
                  style={{
                    flex: 2,
                    padding: '10px',
                    background: 'var(--accent-terracotta)',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--bg-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingMinuteId ? 'Simpan Perubahan Notulensi' : 'Simpan Notulensi Rapat'}
                </button>
              </div>
            </div>
          )}

          {/* Minutes Search & Filter Bar */}
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={minuteSearch}
                  onChange={(e) => setMinuteSearch(e.target.value)}
                  placeholder="Cari notulensi (judul, agenda, keputusan, peserta)..."
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 32px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
                {minuteSearch && (
                  <button
                    onClick={() => setMinuteSearch('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
                <Users size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Peserta:</span>
                <select
                  value={minuteAttendeeFilter}
                  onChange={(e) => setMinuteAttendeeFilter(e.target.value)}
                  style={{
                    padding: '2px 6px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Semua Peserta</option>
                  {COMMUNITY_USERS.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.avatar} {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {(minuteSearch || minuteAttendeeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setMinuteSearch('');
                    setMinuteAttendeeFilter('all');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-terracotta)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Minutes Cards Listing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredMinutes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-2xl)',
                color: 'var(--text-muted)'
              }}>
                <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Tidak ada notulensi rapat ditemukan</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {minuteSearch || minuteAttendeeFilter !== 'all'
                    ? 'Coba sesuaikan kata kunci pencarian atau filter peserta.'
                    : 'Klik tombol "Tambah Notulensi" untuk membuat notulensi pertama.'}
                </div>
              </div>
            ) : (
              filteredMinutes.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 18,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Card Header & CRUD Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        {m.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} /> {m.date}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={13} /> {m.attendees?.length || 0} peserta hadir
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Edit & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => startEditMinute(m)}
                        style={{
                          background: 'rgba(235, 110, 75, 0.1)',
                          border: 'none',
                          color: 'var(--accent-terracotta)',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-lg)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700
                        }}
                        title="Edit Notulensi"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus notulensi "${m.title}"?`)) {
                            deleteMinutes(m.id);
                          }
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-lg)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700
                        }}
                        title="Hapus Notulensi"
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    </div>
                  </div>

                  {/* Attendees Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {(m.attendees || []).map((name, i) => {
                      const u = getCommunityUserByName(name);
                      return (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 11,
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <span>{u?.avatar || '👤'}</span>
                          <span>{name}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Agenda */}
                  {m.agenda && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Agenda:</strong> {m.agenda}
                    </div>
                  )}

                  {/* Decisions */}
                  {m.decisions && m.decisions.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckSquare size={13} color="var(--accent-green)" /> Keputusan:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)' }}>
                        {m.decisions.map((d, i) => (
                          <li key={i} style={{ marginBottom: 3 }}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {m.actionItems && m.actionItems.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ListOrdered size={13} color="var(--accent-terracotta)" /> Action Items:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)' }}>
                        {m.actionItems.map((a, i) => (
                          <li key={i} style={{ marginBottom: 3 }}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB: SURAT (LETTERS) ===================== */}
      {tab === 'letters' && (
        <div>
          {/* Header & Add Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} color="var(--accent-terracotta)" />
                Surat Masuk & Keluar
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {letters.length} arsip surat resmi organisasi
              </p>
            </div>
            <button
              onClick={() => {
                if (showLetterForm) {
                  setShowLetterForm(false);
                  setEditingLetterId(null);
                } else {
                  openAddLetter();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                background: showLetterForm ? '#EF4444' : 'var(--accent-terracotta)',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                color: '#FFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {showLetterForm ? <X size={15} /> : <Plus size={15} />}
              {showLetterForm ? (editingLetterId ? 'Batal Edit' : 'Batal') : 'Tambah Surat'}
            </button>
          </div>

          {/* Letter Form (Create / Edit) */}
          {showLetterForm && (
            <div style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--accent-terracotta)',
              borderRadius: 'var(--radius-2xl)',
              padding: 20,
              marginBottom: 20
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
                {editingLetterId ? '✏️ Edit Surat' : '✉️ Buat / Catat Surat Baru'}
              </h3>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setLType('outgoing')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: lType === 'outgoing' ? 'rgba(52,211,153,0.15)' : 'var(--bg-primary)',
                    border: `1px solid ${lType === 'outgoing' ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xl)',
                    color: lType === 'outgoing' ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📤 Surat Keluar
                </button>
                <button
                  type="button"
                  onClick={() => setLType('incoming')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: lType === 'incoming' ? 'rgba(59,130,246,0.15)' : 'var(--bg-primary)',
                    border: `1px solid ${lType === 'incoming' ? '#3B82F6' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xl)',
                    color: lType === 'incoming' ? '#3B82F6' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📥 Surat Masuk
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
                <input
                  value={lNumber}
                  onChange={(e) => setLNumber(e.target.value)}
                  placeholder="Nomor Surat (cth: 01/TS/X/2026)"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <input
                  value={lSubject}
                  onChange={(e) => setLSubject(e.target.value)}
                  placeholder="Perihal Surat *"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Dari (Pengirim)
                  </label>
                  {lType === 'outgoing' ? (
                    <select
                      value={lFrom}
                      onChange={(e) => setLFrom(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <option value="TemuSpace">🏛️ TemuSpace (Organisasi)</option>
                      {COMMUNITY_USERS.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.avatar} {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={lFrom}
                      onChange={(e) => setLFrom(e.target.value)}
                      placeholder="Instansi / Nama Pengirim"
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Kepada (Tujuan)
                  </label>
                  {lType === 'incoming' ? (
                    <select
                      value={lTo}
                      onChange={(e) => setLTo(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <option value="">-- Pilih Penerima Internal --</option>
                      <option value="Sekretariat TemuSpace">🏛️ Sekretariat TemuSpace</option>
                      {COMMUNITY_USERS.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.avatar} {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={lTo}
                      onChange={(e) => setLTo(e.target.value)}
                      placeholder="Nama Penerima / Instansi Luar"
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  )}
                </div>
              </div>

              <textarea
                value={lContent}
                onChange={(e) => setLContent(e.target.value)}
                placeholder="Ringkasan atau isi surat..."
                rows={3}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', marginBottom: 14, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowLetterForm(false);
                    setEditingLetterId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveLetter}
                  style={{
                    flex: 2,
                    padding: '10px',
                    background: 'var(--accent-terracotta)',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--bg-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingLetterId ? 'Simpan Perubahan Surat' : 'Simpan Surat'}
                </button>
              </div>
            </div>
          )}

          {/* Letters Search & Filter Bar */}
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={letterSearch}
                  onChange={(e) => setLetterSearch(e.target.value)}
                  placeholder="Cari surat (nomor, perihal, pengirim, penerima, isi)..."
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 32px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
                {letterSearch && (
                  <button
                    onClick={() => setLetterSearch('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Row: Type & Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={12} /> Jenis:
                </span>
                {(['all', 'outgoing', 'incoming'] as const).map((t) => {
                  const isSel = letterTypeFilter === t;
                  const labels: Record<string, string> = { all: 'Semua', outgoing: '📤 Surat Keluar', incoming: '📥 Surat Masuk' };
                  return (
                    <button
                      key={t}
                      onClick={() => setLetterTypeFilter(t)}
                      style={{
                        padding: '3px 9px',
                        background: isSel ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                        border: `1px solid ${isSel ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-pill)',
                        color: isSel ? '#FFF' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {(letterSearch || letterTypeFilter !== 'all' || letterStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setLetterSearch('');
                    setLetterTypeFilter('all');
                    setLetterStatusFilter('all');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-terracotta)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={11} /> Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Letter list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredLetters.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 16px',
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-2xl)',
                color: 'var(--text-muted)',
              }}>
                <Mail size={28} style={{ marginBottom: 6, opacity: 0.5 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Tidak ada surat ditemukan
                </div>
                <div style={{ fontSize: 11 }}>
                  {letterSearch || letterTypeFilter !== 'all' || letterStatusFilter !== 'all'
                    ? 'Coba sesuaikan kata kunci pencarian atau jenis surat.'
                    : 'Belum ada arsip surat tercatat.'}
                </div>
              </div>
            ) : (
              filteredLetters.map((l) => (
              <div
                key={l.id}
                style={{
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-2xl)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-xl)',
                  background: l.type === 'outgoing' ? 'rgba(52,211,153,0.1)' : 'rgba(59,130,246,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {l.type === 'outgoing' ? <Mail size={18} color="var(--accent-green)" /> : <MailOpen size={18} color="#3B82F6" />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.subject}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {l.number} • {l.date} • {l.type === 'outgoing' ? `Ke: ${l.to}` : `Dari: ${l.from}`}
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 10,
                  fontWeight: 700,
                  background: l.status === 'sent' ? 'rgba(52,211,153,0.12)' : l.status === 'draft' ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)',
                  color: l.status === 'sent' ? 'var(--accent-green)' : l.status === 'draft' ? '#F59E0B' : 'var(--text-muted)'
                }}>
                  {l.status}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => startEditLetter(l)}
                    style={{
                      background: 'rgba(235, 110, 75, 0.1)',
                      border: 'none',
                      color: 'var(--accent-terracotta)',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                    title="Edit Surat"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus surat "${l.subject}"?`)) {
                        deleteLetter(l.id);
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                    title="Hapus Surat"
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* ===================== TAB: INVENTARIS (ASSETS) ===================== */}
      {tab === 'assets' && (
        <div>
          {/* Header & Add Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} color="var(--accent-terracotta)" />
                Inventaris & Aset Organisasi
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {assets.length} item inventaris tercatat
              </p>
            </div>
            <button
              onClick={() => {
                if (showAssetForm) {
                  setShowAssetForm(false);
                  setEditingAssetId(null);
                } else {
                  openAddAsset();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                background: showAssetForm ? '#EF4444' : 'var(--accent-terracotta)',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                color: '#FFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {showAssetForm ? <X size={15} /> : <Plus size={15} />}
              {showAssetForm ? (editingAssetId ? 'Batal Edit' : 'Batal') : 'Tambah Aset'}
            </button>
          </div>

          {/* Asset Form (Create / Edit) */}
          {showAssetForm && (
            <div style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--accent-terracotta)',
              borderRadius: 'var(--radius-2xl)',
              padding: 20,
              marginBottom: 20
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
                {editingAssetId ? '✏️ Edit Data Aset' : '📦 Tambah Aset Baru'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
                <input
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  placeholder="Nama Barang / Aset *"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <input
                  value={aCategory}
                  onChange={(e) => setACategory(e.target.value)}
                  placeholder="Kategori (cth: Elektronik)"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Jumlah (Qty)
                  </label>
                  <input
                    value={aQty}
                    onChange={(e) => setAQty(e.target.value.replace(/\D/g, ''))}
                    placeholder="1"
                    type="number"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Lokasi Penyimpanan
                  </label>
                  <input
                    value={aLocation}
                    onChange={(e) => setALocation(e.target.value)}
                    placeholder="cth: Ruang Sekretariat / Lemari A"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Kondisi Barang
                  </label>
                  <select
                    value={aCondition}
                    onChange={(e) => setACondition(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <option value="baik">🟢 Baik</option>
                    <option value="perlu servis">🟡 Perlu Servis</option>
                    <option value="rusak-ringan">🟠 Rusak Ringan</option>
                    <option value="rusak">🔴 Rusak</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssetForm(false);
                    setEditingAssetId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsset}
                  style={{
                    flex: 2,
                    padding: '10px',
                    background: 'var(--accent-terracotta)',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--bg-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingAssetId ? 'Simpan Perubahan Aset' : 'Simpan Aset'}
                </button>
              </div>
            </div>
          )}

          {/* Assets Search & Filter Bar */}
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Cari aset (nama barang, kategori, lokasi)..."
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 32px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
                {assetSearch && (
                  <button
                    onClick={() => setAssetSearch('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {uniqueAssetCategories.length > 0 && (
                <select
                  value={assetCategoryFilter}
                  onChange={(e) => setAssetCategoryFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <option value="all">Semua Kategori</option>
                  {uniqueAssetCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Filter Row: Condition Chips */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={12} /> Kondisi:
                </span>
                {(['all', 'baik', 'perlu servis', 'rusak-ringan', 'rusak'] as const).map((cond) => {
                  const isSel = assetConditionFilter === cond;
                  const labels: Record<string, string> = { 
                    all: 'Semua', 
                    baik: '🟢 Baik', 
                    'perlu servis': '🟡 Perlu Servis', 
                    'rusak-ringan': '🟠 Rusak Ringan',
                    rusak: '🔴 Rusak' 
                  };
                  return (
                    <button
                      key={cond}
                      onClick={() => setAssetConditionFilter(cond)}
                      style={{
                        padding: '3px 9px',
                        background: isSel ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                        border: `1px solid ${isSel ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-pill)',
                        color: isSel ? '#FFF' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {labels[cond]}
                    </button>
                  );
                })}
              </div>

              {(assetSearch || assetConditionFilter !== 'all' || assetCategoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setAssetSearch('');
                    setAssetConditionFilter('all');
                    setAssetCategoryFilter('all');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-terracotta)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={11} /> Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Asset list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredAssets.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 16px',
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-2xl)',
                color: 'var(--text-muted)',
              }}>
                <Package size={28} style={{ marginBottom: 6, opacity: 0.5 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Tidak ada aset inventaris ditemukan
                </div>
                <div style={{ fontSize: 11 }}>
                  {assetSearch || assetConditionFilter !== 'all' || assetCategoryFilter !== 'all'
                    ? 'Coba sesuaikan kata kunci pencarian atau kondisi barang.'
                    : 'Belum ada aset inventaris tercatat.'}
                </div>
              </div>
            ) : (
              filteredAssets.map((a) => (
              <div
                key={a.id}
                style={{
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-2xl)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-xl)',
                  background: 'rgba(235, 110, 75, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Package size={18} color="var(--accent-terracotta)" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {a.category} • Qty: {a.quantity} • {a.location} • Update: {a.lastChecked}
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 10,
                  fontWeight: 700,
                  background: a.condition === 'baik' 
                    ? 'rgba(52,211,153,0.12)' 
                    : a.condition === 'perlu servis' 
                    ? 'rgba(245,158,11,0.12)' 
                    : a.condition === 'rusak-ringan'
                    ? 'rgba(249,115,22,0.12)'
                    : 'rgba(239,68,68,0.12)',
                  color: a.condition === 'baik' 
                    ? 'var(--accent-green)' 
                    : a.condition === 'perlu servis' 
                    ? '#F59E0B' 
                    : a.condition === 'rusak-ringan'
                    ? '#F97316'
                    : '#EF4444'
                }}>
                  {a.condition}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => startEditAsset(a)}
                    style={{
                      background: 'rgba(235, 110, 75, 0.1)',
                      border: 'none',
                      color: 'var(--accent-terracotta)',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                    title="Edit Aset"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus aset "${a.name}"?`)) {
                        deleteAsset(a.id);
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                    title="Hapus Aset"
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  );
}
