'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../lib/authProvider';
import { useRouter } from 'next/navigation';

export default function TeacherAnalytics() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    notApproved: 0,
    drafts: 0,
    weeksCompliance: 0,
    missingWeeks: []
  });

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'teacher' && profile.role) {
        router.push('/');
      } else {
        fetchAnalytics();
      }
    }
  }, [user, profile]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all submissions for active teacher
      const { data: subs, error } = await supabase
        .from('rph_submissions')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_deleted', false);

      if (error) throw error;

      const total = subs?.length || 0;
      const approved = subs?.filter(r => r.status === 'Approved').length || 0;
      const pending = subs?.filter(r => r.status === 'Pending').length || 0;
      const notApproved = subs?.filter(r => r.status === 'Not Approved').length || 0;
      const drafts = subs?.filter(r => r.status === 'Draft').length || 0;

      // Calculate missing weeks (assuming active term is week 1 to 20 or up to 43)
      // Let's identify which weeks are missing submissions (week 1 to 43)
      const submittedWeeks = new Set(
        (subs || []).filter(r => r.status !== 'Draft').map(r => r.school_week)
      );

      const missingWeeks = [];
      // Let's check from week 1 to 15 as active baseline
      for (let w = 1; w <= 15; w++) {
        if (!submittedWeeks.has(w)) {
          missingWeeks.push(w);
        }
      }

      const activeTotalWeeks = 15;
      const submittedCount = submittedWeeks.size;
      const complianceRate = Math.round((submittedCount / activeTotalWeeks) * 100);

      setStats({
        total,
        approved,
        pending,
        notApproved,
        drafts,
        weeksCompliance: Math.min(complianceRate, 100),
        missingWeeks
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
        
        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline gap-1 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali ke Utama
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Metrik Saya</span>
        </div>

        {/* Title */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md">
          <h1 className="text-base font-extrabold tracking-tight">Analisis RPH Guru</h1>
          <p className="text-[10px] text-purple-200 mt-0.5 font-medium">Urus prestasi pematuhan mingguan RPH anda.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-3 text-[10px] font-bold text-slate-400 animate-pulse">Menjana analitik peribadi...</p>
          </div>
        ) : (
          <>
            {/* Compliance Circular Metric */}
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-md flex flex-col items-center text-center space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kadar Pematuhan (Minggu 1-15)</span>
              
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-600 transition-all duration-1000"
                    strokeWidth="3.5"
                    strokeDasharray={`${stats.weeksCompliance}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-slate-100">
                    {stats.weeksCompliance}%
                  </span>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase">KPI Pematuhan</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-[240px]">
                {stats.weeksCompliance >= 85 
                  ? 'Syabas! Anda mengekalkan pematuhan tinggi dalam penghantaran RPH.'
                  : 'Sila lengkapkan penghantaran RPH untuk minggu yang tertunggak.'}
              </p>
            </div>

            {/* Breakdown Bars */}
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-md space-y-4">
              <h3 className="text-xs font-extrabold text-slate-100">Pecahan Status RPH</h3>
              
              <div className="space-y-3 text-[10px] font-bold text-slate-500">
                {/* Lulus */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Diluluskan</span>
                    <span className="text-emerald-500">{stats.approved} daripada {stats.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-750" 
                      style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Menunggu */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Menunggu Kelulusan</span>
                    <span className="text-amber-500">{stats.pending} daripada {stats.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-750" 
                      style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Gagal */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Perlu Pembetulan</span>
                    <span className="text-rose-500">{stats.notApproved} daripada {stats.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-750" 
                      style={{ width: `${stats.total > 0 ? (stats.notApproved / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}

      </div>
    </div>
  );
}
