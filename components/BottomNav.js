'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authProvider';

export default function BottomNav() {
  const { user, profile, logout } = useAuth();
  const pathname = usePathname();

  if (!user || !profile) return null;

  const isAdmin = profile?.role === 'admin';
  const isReviewer = profile?.role === 'reviewer';
  const isTeacher = !isAdmin && !isReviewer;

  // Active state checker
  const isActive = (path) => pathname === path;

  // Render navigation links based on roles
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 text-white shadow-2xl px-2 py-1 pb-safe shrink-0">
      <div className="max-w-md mx-auto flex items-center justify-around text-[10px] font-bold">
        
        {/* ================= GURU BOTTOM NAV ================= */}
        {isTeacher && (
          <>
            <Link 
              href="/dashboard" 
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive('/dashboard') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="mt-0.5">Utama</span>
            </Link>

            <Link 
              href="/dashboard/queue" 
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive('/dashboard/queue') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm0 5.25h.007v.008H3.75V12Zm0 5.25h.007v.008H3.75v-.008Z" />
              </svg>
              <span className="mt-0.5">RPH</span>
            </Link>

            {/* Elevated Primary CTA "+ RPH" */}
            <div className="relative -top-3">
              <Link 
                href="/rph/new" 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-xl shadow-purple-500/20 active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Link>
            </div>

            <Link 
              href="/dashboard/analytics" 
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive('/dashboard/analytics') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
              <span className="mt-0.5">Analisis</span>
            </Link>

            <button 
              onClick={logout}
              className="flex flex-col items-center justify-center w-14 h-12 rounded-xl text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              <span className="mt-0.5">Keluar</span>
            </button>
          </>
        )}

        {/* ================= REVIEWER BOTTOM NAV ================= */}
        {isReviewer && (
          <>
            <Link 
              href="/reviewer/dashboard" 
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition ${
                isActive('/reviewer/dashboard') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="mt-0.5">Dashboard</span>
            </Link>

            <Link 
              href="/reviewer/queue" 
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition ${
                isActive('/reviewer/queue') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="mt-0.5">Semakan</span>
            </Link>

            <Link 
              href="/reviewer/analytics" 
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition ${
                isActive('/reviewer/analytics') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
              <span className="mt-0.5">Analisis</span>
            </Link>

            <button 
              onClick={logout}
              className="flex flex-col items-center justify-center w-16 h-12 rounded-xl text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              <span className="mt-0.5">Keluar</span>
            </button>
          </>
        )}

        {/* ================= ADMIN BOTTOM NAV ================= */}
        {isAdmin && (
          <>
            <Link 
              href="/admin/dashboard" 
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive('/admin/dashboard') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="mt-0.5">Dashboard</span>
            </Link>

            <Link 
              href="/admin/queue" 
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive('/admin/queue') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="mt-0.5">Semakan</span>
            </Link>

            <Link 
              href="/admin/teachers" 
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive('/admin/teachers') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span className="mt-0.5">Guru</span>
            </Link>

            <Link 
              href="/admin/settings" 
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
                isActive('/admin/settings') ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span className="mt-0.5">Tetapan</span>
            </Link>

            <button 
              onClick={logout}
              className="flex flex-col items-center justify-center w-14 h-12 rounded-xl text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              <span className="mt-0.5">Keluar</span>
            </button>
          </>
        )}
        
      </div>
    </div>
  );
}
