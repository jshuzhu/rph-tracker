'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/authProvider';
import { useRouter } from 'next/navigation';
import { calculateActiveWeek } from '../../../lib/dateUtils';

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    notApproved: 0
  });
  const [schoolSettings, setSchoolSettings] = useState({
    activeSession: '2026',
    activeWeek: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (profile.role === 'reviewer') {
        router.push('/reviewer/dashboard');
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
        .eq('teacher_id', user.id)
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

      const total = data?.length || 0;
      const pending = data?.filter(r => r.status === 'Pending').length || 0;
      const approved = data?.filter(r => r.status === 'Approved').length || 0;
      const notApproved = data?.filter(r => r.status === 'Not Approved').length || 0;

      setStats({
        total,
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

  if (!user || profile?.role === 'admin' || profile?.role === 'reviewer') {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 font-bold text-xs">
        Memverifikasi akses keselamatan...
      </div>
    );
  }

  return (
    <div className="flex-grow bg-transparent text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-purple-900/10">
          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-950/60 px-3 py-1 rounded-full border border-purple-900/40">
            Portal Guru
          </span>
          <h1 className="text-xl font-extrabold tracking-tight mt-2.5">
            Selamat Kembali,
          </h1>
          <p className="text-sm font-bold text-white underline mt-0.5">
            Cikgu {profile?.full_name}
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
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Jumlah RPH</span>
                <span className="block text-xl font-extrabold text-slate-100">{stats.total}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Lulus</span>
                <span className="block text-xl font-extrabold text-emerald-500">{stats.approved}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Menunggu</span>
                <span className="block text-xl font-extrabold text-amber-500">{stats.pending}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Pembetulan</span>
                <span className="block text-xl font-extrabold text-rose-500">{stats.notApproved}</span>
              </div>
            </div>

            {/* Big Action Cards */}
            <div className="space-y-3">
              <Link 
                href="/rph/new" 
                className="flex items-center justify-between p-5 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white rounded-[1.8rem] shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Isi RPH Baharu</h3>
                  <p className="text-[10px] text-purple-100 font-medium">Buka borang untuk menyediakan RPH pengajaran mingguan anda.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </Link>

              <Link 
                href="/dashboard/queue" 
                className="flex items-center justify-between p-5 bg-slate-900 border border-slate-700 rounded-[1.8rem] shadow-md hover:shadow-lg active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Senarai RPH Saya</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Semak status, edit draf, kemaskini pembetulan, atau muat turun PDF.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm0 5.25h.007v.008H3.75V12Zm0 5.25h.007v.008H3.75v-.008Z" />
                  </svg>
                </div>
              </Link>

              <Link 
                href="/dashboard/analytics" 
                className="flex items-center justify-between p-5 bg-slate-900 border border-slate-700 rounded-[1.8rem] shadow-md hover:shadow-lg active:scale-95 transition"
              >
                <div className="space-y-1 pr-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Analisis & Prestasi RPH</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Lihat carta KPI mingguan dan status kelulusan RPH.</p>
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
    </div>
  );
}
