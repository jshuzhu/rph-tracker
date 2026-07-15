'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/authProvider';
import { useRouter } from 'next/navigation';
import { calculateActiveWeek } from '../../../lib/dateUtils';

export default function AdminSettings() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [schoolSession, setSchoolSession] = useState('2026');
  const [schoolWeek, setSchoolWeek] = useState(1);
  const [sessionStartDate, setSessionStartDate] = useState('2026-03-09');
  const [sessionEndDate, setSessionEndDate] = useState('2027-02-05');
  const [holidayWeeks, setHolidayWeeks] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'admin' && profile.role) {
        router.push('/');
      } else {
        fetchSchoolSettings();
      }
    }
  }, [user, profile]);

  const fetchSchoolSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').eq('id', 1).single();
    if (data) {
      setSchoolName(data.school_name);
      setSchoolLogo(data.logo_url || '');
      setSchoolSession(data.active_session || '2026');
      setSchoolWeek(data.active_week || 1);
      setSessionStartDate(data.session_start_date || '2026-03-09');
      setSessionEndDate(data.session_end_date || '2027-02-05');
      setHolidayWeeks(data.holiday_weeks || 0);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Saiz fail logo melebihi 2MB.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `logo-school-${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('school-assets')
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase
        .from('school_settings')
        .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (dbErr) throw dbErr;

      setSchoolLogo(publicUrl);
      showToast('Logo berjaya dimuat naik & dikemaskini!');
      fetchSchoolSettings();
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat naik logo: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const calculatedWeek = calculateActiveWeek(sessionStartDate, sessionEndDate, parseInt(holidayWeeks || 0));
      const { error } = await supabase
        .from('school_settings')
        .update({ 
          school_name: schoolName, 
          active_session: schoolSession,
          active_week: calculatedWeek,
          session_start_date: sessionStartDate,
          session_end_date: sessionEndDate,
          holiday_weeks: parseInt(holidayWeeks || 0),
          updated_at: new Date().toISOString() 
        })
        .eq('id', 1);

      if (error) throw error;
      showToast('Tetapan sekolah berjaya dikemaskini!');
      fetchSchoolSettings();
    } catch (err) {
      showToast('Gagal menyimpan tetapan.');
    } finally {
      setActionLoading(false);
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
        
        {/* Toast */}
        {toast.message && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-xs font-bold text-white transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/admin/dashboard" 
            className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline gap-1 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali ke Utama
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Profil Sekolah</span>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-sm space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-slate-100 font-semibold">Tetapan Profil Sekolah</h2>
            <p className="text-[10px] text-slate-400 font-medium">Ubah nama dan logo sekolah untuk paparan PDF RPH.</p>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            {/* Logo display & upload */}
            <div className="space-y-2 flex flex-col items-center">
              <label className="block text-[10px] font-bold text-slate-500 uppercase self-start">Logo Sekolah</label>
              
              <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-950 p-3 border border-slate-700 flex items-center justify-center shadow-inner">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[9px] text-slate-450">Tiada Logo</span>
                )}
              </div>

              <label className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold cursor-pointer transition min-h-[38px] active:scale-95">
                {actionLoading ? 'Memproses...' : 'Muat Naik Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={actionLoading}
                  className="hidden"
                />
              </label>
            </div>

            {/* School Name input */}
            <form onSubmit={saveSettings} className="space-y-4 pt-3 border-t border-slate-800/80">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Sekolah *</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Masukkan nama rasmi sekolah..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Sesi Akademik *</label>
                  <input
                    type="text"
                    required
                    value={schoolSession}
                    onChange={(e) => setSchoolSession(e.target.value)}
                    placeholder="Contoh: 2026..."
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Tarikh Mula Sesi *</label>
                  <input
                    type="date"
                    required
                    value={sessionStartDate}
                    onChange={(e) => setSessionStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Tarikh Tamat Sesi *</label>
                  <input
                    type="date"
                    required
                    value={sessionEndDate}
                    onChange={(e) => setSessionEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Minggu Cuti Sekolah *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="52"
                    value={holidayWeeks}
                    onChange={(e) => setHolidayWeeks(e.target.value)}
                    placeholder="Bilangan minggu..."
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase text-purple-400">Minggu Semasa (Auto)</label>
                  <div className="w-full bg-purple-950/40 border border-purple-800/40 text-purple-200 rounded-xl py-3 px-3 font-extrabold text-center text-xs">
                    Minggu {calculateActiveWeek(sessionStartDate, sessionEndDate, parseInt(holidayWeeks || 0))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full min-h-[48px] bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Tetapan'}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
