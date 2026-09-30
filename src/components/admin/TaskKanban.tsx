/**
 * TaskKanban.tsx - Kanban Board & Calendar (Admin)
 * 
 * Drag-style Kanban (click to move), Calendar view
 */
import { useState } from 'react';
import { useAdminStore, generateId } from '../../stores/useAdminStore';
import {
  Plus, X, Trash2, Edit3, ChevronLeft, ChevronRight, Calendar as CalIcon,
  KanbanSquare, ArrowRight, Clock, Flag, Sparkles, CheckCircle2, UserCheck,
  Search, Filter, RotateCcw
} from 'lucide-react';
import { COMMUNITY_USERS, getCommunityUserByName } from '../../data/communityUsers';

function formatAdminDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const STATUS_CONFIG: Record<KanbanStatus, { label: string; color: string; bg: string }> = {
  'todo': { label: 'To-Do', color: 'var(--text-muted)', bg: 'rgba(156,163,175,0.08)' },
  'in-progress': { label: 'In Progress', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  'review': { label: 'Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  'done': { label: 'Done', color: 'var(--accent-green)', bg: 'rgba(52,211,153,0.08)' },
};

const PRIORITY_COLORS: Record<string, string> = {
  'low': 'var(--text-muted)',
  'medium': '#F59E0B',
  'high': '#EF4444',
};

const STATUSES: KanbanStatus[] = ['todo', 'in-progress', 'review', 'done'];

export default function TaskKanban() {
  const { tasks, calendarEvents, addTask, updateTask, deleteTask, moveTask, addCalendarEvent, deleteCalendarEvent } = useAdminStore();
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanStatus | null>(null);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Form
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPriority, setFPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [fAssignee, setFAssignee] = useState('');
  const [fDueDate, setFDueDate] = useState('');
  const [fStatus, setFStatus] = useState<KanbanStatus>('todo');

  const resetForm = () => {
    setFTitle(''); setFDesc(''); setFPriority('medium');
    setFAssignee(''); setFDueDate(''); setFStatus('todo');
    setEditing(null); setShowForm(false);
  };

  const handleSubmit = () => {
    if (!fTitle) return;
    const matchedUser = getCommunityUserByName(fAssignee);
    const data = {
      title: fTitle,
      description: fDesc,
      status: fStatus,
      priority: fPriority,
      assignee: fAssignee || 'Belum ditugaskan',
      assigneeAvatar: matchedUser ? matchedUser.avatar : (fAssignee ? '👤' : ''),
      dueDate: fDueDate,
      tags: [],
      createdAt: Date.now(),
    };
    if (editing) {
      updateTask(editing, data);
    } else {
      addTask({ id: generateId('task'), ...data });
    }
    resetForm();
  };

  const startEdit = (t: KanbanTask) => {
    setEditing(t.id); setFTitle(t.title); setFDesc(t.description);
    setFPriority(t.priority); setFAssignee(t.assignee);
    setFDueDate(t.dueDate); setFStatus(t.status); setShowForm(true);
  };

  // Calendar logic
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);
  const [showAddCalModal, setShowAddCalModal] = useState(false);
  const [calEventTitle, setCalEventTitle] = useState('');
  const [calEventTime, setCalEventTime] = useState('10:00');
  const [calEventType, setCalEventType] = useState<'meeting' | 'deadline' | 'event' | 'reminder'>('event');
  const [calEventColor, setCalEventColor] = useState('#3B82F6');

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthName = new Date(calYear, calMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const getEventsForDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter((e) => e.date === dateStr);
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
           Kanban & Kalender
        </h1>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-xl)', padding: 3 }}>
          <button onClick={() => setView('kanban')} style={{ padding: '6px 12px', background: view === 'kanban' ? 'var(--accent-terracotta)' : 'transparent', border: 'none', borderRadius: 6, color: view === 'kanban' ? 'var(--bg-primary)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <KanbanSquare size={12} /> Kanban
          </button>
          <button onClick={() => setView('calendar')} style={{ padding: '6px 12px', background: view === 'calendar' ? 'var(--accent-terracotta)' : 'transparent', border: 'none', borderRadius: 6, color: view === 'calendar' ? 'var(--bg-primary)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalIcon size={12} /> Kalender
          </button>
        </div>
      </div>

      {view === 'kanban' && (() => {
        const filteredTasks = tasks.filter((t) => {
          if (filterAssignee !== 'all' && t.assignee !== filterAssignee) return false;
          if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            t.title.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            (t.assignee || '').toLowerCase().includes(q)
          );
        });

        return (
        <>
          {/* Action & Filter Controls */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: showForm ? '#EF4444' : 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)',
                color: showForm ? 'var(--text-primary)' : 'var(--bg-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                {showForm ? <X size={14} /> : <Plus size={14} />}
                {showForm ? 'Batal' : 'Tambah Tugas'}
              </button>

              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tugas berdasarkan judul, deskripsi, atau penanggung jawab..."
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
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Row: Priority & Assignee */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={12} /> Prioritas:
                </span>
                {(['all', 'high', 'medium', 'low'] as const).map((p) => {
                  const isSel = filterPriority === p;
                  const labels: Record<string, string> = { all: 'Semua', high: '🔥 Tinggi', medium: '⚡ Sedang', low: '☕ Rendah' };
                  return (
                    <button
                      key={p}
                      onClick={() => setFilterPriority(p)}
                      style={{
                        padding: '4px 9px',
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
                      {labels[p]}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
                  <UserCheck size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>PJ:</span>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
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
                    <option value="all">Semua Anggota ({tasks.length})</option>
                    {COMMUNITY_USERS.map((u) => {
                      const count = tasks.filter((t) => t.assignee === u.name).length;
                      return (
                        <option key={u.id} value={u.name}>
                          {u.avatar} {u.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {(searchQuery || filterPriority !== 'all' || filterAssignee !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterPriority('all');
                      setFilterAssignee('all');
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
          </div>

          {showForm && (
            <div style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', padding: 16, marginBottom: 16 }}>
              <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Judul tugas *" style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              <input value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="Deskripsi" style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select
                  value={fAssignee}
                  onChange={(e) => setFAssignee(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: fAssignee ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  <option value="">👤 Pilih Penanggung Jawab (Belum Ditugaskan)...</option>
                  {COMMUNITY_USERS.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.avatar} {u.name} — {u.department}
                    </option>
                  ))}
                </select>
                <input value={fDueDate} onChange={(e) => setFDueDate(e.target.value)} type="date" style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button key={p} onClick={() => setFPriority(p)} style={{ flex: 1, padding: '6px', background: fPriority === p ? `${PRIORITY_COLORS[p]}15` : 'var(--bg-elevated)', border: `1px solid ${fPriority === p ? PRIORITY_COLORS[p] + '33' : 'var(--border-subtle)'}`, borderRadius: 6, color: fPriority === p ? PRIORITY_COLORS[p] : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={handleSubmit} style={{ width: '100%', padding: '8px', background: 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)', color: 'var(--bg-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {editing ? 'Simpan' : 'Tambah Tugas'}
              </button>
            </div>
          )}

          {/* Kanban Columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {STATUSES.map((status) => {
              const config = STATUS_CONFIG[status];
              const colTasks = filteredTasks.filter((t) => t.status === status);
              return (
                  <div 
                  key={status} 
                  onDragOver={(e) => { e.preventDefault(); if (dragOverCol !== status) setDragOverCol(status); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    setDraggingTask(null);
                    const taskId = e.dataTransfer.getData('taskId');
                    if (taskId) moveTask(taskId, status);
                  }}
                  style={{
                    background: dragOverCol === status ? `${config.color}15` : config.bg,
                    border: dragOverCol === status ? `2px dashed ${config.color}80` : `1px solid ${config.color}22`,
                    borderRadius: 'var(--radius-2xl)',
                    padding: 12,
                    minHeight: 200,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 12, paddingBottom: 8,
                    borderBottom: `1px solid ${config.color}22`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: config.color }}>
                      {config.label}
                    </span>
                    <span style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: `${config.color}22`, color: config.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {colTasks.length}
                    </span>
                  </div>

                  {colTasks.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '28px 8px',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-xl)',
                    }}>
                      Tidak ada tugas
                    </div>
                  )}

                  {colTasks.map((task) => (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('taskId', task.id);
                        setDraggingTask(task.id);
                        setTimeout(() => e.target && ((e.target as HTMLElement).style.opacity = '0.5'), 0);
                      }}
                      onDragEnd={(e) => {
                        setDraggingTask(null);
                        setDragOverCol(null);
                        e.currentTarget.style.opacity = '1';
                      }}
                      style={{
                        background: 'var(--bg-elevated)', boxShadow: draggingTask === task.id ? '0 10px 25px rgba(0,0,0,0.2)' : 'var(--shadow-sm)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-2xl)',
                        padding: 12,
                        marginBottom: 8,
                        cursor: 'grab',
                        transform: draggingTask === task.id ? 'scale(1.02) rotate(2deg)' : 'scale(1) rotate(0deg)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        zIndex: draggingTask === task.id ? 100 : 1,
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1 }}>
                          {task.title}
                        </span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button onClick={() => startEdit(task)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><Edit3 size={11} /></button>
                          <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}><Trash2 size={11} /></button>
                        </div>
                      </div>
                      {task.description && (
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.3 }}>{task.description.slice(0, 60)}...</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 14 }}>
                            {task.assigneeAvatar || getCommunityUserByName(task.assignee)?.avatar || '👤'}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{task.assignee.split(' ')[0]}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Flag size={10} color={PRIORITY_COLORS[task.priority]} />
                          {task.dueDate && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{task.dueDate.slice(5)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
        );
      })()}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-3xl)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{monthName}</span>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
          </div>

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: 4 }}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '1', padding: 4 }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const events = getEventsForDay(day);
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
              return (
                <div
                  key={day}
                  onClick={() => setSelectedCalDay(day)}
                  style={{
                    aspectRatio: '1',
                    padding: 6,
                    background: isToday ? 'rgba(35,122,87,0.15)' : 'var(--bg-card)',
                    border: isToday ? '2px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.04)';
                    e.currentTarget.style.borderColor = 'var(--accent-terracotta)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.zIndex = '2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = isToday ? 'var(--accent-green)' : 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.zIndex = '1';
                  }}
                  title={`Klik untuk melihat detail agenda tanggal ${day}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--accent-green)' : 'var(--text-primary)' }}>{day}</span>
                    {(events.length > 0 || dayTasks.length > 0) && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 'var(--radius-pill)', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>
                        {events.length + dayTasks.length}
                      </span>
                    )}
                  </div>
                  {events.slice(0, 2).map((evt) => (
                    <div key={evt.id} style={{
                      fontSize: 8,
                      padding: '1px 3px',
                      background: `${evt.color}22`,
                      color: evt.color,
                      borderRadius: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}>
                      {evt.title}
                    </div>
                  ))}
                  {dayTasks.slice(0, 1).map((t) => (
                    <div key={t.id} style={{
                      fontSize: 8,
                      padding: '1px 3px',
                      background: 'rgba(245,158,11,0.15)',
                      color: '#D97706',
                      borderRadius: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}>
                      📌 {t.title}
                    </div>
                  ))}
                  {(events.length + dayTasks.length) > 3 && (
                    <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 600, paddingLeft: 2 }}>
                      +{(events.length + dayTasks.length) - 3} lainnya
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Calendar Day Details Modal */}
      {selectedCalDay !== null && (() => {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalDay).padStart(2, '0')}`;
        const dayEvents = getEventsForDay(selectedCalDay);
        const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
        const formattedDate = formatAdminDate(dateStr);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              padding: 20,
            }}
            onClick={() => setSelectedCalDay(null)}
          >
            <div
              style={{
                background: 'var(--bg-elevated)',
                width: '100%',
                maxWidth: 580,
                maxHeight: '88vh',
                borderRadius: 'var(--radius-3xl)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 'var(--radius-2xl)',
                      background: 'rgba(35, 122, 87, 0.12)',
                      color: 'var(--accent-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalIcon size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {formattedDate}
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0 0', fontWeight: 500 }}>
                      {dayEvents.length + dayTasks.length} agenda/task pada tanggal ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCalDay(null)}
                  style={{
                    background: 'var(--bg-elevated)',
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

              {/* Body */}
              <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Calendar Events Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Jadwal Kegiatan ({dayEvents.length})
                    </h4>
                    <button
                      onClick={() => setShowAddCalModal(true)}
                      style={{
                        background: 'rgba(35,122,87,0.1)',
                        border: '1px solid var(--accent-green)',
                        color: 'var(--accent-green)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Plus size={12} /> Tambah Acara
                    </button>
                  </div>

                  {dayEvents.length === 0 ? (
                    <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-subtle)', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      Tidak ada jadwal kegiatan khusus pada hari ini.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {dayEvents.map((evt) => (
                        <div
                          key={evt.id}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--bg-primary)',
                            border: `1px solid ${evt.color}44`,
                            borderLeft: `4px solid ${evt.color}`,
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {evt.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} /> {evt.time}
                              </span>
                              <span>•</span>
                              <span style={{ textTransform: 'capitalize', fontWeight: 600, color: evt.color }}>
                                {evt.type}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteCalendarEvent(evt.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 6,
                            }}
                            title="Hapus Acara"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tasks Due Section */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Task Deadline ({dayTasks.length})
                  </h4>
                  {dayTasks.length === 0 ? (
                    <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-subtle)', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      Tidak ada task yang jatuh tempo pada hari ini.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {t.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                              <span>PJ: {t.assignee}</span>
                              <span>•</span>
                              <span style={{ color: STATUS_CONFIG[t.status].color, fontWeight: 600 }}>
                                {STATUS_CONFIG[t.status].label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCalDay(null);
                              setView('kanban');
                              startEdit(t);
                            }}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-lg)',
                              padding: '5px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Edit3 size={12} /> Buka di Kanban
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Calendar Event Quick Modal */}
      {showAddCalModal && selectedCalDay !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            padding: 20,
          }}
          onClick={() => setShowAddCalModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-elevated)',
              width: '100%',
              maxWidth: 420,
              borderRadius: 'var(--radius-2xl)',
              padding: 20,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Tambah Jadwal Kegiatan
              </h3>
              <button
                onClick={() => setShowAddCalModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Judul Acara *
                </label>
                <input
                  value={calEventTitle}
                  onChange={(e) => setCalEventTitle(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Mingguan"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Waktu
                  </label>
                  <input
                    value={calEventTime}
                    onChange={(e) => setCalEventTime(e.target.value)}
                    placeholder="10:00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Tipe
                  </label>
                  <select
                    value={calEventType}
                    onChange={(e) => setCalEventType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="event">Event</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Warna Penanda
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCalEventColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c,
                        border: calEventColor === c ? '2px solid var(--text-primary)' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowAddCalModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!calEventTitle.trim()) return;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalDay).padStart(2, '0')}`;
                  addCalendarEvent({
                    id: generateId('cal'),
                    title: calEventTitle.trim(),
                    date: dateStr,
                    time: calEventTime || '10:00',
                    color: calEventColor,
                    type: calEventType,
                  });
                  setCalEventTitle('');
                  setShowAddCalModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--accent-green)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
