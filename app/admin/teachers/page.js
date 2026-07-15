'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/authProvider';
import { useRouter } from 'next/navigation';

// Avatar colour palette based on initials
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
];

const getAvatarColor = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] || AVATAR_COLORS[0];
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
};

const ROLE_CONFIG = {
  admin:    { label: 'Pentadbir',   color: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/30',    dot: 'bg-rose-400' },
  reviewer: { label: 'Penyemak',    color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  teacher:  { label: 'Guru',        color: 'text-slate-400',   bg: 'bg-slate-500/15',   border: 'border-slate-500/30',   dot: 'bg-slate-400' },
};

const TITLE_CONFIG = {
  'Guru Besar': { label: 'Guru Besar', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  'PKP':        { label: 'PKP',        color: 'text-sky-400',     bg: 'bg-sky-500/15',     border: 'border-sky-500/30' },
  'PK HEM':     { label: 'PK HEM',     color: 'text-indigo-400',  bg: 'bg-indigo-500/15',  border: 'border-indigo-500/30' },
  'PK KO HEM':  { label: 'PK KO',      color: 'text-teal-400',    bg: 'bg-teal-500/15',    border: 'border-teal-500/30' },
};

function RoleBadge({ user }) {
  if (user.role === 'reviewer' && TITLE_CONFIG[user.title]) {
    const cfg = TITLE_CONFIG[user.title];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
        {cfg.label}
      </span>
    );
  }
  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.teacher;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function AdminTeachers() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [activeSubTab, setActiveSubTab] = useState('users');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const [profilesList, setProfilesList] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserRole, setEditUserRole] = useState('teacher');
  const [editUserTitle, setEditUserTitle] = useState('Penyemak');

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newClsYear, setNewClsYear] = useState('');
  const [newClsName, setNewClsName] = useState('');

  const limit = 8;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'admin' && profile.role) {
        router.push('/');
      } else {
        fetchMasterData();
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      if (activeSubTab === 'users') fetchUserProfiles();
    }
  }, [user, profile, activeSubTab, usersPage]);

  const fetchMasterData = async () => {
    const { data: subs } = await supabase.from('master_subjects').select('*').order('subject_name');
    const { data: clss } = await supabase.from('master_classes').select('*').order('class_name');
    setSubjects(subs || []);
    setClasses(clss || []);
  };

  const fetchUserProfiles = async () => {
    setActionLoading(true);
    try {
      const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('full_name')
        .range((usersPage - 1) * limit, usersPage * limit - 1);
      if (error) throw error;
      setProfilesList(data || []);
      setUsersCount(count || 0);
    } catch (e) {
      showToast('Gagal memuatkan profil pengguna.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const payload = { role: editUserRole, updated_at: new Date().toISOString() };
      if (editUserRole === 'reviewer') payload.title = editUserTitle;
      else if (editUserRole === 'admin') payload.title = 'Admin';
      else payload.title = 'Guru';

      const { error } = await supabase.from('profiles').update(payload).eq('id', editingUser.id);
      if (error) throw error;
      showToast(`Peranan ${editingUser.full_name} berjaya dikemaskini!`);
      setEditingUser(null);
      fetchUserProfiles();
    } catch (e) {
      showToast('Gagal mengemaskini peranan pengguna.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubCode || !newSubName) return;
    try {
      const { error } = await supabase.from('master_subjects').insert([{ subject_code: newSubCode, subject_name: newSubName }]);
      if (error) throw error;
      showToast('Subjek baharu berjaya ditambah!');
      setNewSubCode(''); setNewSubName('');
      fetchMasterData();
    } catch (e) { showToast('Gagal menambah subjek: ' + e.message, 'error'); }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClsYear || !newClsName) return;
    try {
      const { error } = await supabase.from('master_classes').insert([{ academic_year: newClsYear, class_name: newClsName }]);
      if (error) throw error;
      showToast('Kelas baharu berjaya ditambah!');
      setNewClsYear(''); setNewClsName('');
      fetchMasterData();
    } catch (e) { showToast('Gagal menambah kelas: ' + e.message, 'error'); }
  };

  if (!user || profile?.role === 'reviewer' || profile?.role === 'teacher') {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 font-bold text-xs">
        Memverifikasi akses keselamatan...
      </div>
    );
  }

  const TABS = [
    { id: 'users',    label: 'Peranan Guru', icon: '👥' },
    { id: 'subjects', label: 'Subjek',       icon: '📚' },
    { id: 'classes',  label: 'Kelas',        icon: '🏫' },
  ];

  return (
    <div className="flex-grow bg-transparent text-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-md sm:max-w-3xl mx-auto space-y-5">

        {/* Toast */}
        {toast.message && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white border transition-all animate-slideDown ${
            toast.type === 'error'
              ? 'bg-rose-600/90 border-rose-500/50 backdrop-blur-md'
              : 'bg-emerald-600/90 border-emerald-500/50 backdrop-blur-md'
          }`}>
            <span>{toast.type === 'error' ? '✕' : '✓'}</span>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="inline-flex items-center text-xs font-bold text-purple-400 hover:text-purple-300 gap-1.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali
          </Link>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Urus Data</span>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-800/30 rounded-3xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl -translate-y-8 translate-x-8 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm">⚙️</div>
              <h1 className="text-sm font-extrabold tracking-tight text-white">Pengurusan Pengguna & Data</h1>
            </div>
            <p className="text-[10px] text-slate-400 pl-11">Urus peranan guru, pendaftaran subjek & kelas sekolah.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1.5 bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-sm leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: Users ─── */}
        {activeSubTab === 'users' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">

            {/* Section header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-100">Senarai Akaun Guru & Staf</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{usersCount} akaun berdaftar</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-sm">👥</div>
            </div>

            {/* User list */}
            {actionLoading && profilesList.length === 0 ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-[3px] border-slate-700 border-t-purple-500 animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {profilesList.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors group">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(u.full_name)} flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 shadow-md`}>
                      {getInitials(u.full_name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-100 truncate">{u.full_name || 'Tanpa Nama'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                    </div>

                    {/* Role badge */}
                    <div className="shrink-0">
                      <RoleBadge user={u} />
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setEditUserRole(u.role || 'teacher');
                        setEditUserTitle(u.title || 'Penyemak');
                      }}
                      className="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                    >
                      Ubah Role
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500">
                Halaman {usersPage} · {usersCount} pengguna
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setUsersPage((p) => Math.max(p - 1, 1))}
                  disabled={usersPage === 1}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-400 disabled:opacity-30 transition cursor-pointer"
                >← Sebelum</button>
                <button
                  onClick={() => setUsersPage((p) => (p * limit < usersCount ? p + 1 : p))}
                  disabled={usersPage * limit >= usersCount}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-400 disabled:opacity-30 transition cursor-pointer"
                >Seterusnya →</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Subjects ─── */}
        {activeSubTab === 'subjects' && (
          <div className="space-y-4">
            {/* Add form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm">📚</div>
                <h3 className="text-xs font-extrabold text-slate-100">Tambah Subjek Baharu</h3>
              </div>
              <form onSubmit={handleAddSubject} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kod Subjek *</label>
                    <input
                      type="text" required value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value)}
                      placeholder="cth: MT"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none text-xs font-bold transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Subjek *</label>
                    <input
                      type="text" required value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="cth: Matematik"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none text-xs font-bold transition-colors"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full min-h-[42px] bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-purple-900/30">
                  + Tambah Subjek
                </button>
              </form>
            </div>

            {/* Subject list */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-100">Senarai Subjek Aktif</h3>
                <span className="text-[10px] text-slate-500 font-bold">{subjects.length} subjek</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-[260px] overflow-y-auto">
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-[10px] font-extrabold text-blue-400 shrink-0">
                      {s.subject_code?.slice(0, 3) || '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-100">{s.subject_name}</p>
                      <p className="text-[10px] text-slate-500">Kod: {s.subject_code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Classes ─── */}
        {activeSubTab === 'classes' && (
          <div className="space-y-4">
            {/* Add form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-sm">🏫</div>
                <h3 className="text-xs font-extrabold text-slate-100">Tambah Kelas Baharu</h3>
              </div>
              <form onSubmit={handleAddClass} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tahun/Tingkatan *</label>
                    <input
                      type="text" required value={newClsYear}
                      onChange={(e) => setNewClsYear(e.target.value)}
                      placeholder="cth: Tahun 4"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none text-xs font-bold transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Kelas *</label>
                    <input
                      type="text" required value={newClsName}
                      onChange={(e) => setNewClsName(e.target.value)}
                      placeholder="cth: 4 Ibnu Sina"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none text-xs font-bold transition-colors"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full min-h-[42px] bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-teal-900/30">
                  + Tambah Kelas
                </button>
              </form>
            </div>

            {/* Class list */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-100">Senarai Kelas Aktif</h3>
                <span className="text-[10px] text-slate-500 font-bold">{classes.length} kelas</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-[260px] overflow-y-auto">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-teal-600/15 border border-teal-500/20 flex items-center justify-center text-sm shrink-0">🏫</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-100">{c.class_name}</p>
                      <p className="text-[10px] text-slate-500">{c.academic_year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Modal: Change Role ─── */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/60 w-full max-w-sm rounded-t-[2rem] sm:rounded-3xl p-6 space-y-5 shadow-2xl">

              {/* Modal header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(editingUser.full_name)} flex items-center justify-center text-white text-xs font-extrabold shadow-md`}>
                    {getInitials(editingUser.full_name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100">Tukar Peranan</h3>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">{editingUser.full_name}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-base font-bold transition cursor-pointer">
                  ×
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-800" />

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Peranan</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-slate-100 rounded-xl py-3 px-3 focus:outline-none text-xs font-bold transition-colors"
                >
                  <option value="teacher">👩‍🏫 Guru (Default)</option>
                  <option value="reviewer">🔍 Penyemak (Reviewer)</option>
                  <option value="admin">⚙️ Pentadbir (Admin)</option>
                </select>
              </div>

              {/* Title selector — only for reviewer */}
              {editUserRole === 'reviewer' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gelaran / Jawatan</label>
                  <select
                    value={editUserTitle}
                    onChange={(e) => setEditUserTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-slate-100 rounded-xl py-3 px-3 focus:outline-none text-xs font-bold transition-colors"
                  >
                    <option value="Penyemak">Penyemak Am</option>
                    <option value="Guru Besar">Guru Besar</option>
                    <option value="PKP">PKP — Penolong Kanan Pentadbiran</option>
                    <option value="PK HEM">PK HEM — Penolong Kanan HEM</option>
                    <option value="PK KO HEM">PK KO HEM — Penolong Kanan Kokurikulum</option>
                  </select>
                </div>
              )}

              {/* Save button */}
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleUpdateRole}
                className="w-full min-h-[48px] bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-2xl text-xs font-extrabold transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-purple-900/40"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </span>
                ) : '✓ Simpan Peranan'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
