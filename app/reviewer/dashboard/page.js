'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/authProvider';
import { db } from '../../../lib/firebase';
import { collection, query, getDocs, doc, orderBy, limit, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { calculateActiveWeek } from '../../../lib/dateUtils';

export default function ReviewerDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [allRph, setAllRph] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, notApproved: 0 });
  
  const [sessionsMap, setSessionsMap] = useState([]);
  const [selectedSession, setSelectedSession] = useState('All');
  
  const [systemWeek, setSystemWeek] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState('All');
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Title Modal States
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'reviewer') {
        router.push('/');
      } else {
        if (!profile.title || profile.title === 'Penyemak' || profile.title === 'Reviewer') {
          setTitleModalOpen(true);
        }
        fetchData();
      }
    }
  }, [user, profile]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch system settings for default session and week
      let currentSesi = '';
      let currentWk = 1;
      const sDoc = await getDoc(doc(db, 'school_settings', '1'));
      if (sDoc.exists()) {
        const data = sDoc.data();
        currentSesi = data.session_name || '';

        currentWk = calculateActiveWeek(data.session_start_date, data.session_end_date);
        setSystemWeek(currentWk);
        setSelectedSession(currentSesi || 'All');
        setSelectedWeek('All');

        if (data.session_end_date) {
          const endDate = new Date(data.session_end_date);
          endDate.setHours(23, 59, 59, 999);
          if (new Date() > endDate) {
            setIsSessionExpired(true);
          }
        }

      }

      const q = query(collection(db, 'rph_submissions'), orderBy('TIMPESTAMP_SEND', 'desc'), limit(1500)); 
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());
      
      setAllRph(data);

      // Extract unique sessions
      const sessions = new Set();
      if (currentSesi) sessions.add(currentSesi);
      data.forEach(r => {
        if (r.Session_Name) sessions.add(r.Session_Name);
      });
      setSessionsMap(Array.from(sessions).sort());

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter stats based on session and week
    let filtered = allRph;
    if (selectedSession !== 'All') {
      filtered = filtered.filter(r => r.Session_Name === selectedSession || (!r.Session_Name && selectedSession === sessionsMap[0])); // fallback for old data without session
    }
    if (selectedWeek !== 'All') {
      filtered = filtered.filter(r => String(r.Minggu) === selectedWeek);
    }

    const pending = filtered.filter(r => r.Status_Id === '80').length;
    const approved = filtered.filter(r => r.Status_Id === '81').length;
    const notApproved = filtered.filter(r => r.Status_Id === '83').length;

    setStats({ pending, approved, notApproved });
  }, [allRph, selectedSession, selectedWeek, sessionsMap]);

  const handleSaveTitle = async () => {
    if (!selectedTitle) return;
    setIsSavingTitle(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        title: selectedTitle
      });
      setTitleModalOpen(false);
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Gagal menetapkan jawatan.');
    } finally {
      setIsSavingTitle(false);
    }
  };

  if (!mounted) return <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4 flex items-center justify-center"><div className="animate-pulse text-slate-500 text-sm font-bold">Memuatkan antaramuka...</div></div>;

  if (!user || profile?.role !== 'reviewer') {
    return <div className="p-12 text-center text-slate-400">Memverifikasi akses...</div>;
  }

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4 relative">
      {titleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-[2rem] shadow-2xl max-w-md w-full">
            <h2 className="text-xl font-extrabold text-white mb-2">Penetapan Jawatan Penyemak</h2>
            <p className="text-xs text-slate-400 mb-6">Sila pilih jawatan rasmi anda. Ini akan digunakan sebagai 'Cop Digital' semasa meluluskan RPH.</p>
            
            <div className="space-y-3 mb-6">
              {['Guru Besar', 'PK Pentadbiran', 'PK HEM', 'PK Kokurikulum', 'PK Petang', 'Ketua Panitia'].map(t => (
                <label key={t} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${selectedTitle === t ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                  <input type="radio" name="title" value={t} checked={selectedTitle === t} onChange={(e) => setSelectedTitle(e.target.value)} className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-600 focus:ring-2" />
                  <span className="font-bold text-sm text-white">{t}</span>
                </label>
              ))}
            </div>
            
            <button 
              onClick={handleSaveTitle} 
              disabled={!selectedTitle || isSavingTitle}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50"
            >
              {isSavingTitle ? 'Menyimpan...' : 'Sahkan Jawatan'}
            </button>
          </div>
        </div>
      )}


      <div className="max-w-4xl mx-auto space-y-6">
        
        {isSessionExpired && (
          <div className="bg-rose-500/10 border border-rose-500/50 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-rose-500 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-rose-500 font-bold">Takwim Sesi Akademik Telah Tamat</h3>
              <p className="text-rose-400/80 text-xs mt-1">Tarikh akhir sesi persekolahan semasa telah berlalu. Sila kemas kini tarikh dan nama sesi akademik yang baharu di halaman Tetapan.</p>
              <Link href="/reviewer/settings" className="inline-block mt-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition">Kemas Kini Sesi Sekarang</Link>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-950/40 px-3 py-1 rounded-full border border-blue-900/40">
              Portal Penyemak
            </span>
            <h1 className="text-xl font-extrabold text-white mt-3">Selamat Datang, {profile?.title || 'Penyemak'} {profile?.fullName || profile?.full_name}</h1>
            <p className="text-xs text-slate-400 mt-1">Anda mempunyai {stats.pending} RPH yang menanti semakan bagi tapisan ini.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={selectedSession} 
              onChange={(e) => setSelectedSession(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer flex-1 md:flex-none"
            >
              <option value="All">Semua Sesi</option>
              {sessionsMap.map(s => (
                <option key={s} value={s}>Sesi {s}</option>
              ))}
            </select>

            <select 
              value={selectedWeek} 
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer flex-1 md:flex-none"
            >
              <option value="All">Semua Minggu</option>
              {Array.from({ length: 42 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Minggu {w} {systemWeek === w ? '(Semasa)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse">Menyelaraskan data RPH...</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center shadow-lg">
              <div className="text-3xl font-extrabold text-amber-500">{stats.pending}</div>
              <div className="text-[10px] uppercase font-bold text-amber-600 mt-1">Perlu Disemak</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center shadow-lg">
              <div className="text-3xl font-extrabold text-emerald-500">{stats.approved}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-600 mt-1">Lulus</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center shadow-lg">
              <div className="text-3xl font-extrabold text-rose-500">{stats.notApproved}</div>
              <div className="text-[10px] uppercase font-bold text-rose-600 mt-1">Ditolak</div>
            </div>
          </div>
        )}

          <div className="space-y-3 pt-4">
            <Link href="/reviewer/rph" className="block bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-2xl font-bold shadow-lg shadow-indigo-600/30 text-center transition cursor-pointer mb-3">
    RPH Saya (Mod Guru)
  </Link>
            <Link href="/reviewer/queue" className="block bg-blue-600 hover:bg-blue-500 text-white p-5 rounded-2xl font-bold shadow-lg shadow-blue-600/30 text-center transition cursor-pointer">
              Semak RPH Guru
            </Link>
            <Link href="/reviewer/analytics" className="block bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold border border-slate-700 text-center transition cursor-pointer">
              Laporan Prestasi Keseluruhan (Jadual Terperinci)
            </Link>
          </div>
        
      </div>
    </div>
  );
}
