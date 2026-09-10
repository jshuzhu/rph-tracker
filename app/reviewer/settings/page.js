'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../../lib/authProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateActiveWeek } from '../../../lib/dateUtils';

export default function AdminSettings() {
  const { user, profile } = useAuth();
  const router = useRouter();

  // School Identity
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');

  // Takwim Settings
  const [sessionName, setSessionName] = useState('');
  const [sessionStartDate, setSessionStartDate] = useState('');
  const [sessionEndDate, setSessionEndDate] = useState('');
  
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'reviewer') {
        router.push('/');
      } else {
        fetchSchoolSettings();
      }
    }
  }, [user, profile]);

  // Auto-generate session name based on start and end dates
  useEffect(() => {
    if (sessionStartDate && sessionEndDate) {
      const startYear = new Date(sessionStartDate).getFullYear().toString().slice(-2);
      const endYear = new Date(sessionEndDate).getFullYear().toString().slice(-2);
      if (startYear === endYear) {
        setSessionName(startYear);
      } else {
        setSessionName(`${startYear}/${endYear}`);
      }
    }
  }, [sessionStartDate, sessionEndDate]);

  
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setIsPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Live preview update whenever dependencies change
  useEffect(() => {
    if (sessionStartDate) {
      // Holiday offset is hardcoded to 0 since the user didn't want the field
      setCurrentWeek(calculateActiveWeek(sessionStartDate, sessionEndDate));
    }
  }, [sessionStartDate, sessionEndDate]);

  const fetchSchoolSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'school_settings', '1'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSchoolName(data.school_name || '');
        setSchoolLogo(data.logo_url || '');
        setSessionName(data.session_name || '');
        setSessionEndDate(data.session_end_date || '');
        
        const defaultDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        setSessionStartDate(data.session_start_date || defaultDate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('Saiz fail logo melebihi 500KB. Sila gunakan gambar yang lebih kecil (kecil dari 500KB).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setSchoolLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'school_settings', '1'), {
        school_name: schoolName,
        logo_url: schoolLogo,
        session_name: sessionName,
        session_start_date: sessionStartDate,
        session_end_date: sessionEndDate,
        updated_at: new Date().toISOString()
      }, { merge: true });
      alert('Tetapan berjaya disimpan!');
      
      // Force reload to update Navbar globally
      window.location.reload();
    } catch (e) {
      alert('Gagal menyimpan tetapan.');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  
  if (!isPinVerified) {
    return (
      <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4 w-full overflow-hidden flex items-center justify-center">
        <form onSubmit={handlePinSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="bg-blue-500/20 text-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-white">Sahkan Identiti</h1>
            <p className="text-xs text-slate-400 mt-1">Sila masukkan PIN Keselamatan Admin untuk mengakses halaman ini.</p>
          </div>

          <div className="space-y-4">
            <div>
              <input 
                type="password" 
                value={pinInput}
                onChange={e => {setPinInput(e.target.value); setPinError(false);}}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-center text-lg tracking-widest font-bold focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="PIN Admin"
                maxLength={4}
                autoFocus
              />
              {pinError && <p className="text-xs text-rose-500 mt-2 text-center font-bold animate-pulse">PIN tidak sah! Sila cuba lagi.</p>}
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              Teruskan
            </button>
            <Link href="/reviewer/dashboard" className="block text-center text-xs text-slate-500 hover:text-slate-300 mt-4 font-bold transition">Kembali ke Dashboard</Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4 w-full overflow-hidden">

      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold text-white">Tetapan Sistem</h1>
            <p className="text-xs text-slate-400 mt-1">Konfigurasi RPH, Logo Sekolah dan Takwim Mingguan.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse">Memuatkan tetapan...</div>
        ) : (
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-8">
            
            <div className="space-y-5 border-b border-slate-800 pb-8">
              <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest break-words flex items-center gap-2">
                <span>1</span> Maklumat Organisasi
              </h2>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Nama Organisasi / Sekolah</label>
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Contoh: SEKOLAH KEBANGSAAN CONTOH"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Logo Sekolah (Maksima 500KB)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full overflow-hidden bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  {schoolLogo ? (
                    <div className="shrink-0">
                      <img src={schoolLogo} alt="Logo" className="w-16 h-16 object-contain bg-white rounded-lg border border-slate-700 p-1" />
                    </div>
                  ) : (
                    <div className="shrink-0 w-16 h-16 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-xs text-slate-500 font-medium">Tiada Logo</div>
                  )}
                  
                  <div className="flex-1 w-full min-w-0">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full text-xs text-slate-400 file:mr-3 file:mb-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer overflow-hidden text-ellipsis transition-colors"
                    />
                    {schoolLogo && (
                      <button type="button" onClick={() => setSchoolLogo('')} className="block text-[10px] text-rose-400 hover:text-white mt-1 font-bold bg-rose-500/10 hover:bg-rose-500 transition-colors px-3 py-1.5 rounded-md">
                        Padam Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 border-b border-slate-800 pb-8">
              <h2 className="text-sm font-extrabold text-emerald-400 uppercase tracking-widest break-words flex items-center gap-2">
                <span>2</span> Takwim Sesi Akademik
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Nama Sesi Akademik</label>
                  <input 
                    type="text" 
                    value={sessionName}
                    readOnly
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed transition-colors"
                    placeholder="Contoh: 26/27"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Dijana secara automatik.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Tarikh Mula Persekolahan</label>
                  <input 
                    type="date" 
                    value={sessionStartDate}
                    onChange={e => setSessionStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Tarikh Akhir Persekolahan</label>
                  <input 
                    type="date" 
                    value={sessionEndDate}
                    onChange={e => setSessionEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl mt-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lencana Minggu Sistem (Live Preview):</span>
                  <span className="text-base font-extrabold text-emerald-400 bg-emerald-900/30 border border-emerald-500/20 px-4 py-1.5 rounded-lg">
                    Minggu {currentWeek}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Tetapan'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}


