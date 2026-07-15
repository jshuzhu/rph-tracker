'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/authProvider';
import { useRouter } from 'next/navigation';
import { calculateActiveWeek } from '../../../lib/dateUtils';

export default function ReviewerAnalytics() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [analyticsWeek, setAnalyticsWeek] = useState('1');
  const [selectedSession, setSelectedSession] = useState('2026');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [analytics, setAnalytics] = useState({
    pending: 0,
    approved: 0,
    notApproved: 0,
    complianceRate: 0,
    totalTeachers: 0,
    submittedTeachers: 0,
    deficitList: [],
    rejectionHeatmap: []
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // 1. Fetch active session/week on mount to set defaults
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const { data } = await supabase
          .from('school_settings')
          .select('active_session, active_week, session_start_date, session_end_date, holiday_weeks')
          .eq('id', 1)
          .single();
        if (data) {
          const calculatedWeek = calculateActiveWeek(
            data.session_start_date,
            data.session_end_date,
            data.holiday_weeks || 0
          );
          setSelectedSession(data.active_session || '2026');
          setAnalyticsWeek(String(calculatedWeek));
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (user && profile) {
      loadDefaults();
    }
  }, [user, profile]);

  // 2. Trigger fetchAnalytics when filter values change
  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'reviewer' && profile.role) {
        router.push('/');
      } else {
        fetchAnalytics();
      }
    }
  }, [user, profile, analyticsWeek, selectedSession]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch active teacher profiles
      const { data: teachers, error: tErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'teacher');
      
      if (tErr) throw tErr;

      // 2. Fetch submissions for selected analytics week and session
      const { data: subs, error: sErr } = await supabase
        .from('rph_submissions')
        .select('*, class:master_classes!class_id(academic_year), teacher:profiles!teacher_id(full_name, email)')
        .eq('school_week', parseInt(analyticsWeek))
        .eq('academic_session', selectedSession)
        .eq('is_deleted', false);
      
      if (sErr) throw sErr;

      const activeTeachers = teachers || [];
      const targetSubmissions = subs || [];
      const totalTeachers = activeTeachers.length;

      const pending = targetSubmissions.filter(r => r.status === 'Pending').length;
      const approved = targetSubmissions.filter(r => r.status === 'Approved').length;
      const notApproved = targetSubmissions.filter(r => r.status === 'Not Approved').length;

      const submittedTeacherIds = new Set(
        targetSubmissions.filter(r => r.status !== 'Draft').map(r => r.teacher_id)
      );
      const submittedTeachersCount = submittedTeacherIds.size;
      const complianceRate = totalTeachers > 0 ? Math.round((submittedTeachersCount / totalTeachers) * 100) : 0;

      const deficitList = activeTeachers.filter(t => !submittedTeacherIds.has(t.id));

      // Filter rejections by session for heatmap
      let targetRejections = targetSubmissions.filter(r => r.status === 'Not Approved');

      const heatmapObj = {};
      targetRejections.forEach(r => {
        const name = r.teacher?.full_name || 'Guru';
        heatmapObj[name] = (heatmapObj[name] || 0) + 1;
      });

      const rejectionHeatmap = Object.entries(heatmapObj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        pending,
        approved,
        notApproved,
        complianceRate,
        totalTeachers,
        submittedTeachers: submittedTeachersCount,
        deficitList,
        rejectionHeatmap
      });
    } catch (e) {
      console.error(e);
      showToast('Gagal memuatkan data analitik.', 'error');
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
        
        {/* Toast */}
        {toast.message && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-xs font-bold text-white transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Back navigation & Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/reviewer/dashboard" 
            className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline gap-1 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali ke Utama
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Analisis</span>
        </div>

        {/* Title */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex justify-between items-center gap-3">
          <div>
            <h1 className="text-base font-extrabold tracking-tight">Analisis & Laporan</h1>
            <p className="text-[10px] text-purple-200 mt-0.5 font-medium">Metrik prestasi dan kadar pematuhan RPH guru.</p>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="bg-slate-950/80 text-white border border-white/10 rounded-xl py-1.5 px-2 text-[9px] font-extrabold focus:outline-none"
            >
              <option value="2025" className="bg-slate-900 text-white">Sesi 2025</option>
              <option value="2026" className="bg-slate-900 text-white">Sesi 2026</option>
              <option value="2027" className="bg-slate-900 text-white">Sesi 2027</option>
            </select>

            <select
              value={analyticsWeek}
              onChange={(e) => setAnalyticsWeek(e.target.value)}
              className="bg-slate-950/80 text-white border border-white/10 rounded-xl py-1.5 px-2 text-[9px] font-extrabold focus:outline-none"
            >
              {Array.from({ length: 43 }, (_, i) => String(i + 1)).map(w => (
                <option key={w} value={w} className="bg-slate-900 text-white">Minggu {w}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-3 text-[10px] font-bold text-slate-400 animate-pulse">Menjana laporan sekolah...</p>
          </div>
        ) : (
          <>
            {/* Compliance Circular Metric */}
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kadar Pematuhan Minggu {analyticsWeek}</span>
              
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-600"
                    strokeWidth="3.5"
                    strokeDasharray={`${analytics.complianceRate}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-extrabold text-slate-100">
                    {analytics.complianceRate}%
                  </span>
                  <span className="text-[7px] text-slate-400 font-extrabold uppercase">Dihantar</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-bold space-y-1">
                <p>Jumlah Guru Aktif: {analytics.totalTeachers}</p>
                <p>Menghantar RPH: {analytics.submittedTeachers}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-rose-500">Kumpulan Defisit (Tiada Laporan Minggu Ini)</h3>
              {analytics.deficitList.length === 0 ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-2xl text-[11px] font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-400 shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  <span>Tahniah! Semua guru telah menghantar RPH untuk minggu {analyticsWeek}.</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {analytics.deficitList.map((t, idx) => (
                    <div key={t.id} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-[10px] font-bold">
                      <span className="text-slate-200">{idx + 1}. {t.full_name}</span>
                      <span className="text-slate-400">{t.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejection Heatmap */}
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-100">Log Teguran (Kekerapan Pembetulan RPH)</h3>
              {analytics.rejectionHeatmap.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold">Tiada sebarang teguran pembetulan dilaporkan buat masa ini.</p>
              ) : (
                <div className="space-y-2 text-[10px] font-bold">
                  {analytics.rejectionHeatmap.map((t) => (
                    <div key={t.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-800 dark:text-slate-200">{t.name}</span>
                        <span className="text-rose-500">{t.count} kali pembetulan</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full" 
                          style={{ width: `${Math.min((t.count / 5) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
