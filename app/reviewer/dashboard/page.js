'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/authProvider';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { calculateActiveWeek } from '../../../lib/dateUtils';

export default function ReviewerDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    notApproved: 0
  });
  const [schoolSettings, setSchoolSettings] = useState({
    activeSession: '2026',
    activeWeek: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [titleModalOpen, setTitleModalOpen] = useState(false);

  useEffect(() => {
    if (profile?.role === 'reviewer' && (!profile?.title || profile?.title === 'Penyemak' || profile?.title === 'Reviewer')) {
      setTitleModalOpen(true);
    }
  }, [profile]);

  const handleSaveTitle = async () => {
    if (!selectedTitle) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ title: selectedTitle, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      setTitleModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Gagal menetapkan jawatan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'reviewer' && profile.role) {
        router.push('/');
      } else {
        fetchStats();
      }
    }
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('rph_submissions')
        .select('status')
        .eq('is_deleted', false);

      if (error) throw error;

      const { data: settingsData } = await supabase
        .from('school_settings')
        .select('active_session, active_week, session_start_date, session_end_date, holiday_weeks')
        .eq('id', 1)
        .single();
      if (settingsData) {
        const calculatedWeek = calculateActiveWeek(
          settingsData.session_start_date,
          settingsData.session_end_date,
          settingsData.holiday_weeks || 0
        );
        setSchoolSettings({
          activeSession: settingsData.active_session || '2026',
          activeWeek: calculatedWeek
        });
      }

      const pending = data?.filter(r => r.status === 'Pending').length || 0;
      const approved = data?.filter(r => r.status === 'Approved').length || 0;
      const notApproved = data?.filter(r => r.status === 'Not Approved').length || 0;

      setStats({
        pending,
        approved,
        notApproved
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || profile?.role === 'admin' || profile?.role === 'teacher') {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 font-bold text-xs">
        Memverifikasi akses keselamatan...
      </div>
    );
  }

  return (
    <div className="flex-grow bg-transparent text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-purple-900/10">
          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-950/60 px-3 py-1 rounded-full border border-purple-900/40">
            Portal Penyemak
          </span>
          <h1 className="text-xl font-extrabold tracking-tight mt-2.5">
            Selamat Kembali,
          </h1>
          <p className="text-sm font-bold text-white underline mt-0.5">
            {profile?.full_name}
          </p>
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>[Jawatan : {
              profile?.title === 'GB' ? 'Guru Besar' :
              profile?.title === 'PKP' ? 'PK Pentadbiran' :
              profile?.title === 'PK HEM' ? 'PK HEM' :
              profile?.title === 'PK KO' || profile?.title === 'PK KO HEM' ? 'PK Kokurikulum' :
              (profile?.title || 'Penyemak')
            }]</span>
            <span className="text-purple-400">[Sesi {schoolSettings.activeSession} : Minggu {schoolSettings.activeWeek}]</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-3 text-[10px] font-bold text-slate-400 animate-pulse">Menghubungkan sesi...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-xs font-semibold">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-md space-y-1 text-center">
                <span className="block text-[8px] font-bold text-slate-400 uppercase">Menunggu</span>
                <span className="block text-lg font-extrabold text-amber-500">{stats.pending}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-md space-y-1 text-center">
                <span className="block text-[8px] font-bold text-slate-400 uppercase">Lulus</span>
                <span className="block text-lg font-extrabold text-emerald-500">{stats.approved}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-md space-y-1 text-center">
                <span className="block text-[8px] font-bold text-slate-400 uppercase">Pembetulan</span>
                <span className="block text-lg font-extrabold text-rose-500">{stats.notApproved}</span>
              </div>
            </div>

            {/* Big Action Cards */}
            <div className="space-y-3">
              <Link 
                href="/reviewer/queue" 
                className="flex items-center justify-between p-5 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white rounded-[1.8rem] shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Senarai Semakan (Queue)</h3>
                  <p className="text-[10px] text-purple-100 font-medium">Buka senarai RPH menunggu semakan dan berikan kelulusan.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </Link>

              <Link 
                href="/reviewer/analytics" 
                className="flex items-center justify-between p-5 bg-slate-900 border border-slate-700 rounded-[1.8rem] shadow-md hover:shadow-lg active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Analisis & Laporan</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Pantau kadar pematuhan guru, deficit list, dan rejection heatmap.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                  </svg>
                </div>
              </Link>
            </div>
          </>
        )}

      </div>

      {/* Force Designation Selection Modal for first-time login Reviewers */}
      {titleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-[2rem] p-6 space-y-4 shadow-2xl text-xs font-semibold text-left">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-100">Pilih Gelaran / Jawatan Anda</h3>
              <p className="text-[10px] text-purple-300 font-medium mt-0.5">Sila tetapkan jawatan anda untuk paparan pada portal dan dokumen sekolah.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Jawatan Pengurusan</label>
              <select
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3.5 px-3 focus:outline-none"
              >
                <option value="">-- Pilih Jawatan --</option>
                <option value="Guru Besar">Guru Besar</option>
                <option value="PKP">PKP (Penolong Kanan Pentadbiran)</option>
                <option value="PK HEM">PK HEM (Penolong Kanan Hal Ehwal Murid)</option>
                <option value="PK KO HEM">PK KO HEM (Penolong Kanan Kokurikulum)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={!selectedTitle || isLoading}
              onClick={handleSaveTitle}
              className="w-full min-h-[48px] bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
            >
              Simpan & Teruskan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
