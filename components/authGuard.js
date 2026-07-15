'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/authProvider';

export default function AuthGuard({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === '/login';
    const isResetPage = pathname === '/reset-password';

    if (!user) {
      // Unauthenticated users can access /login or /reset-password
      if (!isLoginPage && !isResetPage) {
        router.replace('/login');
      }
    } else {
      // Authenticated users
      if (isLoginPage) {
        // Redirect logged-in users away from login page to their dashboard
        if (profile?.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (profile?.role === 'reviewer') {
          router.replace('/reviewer/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        // Enforce role-based route protection
        if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
          if (profile?.role === 'reviewer') router.replace('/reviewer/dashboard');
          else router.replace('/dashboard');
        } else if (pathname.startsWith('/reviewer') && profile?.role !== 'reviewer') {
          if (profile?.role === 'admin') router.replace('/admin/dashboard');
          else router.replace('/dashboard');
        } else if (pathname.startsWith('/dashboard') && profile?.role && profile?.role !== 'teacher') {
          if (profile?.role === 'admin') router.replace('/admin/dashboard');
          else if (profile?.role === 'reviewer') router.replace('/reviewer/dashboard');
        } else if (pathname === '/' && profile?.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (pathname === '/' && profile?.role === 'reviewer') {
          router.replace('/reviewer/dashboard');
        } else if (pathname === '/') {
          router.replace('/dashboard');
        }
      }
    }
  }, [user, profile, loading, pathname, router]);

  // Show premium loading micro-animation
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
          <div className="absolute w-6 h-6 rounded-full bg-blue-500/20 animate-ping"></div>
        </div>
        <p className="mt-6 text-sm font-medium text-slate-400 tracking-wide animate-pulse">
          Mengesahkan Sesi...
        </p>
      </div>
    );
  }

  const isLoginPage = pathname === '/login';
  const isResetPage = pathname === '/reset-password';

  // Prevent flashing of protected pages
  if (!user && !isLoginPage && !isResetPage) {
    return null;
  }
  if (user && pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return null;
  }
  if (user && pathname.startsWith('/reviewer') && profile?.role !== 'reviewer') {
    return null;
  }
  if (user && pathname.startsWith('/dashboard') && profile?.role && profile?.role !== 'teacher') {
    return null;
  }
  if (user && pathname === '/') {
    return null;
  }

  return children;
}
