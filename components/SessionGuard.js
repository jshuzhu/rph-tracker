'use client';

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../lib/authProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SessionGuard({ children }) {
  const { user, profile } = useAuth();
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      if (!user || !profile) {
        setLoading(false);
        return;
      }
      try {
        const sDoc = await getDoc(doc(db, 'school_settings', '1'));
        if (sDoc.exists()) {
          const data = sDoc.data();
          if (!data.session_end_date || !data.session_start_date) {
            setIsExpired(true);
          } else {
            const endDate = new Date(data.session_end_date);
            endDate.setHours(23, 59, 59, 999);
            const startDate = new Date(data.session_start_date);
            startDate.setHours(0, 0, 0, 0);

            if (new Date() > endDate || new Date() < startDate) {
              setIsExpired(true);
            }
          }
        } else {
           setIsExpired(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    // Check initially
    checkSession();
    
    // Also re-check when returning to the tab
    const handleFocus = () => checkSession();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    
  }, [user, profile]);

  if (loading || !user || !profile) return children;

  // Sentiasa benarkan admin/penyemak masuk ke halaman tetapan
  if (pathname?.includes('/settings')) {
    return children;
  }

  if (isExpired) {
    if (profile.role === 'teacher') {
      return (
        <>
          {children}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4">
            <div className="bg-slate-900 border border-rose-500/50 p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center">
              <div className="bg-rose-500/20 text-rose-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">Sesi Belum Wujud</h2>
              <p className="text-sm text-slate-400 mb-6">Sesi akademik semasa masih belum ditetapkan atau telah tamat. Sila tunggu sehingga pihak pentadbir mengemaskini takwim persekolahan di dalam sistem.</p>
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          {children}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4">
            <div className="bg-slate-900 border border-amber-500/50 p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center">
              <div className="bg-amber-500/20 text-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">Sila Tetapkan Sesi Sekarang</h2>
              <p className="text-sm text-slate-400 mb-6">Tarikh akhir sesi persekolahan semasa telah berlalu atau belum diwujudkan. Semua fungsi portal telah dikunci sementara sehingga takwim dikemaskini.</p>
              <Link href={profile.role === 'admin' ? '/admin/settings' : '/reviewer/settings'} className="inline-block bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-amber-600/30">Kemaskini Tetapan</Link>
            </div>
          </div>
        </>
      );
    }
  }

  return children;
}
