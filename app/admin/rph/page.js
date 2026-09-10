'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/authProvider';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function GuruDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    notApproved: 0
  });
  const [schoolSettings, setSchoolSettings] = useState({
    activeSession: '2026/2027',
    activeWeek: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchStats();
    }
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      const q = query(
        collection(db, 'rph_submissions'), 
        where('User_Id', '==', user.id)
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());

      const total = data.length;
      const pending = data.filter(r => r.Status_Id === '80').length;
      const approved = data.filter(r => r.Status_Id === '81').length;
      const notApproved = data.filter(r => r.Status_Id === '83').length;

      setStats({ total, pending, approved, notApproved });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 font-bold text-xs">
        Memverifikasi akses keselamatan...
      </div>
    );
  }

  return (
    <div className="flex-grow bg-transparent text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-6">
        
        
        {/* Back to Portal Button for Admin/Reviewers */}
        {(true) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 text-center">
            <span className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Anda Berada Di Mod Guru</span>
            <Link 
              href="/admin/dashboard" 
              className="inline-block bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-6 rounded-xl transition shadow-lg shadow-amber-600/20"
            >
              Kembali ke Portal Asal
            </Link>
          </div>
        )}


        {/* Welcome Header */}
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-purple-900/10">
          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-950/60 px-3 py-1 rounded-full border border-purple-900/40">
            Portal Guru
          </span>
          <h1 className="text-xl font-extrabold tracking-tight mt-2.5">
            Selamat Kembali,
          </h1>
          <p className="text-sm font-bold text-white underline mt-0.5">
            Cikgu {profile?.fullName || profile?.full_name}
          </p>
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            [Sesi {schoolSettings.activeSession}]
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-3 text-[10px] font-bold text-slate-400 animate-pulse">Menghubungkan sesi...</p>

          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Jumlah RPH</span>
                <span className="block text-xl font-extrabold text-slate-100">{stats.total}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Lulus</span>
                <span className="block text-xl font-extrabold text-emerald-500">{stats.approved}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Menunggu</span>
                <span className="block text-xl font-extrabold text-amber-500">{stats.pending}</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-md space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Pembetulan</span>
                <span className="block text-xl font-extrabold text-rose-500">{stats.notApproved}</span>
              </div>
            </div>

            {/* Big Action Cards */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link 
                href="/rph/new" 
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition text-center"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <h3 className="text-xs font-extrabold">Isi RPH Baharu</h3>
              </Link>
              
              <Link 
                href="/admin/rph/queue" 
                className="flex flex-col items-center justify-center p-4 bg-slate-800 border border-slate-700 text-white rounded-2xl shadow-lg hover:bg-slate-700 active:scale-95 transition text-center"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <h3 className="text-xs font-extrabold">Senarai RPH Saya</h3>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
