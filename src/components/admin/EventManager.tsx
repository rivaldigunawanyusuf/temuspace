/**
 * EventManager.tsx - Event Manager (Admin)
 * 
 * CRUD: Create/Edit/Delete events that sync to member Events tab
 */
import { useState } from 'react';
import { useEventStore, generateEventId } from '../../stores/useEventStore';
import type { EventItem, EventStatus, EventLocation, EventFormField, EventFormFieldType } from '../../stores/useEventStore';
import {
  Plus, X, Trash2, Edit3, Save, Calendar, MapPin, Monitor, ExternalLink,
  Users, FileText, ChevronDown, ChevronRight, Check, Search, Filter, RotateCcw
} from 'lucide-react';
import { COMMUNITY_USERS, getCommunityUserByName } from '../../data/communityUsers';

export default function EventManager() {
  const { events, addEvent, updateEvent, deleteEvent, approveEvent, rejectEvent } = useEventStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [approvalTab, setApprovalTab] = useState<'approved' | 'pending'>('approved');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<EventLocation | 'all'>('all');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<EventStatus>('upcoming');
  const [location, setLocation] = useState<EventLocation>('virtual-room');
  const [locationDetail, setLocationDetail] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [emoji, setEmoji] = useState('');
  const [organizer, setOrganizer] = useState('Dewi Kartika');
  const [tags, setTags] = useState('');
  const [formFields, setFormFields] = useState<EventFormField[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const resetForm = () => {
    setTitle(''); setDesc(''); setDate(new Date().toISOString().split('T')[0]); setTime('');
    setStatus('upcoming'); setLocation('virtual-room'); setLocationDetail('');
    setCapacity('50'); setEmoji(''); setOrganizer('Dewi Kartika'); setTags(''); setFormFields([]); setEditing(null); setShowForm(false);
  };

  const handleSubmit = () => {
    if (!title) return;
    const orgUser = getCommunityUserByName(organizer);
    const data: Omit<EventItem, 'id' | 'createdAt'> = {
      title, description: desc,
      organizer: organizer || 'Dewi Kartika',
      organizerAvatar: orgUser ? (orgUser.avatarUrl || orgUser.avatar) : 'https://i.pravatar.cc/150?u=Dewi',
      date, time: time || 'TBD', status, location, locationDetail,
      coverEmoji: emoji, capacity: parseInt(capacity) || 50, attendees: 0,
      isRSVPed: false, tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      formFields,
    };
    if (editing) {
      updateEvent(editing, data);
    } else {
      addEvent({ id: generateEventId(), approvalStatus: 'approved', ...data });
    }
    resetForm();
  };

  const startEdit = (e: EventItem) => {
    setEditing(e.id); setTitle(e.title); setDesc(e.description); setDate(e.date);
    setTime(e.time); setStatus(e.status); setLocation(e.location);
    setLocationDetail(e.locationDetail); setCapacity(String(e.capacity));
    setEmoji(e.coverEmoji); setOrganizer(e.organizer || 'Dewi Kartika'); setTags(e.tags.join(', ')); setFormFields(e.formFields || []); setShowForm(true);
  };

  const statusColors: Record<EventStatus, { bg: string; text: string }> = {
    live: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
    upcoming: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
    past: { bg: 'rgba(156,163,175,0.1)', text: 'var(--text-muted)' },
  };

  const filteredEvents = events
    .filter((e) => e.approvalStatus === approvalTab)
    .filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (locationFilter !== 'all' && e.location !== locationFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.organizer || '').toLowerCase().includes(q) ||
        (e.locationDetail || '').toLowerCase().includes(q) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });

  return (
    <div style={{ padding: '24px 20px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
        Event Manager
      </h1>

      <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', marginBottom: 12,
        background: showForm ? '#EF4444' : 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)',
        color: showForm ? 'var(--text-primary)' : 'var(--bg-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}>
        {showForm ? <X size={14} /> : <Plus size={14} />}
        {showForm ? 'Batal' : 'Buat Event Baru'}
      </button>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}>
          <div style={{ background: 'var(--bg-elevated)', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-3xl)', padding: 24, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {editing ? 'Edit Event' : 'Buat Event Baru'}
              </h2>
              <button onClick={() => { resetForm(); setShowForm(false); }} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" style={{ width: 60, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 24, textAlign: 'center', outline: 'none' }} />
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul Event *" style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            </div>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi..." rows={3} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 12, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <input value={date} onChange={(e) => setDate(e.target.value)} type="date" style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Waktu (cth: 15:00 - 17:00)" style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['upcoming', 'live', 'past'] as EventStatus[]).map((s) => (
                <button key={s} onClick={() => setStatus(s)} style={{ flex: 1, padding: '8px', background: status === s ? statusColors[s].bg : 'var(--bg-primary)', border: `1px solid ${status === s ? statusColors[s].text + '33' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', color: status === s ? statusColors[s].text : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {([
                { key: 'virtual-room' as const, label: 'Virtual Room', icon: <Monitor size={14} /> },
                { key: 'online-external' as const, label: 'Online', icon: <ExternalLink size={14} /> },
                { key: 'offline' as const, label: 'Offline', icon: <MapPin size={14} /> },
              ]).map(({ key, label, icon }) => (
                <button key={key} onClick={() => setLocation(key)} style={{ flex: 1, padding: '8px', background: location === key ? 'rgba(59, 130, 246,0.1)' : 'var(--bg-primary)', border: `1px solid ${location === key ? 'rgba(59, 130, 246,0.3)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', color: location === key ? 'var(--accent-terracotta)' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <input value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} placeholder="Detail lokasi / Link" style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Kapasitas" type="number" style={{ width: 100, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            </div>

            {/* Organizer select */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Penyelenggara / PIC Event
              </label>
              <select
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
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

            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (pisah dengan koma)" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />

            <div style={{ marginBottom: 24, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Formulir RSVP Custom</span>
                <button onClick={() => setFormFields([...formFields, { id: Date.now().toString(), label: '', type: 'text', required: false }])} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: 'var(--radius-lg)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <Plus size={14} /> Tambah Field
                </button>
              </div>
              {formFields.map((field, idx) => (
                <div key={field.id} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', background: 'var(--bg-primary)', padding: 12, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
                  <input value={field.label} onChange={(e) => { const newF = [...formFields]; newF[idx].label = e.target.value; setFormFields(newF); }} placeholder="Label Pertanyaan" style={{ flex: 2, padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
                  <select value={field.type} onChange={(e) => { const newF = [...formFields]; newF[idx].type = e.target.value as EventFormFieldType; setFormFields(newF); }} style={{ flex: 1, padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}>
                    <option value="text">Text Singkat</option>
                    <option value="textarea">Text Panjang</option>
                    <option value="email">Email</option>
                    <option value="tel">Nomor HP</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={field.required} onChange={(e) => { const newF = [...formFields]; newF[idx].required = e.target.checked; setFormFields(newF); }} /> Wajib
                  </label>
                  <button onClick={() => setFormFields(formFields.filter((_, i) => i !== idx))} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                </div>
              ))}
              {formFields.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-subtle)' }}>
                  Tidak ada field kustom. Member bisa RSVP langsung.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: '10px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleSubmit} style={{ padding: '10px 20px', background: 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-pill)', color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {editing ? 'Simpan Perubahan' : 'Buat Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
        <button onClick={() => setApprovalTab('approved')} style={{ padding: '8px 4px', background: 'none', border: 'none', borderBottom: approvalTab === 'approved' ? '2px solid var(--accent-terracotta)' : '2px solid transparent', color: approvalTab === 'approved' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          Disetujui ({events.filter((e) => e.approvalStatus === 'approved').length})
        </button>
        <button onClick={() => setApprovalTab('pending')} style={{ padding: '8px 4px', background: 'none', border: 'none', borderBottom: approvalTab === 'pending' ? '2px solid var(--accent-terracotta)' : '2px solid transparent', color: approvalTab === 'pending' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          Menunggu Persetujuan ({events.filter((e) => e.approvalStatus === 'pending').length})
        </button>
      </div>

      {/* Search & Filter Bar */}
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
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari event berdasarkan judul, deskripsi, organizer, tags..."
              style={{
                width: '100%',
                padding: '9px 36px 9px 36px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value as any)}
            style={{
              padding: '9px 12px',
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
            <option value="all">Semua Lokasi</option>
            <option value="virtual-room">Virtual Room TemuSpace</option>
            <option value="offline">Offline / Tatap Muka</option>
            <option value="online-external">Online Eksternal</option>
          </select>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={12} /> Status:
          </span>
          {(['all', 'upcoming', 'live', 'past'] as const).map((st) => {
            const isSel = statusFilter === st;
            const labels: Record<string, string> = { all: 'Semua', upcoming: 'Upcoming', live: '🔴 Live Now', past: 'Selesai (Past)' };
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 10px',
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
                {labels[st]}
              </button>
            );
          })}

          {(searchQuery || statusFilter !== 'all' || locationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setLocationFilter('all');
              }}
              style={{
                marginLeft: 'auto',
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

      {/* Event List */}
      {filteredEvents.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--bg-elevated)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          color: 'var(--text-muted)',
        }}>
          <Calendar size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Tidak ada event ditemukan
          </div>
          <div style={{ fontSize: 12 }}>
            {searchQuery || statusFilter !== 'all' || locationFilter !== 'all'
              ? 'Coba sesuaikan kata kunci pencarian atau filter lokasi/status.'
              : 'Belum ada event dalam kategori ini.'}
          </div>
        </div>
      ) : (
        filteredEvents.map((e) => (
          <div key={e.id} style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', marginBottom: 8, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setExpandedEventId(expandedEventId === e.id ? null : e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 0 }}>
                {expandedEventId === e.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-xl)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {e.coverEmoji || <Calendar size={20} color="var(--text-muted)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.date} • {e.attendees}/{e.capacity} peserta</div>
              </div>
              <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, ...statusColors[e.status] }}>
                {e.status}
              </span>
              {approvalTab === 'pending' ? (
                <>
                  <button onClick={() => approveEvent(e.id)} style={{ background: 'var(--accent-green)', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}><Check size={14} /> Setuju</button>
                  <button onClick={() => rejectEvent(e.id)} style={{ background: '#EF4444', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}><X size={14} /> Tolak</button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(e)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><Edit3 size={14} /></button>
                  <button onClick={() => deleteEvent(e.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                </>
              )}
            </div>

            {/* RSVP Data View */}
            {expandedEventId === e.id && (
              <div style={{ padding: '0 16px 16px 44px', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Data Pendaftar ({e.rsvpData?.length || 0})</span>
                {e.rsvpData && e.rsvpData.length > 0 ? (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {e.rsvpData.map((rsvp, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <img src={rsvp.userAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{rsvp.userName}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {Object.entries(rsvp.answers).map(([key, val]) => {
                            const fieldLabel = e.formFields?.find(f => f.id === key)?.label || key;
                            return (
                              <div key={key}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fieldLabel}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{val}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Belum ada yang daftar.</div>
                )}
              </div>
            )}
          </div>
        )))}
    </div>
  );
}
