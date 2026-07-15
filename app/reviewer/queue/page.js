'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/authProvider';
import { generateRphPdf } from '../../../lib/pdfGenerator';
import { useRouter } from 'next/navigation';

export default function ReviewerQueue() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [submissions, setSubmissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRph, setSelectedRph] = useState(null);
  
  // Review form states
  const [reviewerRemarks, setReviewerRemarks] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  // Filter states
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState('All');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('All');
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);

  const limit = 6;

  // 1. Fetch active session default on mount
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const { data } = await supabase
          .from('school_settings')
          .select('active_session')
          .eq('id', 1)
          .single();
        if (data) {
          setSelectedSessionFilter(data.active_session || '2026');
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (user && profile) {
      loadDefaults();
    }
  }, [user, profile]);

  // 2. Trigger fetch when filters change
  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'reviewer' && profile.role) {
        router.push('/');
      } else {
        fetchSubmissions();
      }
    }
  }, [user, profile, page, statusFilter, selectedWeekFilter, selectedSessionFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('rph_submissions')
        .select('*, teacher:profiles!teacher_id(full_name, email), subject:master_subjects(subject_name, subject_code), class:master_classes(academic_year, class_name)', { count: 'exact' })
        .eq('is_deleted', false);

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      } else {
        query = query.neq('status', 'Draft');
      }

      if (selectedWeekFilter !== 'All') {
        query = query.eq('school_week', parseInt(selectedWeekFilter));
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      let filteredData = data || [];
      
      // Client-side filter by selected academic session
      if (selectedSessionFilter !== 'All') {
        filteredData = filteredData.filter(r => r.academic_session === selectedSessionFilter);
      }

      // Client-side filter by teacher name
      if (teacherFilter.trim()) {
        const search = teacherFilter.toLowerCase();
        filteredData = filteredData.filter(r => 
          r.teacher?.full_name?.toLowerCase().includes(search)
        );
      }

      // Paginate client-side
      const startIdx = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIdx, startIdx + limit);

      setSubmissions(paginatedData);
      setTotalCount(filteredData.length);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuatkan rekod semakan.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  };

  const processApproval = async (rphId, targetStatus) => {
    if (targetStatus === 'Not Approved' && !reviewerRemarks.trim()) {
      showToast('Sila masukkan ulasan/sebab penolakan.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      // Fetch latest reviewer profile from DB to ensure accurate name & title
      const { data: reviewerProfile } = await supabase
        .from('profiles')
        .select('full_name, title')
        .eq('id', user.id)
        .single();

      const reviewerName = reviewerProfile?.full_name || profile?.full_name || 'Penyemak';
      const reviewerTitle = reviewerProfile?.title || profile?.title || '';

      const { data: previous } = await supabase
        .from('rph_submissions')
        .select('*')
        .eq('id', rphId)
        .single();

      const { error: updateErr } = await supabase
        .from('rph_submissions')
        .update({
          status: targetStatus,
          reviewer_remarks: targetStatus === 'Not Approved' ? reviewerRemarks : null,
          reviewer_id: user.id,
          reviewer_name: reviewerName,
          reviewer_title: reviewerTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', rphId);

      if (updateErr) throw updateErr;

      await supabase.from('rph_history').insert({
        rph_id: rphId,
        action_by: user.id,
        status_changed_to: targetStatus,
        remarks: targetStatus === 'Not Approved' ? `Penolakan: ${reviewerRemarks}` : `Diluluskan oleh ${reviewerTitle ? reviewerTitle + ' ' : ''}${reviewerName}`,
        previous_data_snapshot: previous
      });

      showToast(targetStatus === 'Approved' ? 'RPH berjaya diluluskan!' : 'RPH berjaya dikembalikan untuk pembetulan.');
      setSelectedRph(null);
      setReviewerRemarks('');
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      showToast('Gagal mengemaskini keputusan semakan: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdfDownload = (rph) => {
    generateRphPdf(rph, rph.teacher?.full_name || 'Guru', null);
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
            href="/reviewer/dashboard" 
            className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline gap-1 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali ke Utama
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Semakan RPH</span>
        </div>

        {/* Welcome Header */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-base font-extrabold tracking-tight">Senarai Semakan</h1>
            <p className="text-[10px] text-purple-200 mt-0.5">Semak dan luluskan laporan RPH pengajaran guru di bawah seliaan anda.</p>
          </div>

          <div className="flex space-x-1 bg-slate-950/60 p-1 rounded-xl text-[10px] font-bold border border-white/5 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'All', label: 'Semua' },
              { id: 'Pending', label: 'Menunggu' },
              { id: 'Approved', label: 'Lulus' },
              { id: 'Not Approved', label: 'Gagal' },
            ].map((queue) => (
              <button
                key={queue.id}
                onClick={() => { setStatusFilter(queue.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  statusFilter === queue.id
                    ? queue.id === 'Approved'
                      ? 'bg-emerald-600 text-white'
                      : queue.id === 'Not Approved'
                      ? 'bg-rose-600 text-white'
                      : queue.id === 'Pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {queue.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-sm">
          <form onSubmit={handleFilterSearch} className="flex flex-wrap items-end gap-3 text-xs font-semibold">
            <div className="flex-grow min-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Nama Guru</label>
              <input
                type="text"
                placeholder="Masukkan nama guru..."
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none"
              />
            </div>
            <div className="w-[130px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sesi Akademik</label>
              <select
                value={selectedSessionFilter}
                onChange={(e) => { setSelectedSessionFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none font-bold text-xs"
              >
                <option value="All">Semua Sesi</option>
                <option value="2025">Sesi 2025</option>
                <option value="2026">Sesi 2026</option>
                <option value="2027">Sesi 2027</option>
              </select>
            </div>
            <div className="w-[120px] relative">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Minggu</label>
              <button
                type="button"
                onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none font-bold flex items-center justify-between cursor-pointer text-left text-xs"
              >
                <span>{selectedWeekFilter === 'All' ? 'Semua' : `Minggu ${selectedWeekFilter}`}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isWeekDropdownOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isWeekDropdownOpen && (
                <>
                  {/* Click outside backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsWeekDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 text-slate-100 text-xs font-bold divide-y divide-slate-700/50">
                    <button
                      type="button"
                      onClick={() => { setSelectedWeekFilter('All'); setIsWeekDropdownOpen(false); }}
                      className="w-full text-left py-2 px-3 hover:bg-slate-700 transition cursor-pointer"
                    >
                      Semua
                    </button>
                    {Array.from({ length: 43 }, (_, i) => String(i + 1)).map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => { setSelectedWeekFilter(w); setIsWeekDropdownOpen(false); }}
                        className="w-full text-left py-2 px-3 hover:bg-slate-700 transition cursor-pointer"
                      >
                        Minggu {w}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition cursor-pointer min-h-[40px]"
            >
              Cari Rekod
            </button>
          </form>
        </div>

        {/* Card-Based Listing (Mobile) and Grid List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 animate-pulse">Memuatkan senarai RPH...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-700 rounded-3xl p-6">
            <p className="text-xs font-bold text-slate-400">Tiada rekod RPH yang memerlukan semakan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((rph) => (
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
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                        Minggu {rph.school_week}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 text-[8px] border border-slate-700">
                          {rph.class?.academic_year} {rph.class?.class_name}
                        </span>
                        {rph.status === 'Approved' ? (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 text-[8px] border border-emerald-500/25">Lulus</span>
                        ) : rph.status === 'Pending' ? (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 text-[8px] border border-amber-500/25 animate-pulse">Menunggu</span>
                        ) : rph.status === 'Not Approved' ? (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 text-[8px] border border-rose-500/25">Gagal</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-slate-500/10 text-slate-400 text-[8px] border border-slate-500/25">Draf</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Guru Pengajar</span>
                      <span className="text-xs font-bold text-slate-950 dark:text-white underline">{rph.teacher?.full_name}</span>
                    </div>

                    <div>
                      <h3 className="text-xs font-extrabold text-slate-100 line-clamp-1">
                        {rph.subject?.subject_name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{rph.lesson_date} ({rph.start_time.slice(0, 5)} - {rph.end_time.slice(0, 5)})</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-800/80">
                    <Link
                      href={`/rph/${rph.id}`}
                      className="flex-grow min-h-[44px] bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700"
                    >
                      Perincian
                    </Link>

                    <button
                      onClick={() => handlePdfDownload(rph)}
                      className="p-2.5 min-h-[44px] min-w-[44px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center border border-slate-200"
                      title="PDF"
                    >
                      PDF
                    </button>

                    {statusFilter === 'Pending' && (
                      <button
                        onClick={() => setSelectedRph(rph)}
                        className="flex-grow min-h-[44px] bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        Semak
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-700 mt-4 text-[11px] font-bold text-slate-500">
              <span>Jumlah Laporan: {totalCount}</span>
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

        {/* Action Remarks dialog modal drawer */}
        {selectedRph && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 space-y-4 shadow-2xl text-xs font-semibold animate-slideUp">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">Keputusan Semakan RPH</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Minggu {selectedRph.school_week} - {selectedRph.teacher?.full_name}</p>
                </div>
                <button 
                  onClick={() => { setSelectedRph(null); setReviewerRemarks(''); }}
                  className="text-slate-400 hover:text-slate-950 dark:hover:text-white text-base font-extrabold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Ulasan / Maklum Balas Penyemak (Mandatori jika gagal)</label>
                <textarea
                  value={reviewerRemarks}
                  onChange={(e) => setReviewerRemarks(e.target.value)}
                  placeholder="Masukkan ulasan standard kandungan/aktiviti perlu ditambah baik..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3.5 px-3 focus:outline-none min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => processApproval(selectedRph.id, 'Not Approved')}
                  className="min-h-[48px] bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  Perlu Pembetulan
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => processApproval(selectedRph.id, 'Approved')}
                  className="min-h-[48px] bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  Luluskan RPH
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
