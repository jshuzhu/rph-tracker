'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../../lib/authProvider';
import { useRouter } from 'next/navigation';

export default function TeacherAnalytics() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    drafts: 0,
    rejected: 0,
    weeklyData: [0,0,0,0]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'teacher') router.push('/');
      else fetchStats();
    }
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const q = query(collection(db, 'rph_submissions'), where('User_Id', '==', user.id));
      const snap = await getDocs(q);
      const subs = snap.docs.map(doc => doc.data());

      let total = subs.length;
      let approved = subs.filter(r => r.Status_Id === '81').length;
      let pending = subs.filter(r => r.Status_Id === '80').length;
      let drafts = subs.filter(r => r.Status_Id === '82').length;
      let rejected = subs.filter(r => r.Status_Id === '83').length;

      setStats({ total, approved, pending, drafts, rejected, weeklyData: [1,2,3,4] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold text-white">Analisis Prestasi</h1>
            <p className="text-xs text-slate-400">Papan pemuka statistik RPH mingguan anda.</p>
          </div>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 text-xs font-bold transition">
            Kembali
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse">Menjana laporan analisis...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-slate-200">{stats.total}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Jumlah RPH</div>
            </div>
            <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-900/30 text-center">
              <div className="text-3xl font-extrabold text-emerald-500">{stats.approved}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-600/80 mt-1">Lulus</div>
            </div>
            <div className="bg-amber-950/30 p-4 rounded-2xl border border-amber-900/30 text-center">
              <div className="text-3xl font-extrabold text-amber-500">{stats.pending}</div>
              <div className="text-[10px] uppercase font-bold text-amber-600/80 mt-1">Menunggu</div>
            </div>
            <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-900/30 text-center">
              <div className="text-3xl font-extrabold text-rose-500">{stats.rejected}</div>
              <div className="text-[10px] uppercase font-bold text-rose-600/80 mt-1">Pembetulan</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
