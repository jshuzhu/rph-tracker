'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authProvider';

export default function AdminRedirect() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="flex-grow flex items-center justify-center p-12 text-slate-400 font-bold text-xs bg-slate-950 min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin"></div>
        <span>Membuka Dashboard Pentadbir...</span>
      </div>
    </div>
  );
}
