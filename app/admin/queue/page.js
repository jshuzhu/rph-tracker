'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/authProvider';
import { db } from '../../../lib/firebase';
import { collection, query, getDocs, doc, orderBy, limit, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { generateRphPdf } from '../../../lib/pdfGenerator';

export default function AdminQueue() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [allSubmissions, setAllSubmissions] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [teachers, setTeachers] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('80'); // 80=Pending
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWeek, setFilterWeek] = useState('All');
  const [filterSession, setFilterSession] = useState('All');
  const [sessionsMap, setSessionsMap] = useState([]);
  
  const [isUpdating, setIsUpdating] = useState(null);

  // Remarks Modal State
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [selectedRphId, setSelectedRphId] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'admin') router.push('/');
      else fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Subjects
      const subjSnap = await getDocs(collection(db, 'subjects'));
      const subjMap = {};
      subjSnap.forEach(s => { subjMap[s.id] = s.data().label; });
      setSubjects(subjMap);

      // Fetch Teachers
      const usersSnap = await getDocs(collection(db, 'users'));
      const userMap = {};
      usersSnap.forEach(u => { userMap[u.id] = u.data().fullName || u.data().email; });
      setTeachers(userMap);

      
      let currentSesi = '';
      const sDoc = await getDoc(doc(db, 'school_settings', '1'));
      if (sDoc.exists()) {
        currentSesi = sDoc.data().session_name || '';
        setFilterSession(currentSesi || 'All');
      }

      // Fetch Submissions
      const q = query(collection(db, 'rph_submissions'), orderBy('TIMPESTAMP_SEND', 'desc'), limit(1500));
      const snap = await getDocs(q);
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sessions = new Set();
      if (currentSesi) sessions.add(currentSesi);
      data.forEach(r => {
        if (r.Session_Name) sessions.add(r.Session_Name);
      });
      setSessionsMap(Array.from(sessions).sort());

      data.sort((a, b) => new Date(b.TIMPESTAMP_SEND) - new Date(a.TIMPESTAMP_SEND));

      data = data.filter(r => r.Status_Id !== '82'); // NEVER show drafts

      setAllSubmissions(data);
    } catch (e) {
      console.error(e);
      alert('Gagal memuatkan rekod RPH.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus, customRemarks = '') => {
    setIsUpdating(id);
    try {
      const payload = {
        Status_Id: newStatus,
        TIMESTAMP_UPDATED: new Date().toISOString(),
        Reviewer_Id: user.id,
        Reviewer_Name: profile.fullName || profile.full_name,
        Reviewer_Title: profile.title || 'Penyemak',
      };
      
      if (newStatus === '83') {
        payload.Reviewer_Remarks = customRemarks;
      } else {
        payload.Reviewer_Remarks = ''; 
      }

      await updateDoc(doc(db, 'rph_submissions', id), payload);
      fetchData();
    } catch (e) {
      alert('Gagal mengemaskini status.');
    } finally {
      setIsUpdating(null);
      setRemarksModalOpen(false);
      setRemarks('');
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('Adakah anda pasti untuk memadam RPH ini? RPH ini akan hilang sepenuhnya!')) return;
    try {
      await deleteDoc(doc(db, 'rph_submissions', id));
      alert('RPH berjaya dipadam.');
      fetchData();
    } catch (e) {
      alert('Gagal memadam RPH.');
    }
  };

  const confirmReject = (id) => {
    setSelectedRphId(id);
    setRemarksModalOpen(true);
  };

  // Advanced Filtering
  
  const filteredSubmissions = allSubmissions.filter(rph => {
    let match = true;

    if (filterSession !== 'All') {
      if (rph.Session_Name !== filterSession && !(!rph.Session_Name && filterSession === sessionsMap[0])) match = false;
    }


    if (statusFilter !== 'All') {
      if (rph.Status_Id !== statusFilter) match = false;
    }

    if (filterWeek !== 'All') {
      if (String(rph.Minggu) !== String(filterWeek)) match = false;
    }

    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      const sName = (rph.Subject_Name || subjects[rph.Subject_Id] || rph.Subject_Id || '').toLowerCase();
      const cName = (rph.Kelas_Id || '').toLowerCase();
      const tName = (rph.Teacher_Name || teachers[rph.User_Id] || '').toLowerCase();
      
      if (!sName.includes(sq) && !cName.includes(sq) && !tName.includes(sq)) {
        match = false;
      }
    }

    return match;
  });

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4 relative">
      
      {remarksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-[2rem] shadow-2xl max-w-md w-full">
            <h2 className="text-lg font-extrabold text-rose-500 mb-2">Minta Pembetulan</h2>
            <p className="text-xs text-slate-400 mb-4">Sila berikan ulasan atau sebab penolakan agar guru boleh membuat pembetulan.</p>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Contoh: Objektif pembelajaran tidak jelas..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[100px] mb-4 focus:border-rose-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setRemarksModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold transition">Batal</button>
              <button onClick={() => handleUpdateStatus(selectedRphId, '83', remarks)} disabled={!remarks.trim()} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-xl text-xs font-bold transition disabled:opacity-50">Hantar Ulasan</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-4">
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="w-full md:w-auto">
            <h1 className="text-xl font-extrabold text-white">Semakan RPH</h1>
            <p className="text-xs text-slate-400 mt-1">Senarai RPH. Anda log masuk sebagai <strong className="text-blue-400">{profile?.title || 'Penyemak'}</strong></p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <Link href="/admin/dashboard" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center justify-center">Kembali</Link>

              <select 
                value={filterSession} 
                onChange={(e) => setFilterSession(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2 text-xs font-bold rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">Semua Sesi</option>
                {sessionsMap.map(s => (
                  <option key={s} value={s}>Sesi {s}</option>
                ))}
              </select>
  
          </div>
        </div>

        <div className="flex gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl overflow-x-auto">
          {[{label:'Semua', val:'All'}, {label:'Menunggu Semakan', val:'80'}, {label:'Telah Diluluskan', val:'81'}, {label:'Perlu Pembetulan', val:'83'}].map(f => (
            <button
              key={f.val}
              onClick={() => setStatusFilter(f.val)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === f.val ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input 
            type="text" 
            placeholder="🔍 Cari Kelas, Subjek atau Nama Guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          />

          <select 
            value={filterWeek} 
            onChange={(e) => setFilterWeek(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">Semua Minggu</option>
            {Array.from({ length: 42 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Minggu {w}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse">Mencari data RPH...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl py-12 text-slate-500 text-sm">
            Tiada RPH dalam kategori ini.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map(rph => {
              const bgBorderClass = rph.Status_Id === '80' ? 'bg-amber-900/40 border-amber-500/50' : 
                                    rph.Status_Id === '81' ? 'bg-emerald-900/40 border-emerald-500/50' : 
                                    'bg-rose-900/40 border-rose-500/50';
              return (
              <div key={rph.id} className={`${bgBorderClass} border-2 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group`}>
                
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md text-[10px] font-mono border border-slate-700">ID: {rph.id.substring(0,6).toUpperCase()}</span>
                    <span className="text-xs font-bold text-blue-400">{rph.Teacher_Name || teachers[rph.User_Id] || 'Guru Tidak Diketahui'}</span>
                    {rph.Minggu && <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded-md text-[10px] font-bold border border-blue-800/50">Minggu {rph.Minggu}</span>}
                  </div>
                  <h3 className="font-extrabold text-slate-200 text-sm">{rph.Subject_Name || subjects[rph.Subject_Id] || 'Subjek Tidak Diketahui'}</h3>
                  
                  <div className="text-xs text-slate-400 space-y-2 mt-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
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
                    
                    <div className="border-t border-slate-800/50 pt-2">
                      <strong className="text-slate-500 block text-[9px] uppercase">Tajuk / DSKP</strong>
                      <span className="text-slate-300 font-medium">{rph.TAJUK || rph.Tajuk_Id || '-'}</span>
                    </div>
                    
                    <div className="border-t border-slate-800/50 pt-2">
                      <strong className="text-slate-500 block text-[9px] uppercase">Tarikh Dihantar</strong>
                      <span className="text-slate-300">{new Date(rph.TIMPESTAMP_SEND).toLocaleString('ms-MY')}</span>
                    </div>
                  </div>

                  {rph.Reviewer_Remarks && rph.Status_Id === '83' && (
                    <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-900/50 mt-2 text-xs">
                      <strong className="text-rose-500 block text-[10px] uppercase mb-1">Ulasan Penolakan Anda:</strong>
                      <p className="text-rose-300 italic">"{rph.Reviewer_Remarks}"</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col w-full md:w-48 gap-2 shrink-0">
                  <div className="grid grid-cols-2 gap-2">
                    {rph.Status_Id === '81' ? (
                      <>
                        <button 
                          onClick={() => generateRphPdf(rph, rph.Teacher_Name || teachers[rph.User_Id] || 'Guru')} 
                          className="col-span-2 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/40 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                          Muat Turun PDF
                        </button>
                        <Link href={`/rph/${rph.id}`} className="col-span-2 text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30">
                          Paparkan
                        </Link>
                      </>
                    ) : (
                      <Link href={`/rph/${rph.id}`} className="col-span-2 bg-slate-700 hover:bg-slate-600 text-white text-center font-bold py-2.5 rounded-xl text-xs transition border border-slate-600">
                        Papar Penuh
                      </Link>
                    )}
                  </div>

                  {rph.Status_Id === '80' && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button onClick={() => handleUpdateStatus(rph.id, '81')} disabled={isUpdating === rph.id} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase transition cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-900/20">
                        {isUpdating === rph.id ? 'Tunggu...' : 'Luluskan'}
                      </button>
                      <button onClick={() => confirmReject(rph.id)} disabled={isUpdating === rph.id} className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase transition cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-900/20">
                        Tolak
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 mt-1 border-t border-slate-700/50 pt-2">
                    <button onClick={() => handleDelete(rph.id)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-2.5 rounded-xl text-xs transition border border-red-500/20 cursor-pointer">
                      Padam RPH
                    </button>
                  </div>
                  
                  {rph.Status_Id === '81' && <div className="text-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold py-2 px-2 rounded-xl text-[10px] uppercase mt-1">Status: SAH LULUS</div>}
                  {rph.Status_Id === '83' && <div className="text-center bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold py-2 px-2 rounded-xl text-[10px] uppercase mt-1">Status: MENUNGGU GURU</div>}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
