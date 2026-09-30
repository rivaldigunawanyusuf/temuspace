/**
 * Treasury.tsx - Bendahara Module (Admin)
 * 
 * Full CRUD: income/expense transactions
 * Flexible Member dues tracking & settings (cadence, custom targets, quick payments)
 */
import { useState } from 'react';
import { useAdminStore, generateId, SEED_DUES_CONFIG } from '../../stores/useAdminStore';
import type { Transaction, TransactionType, MemberDues, DuesPeriodType } from '../../stores/useAdminStore';
import {
  Plus, Trash2, Edit3, X, TrendingUp, TrendingDown, Wallet,
  Check, AlertCircle, Search, Settings, Sliders, Calendar,
  DollarSign, CheckCircle2, Clock, HelpCircle, RefreshCw,
  Filter, RotateCcw
} from 'lucide-react';

import { COMMUNITY_USERS } from '../../data/communityUsers';

const formatRp = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

const CADENCE_LABELS: Record<DuesPeriodType, { label: string; badge: string; desc: string }> = {
  monthly: {
    label: 'Bulanan',
    badge: '🔄 Iuran Bulanan',
    desc: 'Ditagihkan rutin setiap bulan untuk operasional berkala.',
  },
  semester: {
    label: 'Per Semester',
    badge: '🎓 Iuran Per Semester',
    desc: 'Ditagihkan 1x setiap 6 bulan (periode semester kepengurusan).',
  },
  lifetime: {
    label: 'Seumur Keanggotaan',
    badge: '🛡️ Sekali Seumur Keanggotaan',
    desc: 'Dibayarkan hanya satu kali selama menjadi anggota komunitas.',
  },
};

export default function Treasury() {
  const {
    transactions,
    duesConfig: rawDuesConfig,
    memberDues,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    payDues,
    setDuesConfig,
    updateMemberDuesTarget,
    updateAllDuesTarget,
    resetDuesPeriod,
  } = useAdminStore();

  const duesConfig = rawDuesConfig || SEED_DUES_CONFIG;

  const [tab, setTab] = useState<'transactions' | 'dues'>('transactions');

  // Transactions Form State
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formType, setFormType] = useState<TransactionType>('income');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCreatedBy, setFormCreatedBy] = useState('Dewi Kartika');

  // Transactions Filtering & Search
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');

  // Dues Filtering & Search
  const [duesFilter, setDuesFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [duesSearch, setDuesSearch] = useState('');

  // Global Dues Settings Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cfgPeriodType, setCfgPeriodType] = useState<DuesPeriodType>(duesConfig.periodType);
  const [cfgActivePeriod, setCfgActivePeriod] = useState(duesConfig.activePeriod);
  const [cfgDefaultAmount, setCfgDefaultAmount] = useState(String(duesConfig.defaultAmount));
  const [cfgDescription, setCfgDescription] = useState(duesConfig.description);
  const [cfgDueDate, setCfgDueDate] = useState(duesConfig.dueDate || '');
  const [cfgApplyToAll, setCfgApplyToAll] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Individual Member Dues Target Modal State
  const [settingMember, setSettingMember] = useState<MemberDues | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customNote, setCustomNote] = useState('');

  // Pay Dues Modal State
  const [payDuesMember, setPayDuesMember] = useState<MemberDues | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Transfer Bank BCA');
  const [payRecordedBy, setPayRecordedBy] = useState('Dewi Kartika');

  // Summary Metrics for Transactions
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Summary Metrics for Dues
  const totalDuesTarget = memberDues.reduce((s, d) => s + (d.amount || 0), 0);
  const totalDuesPaid = memberDues.reduce((s, d) => s + (d.paidAmount || 0), 0);
  const totalDuesRemaining = Math.max(0, totalDuesTarget - totalDuesPaid);
  const paidPercent = totalDuesTarget > 0 ? Math.min(100, Math.round((totalDuesPaid / totalDuesTarget) * 100)) : 100;

  const paidCount = memberDues.filter((d) => (d.paidAmount || 0) >= (d.amount || 0) && (d.amount || 0) > 0).length;
  const partialCount = memberDues.filter((d) => (d.paidAmount || 0) > 0 && (d.paidAmount || 0) < (d.amount || 0)).length;
  const unpaidCount = memberDues.filter((d) => (d.paidAmount || 0) === 0 && (d.amount || 0) > 0).length;

  // Filtered dues
  const filteredMemberDues = memberDues.filter((d) => {
    const q = duesSearch.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(q) || (d.department || '').toLowerCase().includes(q) || (d.note || '').toLowerCase().includes(q);
    if (!matchSearch) return false;

    const isFullyPaid = (d.paidAmount || 0) >= (d.amount || 0);
    const isPartial = (d.paidAmount || 0) > 0 && (d.paidAmount || 0) < (d.amount || 0);
    const isUnpaid = (d.paidAmount || 0) === 0 && (d.amount || 0) > 0;

    if (duesFilter === 'paid') return isFullyPaid;
    if (duesFilter === 'partial') return isPartial;
    if (duesFilter === 'unpaid') return isUnpaid;
    return true;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
    if (txCategoryFilter !== 'all' && t.category !== txCategoryFilter) return false;
    if (!txSearch.trim()) return true;
    const q = txSearch.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.createdBy || '').toLowerCase().includes(q)
    );
  });

  const uniqueTxCategories = Array.from(new Set(transactions.map((t) => t.category).filter(Boolean)));

  const resetForm = () => {
    setFormType('income');
    setFormCategory('');
    setFormDesc('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCreatedBy('Dewi Kartika');
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmitTransaction = () => {
    if (!formCategory || !formDesc || !formAmount) return;
    const data = {
      type: formType,
      category: formCategory,
      description: formDesc,
      amount: parseInt(formAmount) || 0,
      date: formDate,
      createdBy: formCreatedBy || 'Dewi Kartika',
    };
    if (editing) {
      updateTransaction(editing, data);
    } else {
      addTransaction({ id: generateId('trx'), ...data });
    }
    resetForm();
  };

  const startEditTransaction = (t: Transaction) => {
    setEditing(t.id);
    setFormType(t.type);
    setFormCategory(t.category);
    setFormDesc(t.description);
    setFormAmount(String(t.amount));
    setFormDate(t.date);
    setFormCreatedBy(t.createdBy || 'Dewi Kartika');
    setShowForm(true);
  };

  const handleOpenConfigModal = () => {
    setCfgPeriodType(duesConfig.periodType);
    setCfgActivePeriod(duesConfig.activePeriod);
    setCfgDefaultAmount(String(duesConfig.defaultAmount));
    setCfgDescription(duesConfig.description);
    setCfgDueDate(duesConfig.dueDate || '');
    setCfgApplyToAll(false);
    setShowResetConfirm(false);
    setShowConfigModal(true);
  };

  const handleSaveConfig = () => {
    const numAmount = parseInt(cfgDefaultAmount) || 0;
    setDuesConfig({
      periodType: cfgPeriodType,
      activePeriod: cfgActivePeriod.trim() || 'Oktober 2026',
      defaultAmount: numAmount,
      description: cfgDescription,
      dueDate: cfgDueDate,
    });
    if (cfgApplyToAll) {
      updateAllDuesTarget(numAmount);
    }
    setShowConfigModal(false);
  };

  const handleOpenMemberSetting = (d: MemberDues) => {
    setSettingMember(d);
    setCustomAmount(String(d.amount));
    setCustomNote(d.note || 'Tarif Standar');
  };

  const handleSaveMemberSetting = () => {
    if (!settingMember) return;
    const parsedAmount = parseInt(customAmount) || 0;
    updateMemberDuesTarget(settingMember.memberId, parsedAmount, customNote);
    setSettingMember(null);
  };

  const handleOpenPayModal = (d: MemberDues) => {
    setPayDuesMember(d);
    const remaining = Math.max(0, d.amount - (d.paidAmount || 0));
    setPayAmount(String(remaining > 0 ? remaining : d.amount));
  };

  const handleConfirmPay = () => {
    if (!payDuesMember) return;
    const amount = parseInt(payAmount) || 0;
    if (amount <= 0) return;

    // Log to income transactions automatically for transparency
    addTransaction({
      id: generateId('trx'),
      type: 'income',
      category: 'Iuran Kas',
      description: `Iuran ${duesConfig.activePeriod} - ${payDuesMember.name} (${payMethod})`,
      amount,
      date: new Date().toISOString().split('T')[0],
      createdBy: payRecordedBy || 'Dewi Kartika',
    });

    payDues(payDuesMember.memberId, amount);
    setPayDuesMember(null);
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Modul Bendahara
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Pengelolaan arus kas, pembukuan transaksi, dan tata kelola iuran anggota TemuSpace
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingUp size={16} color="var(--accent-green)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Pemasukan</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)' }}>{formatRp(totalIncome)}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingDown size={16} color="#EF4444" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Pengeluaran</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444' }}>{formatRp(totalExpense)}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Wallet size={16} color="var(--accent-terracotta)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Saldo Kas Saat Ini</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: balance >= 0 ? 'var(--accent-terracotta)' : '#EF4444' }}>
            {formatRp(balance)}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-2xl)', padding: 4, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setTab('transactions')}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: tab === 'transactions' ? 'var(--accent-terracotta)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            color: tab === 'transactions' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Buku Transaksi Kas ({transactions.length})
        </button>
        <button
          onClick={() => setTab('dues')}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: tab === 'dues' ? 'var(--accent-terracotta)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            color: tab === 'dues' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Iuran Anggota ({memberDues.length})
        </button>
      </div>

      {/* ============================================================
          TAB 1: TRANSAKSI KAS
          ============================================================ */}
      {tab === 'transactions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Riwayat Transaksi Masuk & Keluar
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: showForm ? '#EF4444' : 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)',
                color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Batal' : 'Tambah Transaksi'}
            </button>
          </div>

          {showForm && (
            <div style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  style={{
                    flex: 1, padding: '8px',
                    background: formType === 'income' ? 'rgba(52,211,153,0.15)' : 'var(--bg-elevated)',
                    border: `1px solid ${formType === 'income' ? 'rgba(52,211,153,0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xl)',
                    color: formType === 'income' ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  style={{
                    flex: 1, padding: '8px',
                    background: formType === 'expense' ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)',
                    border: `1px solid ${formType === 'expense' ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xl)',
                    color: formType === 'expense' ? '#EF4444' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Pengeluaran
                </button>
              </div>
              <input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Kategori (misal: Operasional, Event, Iuran Kas, Donasi)"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Deskripsi Transaksi"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Jumlah (Rp)"
                  type="text"
                  style={{ flex: 1, padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <input
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  type="date"
                  style={{ padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Penanggung Jawab / Dicatat Oleh
                </label>
                <select
                  value={formCreatedBy}
                  onChange={(e) => setFormCreatedBy(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer'
                  }}
                >
                  {COMMUNITY_USERS.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.avatar} {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSubmitTransaction}
                style={{ width: '100%', padding: '10px', background: 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {editing ? 'Simpan Perubahan' : 'Catat Transaksi'}
              </button>
            </div>
          )}

          {/* Transaction Search & Filter Bar */}
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
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Cari transaksi (deskripsi, kategori, penanggung jawab)..."
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
                {txSearch && (
                  <button
                    onClick={() => setTxSearch('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {uniqueTxCategories.length > 0 && (
                <select
                  value={txCategoryFilter}
                  onChange={(e) => setTxCategoryFilter(e.target.value)}
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
                  {uniqueTxCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={12} /> Tipe:
                </span>
                {(['all', 'income', 'expense'] as const).map((type) => {
                  const isSel = txTypeFilter === type;
                  const labels: Record<string, string> = { all: 'Semua', income: '🟢 Pemasukan (+)', expense: '🔴 Pengeluaran (-)' };
                  return (
                    <button
                      key={type}
                      onClick={() => setTxTypeFilter(type)}
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
                      {labels[type]}
                    </button>
                  );
                })}
              </div>

              {(txSearch || txTypeFilter !== 'all' || txCategoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setTxSearch('');
                    setTxTypeFilter('all');
                    setTxCategoryFilter('all');
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

          {/* Transaction list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredTransactions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 16px',
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-2xl)',
                color: 'var(--text-muted)',
              }}>
                <Wallet size={28} style={{ marginBottom: 6, opacity: 0.5 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Tidak ada transaksi ditemukan
                </div>
                <div style={{ fontSize: 11 }}>
                  {txSearch || txTypeFilter !== 'all' || txCategoryFilter !== 'all'
                    ? 'Coba sesuaikan kata kunci pencarian atau ganti filter.'
                    : 'Belum ada transaksi tercatat.'}
                </div>
              </div>
            ) : (
              filteredTransactions.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-2xl)', padding: '12px 16px',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-xl)',
                  background: t.type === 'income' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {t.type === 'income' ? <TrendingUp size={18} color="var(--accent-green)" /> : <TrendingDown size={18} color="#EF4444" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span style={{ fontWeight: 600 }}>{t.category}</span> • {t.date} • PJ: {t.createdBy || 'Dewi Kartika'}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 800,
                  color: t.type === 'income' ? 'var(--accent-green)' : '#EF4444',
                  whiteSpace: 'nowrap',
                }}>
                  {t.type === 'income' ? '+' : '-'}{formatRp(t.amount)}
                </div>
                <button
                  onClick={() => startEditTransaction(t)}
                  title="Edit Transaksi"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => deleteTransaction(t.id)}
                  title="Hapus Transaksi"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )))}
          </div>
        </>
      )}

      {/* ============================================================
          TAB 2: IURAN ANGGOTA & PENGATURAN SIKLUS
          ============================================================ */}
      {tab === 'dues' && (
        <>
          {/* Active Period & Cadence Banner */}
          <div style={{
            background: 'var(--bg-elevated)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-3xl)',
            padding: '18px 20px',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px',
                    background: 'rgba(217,119,6,0.12)',
                    border: '1px solid rgba(217,119,6,0.25)',
                    borderRadius: 'var(--radius-xl)',
                    color: '#D97706',
                    fontSize: 11, fontWeight: 800,
                  }}>
                    {CADENCE_LABELS[duesConfig.periodType]?.badge || '🔄 Iuran Bulanan'}
                  </span>

                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    <Calendar size={13} color="var(--accent-terracotta)" />
                    Periode: <strong>{duesConfig.activePeriod}</strong>
                  </span>

                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-secondary)',
                    fontSize: 11, fontWeight: 600,
                  }}>
                    Tarif Acuan: <strong>{formatRp(duesConfig.defaultAmount)}</strong>
                  </span>
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
                  {duesConfig.description}
                </div>

                {duesConfig.dueDate && (
                  <div style={{ fontSize: 11, color: 'var(--accent-terracotta)', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {duesConfig.dueDate}
                  </div>
                )}
              </div>

              {/* Action Button: Global Dues Settings */}
              <button
                onClick={handleOpenConfigModal}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--accent-terracotta)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--accent-terracotta)',
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Settings size={14} /> Pengaturan Iuran & Siklus
              </button>
            </div>

            {/* Dues Progress Bar & Statistics */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Kas Komunitas</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{formatRp(totalDuesTarget)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Terkumpul</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-green)' }}>{formatRp(totalDuesPaid)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sisa Tagihan</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: totalDuesRemaining > 0 ? '#EF4444' : 'var(--accent-green)' }}>
                    {formatRp(totalDuesRemaining)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kelunasan Anggota</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-terracotta)' }}>
                    {paidPercent}% ({paidCount}/{memberDues.length})
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: 8, background: 'var(--bg-primary)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  width: `${paidPercent}%`,
                  height: '100%',
                  background: paidPercent === 100 ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-terracotta) 0%, var(--accent-green) 100%)',
                  borderRadius: 99,
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Filtering & Member Search Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 3 }}>
              <button
                onClick={() => setDuesFilter('all')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: duesFilter === 'all' ? 'var(--accent-terracotta)' : 'transparent',
                  color: duesFilter === 'all' ? 'white' : 'var(--text-muted)'
                }}
              >
                Semua ({memberDues.length})
              </button>
              <button
                onClick={() => setDuesFilter('paid')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: duesFilter === 'paid' ? 'rgba(52,211,153,0.15)' : 'transparent',
                  color: duesFilter === 'paid' ? 'var(--accent-green)' : 'var(--text-muted)'
                }}
              >
                Lunas ({paidCount})
              </button>
              <button
                onClick={() => setDuesFilter('partial')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: duesFilter === 'partial' ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: duesFilter === 'partial' ? '#D97706' : 'var(--text-muted)'
                }}
              >
                Kurang Bayar ({partialCount})
              </button>
              <button
                onClick={() => setDuesFilter('unpaid')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: duesFilter === 'unpaid' ? 'rgba(239,68,68,0.15)' : 'transparent',
                  color: duesFilter === 'unpaid' ? '#EF4444' : 'var(--text-muted)'
                }}
              >
                Belum Bayar ({unpaidCount})
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={duesSearch}
                onChange={(e) => setDuesSearch(e.target.value)}
                placeholder="Cari anggota atau jabatan..."
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Member Dues List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredMemberDues.length === 0 ? (
              <div style={{
                padding: '32px 20px', textAlign: 'center', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', color: 'var(--text-muted)', fontSize: 13
              }}>
                Tidak ada data anggota yang cocok dengan filter.
              </div>
            ) : (
              filteredMemberDues.map((d) => {
                const paid = d.paidAmount || 0;
                const target = d.amount || 0;
                const isPaid = paid >= target && target > 0;
                const isExempt = target === 0;
                const remaining = Math.max(0, target - paid);

                return (
                  <div
                    key={d.memberId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-2xl)', padding: '14px 18px',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{d.avatar}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
                        {d.department && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 6 }}>
                            {d.department}
                          </span>
                        )}
                        {d.note && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                            background: d.note.includes('Keringanan') ? 'rgba(59,130,246,0.1)' : 'rgba(217,119,6,0.1)',
                            color: d.note.includes('Keringanan') ? '#2563EB' : '#B45309'
                          }}>
                            {d.note}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Terkumpul: <strong>{formatRp(paid)}</strong> / <strong>{formatRp(target)}</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          • {CADENCE_LABELS[duesConfig.periodType]?.label || 'Bulanan'} ({duesConfig.activePeriod})
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isExempt ? (
                        <div style={{
                          padding: '6px 12px', background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.2)',
                          borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700
                        }}>
                          Bebas Iuran
                        </div>
                      ) : isPaid ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px',
                          background: 'rgba(52,211,153,0.12)',
                          border: '1px solid rgba(52,211,153,0.25)',
                          borderRadius: 'var(--radius-xl)',
                          color: 'var(--accent-green)',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          <Check size={13} /> Lunas ({d.lastPaidDate || 'Bulan ini'})
                        </div>
                      ) : paid > 0 ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px',
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.25)',
                          borderRadius: 'var(--radius-xl)',
                          color: '#D97706',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          <AlertCircle size={13} /> Kurang {formatRp(remaining)}
                        </div>
                      ) : (
                        <div style={{
                          padding: '6px 12px',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 'var(--radius-xl)',
                          color: '#EF4444',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          Belum Bayar
                        </div>
                      )}
                    </div>

                    {/* Actions: Setting individual dues amount + Bayar */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleOpenMemberSetting(d)}
                        title="Atur besar iuran anggota ini"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '7px 11px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xl)',
                          color: 'var(--text-secondary)',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        <Sliders size={13} /> Setting Tagihan
                      </button>

                      {!isPaid && !isExempt && (
                        <button
                          onClick={() => handleOpenPayModal(d)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '7px 12px',
                            background: 'var(--accent-terracotta)',
                            border: 'none',
                            borderRadius: 'var(--radius-xl)',
                            color: 'white',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          <Plus size={13} /> Bayar Iuran
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ============================================================
          MODAL 1: PENGATURAN IURAN KOMUNITAS (GLOBAL SETTINGS)
          ============================================================ */}
      {showConfigModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}>
          <div style={{ background: 'var(--bg-elevated)', width: '100%', maxWidth: 520, borderRadius: 'var(--radius-3xl)', padding: 24, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-xl)', background: 'rgba(217,119,6,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={20} color="var(--accent-terracotta)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Pengaturan Iuran Komunitas</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Konfigurasi siklus tagihan, periode aktif, dan tarif standar</p>
                </div>
              </div>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* 1. Cadence / Siklus Tagihan */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                Siklus & Periode Tagihan Iuran
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['monthly', 'semester', 'lifetime'] as DuesPeriodType[]).map((pType) => {
                  const info = CADENCE_LABELS[pType];
                  const isSelected = cfgPeriodType === pType;
                  return (
                    <button
                      key={pType}
                      type="button"
                      onClick={() => setCfgPeriodType(pType)}
                      style={{
                        padding: '10px 8px',
                        background: isSelected ? 'rgba(217,119,6,0.12)' : 'var(--bg-primary)',
                        border: `2px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-xl)',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: isSelected ? 'var(--accent-terracotta)' : 'var(--text-primary)' }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.2 }}>
                        {pType === 'monthly' ? 'Rutin tiap bulan' : pType === 'semester' ? '1x per 6 bulan' : '1x seumur hidup'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                ℹ️ {CADENCE_LABELS[cfgPeriodType]?.desc}
              </div>
            </div>

            {/* 2. Periode Aktif & Tarif Acuan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                  Nama Periode Aktif
                </label>
                <input
                  value={cfgActivePeriod}
                  onChange={(e) => setCfgActivePeriod(e.target.value)}
                  placeholder="Contoh: Oktober 2026"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                  Tarif Standar (Rp)
                </label>
                <input
                  value={cfgDefaultAmount}
                  onChange={(e) => setCfgDefaultAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="50000"
                  type="text"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Apply default amount to all members checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', marginBottom: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={cfgApplyToAll}
                onChange={(e) => setCfgApplyToAll(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent-terracotta)' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                Terapkan tarif standar Rp {parseInt(cfgDefaultAmount || '0').toLocaleString('id-ID')} ini ke semua anggota ({memberDues.length} orang)
              </span>
            </label>

            {/* 3. Deskripsi & Batas Waktu */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Keterangan & Alokasi Kas (Transparansi)
              </label>
              <textarea
                value={cfgDescription}
                onChange={(e) => setCfgDescription(e.target.value)}
                rows={2}
                placeholder="Penjelasan untuk anggota tentang peruntukan kas ini..."
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', resize: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Catatan Batas Waktu Pembayaran (Opsional)
              </label>
              <input
                value={cfgDueDate}
                onChange={(e) => setCfgDueDate(e.target.value)}
                placeholder="Contoh: Batas bayar: Tanggal 10 setiap bulan"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
              />
            </div>

            {/* Opsional: Mulai Periode Baru (Reset Pembayaran) */}
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 'var(--radius-xl)', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>Tutup Buku / Buka Periode Baru</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mulai tagihan bulan baru dan reset status pembayaran anggota ke 0</div>
                </div>
                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Buka Periode Baru
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        resetDuesPeriod(cfgActivePeriod);
                        setShowResetConfirm(false);
                      }}
                      style={{ padding: '6px 10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Konfirmasi Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      style={{ padding: '6px 8px', background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', fontSize: 11, cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveConfig}
                style={{ flex: 1.5, padding: '10px', background: 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: SETTING TAGIHAN KHUSUS ANGGOTA
          ============================================================ */}
      {settingMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}>
          <div style={{ background: 'var(--bg-elevated)', width: '100%', maxWidth: 460, borderRadius: 'var(--radius-3xl)', padding: 24, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 32 }}>{settingMember.avatar}</span>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Setting Tagihan Anggota
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {settingMember.name} • {settingMember.department || 'Anggota'}
                  </div>
                </div>
              </div>
              <button onClick={() => setSettingMember(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Atur besaran kewajiban iuran untuk anggota ini pada periode <strong>{duesConfig.activePeriod}</strong> ({CADENCE_LABELS[duesConfig.periodType]?.label}).
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Pilihan Cepat Nominal:
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'Rp 0 (Bebas)', amount: '0', note: 'Bebas Iuran' },
                  { label: 'Rp 25.000', amount: '25000', note: 'Keringanan Mahasiswa' },
                  { label: 'Rp 35.000', amount: '35000', note: 'Keringanan Mahasiswa' },
                  { label: 'Rp 50.000 (Standar)', amount: '50000', note: 'Tarif Standar' },
                  { label: 'Rp 75.000 (Donatur)', amount: '75000', note: 'Donatur / Patron' },
                ].map((item) => (
                  <button
                    key={item.amount}
                    type="button"
                    onClick={() => {
                      setCustomAmount(item.amount);
                      setCustomNote(item.note);
                    }}
                    style={{
                      padding: '5px 10px',
                      background: customAmount === item.amount ? 'var(--accent-terracotta)' : 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      color: customAmount === item.amount ? 'white' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Target Amount Input */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Target Kewajiban Iuran (Rp)
              </label>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="Jumlah target iuran"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>

            {/* Custom Note Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Kategori / Catatan Khusus
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Contoh: Keringanan Mahasiswa, Tarif Standar, Pengurus Inti"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSettingMember(null)}
                style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveMemberSetting}
                style={{ flex: 1.5, padding: '10px', background: 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: INPUT PEMBAYARAN IURAN ANGGOTA
          ============================================================ */}
      {payDuesMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}>
          <div style={{ background: 'var(--bg-elevated)', width: '100%', maxWidth: 440, borderRadius: 'var(--radius-3xl)', padding: 24, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 30 }}>{payDuesMember.avatar}</span>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Input Pembayaran Iuran
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {payDuesMember.name} • {duesConfig.activePeriod}
                  </div>
                </div>
              </div>
              <button onClick={() => setPayDuesMember(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Target vs Paid Status */}
            <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Tagihan</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{formatRp(payDuesMember.amount)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sudah Masuk</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>{formatRp(payDuesMember.paidAmount)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sisa Tagihan</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>
                  {formatRp(Math.max(0, payDuesMember.amount - (payDuesMember.paidAmount || 0)))}
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setPayAmount(String(Math.max(0, payDuesMember.amount - (payDuesMember.paidAmount || 0))))}
                style={{ flex: 1, padding: '6px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 'var(--radius-lg)', color: 'var(--accent-green)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Bayar Lunas (Sisa: {formatRp(Math.max(0, payDuesMember.amount - (payDuesMember.paidAmount || 0)))})
              </button>
              <button
                type="button"
                onClick={() => setPayAmount('25000')}
                style={{ padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                Rp 25.000
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Nominal Pembayaran (Rp)
              </label>
              <input
                type="text"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="Jumlah Bayar"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Metode Pembayaran
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="QRIS Komunitas">QRIS Komunitas</option>
                <option value="Tunai / Cash">Tunai / Cash</option>
                <option value="GoPay / OVO">GoPay / OVO</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                Dicatat Oleh (Bendahara PJ)
              </label>
              <select
                value={payRecordedBy}
                onChange={(e) => setPayRecordedBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {COMMUNITY_USERS.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.avatar} {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPayDuesMember(null)}
                style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPay}
                style={{ flex: 1.5, padding: '10px', background: 'var(--accent-terracotta)', border: 'none', borderRadius: 'var(--radius-xl)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Simpan & Catat Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
