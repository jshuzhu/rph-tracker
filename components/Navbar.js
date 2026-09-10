'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authProvider';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { calculateActiveWeek, formatMalaysianDate } from '../lib/dateUtils';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();

  const [dateStr, setDateStr] = useState('');
  const [sessionBadge, setSessionBadge] = useState('');

  useEffect(() => {
    const fetchDateBadge = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'school_settings', '1'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          const sName = data.session_name || 'Sesi Akademik';
          const sStart = data.session_start_date || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
          const sEnd = data.session_end_date || null;
          const weekNo = calculateActiveWeek(sStart, sEnd);
          setSessionBadge(`${sName} | Minggu ${weekNo}`);
        } else {
          setSessionBadge(`Sesi Akademik | Minggu 1`);
        }
      } catch (e) {
        console.error(e);
        setSessionBadge(`Sesi Akademik`);
      }
      setDateStr(formatMalaysianDate());
    };
    fetchDateBadge();
    
    // Interval to keep the date updated if they leave it open
    const interval = setInterval(() => setDateStr(formatMalaysianDate()), 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  if (!user || !profile) {
    return (
      <header className="bg-slate-900 border-b border-slate-800 text-white py-4 px-6 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">RPH Tracker</span>
          </Link>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-xs font-bold text-slate-300">{dateStr}</span>
             </div>
             <Link href="/login" className="text-sm font-bold bg-slate-800 hover:bg-slate-700 transition px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600">Log Masuk</Link>
             
          </div>
        </div>
      </header>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const isReviewer = profile?.role === 'reviewer';
  const isTeacher = profile?.role === 'teacher';

  const NavLink = ({ href, label }) => {
    const isActive = pathname === href;
    return (
      <Link href={href} className={`transition duration-150 px-3 py-2 rounded-md text-xs font-bold ${isActive ? 'text-white bg-slate-800 border-b-2 border-purple-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
        {label}
      </Link>
    );
  };

  return (
    <>
    {/* Mobile Top Header for Date Badge */}
    <div className="md:hidden bg-slate-900 border-b border-slate-800 p-3 sticky top-0 z-40 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dateStr}</span>
          <span className="text-[10px] font-extrabold text-purple-400">{sessionBadge}</span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-bold text-white block">{profile.fullName || profile.full_name || user.email}</span>
        <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">
          {isAdmin ? 'PENTADBIR' : isReviewer ? 'PENYEMAK' : 'GURU'}
        </span>
      </div>
    </div>

    {/* Desktop Navbar */}
    <header className="hidden md:block bg-slate-900 border-b border-slate-850 text-white sticky top-0 z-50 shadow-md shrink-0">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center space-x-6">
          <Link href={isAdmin ? '/admin/dashboard' : isReviewer ? '/reviewer/dashboard' : '/dashboard'} className="flex items-center space-x-2 group pr-4">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-white leading-tight group-hover:text-purple-300 transition-colors duration-200">
                RPH Tracker
              </span>
            </div>
          </Link>

          <nav className="flex items-center space-x-1 border-l border-slate-800 pl-4">
            {isAdmin && (
              <>
                <NavLink href="/admin/dashboard" label="Utama" />
                <NavLink href="/admin/teachers" label="Urus Guru" />
                <NavLink href="/admin/settings" label="Tetapan" />
              </>
            )}
            {isReviewer && (
              <>
                <NavLink href="/reviewer/dashboard" label="Utama" />
                <NavLink href="/reviewer/queue" label="Semak RPH" />
                <NavLink href="/reviewer/analytics" label="Analisis" />
                <NavLink href="/reviewer/settings" label="Tetapan" />
              </>
            )}
            {isTeacher && (
              <>
                <NavLink href="/dashboard" label="Utama" />
                <NavLink href="/rph/new" label="+ RPH Baru" />
                <NavLink href="/dashboard/queue" label="Senarai RPH" />
                <NavLink href="/dashboard/analytics" label="Prestasi" />
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          
          {/* Global Date Badge */}
          {dateStr && (
            <div className="hidden lg:flex flex-col items-end mr-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1 flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dateStr}</span>
                <span className="text-xs font-extrabold text-purple-400">{sessionBadge}</span>
              </div>
            </div>
          )}

          <div className="hidden sm:flex flex-col items-end text-right border-r border-slate-800 pr-4">
            <span className="text-sm font-bold text-white leading-tight">{profile.fullName || profile.full_name || user.email}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {isAdmin ? 'PENTADBIR' : isReviewer ? 'PENYEMAK' : 'GURU'}
            </span>
          </div>

          <button onClick={logout} className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors duration-200 cursor-pointer" title="Log Keluar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>

        </div>
      </div>
    </header>
    </>
  );
}
