'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/authProvider';
import { supabase } from '../../../lib/supabaseClient';
import { generateRphPdf } from '../../../lib/pdfGenerator';
import { useRouter } from 'next/navigation';

export default function RphDetail({ params }) {
  const unwrappedParams = use(params);
  const rphId = unwrappedParams.id;
  const { user, profile } = useAuth();
  const router = useRouter();

  const [rph, setRph] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  useEffect(() => {
    if (user && rphId) {
      fetchRecord();
    }
  }, [user, rphId]);

  const fetchRecord = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('rph_submissions')
        .select('*, teacher:profiles!teacher_id(full_name, email), reviewer:profiles!reviewer_id(full_name, title), subject:master_subjects(*), class:master_classes(*)')
        .eq('id', rphId)
        .single();

      if (error) throw error;

      // Map reviewer profile into flat fields expected by the UI
      if (data && data.reviewer) {
        data.reviewer_name = data.reviewer.full_name || data.reviewer_name;
        data.reviewer_title = data.reviewer.title || data.reviewer_title;
      }

      setRph(data);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuatkan rekod RPH.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfDownload = () => {
    if (rph) {
      generateRphPdf(rph, rph.teacher?.full_name || 'Guru', null);
    }
  };

  // Resolve back path based on role
  const getBackPath = () => {
    if (profile?.role === 'admin') return '/admin/queue';
    if (profile?.role === 'reviewer') return '/reviewer';
    return '/dashboard/queue';
  };

  if (!user) {
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

        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href={getBackPath()} 
            className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline gap-1 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Perincian RPH</span>
        </div>

        {isLoading ? (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center">
            <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-3 text-[10px] font-bold text-slate-400 animate-pulse">Memuatkan butiran RPH...</p>
          </div>
        ) : !rph ? (
          <div className="text-center py-10 bg-slate-900 border border-slate-700 rounded-3xl p-6">
            <p className="text-xs font-bold text-slate-400">Rekod RPH tidak ditemui.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-md space-y-6">
            
            {/* Header / Meta */}
            <div className="border-b border-slate-800 pb-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/40 text-purple-650 dark:text-purple-300 font-extrabold text-[9px] rounded-full border border-purple-200 dark:border-purple-900">
                  Minggu {rph.school_week}
                </span>

                {rph.status === 'Approved' ? (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[9px] border border-emerald-200">Lulus</span>
                ) : rph.status === 'Pending' ? (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] border border-amber-200 animate-pulse">Menunggu</span>
                ) : rph.status === 'Not Approved' ? (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-[9px] border border-rose-200">Gagal</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-850 text-slate-655 dark:text-slate-400 text-[9px] border border-slate-200 dark:border-slate-700">Draf</span>
                )}
              </div>

              <div>
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Guru Pelapor</span>
                <span className="text-xs font-bold text-slate-100 underline">{rph.teacher?.full_name}</span>
              </div>

              <div>
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  {rph.status === 'Approved' ? 'Diluluskan Oleh' : rph.status === 'Not Approved' ? 'Disemak Oleh' : 'Diluluskan Oleh'}
                </span>
                <span className="text-xs font-bold text-slate-100">
                  {(rph.reviewer?.full_name || rph.reviewer_name) ? (
                    (() => {
                      const name = rph.reviewer?.full_name || rph.reviewer_name;
                      const rawTitle = rph.reviewer?.title || rph.reviewer_title || '';
                      const title = rawTitle === 'GB' ? 'Guru Besar' 
                        : rawTitle === 'PKP' ? 'PK Pentadbiran' 
                        : rawTitle === 'PK HEM' ? 'PK HEM' 
                        : rawTitle === 'PK KO' || rawTitle === 'PK KO HEM' ? 'PK Kokurikulum' 
                        : rawTitle;
                      return title ? `${title} ${name}` : name;
                    })()
                  ) : (
                    <span className="text-slate-500 italic font-semibold">Belum disemak</span>
                  )}
                </span>
              </div>

              <div>
                <h1 className="text-sm font-extrabold text-slate-100 leading-snug">
                  {rph.subject?.subject_name} ({rph.subject?.subject_code})
                </h1>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Kelas: {rph.class?.academic_year} {rph.class?.class_name}
                </p>
              </div>
            </div>

            {/* Timings and Schedule */}
            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-600 dark:text-slate-350">
              <div className="space-y-1">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Tarikh Pengajaran</span>
                <p>{rph.lesson_date}</p>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Masa Pengajaran</span>
                <p>{rph.start_time.slice(0, 5)} - {rph.end_time.slice(0, 5)}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800/85 text-[11px] font-medium text-slate-200">
              <div className="space-y-1.5">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Standard Kandungan</span>
                <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 space-y-1">
                  {(rph.content_standards || []).map((std, i) => (
                    <p key={i} className="leading-relaxed">{std}</p>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Standard Pembelajaran</span>
                <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 space-y-1">
                  {(rph.learning_standards || []).map((std, i) => (
                    <p key={i} className="leading-relaxed">{std}</p>
                  ))}
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-1.5">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Objektif Pembelajaran</span>
                <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 space-y-2">
                  {(rph.objectives || []).map((obj, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-purple-650 dark:text-purple-400 font-extrabold">&#x2713;</span>
                      <p className="leading-relaxed">{obj}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              {rph.activities && (
                <div className="space-y-1.5">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Aktiviti Pengajaran</span>
                  <p className="bg-slate-800 p-3 rounded-2xl border border-slate-700 whitespace-pre-wrap leading-relaxed">{rph.activities}</p>
                </div>
              )}

              {/* Teaching Aids */}
              {rph.teaching_aids && (
                <div className="space-y-1.5">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Bahan Bantu Mengajar (BBM)</span>
                  <p className="bg-slate-800 p-3 rounded-2xl border border-slate-700 leading-relaxed">{rph.teaching_aids}</p>
                </div>
              )}

              {/* Reflections */}
              {rph.reflection && (
                <div className="space-y-1.5">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Refleksi Pengajaran</span>
                  <p className="bg-slate-800 p-3 rounded-2xl border border-slate-700 whitespace-pre-wrap leading-relaxed italic">{rph.reflection}</p>
                </div>
              )}
            </div>

            {/* Reviewer / Approver stamp remarks */}
            {(rph.reviewer?.full_name || rph.reviewer_name) && (
              <div className="border-t-2 border-dashed border-slate-700 pt-4 space-y-2">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Keputusan Semakan Laporan</span>
                <div className="bg-purple-500/5 border border-purple-200/50 dark:border-purple-800/40 rounded-2xl p-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-400 font-extrabold uppercase text-[8px] block">Status Kelulusan</span>
                    <span className={`inline-block font-extrabold mt-0.5 ${rph.status === 'Approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {rph.status === 'Approved' ? 'DILULUSKAN' : 'PERLU PEMBETULAN'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-400 font-extrabold uppercase text-[8px] block">{rph.status === 'Approved' ? 'Diluluskan Oleh' : 'Disemak Oleh'}</span>
                    <p className="text-slate-800 dark:text-slate-200 font-extrabold">
                      {(() => {
                        const name = rph.reviewer?.full_name || rph.reviewer_name || '';
                        const rawTitle = rph.reviewer?.title || rph.reviewer_title || '';
                        const title = rawTitle === 'GB' ? 'Guru Besar'
                          : rawTitle === 'PKP' ? 'PK Pentadbiran'
                          : rawTitle === 'PK HEM' ? 'PK HEM'
                          : rawTitle === 'PK KO' || rawTitle === 'PK KO HEM' ? 'PK Kokurikulum'
                          : rawTitle;
                        return title ? `${title} ${name}` : name;
                      })()}
                    </p>
                  </div>
                  {rph.reviewer_remarks && (
                    <div className="pt-2 border-t border-slate-800/80 mt-1">
                      <span className="text-slate-400 font-extrabold uppercase text-[8px] block">Ulasan / Maklum Balas</span>
                      <p className="font-semibold italic text-rose-500 mt-0.5">"{rph.reviewer_remarks}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PDF Generation Download CTA */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={handlePdfDownload}
                className="w-full min-h-[48px] bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                Muat turun PDF Laporan
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
