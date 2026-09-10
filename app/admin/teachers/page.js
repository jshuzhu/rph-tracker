'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../lib/authProvider';
import { useRouter } from 'next/navigation';

export default function AdminTeachers() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (profile.role !== 'admin') router.push('/');
      else fetchTeachers();
    }
  }, [user, profile]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (id, newRole) => {
    if(!confirm(`Tukar peranan pengguna ini kepada ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole });
      alert('Berjaya dikemaskini.');
      fetchTeachers();
    } catch(e) {
      alert('Gagal mengemaskini.');
    }
  };

  const deleteUser = async (id) => {
    if(!confirm('Padam pengguna ini? PERHATIAN: Ini hanya memadam profil dari sistem, bukan akaun Authentication Firebase sepenuhnya.')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      alert('Berjaya dipadam.');
      fetchTeachers();
    } catch(e) {
      alert('Gagal memadam.');
    }
  };

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold text-white">Urus Pengguna</h1>
            <p className="text-xs text-slate-400">Senarai guru, penyemak, dan pentadbir sistem.</p>
          </div>
          <Link href="/admin/dashboard" className="text-rose-400 hover:text-rose-300 text-xs font-bold transition">
            Kembali
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse">Memuatkan pengguna...</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-xs uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Peranan</th>
                    <th className="px-6 py-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-bold text-white">{t.fullName || 'Tiada Nama'}</td>
                      <td className="px-6 py-4 text-xs">{t.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={t.role || 'teacher'}
                          onChange={e => updateRole(t.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-xs rounded-lg p-1.5 focus:outline-none"
                        >
                          <option value="admin">Pentadbir (Admin)</option>
                          <option value="reviewer">Penyemak</option>
                          <option value="teacher">Guru</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => deleteUser(t.id)} className="text-rose-500 hover:text-rose-400 text-xs font-bold">Padam</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
