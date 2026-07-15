'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../lib/authProvider';
import { generateRphPdf } from '../../../../lib/pdfGenerator';
import { useRouter } from 'next/navigation';

export default function TeacherQueue() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState({ message: '', type: '' });

  const limit = 8;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'teacher' && profile.role) {
        router.push('/');
      } else {
        fetchSubmissions();
      }
    }
  }, [user, profile, page, statusFilter]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('rph_submissions')
        .select('*, subject:master_subjects(subject_name, subject_code), class:master_classes(academic_year, class_name)', { count: 'exact' })
        .eq('teacher_id', user.id)
        .eq('is_deleted', false);

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      setSubmissions(data || []);
      setTotalCount(count || 0);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuatkan rekod RPH.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfDownload = (rph) => {
    generateRphPdf(rph, profile?.full_name || 'Guru', null);
  };

  const handleDeleteRph = async (rphId) => {
    if (!confirm('Adakah anda pasti mahu memadam rekod RPH ini?')) return;
    try {
      const { error } = await supabase
        .from('rph_submissions')
        .update({ is_deleted: true })
        .eq('id', rphId);

      if (error) throw error;
      showToast('RPH berjaya dipadam.');
      fetchSubmissions();
    } catch (e) {
      console.error(e);
      showToast('Gagal memadam rekod RPH.', 'error');
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
      <div className="max-w-md sm:max-w-3xl lg:max-w-7xl mx-auto space-y-6">
        
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
            href="/dashboard" 
            className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline gap-1 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali ke Utama
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Sejarah RPH</span>
        </div>

        {/* Title */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md">
          <h1 className="text-base font-extrabold tracking-tight">Senarai RPH Saya</h1>
          <p className="text-[10px] text-purple-200 mt-0.5">Semak status, kemaskini pembetulan, dan muat turun PDF.</p>
        </div>

        {/* Status Scrollable Filter Tabs */}
        <div className="flex space-x-1.5 bg-slate-200/80 dark:bg-slate-900/50 p-1.5 rounded-2xl text-[11px] font-bold overflow-x-auto whitespace-nowrap scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { id: 'All', label: 'Semua' },
            { id: 'Draft', label: 'Draf' },
            { id: 'Pending', label: 'Menunggu' },
            { id: 'Approved', label: 'Lulus' },
            { id: 'Not Approved', label: 'Gagal' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id 
                  ? tab.id === 'Approved'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : tab.id === 'Not Approved'
                    ? 'bg-rose-600 text-white shadow-md'
                    : tab.id === 'Pending'
                    ? 'bg-amber-600 text-white shadow-md'
                    : tab.id === 'Draft'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Listing */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 animate-pulse">Memuatkan senarai RPH...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-700 rounded-3xl p-6">
            <p className="text-xs font-bold text-slate-400">Tiada rekod RPH ditemui untuk kategori ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Card List Stack (Mobile) & Grid (Desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((rph) => {
                const isDraftOrFailed = rph.status === 'Draft' || rph.status === 'Not Approved';
                return (
                  <div 
                    key={rph.id} 
                    className={`bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between border-l-4 ${
                      rph.status === 'Approved'
                        ? 'border-l-emerald-500'
                        : rph.status === 'Not Approved'
                        ? 'border-l-rose-500'
                        : rph.status === 'Pending'
                        ? 'border-l-amber-500'
                        : 'border-l-slate-500'
                    }`}
                  >
                    {/* Header info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                          Minggu {rph.school_week}
                        </span>
                        
                        {/* Status badge pill */}
                        {rph.status === 'Approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[9px] border border-emerald-200">Lulus</span>
                        ) : rph.status === 'Pending' ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] border border-amber-200 animate-pulse">Menunggu</span>
                        ) : rph.status === 'Not Approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-[9px] border border-rose-200">Gagal</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 text-[9px] border border-slate-200 dark:border-slate-700">Draf</span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-extrabold text-slate-100 line-clamp-1">
                          {rph.subject?.subject_name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {rph.class?.academic_year} {rph.class?.class_name}
                        </p>
                      </div>
                    </div>

                    {/* Date and timing */}
                    <div className="text-[10px] text-slate-500 font-bold space-y-1">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                        </svg>
                        <span>{rph.lesson_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>{rph.start_time.slice(0, 5)} - {rph.end_time.slice(0, 5)}</span>
                      </div>
                    </div>

                    {/* Reviewer Stamp info (if approved/rejected) */}
                    {rph.reviewer_name && (
                      <div className="pt-2 border-t border-slate-800/80 flex flex-col">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase">
                          Disemak oleh:
                        </span>
                        <span className="text-[9px] font-bold text-purple-650 dark:text-purple-400">
                          {rph.reviewer_title} {rph.reviewer_name}
                        </span>
                        {rph.reviewer_remarks && (
                          <span className="text-[9px] text-rose-500 font-medium italic mt-0.5 line-clamp-2">
                            Maklum balas: "{rph.reviewer_remarks}"
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons (Touch Target minimal 48px) */}
                    <div className="flex gap-2 pt-3 border-t border-slate-800/80">
                      
                      {isDraftOrFailed ? (
                        <Link 
                          href={`/rph/${rph.id}/edit`} 
                          className="flex-grow min-h-[44px] bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-xs flex items-center justify-center border border-purple-200/50"
                        >
                          Edit
                        </Link>
                      ) : (
                        <Link 
                          href={`/rph/${rph.id}`} 
                          className="flex-grow min-h-[44px] bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700"
                        >
                          Butiran
                        </Link>
                      )}

                      <button
                        onClick={() => handlePdfDownload(rph)}
                        className="p-2.5 min-h-[44px] min-w-[44px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-750"
                        title="Muat turun PDF"
                      >
                        PDF
                      </button>

                      {isDraftOrFailed && (
                        <button
                          onClick={() => handleDeleteRph(rph.id)}
                          className="p-2.5 min-h-[44px] min-w-[44px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 rounded-xl font-bold text-xs flex items-center justify-center border border-rose-100 dark:border-rose-950/60"
                          title="Padam Rekod"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-700 mt-4 text-[11px] font-bold text-slate-500">
              <span>Jumlah Rekod: {totalCount}</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl disabled:opacity-40 border border-slate-700"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-2">Muka {page} / {Math.ceil(totalCount / limit) || 1}</span>
                <button
                  onClick={() => setPage((p) => (p * limit < totalCount ? p + 1 : p))}
                  disabled={page * limit >= totalCount}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl disabled:opacity-40 border border-slate-700"
                >
                  Seterusnya
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
