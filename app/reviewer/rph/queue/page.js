'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../lib/authProvider';
import { db } from '../../../../lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { generateRphPdf } from '../../../../lib/pdfGenerator';

export default function TeacherQueue() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [allSubmissions, setAllSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWeek, setFilterWeek] = useState('All');
  const [filterSession, setFilterSession] = useState('All');
  const [sessionsMap, setSessionsMap] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (user && profile) {
      if (!profile) {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, profile]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Subjects for mapping ID to Label
      const subjSnap = await getDocs(collection(db, 'subjects'));
      const subjMap = {};
      subjSnap.forEach(s => { subjMap[s.id] = s.data().label; });
      setSubjects(subjMap);

      
      // Fetch system settings for default session
      let currentSesi = '';
      const sDoc = await getDoc(doc(db, 'school_settings', '1'));
      if (sDoc.exists()) {
        currentSesi = sDoc.data().session_name || '';
        setFilterSession(currentSesi || 'All');
      }

      // 2. Fetch RPH Submissions
      let q = query(
        collection(db, 'rph_submissions'),
        where('User_Id', '==', user.id)
      );

      
      const snap = await getDocs(q);
      
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sessions = new Set();
      if (currentSesi) sessions.add(currentSesi);
      data.forEach(r => {
        if (r.Session_Name) sessions.add(r.Session_Name);
      });
      setSessionsMap(Array.from(sessions).sort());

      // Sort in JS since we don't have composite indexes yet
      data.sort((a, b) => new Date(b.TIMPESTAMP_SEND) - new Date(a.TIMPESTAMP_SEND));


      setAllSubmissions(data);
    } catch (e) {
      console.error(e);
      alert('Gagal memuatkan rekod RPH.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmissions = allSubmissions.filter(rph => {
    let match = true;
    
    if (statusFilter !== 'All') {
      const filterVal = statusFilter === 'Pending' ? '80' : statusFilter === 'Approved' ? '81' : statusFilter === 'Draft' ? '82' : '83';
      if (rph.Status_Id !== filterVal) match = false;
    }
    
    
    if (filterSession !== 'All') {
      if (rph.Session_Name !== filterSession && !(!rph.Session_Name && filterSession === sessionsMap[0])) match = false;
    }

    if (filterWeek !== 'All') {

      if (String(rph.Minggu) !== String(filterWeek)) match = false;
    }
    
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      const sName = (rph.Subject_Name || subjects[rph.Subject_Id] || rph.Subject_Id || '').toLowerCase();
      const cName = (rph.Kelas_Id || '').toLowerCase();
      if (!sName.includes(sq) && !cName.includes(sq)) {
        match = false;
      }
    }
    
    return match;
  });

  const getStatusLabel = (statusId) => {
    switch (statusId) {
      case '80': return <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full text-[10px] font-bold">MENUNGGU (PENDING)</span>;
      case '81': return <span className="bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full text-[10px] font-bold">LULUS</span>;
      case '82': return <span className="bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full text-[10px] font-bold">DRAF</span>;
      case '83': return <span className="bg-rose-500/20 text-rose-500 px-2 py-1 rounded-full text-[10px] font-bold">PEMBETULAN</span>;
      default: return <span className="bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full text-[10px] font-bold">TIDAK DIKETAHUI</span>;
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('Adakah anda pasti untuk memadam RPH ini?')) return;
    try {
      await deleteDoc(doc(db, 'rph_submissions', id));
      alert('Berjaya dipadam.');
      fetchData();
    } catch (e) {
      alert('Gagal memadam.');
    }
  }

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        
        <div className="flex items-center gap-2 mb-2">
          <Link href="/reviewer/rph" className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs transition">
            Kembali
          </Link>
        </div>
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold text-white">Senarai RPH Saya</h1>
            <p className="text-xs text-slate-400">Pantau dan urus status penghantaran RPH mingguan anda.</p>
          </div>
          <Link href="/rph/new" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-lg shadow-purple-500/20">
            + RPH Baharu
          </Link>
        </div>

        <div className="flex gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl overflow-x-auto">
          {['All', 'Pending', 'Approved', 'Not Approved', 'Draft'].map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === filter ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {filter === 'All' ? 'Semua' : filter === 'Pending' ? 'Menunggu' : filter === 'Approved' ? 'Lulus' : filter === 'Draft' ? 'Draf' : 'Pembetulan'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input 
            type="text" 
            placeholder="🔍 Cari Kelas atau Subjek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-purple-500 focus:outline-none"
          />

          <select 
            value={filterWeek} 
            onChange={(e) => setFilterWeek(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-purple-500 focus:outline-none"
          >
            <option value="All">📅 Semua Minggu</option>
            {Array.from({ length: 42 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Minggu {w}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse">Memuat turun data Firebase...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl py-12 text-slate-500 text-sm">
            Tiada rekod RPH dijumpai.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubmissions.map(rph => (
              <div key={rph.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-800">
                        ID: {rph.id.substring(0,6).toUpperCase()}
                      </span>
                      {rph.Minggu && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-800">
                          Minggu {rph.Minggu}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-200 text-sm">{rph.Subject_Name || subjects[rph.Subject_Id] || 'Subjek Tidak Diketahui'}</h3>
                  </div>
                  {getStatusLabel(rph.Status_Id)}
                </div>

                <div className="text-xs text-slate-400 space-y-2 mb-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong className="text-slate-500 block text-[9px] uppercase">Kelas</strong>
                      <span className="text-slate-300 font-medium">{rph.Kelas_Id || '-'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500 block text-[9px] uppercase">Tarikh P&P</strong>
                      <span className="text-slate-300 font-medium">{rph.Tarikh || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <strong className="text-slate-500 block text-[9px] uppercase">Masa</strong>
                      <span className="text-slate-300 font-medium">{rph.Masa || '-'}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700/50 pt-2">
                    <strong className="text-slate-500 block text-[9px] uppercase">Tajuk / DSKP</strong>
                    <span className="text-slate-300 font-medium">{rph.TAJUK || rph.Tajuk_Id || '-'}</span>
                  </div>
                  
                  <div className="border-t border-slate-700/50 pt-2">
                    <strong className="text-slate-500 block text-[9px] uppercase">Tarikh Dihantar</strong>
                    <span className="text-slate-300">{new Date(rph.TIMPESTAMP_SEND).toLocaleString('ms-MY')}</span>
                  </div>
                  
                  {rph.Reviewer_Remarks && rph.Status_Id === '83' && (
                    <div className="border-t border-rose-900/50 pt-2 mt-2">
                      <strong className="text-rose-500 block text-[9px] uppercase">Teguran Penyemak:</strong>
                      <span className="text-rose-300 italic">"{rph.Reviewer_Remarks}"</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                  {rph.Status_Id === '81' ? (
                    <>
                      <button 
                        onClick={() => generateRphPdf(rph, profile?.fullName || profile?.full_name || user?.email || 'Guru')} 
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-lg shadow-blue-600/40 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Muat Turun PDF
                      </button>
                      <Link 
                        href={`/rph/${rph.id}`} 
                        className="flex-1 text-center flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                      >
                        Paparkan
                      </Link>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleDelete(rph.id)} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-2 rounded-xl text-xs transition border border-rose-500/20 cursor-pointer">
                        Padam
                      </button>
                      <Link href={`/rph/${rph.id}/edit`} className="flex-1 text-center flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer">
                        Edit Draf
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
