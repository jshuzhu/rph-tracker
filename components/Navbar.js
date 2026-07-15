'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authProvider';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const pathname = usePathname();
  const [schoolInfo, setSchoolInfo] = useState(null);

  // Enforce light mode on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Fetch school settings dynamically
  useEffect(() => {
    if (user) {
      const getSchoolInfo = async () => {
        try {
          const { data } = await supabase
            .from('school_settings')
            .select('school_name, logo_url')
            .eq('id', 1)
            .single();
          if (data) {
            setSchoolInfo(data);
          }
        } catch (err) {
          console.error('Error fetching school navbar info:', err);
        }
      };
      getSchoolInfo();
    } else {
      setSchoolInfo(null);
    }
  }, [user]);

  // If no user is logged in, show a simple header
  if (!user) {
    return (
      <header className="bg-slate-900 border-b border-slate-800 text-white py-4 px-6 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-purple-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="font-extrabold text-sm tracking-widest text-slate-100 uppercase">
              RPH Tracker
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-slate-400 font-medium bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 hidden sm:block">
              Sistem Automasi Sekolah Pintar
            </div>
          </div>
        </div>
      </header>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const isReviewer = profile?.role === 'reviewer';

  return (
    <header className="hidden md:block bg-slate-900 border-b border-slate-850 text-white sticky top-0 z-50 shadow-md shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Identification Info */}
          <div className="flex items-center space-x-3">
            <Link href={isAdmin ? '/admin' : isReviewer ? '/reviewer' : '/'} className="flex items-center space-x-2 group">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-105 transition-transform duration-200 shrink-0">
                {schoolInfo?.logo_url ? (
                  <img src={schoolInfo.logo_url} alt="Logo Sekolah" className="w-full h-full object-contain p-1" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-purple-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight group-hover:text-purple-300 transition-colors duration-200">
                  RPH Tracker
                </span>
                {schoolInfo?.school_name && (
                  <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-wider line-clamp-1 max-w-[150px]">
                    {schoolInfo.school_name}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            {isAdmin && (
              <Link 
                href="/admin" 
                className={`transition duration-150 px-3 py-2 rounded-md ${
                  pathname === '/admin' 
                    ? 'text-white bg-slate-800 border-b-2 border-purple-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Admin Dashboard
              </Link>
            )}
            {isReviewer && (
              <Link 
                href="/reviewer" 
                className={`transition duration-150 px-3 py-2 rounded-md ${
                  pathname === '/reviewer' 
                    ? 'text-white bg-slate-800 border-b-2 border-purple-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Reviewer Portal
              </Link>
            )}
            {!isAdmin && !isReviewer && (
              <Link 
                href="/" 
                className={`transition duration-150 px-3 py-2 rounded-md ${
                  pathname === '/' 
                    ? 'text-white bg-slate-800 border-b-2 border-purple-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Borang Guru
              </Link>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">

            {/* Profile info */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-slate-100">
                {profile?.full_name || 'Pengguna'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 mt-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isAdmin 
                  ? 'bg-purple-950/40 text-purple-300 border-purple-800' 
                  : isReviewer
                  ? 'bg-blue-950/40 text-blue-300 border-blue-800'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
              }`}>
                {isAdmin ? 'Admin' : isReviewer ? 'Reviewer' : 'Guru'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="bg-red-600/90 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm shadow-red-900/10 hover:shadow-red-900/20 active:scale-95 cursor-pointer"
            >
              Log Keluar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
