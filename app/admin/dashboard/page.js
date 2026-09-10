'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/authProvider';
import { db } from '../../../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({ totalUsers: 0, pendingRph: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'admin') {
        router.push('/');
      } else {
        fetchStats();
      }
    }
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const userSnap = await getDocs(collection(db, 'users'));
      const rphSnap = await getDocs(collection(db, 'rph_submissions'));
      
      const totalUsers = userSnap.docs.length;
      const pendingRph = rphSnap.docs.map(d => d.data()).filter(r => r.Status_Id === '80').length;

      setStats({ totalUsers, pendingRph });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || profile?.role !== 'admin') {
    return <div className="p-12 text-center text-slate-400">Memverifikasi akses...</div>;
  }

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-950/40 px-3 py-1 rounded-full border border-rose-900/40">
            Portal Pentadbir
          </span>
          <h1 className="text-xl font-extrabold text-white mt-3">Sistem Kawalan Pusat</h1>
          <p className="text-xs text-slate-400 mt-1">Pantau guru, selaraskan takwim, dan lihat analisis sekolah.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
            <div className="text-3xl font-extrabold text-white">{stats.totalUsers}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Jumlah Pengguna</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
            <div className="text-3xl font-extrabold text-amber-500">{stats.pendingRph}</div>
            <div className="text-[10px] uppercase font-bold text-amber-600 mt-1">RPH Menunggu Semakan</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/queue" className="bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold border border-slate-700 text-center transition cursor-pointer text-xs">
            Senarai Penuh RPH
          </Link>
          <Link href="/admin/teachers" className="bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold border border-slate-700 text-center transition cursor-pointer text-xs">
            Urus Guru
          </Link>
          <Link href="/admin/analytics" className="bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold border border-slate-700 text-center transition cursor-pointer text-xs">
            Analisis Sekolah
          </Link>
          <Link href="/admin/settings" className="bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold border border-slate-700 text-center transition cursor-pointer text-xs">
            Tetapan Takwim
          </Link>
        </div>
        
      </div>
    </div>
  );
}
