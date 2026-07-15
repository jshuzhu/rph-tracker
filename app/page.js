'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/authProvider';

export default function HomeRedirect() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (profile?.role === 'reviewer') {
        router.replace('/reviewer/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="flex-grow flex items-center justify-center p-12 text-slate-400 font-bold text-xs bg-slate-950 min-h-screen text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin"></div>
        <span>Membuka RPH Tracker...</span>
      </div>
    </div>
  );
}