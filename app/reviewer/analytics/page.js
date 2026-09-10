'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../../lib/authProvider';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function ReviewerAnalytics() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [allRph, setAllRph] = useState([]);
  const [teachersMap, setTeachersMap] = useState({});
  const [subjectsMap, setSubjectsMap] = useState({});

  const [filterTeacher, setFilterTeacher] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterWeek, setFilterWeek] = useState('All');
  const [filterSession, setFilterSession] = useState('All');
  const [sessionsMap, setSessionsMap] = useState([]);

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [teacherStats, setTeacherStats] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'reviewer') router.push('/');
      else fetchInitialData();
    }
  }, [user, profile]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Subjects
      const sSnap = await getDocs(collection(db, 'subjects'));
      const sMap = {};
      sSnap.forEach(d => { sMap[d.id] = d.data().label; });
      setSubjectsMap(sMap);

      // Fetch Users
      const uSnap = await getDocs(collection(db, 'users'));
      const tMap = {};
      uSnap.forEach(d => { tMap[d.id] = d.data().fullName || d.data().email; });
      setTeachersMap(tMap);

     
      // Fetch system settings for default session
      let currentSesi = '';
      const sDoc = await getDoc(doc(db, 'school_settings', '1'));
      if (sDoc.exists()) {
        currentSesi = sDoc.data().session_name || '';
        setFilterSession(currentSesi || 'All');
      }

      // Fetch RPH
      const q = query(collection(db, 'rph_submissions'), orderBy('TIMPESTAMP_SEND', 'desc'), limit(2000));
      const snap = await getDocs(q);
      let subs = snap.docs.map(doc => doc.data());
      subs = subs.filter(r => r.Status_Id !== '82'); // exclude drafts

      const sessions = new Set();
      if (currentSesi) sessions.add(currentSesi);
      subs.forEach(r => {
        if (r.Session_Name) sessions.add(r.Session_Name);
      });
      setSessionsMap(Array.from(sessions).sort());
      
      setAllRph(subs);


    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Re-compute stats whenever filters or allRph changes
    
    let subs = allRph;

    if (filterSession !== 'All') {
      subs = subs.filter(r => r.Session_Name === filterSession || (!r.Session_Name && filterSession === sessionsMap[0]));
    }


    if (filterTeacher !== 'All') {
      subs = subs.filter(r => r.User_Id === filterTeacher);
    }
    if (filterSubject !== 'All') {
      subs = subs.filter(r => r.Subject_Id === filterSubject);
    }
    if (filterWeek !== 'All') {
      subs = subs.filter(r => String(r.Minggu) === String(filterWeek));
    }

    let total = subs.length;
    let approved = subs.filter(r => r.Status_Id === '81').length;
    let pending = subs.filter(r => r.Status_Id === '80').length;
    let rejected = subs.filter(r => r.Status_Id === '83').length;

    setStats({ total, approved, pending, rejected });

    setStatusData([
      { name: 'Lulus', value: approved, color: '#10b981' },
      { name: 'Menunggu', value: pending, color: '#f59e0b' },
      { name: 'Ditolak', value: rejected, color: '#f43f5e' }
    ].filter(d => d.value > 0));

    const tCounts = {};
    subs.forEach(r => {
      const tId = r.User_Id;
      if (!tCounts[tId]) tCounts[tId] = { id: tId, name: teachersMap[tId] || 'Guru Tidak Diketahui', total: 0, approved: 0, pending: 0, rejected: 0 };
      tCounts[tId].total++;
      if (r.Status_Id === '81') tCounts[tId].approved++;
      if (r.Status_Id === '80') tCounts[tId].pending++;
      if (r.Status_Id === '83') tCounts[tId].rejected++;
    });
    
    const tArray = Object.values(tCounts).sort((a,b) => b.total - a.total);
    setTeacherStats(tArray);

  }, [allRph, filterTeacher, filterSubject, filterWeek, filterSession, sessionsMap, teachersMap]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
          <p className="text-white font-bold mb-1">{payload[0].name}</p>
          <p className="text-slate-300">Jumlah: <span className="font-extrabold text-blue-400">{payload[0].value}</span> RPH</p>
        </div>
      );
    }
    return null;
  };

  if (!mounted) return <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4 flex items-center justify-center"><div className="animate-pulse text-slate-500 text-sm font-bold">Memuatkan antaramuka...</div></div>;

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold text-white">Analisis & Prestasi Guru</h1>
            <p className="text-xs text-slate-400 mt-1">Laporan penuh penghantaran RPH mengikut status dan senarai guru.</p>
          </div>
          <Link href="/reviewer/dashboard" className="text-blue-400 hover:text-blue-300 text-xs font-bold transition bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-900/30 whitespace-nowrap">
            Kembali
          </Link>
        </div>

        {/* FILTERS */}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select 
            value={filterSession} 
            onChange={(e) => setFilterSession(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">Semua Sesi</option>
            {sessionsMap.map(s => (
              <option key={s} value={s}>Sesi {s}</option>
            ))}
          </select>

          <select 

            value={filterTeacher} 
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">Semua Guru</option>
            {Object.entries(teachersMap).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          <select 
            value={filterSubject} 
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">Semua Subjek</option>
            {Object.entries(subjectsMap).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

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
          <div className="text-center py-20 text-xs font-bold text-slate-400 animate-pulse">Menjana laporan dan carta...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-center shadow-lg">
                <div className="text-4xl font-extrabold text-slate-200">{stats.total}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-widest">RPH Terkumpul</div>
              </div>
              <div className="bg-emerald-950/30 p-5 rounded-2xl border border-emerald-900/30 text-center shadow-lg">
                <div className="text-4xl font-extrabold text-emerald-500">{stats.approved}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-600/80 mt-2 tracking-widest">Lulus</div>
              </div>
              <div className="bg-amber-950/30 p-5 rounded-2xl border border-amber-900/30 text-center shadow-lg">
                <div className="text-4xl font-extrabold text-amber-500">{stats.pending}</div>
                <div className="text-[10px] uppercase font-bold text-amber-600/80 mt-2 tracking-widest">Menunggu Semakan</div>
              </div>
              <div className="bg-rose-950/30 p-5 rounded-2xl border border-rose-900/30 text-center shadow-lg">
                <div className="text-4xl font-extrabold text-rose-500">{stats.rejected}</div>
                <div className="text-[10px] uppercase font-bold text-rose-600/80 mt-2 tracking-widest">Perlu Pembetulan</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Pie Chart Section */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center lg:col-span-1">
                <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest mb-6 w-full text-center">Taburan Status RPH</h2>
                {statusData.length > 0 ? (
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-10">Tiada data untuk dipaparkan</div>
                )}
              </div>

              {/* Bar Chart Section */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl lg:col-span-2">
                <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest mb-6">Prestasi Guru Teratas</h2>
                {teacherStats.length > 0 ? (
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teacherStats.slice(0,5)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tick={{fill: '#94a3b8'}} />
                        <YAxis stroke="#64748b" fontSize={10} tick={{fill: '#94a3b8'}} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b'}} />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Jumlah RPH" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-10 text-center">Tiada data untuk dipaparkan</div>
                )}
              </div>
            </div>

            {/* Detailed Table Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-6">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">Laporan Terperinci Guru</h2>
              </div>
              <div className="overflow-x-auto">
                {teacherStats.length > 0 ? (
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead className="bg-slate-950/50 text-slate-300 uppercase text-[10px]">
                      <tr>
                        <th className="px-6 py-4 font-bold border-b border-slate-800">Nama Guru</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-800 text-center text-blue-400">Jumlah</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-800 text-center text-emerald-500">Lulus</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-800 text-center text-amber-500">Menunggu</th>
                        <th className="px-6 py-4 font-bold border-b border-slate-800 text-center text-rose-500">Ditolak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherStats.map((t, idx) => (
                        <tr key={t.id} className={`hover:bg-slate-800/50 transition ${idx !== teacherStats.length - 1 ? 'border-b border-slate-800/50' : ''}`}>
                          <td className="px-6 py-4 font-bold text-slate-300">{t.name}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-blue-400">{t.total}</td>
                          <td className="px-6 py-4 text-center text-emerald-500">{t.approved}</td>
                          <td className="px-6 py-4 text-center text-amber-500">{t.pending}</td>
                          <td className="px-6 py-4 text-center text-rose-500">{t.rejected}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">Tiada guru yang menghantar RPH untuk tapisan ini.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

