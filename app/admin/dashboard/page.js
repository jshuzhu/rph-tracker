'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/authProvider';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { calculateActiveWeek } from '../../../lib/dateUtils';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    users: 0,
    subjects: 0,
    classes: 0,
    submissions: 0
  });
  const [schoolSettings, setSchoolSettings] = useState({
    activeSession: '2026',
    activeWeek: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'admin' && profile.role) {
        router.push('/');
      } else {
        fetchStats();
      }
    }
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { count: users } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { count: subjects } = await supabase.from('master_subjects').select('id', { count: 'exact', head: true });
      const { count: classes } = await supabase.from('master_classes').select('id', { count: 'exact', head: true });
      const { count: submissions } = await supabase.from('rph_submissions').select('id', { count: 'exact', head: true }).eq('is_deleted', false);

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

      setStats({
        users: users || 0,
        subjects: subjects || 0,
        classes: classes || 0,
        submissions: submissions || 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || profile?.role === 'reviewer' || profile?.role === 'teacher') {
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
            Portal Pentadbir (Admin)
          </span>
          <h1 className="text-xl font-extrabold tracking-tight mt-2.5">
            Selamat Kembali,
          </h1>
          <p className="text-sm font-bold text-white underline mt-0.5">
            {profile?.full_name}
          </p>
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            [Sesi {schoolSettings.activeSession} : Minggu {schoolSettings.activeWeek}]
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
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Jumlah Guru</span>
                <span className="block text-xl font-extrabold text-slate-100">{stats.users}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Laporan RPH</span>
                <span className="block text-xl font-extrabold text-purple-650 dark:text-purple-400">{stats.submissions}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Mata Pelajaran</span>
                <span className="block text-xl font-extrabold text-slate-100">{stats.subjects}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Kelas Aktif</span>
                <span className="block text-xl font-extrabold text-slate-100">{stats.classes}</span>
              </div>
            </div>

            {/* Big Action Cards */}
            <div className="space-y-3">
              <Link 
                href="/admin/queue" 
                className="flex items-center justify-between p-5 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white rounded-[1.8rem] shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Semakan RPH Sekolah</h3>
                  <p className="text-[10px] text-purple-100 font-medium">Buka dan pantau sejarah serta status RPH bagi seluruh warga sekolah.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </Link>

              <Link 
                href="/admin/teachers" 
                className="flex items-center justify-between p-5 bg-slate-900 border border-slate-700 rounded-[1.8rem] shadow-md hover:shadow-lg active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Pengurusan Guru & Master Data</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Urus hak peranan akaun pengguna, subjek DSKP, serta nama-nama kelas.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
              </Link>

              <Link 
                href="/admin/settings" 
                className="flex items-center justify-between p-5 bg-slate-900 border border-slate-700 rounded-[1.8rem] shadow-md hover:shadow-lg active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Tetapan Profil Sekolah</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Ubah nama dan kemaskini logo sekolah untuk kepala surat PDF RPH.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </div>
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
