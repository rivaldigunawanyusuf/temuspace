/**
 * Dashboard.tsx - Executive Dashboard & Community Intelligence (Admin)
 * 
 * Complete and comprehensive overview across all community operations:
 * - Treasury & Cashflow Analytics (Cashflow trends, category expense breakdown, dues progress)
 * - Kanban & Team Workload (Task status, priority, per-assignee distribution)
 * - Secretariat, Letters & Inventory (Incoming/outgoing correspondence, minutes, physical assets)
 * - Community Events & Engagement (Upcoming events, LMS modules, Vault resources)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../../stores/usePostStore';
import { useEventStore } from '../../stores/useEventStore';
import { useResourceStore } from '../../stores/useResourceStore';
import { useAdminStore, SEED_DUES_CONFIG } from '../../stores/useAdminStore';
import { COMMUNITY_USERS } from '../../data/communityUsers';
import {
  Users, FileText, Calendar, Wallet, KanbanSquare, BarChart3,
  PieChart as PieChartIcon, BookOpen, Activity, ArrowUpRight,
  ArrowDownRight, CheckCircle2, Clock, AlertTriangle, Layers,
  Inbox, Send, Package, Download, ChevronRight, Sparkles,
  TrendingUp, TrendingDown, Check, AlertCircle, FileCheck2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const formatRp = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

const EXPENSE_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#6366F1'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'treasury' | 'operations' | 'governance' | 'community'>('all');

  // Stores with defensive fallbacks
  const rawPosts = usePostStore((s) => s.posts);
  const posts = Array.isArray(rawPosts) ? rawPosts : [];

  const rawEvents = useEventStore((s) => s.events);
  const events = Array.isArray(rawEvents) ? rawEvents : [];

  const { modules: rawModules, vault: rawVault } = useResourceStore();
  const modules = Array.isArray(rawModules) ? rawModules : [];
  const vault = Array.isArray(rawVault) ? rawVault : [];

  const adminStore = useAdminStore();
  const transactions = Array.isArray(adminStore.transactions) ? adminStore.transactions : [];
  const memberDues = Array.isArray(adminStore.memberDues) ? adminStore.memberDues : [];
  const tasks = Array.isArray(adminStore.tasks) ? adminStore.tasks : [];
  const letters = Array.isArray(adminStore.letters) ? adminStore.letters : [];
  const minutes = Array.isArray(adminStore.minutes) ? adminStore.minutes : [];
  const assets = Array.isArray(adminStore.assets) ? adminStore.assets : [];
  const duesConfig = adminStore.duesConfig || SEED_DUES_CONFIG;

  // Treasury Metrics
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  // Dues Metrics
  const totalDuesTarget = memberDues.reduce((s, d) => s + (d.amount || 0), 0);
  const totalDuesPaid = memberDues.reduce((s, d) => s + (d.paidAmount || 0), 0);
  const totalDuesRemaining = Math.max(0, totalDuesTarget - totalDuesPaid);
  const duesPaidCount = memberDues.filter((d) => (d.paidAmount || 0) >= (d.amount || 0) && (d.amount || 0) > 0).length;
  const duesPartialCount = memberDues.filter((d) => (d.paidAmount || 0) > 0 && (d.paidAmount || 0) < (d.amount || 0)).length;
  const duesUnpaidCount = memberDues.filter((d) => (d.paidAmount || 0) === 0 && (d.amount || 0) > 0).length;
  const duesPercent = totalDuesTarget > 0 ? Math.min(100, Math.round((totalDuesPaid / totalDuesTarget) * 100)) : 100;

  // Task & Operations Metrics
  const tasksTodo = tasks.filter((t) => t.status === 'todo').length;
  const tasksInProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const tasksReview = tasks.filter((t) => t.status === 'review').length;
  const tasksDone = tasks.filter((t) => t.status === 'done').length;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'done');

  // Secretariat & Inventory Metrics
  const incomingLetters = letters.filter((l) => l.type === 'incoming').length;
  const outgoingLetters = letters.filter((l) => l.type === 'outgoing').length;
  const assetsGood = assets.filter((a) => a.condition === 'baik').length;
  const totalAssetQty = assets.reduce((s, a) => s + (a.quantity || 1), 0);

  // Events & Engagement Metrics
  const liveEvents = events.filter((e) => e.status === 'live').length;
  const upcomingEvents = events.filter((e) => e.status === 'upcoming').length;
  const totalAttendees = events.reduce((s, e) => s + (e.attendees || 0), 0);
  const publishedModules = modules.filter((m) => m.isPublished).length;
  const totalVaultDownloads = vault.reduce((s, f) => s + (f.downloads || 0), 0);

  // ============================================================
  // Charts Data Preparation
  // ============================================================

  // 1. Dynamic Monthly Cashflow
  const sepIncome = transactions.filter(t => t.type === 'income' && (t.date || '').startsWith('2026-09')).reduce((s, t) => s + t.amount, 0);
  const sepExpense = transactions.filter(t => t.type === 'expense' && (t.date || '').startsWith('2026-09')).reduce((s, t) => s + t.amount, 0);
  const octIncome = transactions.filter(t => t.type === 'income' && (t.date || '').startsWith('2026-10')).reduce((s, t) => s + t.amount, 0);
  const octExpense = transactions.filter(t => t.type === 'expense' && (t.date || '').startsWith('2026-10')).reduce((s, t) => s + t.amount, 0);

  const cashFlowData = [
    { name: 'Juli', Pemasukan: 1800000, Pengeluaran: 1200000 },
    { name: 'Agustus', Pemasukan: 3200000, Pengeluaran: 2100000 },
    { name: 'September', Pemasukan: sepIncome || 2500000, Pengeluaran: sepExpense || 1800000 },
    { name: 'Oktober', Pemasukan: octIncome || totalIncome, Pengeluaran: octExpense || totalExpense },
  ];

  // 2. Expense Breakdown by Category
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Operasional';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (t.amount || 0);
    });

  const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Fallback if empty
  if (expenseCategoryData.length === 0) {
    expenseCategoryData.push({ name: 'Operasional', value: 1000000 });
  }

  // 3. Team Workload (Kanban Tasks by Assignee)
  const workloadMap: Record<string, { total: number; done: number; inProgress: number; avatar: string; role: string }> = {};
  COMMUNITY_USERS.forEach((u) => {
    workloadMap[u.name] = { total: 0, done: 0, inProgress: 0, avatar: u.avatar, role: u.department };
  });
  tasks.forEach((t) => {
    if (!workloadMap[t.assignee]) {
      workloadMap[t.assignee] = { total: 0, done: 0, inProgress: 0, avatar: t.assigneeAvatar || '👤', role: 'Anggota' };
    }
    workloadMap[t.assignee].total += 1;
    if (t.status === 'done') workloadMap[t.assignee].done += 1;
    if (t.status === 'in-progress') workloadMap[t.assignee].inProgress += 1;
  });

  const workloadList = Object.entries(workloadMap)
    .filter(([_, data]) => data.total > 0)
    .sort((a, b) => b[1].total - a[1].total);

  // Recent Minutes & Latest Letters
  const latestMinutes = minutes[0];
  const recentLetters = letters.slice(0, 4);

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1060, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ============================================================
          HEADER & STATUS OVERVIEW
          ============================================================ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.3)', borderRadius: 99,
              color: 'var(--accent-green)', fontSize: 10, fontWeight: 800,
              textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace"
            }}>
              <Activity size={11} /> LIVE INTELLIGENCE
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', background: 'rgba(217,119,6,0.12)',
              border: '1px solid rgba(217,119,6,0.25)', borderRadius: 99,
              color: '#D97706', fontSize: 11, fontWeight: 700
            }}>
              <Calendar size={12} /> Periode: {duesConfig.activePeriod}
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Executive Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Visibilitas 360° tata kelola organisasi: keuangan, proker kanban, surat menyurat, event & aset TemuSpace
          </p>
        </div>

        {/* Quick Navigation Filter */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)', padding: 4
        }}>
          {[
            { id: 'all', label: 'Semua Ringkasan' },
            { id: 'treasury', label: 'Keuangan' },
            { id: 'operations', label: 'Proker & Tim' },
            { id: 'governance', label: 'Sekretariat' },
            { id: 'community', label: 'Komunitas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '7px 12px',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--accent-terracotta)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          METRIC KPI GRID (8 KEY PERFORMANCE INDICATORS)
          ============================================================ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {/* KPI 1: Saldo Kas */}
        <div
          onClick={() => navigate('/admin/treasury')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-terracotta)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(217,119,6,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-terracotta)' }}>
              <Wallet size={18} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUp size={12} /> Sehat
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: balance >= 0 ? 'var(--accent-terracotta)' : '#EF4444' }}>
            {formatRp(balance)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Saldo Kas</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Masuk: {formatRp(totalIncome)}</span>
          </div>
        </div>

        {/* KPI 2: Iuran Anggota */}
        <div
          onClick={() => navigate('/admin/treasury')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-green)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
              <FileCheck2 size={18} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 800 }}>
              {duesPercent}% ({duesPaidCount}/{memberDues.length})
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-green)' }}>
            {formatRp(totalDuesPaid)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Iuran Terkumpul</span>
            <span style={{ fontSize: 11, color: '#D97706' }}>Sisa: {formatRp(totalDuesRemaining)}</span>
          </div>
        </div>

        {/* KPI 3: Proker Kanban */}
        <div
          onClick={() => navigate('/admin/kanban')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <KanbanSquare size={18} />
            </div>
            <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>
              {tasksDone} Selesai
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {tasksInProgress + tasksReview} Tugas Aktif
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Proker Kanban</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total {tasks.length} Proker</span>
          </div>
        </div>

        {/* KPI 4: Event & Agenda */}
        <div
          onClick={() => navigate('/admin/events')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <Calendar size={18} />
            </div>
            <span style={{ fontSize: 11, color: liveEvents > 0 ? '#EF4444' : 'var(--text-muted)', fontWeight: 800 }}>
              {liveEvents > 0 ? `🔴 ${liveEvents} Live` : 'Standby'}
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {upcomingEvents} Mendatang
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Event Komunitas</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{totalAttendees} Pendaftar</span>
          </div>
        </div>

        {/* KPI 5: Surat & Legalitas */}
        <div
          onClick={() => navigate('/admin/secretariat')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
              <Inbox size={18} />
            </div>
            <span style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 700 }}>
              {minutes.length} Notulensi
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {letters.length} Berkas Surat
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Sekretariat</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{incomingLetters} Masuk • {outgoingLetters} Keluar</span>
          </div>
        </div>

        {/* KPI 6: Aset & Inventaris */}
        <div
          onClick={() => navigate('/admin/secretariat')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59E0B'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <Package size={18} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700 }}>
              {assetsGood} Baik
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {assets.length} Item Aset
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Inventaris Organisasi</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{totalAssetQty} Unit Fisik</span>
          </div>
        </div>

        {/* KPI 7: Modul LMS & Vault */}
        <div
          onClick={() => navigate('/admin/lms')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10B981'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <BookOpen size={18} />
            </div>
            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>
              {totalVaultDownloads}x Unduhan
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {publishedModules} Modul Publik
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Knowledge Base</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{vault.length} Berkas Vault</span>
          </div>
        </div>

        {/* KPI 8: Anggota Aktif */}
        <div
          onClick={() => navigate('/admin/treasury')}
          style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EC4899'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
              <Users size={18} />
            </div>
            <span style={{ fontSize: 11, color: '#EC4899', fontWeight: 700 }}>
              100% Terdata
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {COMMUNITY_USERS.length} Anggota
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Daftar Komunitas</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>1 Admin • 9 Anggota</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          CHARTS SECTION (CASHFLOW & TEAM TASK DISTRIBUTION)
          ============================================================ */}
      {(activeTab === 'all' || activeTab === 'treasury') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Chart 1: Cash Flow Multi-Month Bar */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={18} color="var(--accent-terracotta)" />
                  Tren Arus Kas Organisasi (2026)
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Perbandingan Pemasukan vs Pengeluaran multi-bulan
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/treasury')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-terracotta)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Detail Kas <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${v / 1000000}M`} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-primary)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    formatter={(val: number) => formatRp(val)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="Pemasukan" fill="#34D399" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="Pengeluaran" fill="#F87171" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Expense Breakdown by Category */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChartIcon size={18} color="#EF4444" />
                  Alokasi Pengeluaran Kas
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Proporsi pos biaya pengeluaran komunitas
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444' }}>
                Total: {formatRp(totalExpense)}
              </span>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expenseCategoryData.map((_, index) => (
                      <Cell key={`expense-cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    formatter={(val: number) => formatRp(val)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 2: PROKER KANBAN & TEAM WORKLOAD
          ============================================================ */}
      {(activeTab === 'all' || activeTab === 'operations') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Team Workload Meter */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="#3B82F6" />
                  Beban Kerja Anggota Tim (Kanban)
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Distribusi tugas yang sedang di-handle per personel
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/kanban')}
                style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Papan Kanban <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workloadList.map(([name, data]) => {
                const percent = Math.round((data.done / data.total) * 100);
                return (
                  <div key={name} style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{data.avatar}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{data.role}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {data.total} Task
                        </span>
                        <div style={{ fontSize: 10, color: 'var(--accent-green)', fontWeight: 600 }}>
                          {data.done} selesai • {data.inProgress} proses
                        </div>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        width: `${percent}%`, height: '100%',
                        background: percent === 100 ? 'var(--accent-green)' : '#3B82F6',
                        borderRadius: 99
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent & High Priority Tasks */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#F59E0B" />
                  Tugas Prioritas Tinggi & Mendesak
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Proker yang membutuhkan atensi segera dari tim
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', background: 'rgba(245,158,11,0.12)', color: '#D97706', borderRadius: 99 }}>
                {highPriorityTasks.length} Urgent
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.slice(0, 5).map((t) => {
                const isHigh = t.priority === 'high';
                return (
                  <div key={t.id} style={{
                    padding: '11px 13px', background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-xl)', border: `1px solid ${isHigh ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
                    display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <span style={{ fontSize: 20 }}>{t.assigneeAvatar || '📌'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>PJ: {t.assignee}</span>
                        {t.dueDate && <span>• 📅 {t.dueDate}</span>}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 6,
                      background: isHigh ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                      color: isHigh ? '#EF4444' : '#3B82F6', textTransform: 'uppercase'
                    }}>
                      {t.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 3: TRANSPARANSI IURAN & KAS DETAIL
          ============================================================ */}
      {(activeTab === 'all' || activeTab === 'treasury') && (
        <div style={{
          background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-3xl)', padding: 20, marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Ringkasan Iuran Kas Anggota ({duesConfig.activePeriod})
                </h2>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'rgba(217,119,6,0.12)', color: '#D97706', borderRadius: 99 }}>
                  Tarif Acuan: {formatRp(duesConfig.defaultAmount)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {duesConfig.description}
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/treasury')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: 'var(--accent-terracotta)', border: 'none',
                borderRadius: 'var(--radius-xl)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Kelola di Modul Bendahara <ChevronRight size={14} />
            </button>
          </div>

          {/* Dues Progress Bar & Roster Cards */}
          <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                Kemajuan Tagihan Kas: <strong>{formatRp(totalDuesPaid)}</strong> dari <strong>{formatRp(totalDuesTarget)}</strong>
              </span>
              <span style={{ color: duesPercent === 100 ? 'var(--accent-green)' : 'var(--accent-terracotta)', fontWeight: 800 }}>
                {duesPercent}% ({duesPaidCount} Lunas • {duesPartialCount} Kurang • {duesUnpaidCount} Belum)
              </span>
            </div>
            <div style={{ width: '100%', height: 10, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${duesPercent}%`, height: '100%',
                background: duesPercent === 100 ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-terracotta) 0%, var(--accent-green) 100%)',
                borderRadius: 99
              }} />
            </div>
          </div>

          {/* Member Dues Grid Snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {memberDues.map((m) => {
              const paid = m.paidAmount || 0;
              const target = m.amount || 0;
              const isPaid = paid >= target && target > 0;
              const isExempt = target === 0;
              const remaining = Math.max(0, target - paid);

              return (
                <div key={m.memberId} style={{
                  padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 22 }}>{m.avatar}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatRp(paid)} / {formatRp(target)} {m.note ? `• ${m.note}` : ''}
                    </div>
                  </div>
                  <div>
                    {isExempt ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', background: 'rgba(156,163,175,0.15)', color: 'var(--text-muted)', borderRadius: 6 }}>
                        Bebas
                      </span>
                    ) : isPaid ? (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Check size={11} /> Lunas
                      </span>
                    ) : paid > 0 ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', background: 'rgba(245,158,11,0.15)', color: '#D97706', borderRadius: 6 }}>
                        Kurang {formatRp(remaining)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', background: 'rgba(239,68,68,0.12)', color: '#EF4444', borderRadius: 6 }}>
                        Belum Bayar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 4: SEKRETARIAT, NOTULENSI & INVENTARIS
          ============================================================ */}
      {(activeTab === 'all' || activeTab === 'governance') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Latest Minutes & Decisions */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#8B5CF6" />
                  Notulensi & Keputusan Rapat Terakhir
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Hasil kesepakatan koordinasi organisasi
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/secretariat')}
                style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Arsip Notulensi <ChevronRight size={13} />
              </button>
            </div>

            {latestMinutes ? (
              <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {latestMinutes.title}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {latestMinutes.date}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
                  {latestMinutes.agenda}
                </div>

                {latestMinutes.decisions && Array.isArray(latestMinutes.decisions) && latestMinutes.decisions.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Keputusan Utama:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {latestMinutes.decisions.slice(0, 3).map((dec, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={12} color="var(--accent-green)" /> {dec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                Belum ada data notulensi rapat.
              </div>
            )}
          </div>

          {/* Inventaris Fisik & Surat Masuk/Keluar */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Inbox size={18} color="#D97706" />
                  Korespondensi & Surat Resmi
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Surat permohonan, izin venue, dan sponsorship
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/secretariat')}
                style={{ background: 'none', border: 'none', color: '#D97706', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Buku Surat <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentLetters.map((l) => (
                <div key={l.id} style={{
                  padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: l.type === 'incoming' ? 'rgba(59,130,246,0.12)' : 'rgba(52,211,153,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {l.type === 'incoming' ? <Inbox size={14} color="#3B82F6" /> : <Send size={14} color="var(--accent-green)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.subject}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {l.number} • {l.type === 'incoming' ? `Dari: ${l.from}` : `Tujuan: ${l.to}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(156,163,175,0.15)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 5: KOMUNITAS, EVENT & RESOURCE VAULT
          ============================================================ */}
      {(activeTab === 'all' || activeTab === 'community') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          {/* Upcoming Events */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="#EF4444" />
                  Agenda & Event Mendatang
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Workshop, meetup, dan hackathon komunitas
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/events')}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Event Manager <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.slice(0, 4).map((e) => (
                <div key={e.id} style={{
                  padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 22 }}>{e.coverEmoji || '🎪'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      📅 {e.date} • 🕒 {e.time} • {e.attendees} Pendaftar
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                    background: e.status === 'live' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.12)',
                    color: e.status === 'live' ? '#EF4444' : '#3B82F6', textTransform: 'uppercase'
                  }}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular LMS Modules & Vault Files */}
          <div style={{
            background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={18} color="#10B981" />
                  Materi LMS & Vault Terpopuler
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Modul kursus & berkas template terpakai
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/lms')}
                style={{ background: 'none', border: 'none', color: '#10B981', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                LMS Studio <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modules.slice(0, 2).map((m) => (
                <div key={m.id} style={{
                  padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 20 }}>{m.thumbnail || '📘'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Oleh: {m.authorName} • {m.duration} • Progress {m.progress}%
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', background: 'rgba(16,185,129,0.12)', color: '#10B981', borderRadius: 6 }}>
                    LMS Kursus
                  </span>
                </div>
              ))}

              {vault.slice(0, 2).map((f) => (
                <div key={f.id} style={{
                  padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 20 }}>{f.icon || '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {f.fileSize} • Diunggah {f.uploadedBy} • {f.downloads} Unduhan
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', background: 'rgba(59,130,246,0.12)', color: '#3B82F6', borderRadius: 6 }}>
                    Vault File
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
