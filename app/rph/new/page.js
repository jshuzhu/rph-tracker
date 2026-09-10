'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../lib/firebase';
import { collection, addDoc, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../lib/authProvider';
import { calculateActiveWeek } from '../../../lib/dateUtils';
import Link from 'next/link';

export default function NewRPH() {
  const toAmPm = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  const formatMasa = (mula, tamat) => {
    if (mula && tamat) return `${toAmPm(mula)} - ${toAmPm(tamat)}`;
    if (mula) return toAmPm(mula);
    return '';
  };
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  // Form Fields
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  const [minggu, setMinggu] = useState('1');
  const [kelas, setKelas] = useState('');
  const [tarikh, setTarikh] = useState(new Date().toISOString().split('T')[0]);
  const [hari, setHari] = useState('');
  const [masaMula, setMasaMula] = useState('');
  const [masaTamat, setMasaTamat] = useState('');

  // DSKP
  const [tajukList, setTajukList] = useState([]);
  const [selectedTajukIdx, setSelectedTajukIdx] = useState('');
  const [isLoadingTajuk, setIsLoadingTajuk] = useState(false);

  // Content
  const [objektif, setObjektif] = useState('');
  const [kriteria, setKriteria] = useState('');
  const [aktivitiPermulaan, setAktivitiPermulaan] = useState('');
  const [aktivitiUtama, setAktivitiUtama] = useState('');
  const [abm, setAbm] = useState('');
  const [aktivitiPenutup, setAktivitiPenutup] = useState('');
  const [refleksi, setRefleksi] = useState('');
  const [sessionName, setSessionName] = useState('');

  // Initial Data Load
  useEffect(() => {
    if (user) {
      loadTeacherSubjects();
      fetchGlobalWeek();
    }
  }, [user]);

  // Auto set Hari when Tarikh changes
  useEffect(() => {
    if (tarikh) {
      const d = new Date(tarikh);
      const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
      setHari(days[d.getDay()]);
    }
  }, [tarikh]);

  // When subject changes, fetch its Tajuk list
  useEffect(() => {
    if (subjectId) {
      const selectedSubj = subjects.find(s => s.subject_id === subjectId);
      if (selectedSubj) setSubjectName(selectedSubj.label);
      
      const loadTajuk = async () => {
        setIsLoadingTajuk(true);
        try {
          const q = query(collection(db, 'tajuk'), where('subject_id', '==', subjectId));
          const snap = await getDocs(q);
          setTajukList(snap.docs.map(doc => ({ doc_id: doc.id, ...doc.data() })));
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingTajuk(false);
        }
      };
      loadTajuk();
    } else {
      setTajukList([]);
      setSubjectName('');
    }
    setSelectedTajukIdx('');
  }, [subjectId]);

  async function fetchGlobalWeek() {
    try {
      const sDoc = await getDoc(doc(db, 'school_settings', '1'));
      if (sDoc.exists() && sDoc.data().session_start_date) {
        setSessionName(sDoc.data().session_name || '');
        setMinggu(String(calculateActiveWeek(sDoc.data().session_start_date, sDoc.data().session_end_date)));
      }
    } catch (e) {}
  };

  async function loadTeacherSubjects() {
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      const subjs = snap.docs.map(d => ({ id: d.id, subject_id: d.id, label: d.data().label || d.data().name || d.id, ...d.data() }));
      setSubjects(subjs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSubjects(false);
    }
  };


  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    if (!isDraft) {
      if (!subjectId || !kelas || !tarikh || !objektif || !kriteria || !aktivitiUtama) {
        alert('Sila lengkapkan maklumat penting: Subjek, Kelas, Tarikh, Objektif, Kriteria Kejayaan, dan Aktiviti Utama sebelum menghantar.');
        return;
      }
    }

    if (isDraft) setIsDrafting(true); else setIsSubmitting(true);


    try {
      const selectedTajuk = tajukList[selectedTajukIdx] || {};
      
      const payload = {
        User_Id: user.id,
        Teacher_Name: profile?.fullName || profile?.full_name || user.email,
        Status_Id: isDraft ? '82' : '80', // 82=Draft, 80=Send
        Session_Name: sessionName,
        
        Subject_Id: subjectId,
        Subject_Name: subjectName,
        Minggu: minggu,
        Kelas_Id: kelas,
        Tarikh: tarikh,
        Hari: hari,
        Masa: formatMasa(masaMula, masaTamat),
        
        KEMAHIRAN_ID: selectedTajuk.KEMAHIRAN_ID || '',
        TERAS_id: selectedTajuk.TERAS_id || '',
        TEMA: selectedTajuk.TEMA || selectedTajuk.KEMAHIRAN || '',
        TAJUK: selectedTajuk.TAJUK || '',
        SK: selectedTajuk.SK || '',
        SP: selectedTajuk.SP || '',
        
        Objektif_Pembelajaran: objektif,
        Kriteria_Kejayaan: kriteria,
        Aktiviti_Permulaan: aktivitiPermulaan,
        Aktiviti_Utama: aktivitiUtama,
        Alat_Bantu_mengajar: abm,
        Aktiviti_Penutup: aktivitiPenutup,
        Refleksi: refleksi,

        TIMPESTAMP_SEND: new Date().toISOString(),
      };

      await addDoc(collection(db, 'rph_submissions'), payload);
      alert(isDraft ? 'Draf berjaya disimpan!' : 'RPH berjaya dihantar untuk semakan!');
      router.push('/dashboard/queue');
    } catch (e) {
      alert('Ralat menyimpan RPH');
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setIsDrafting(false);
    }
  };

  return (
    <div className="flex-grow bg-slate-950 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Cipta RPH Baharu</h1>
          <Link href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-white transition">← Kembali</Link>
        </div>

        <form className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
          
          {/* BAHAGIAN A: MAKLUMAT ASAS */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2">A. Maklumat Asas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mata Pelajaran</label>
                <select 
                  value={subjectId} 
                  onChange={e => setSubjectId(e.target.value)} 
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">{isLoadingSubjects ? 'Memuatkan...' : '-- Pilih Mata Pelajaran --'}</option>
                  {subjects.map(s => <option key={s.id} value={s.subject_id}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Minggu</label>
                <select 
                  value={minggu} 
                  onChange={e => setMinggu(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {Array.from({ length: 42 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Minggu {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Kelas</label>
                <input 
                  type="text" 
                  value={kelas}
                  onChange={e => setKelas(e.target.value)}
                  placeholder="Contoh: 1 Mawar"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Masa</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={masaMula}
                    onChange={e => setMasaMula(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold text-xs shrink-0">hingga</span>
                  <input 
                    type="time" 
                    value={masaTamat}
                    onChange={e => setMasaTamat(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Tarikh</label>
                <input 
                  type="date" 
                  value={tarikh}
                  onChange={e => setTarikh(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Hari</label>
                <input 
                  type="text" 
                  value={hari}
                  onChange={e => setHari(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

            </div>
          </div>

          {/* BAHAGIAN B: STANDARD KANDUNGAN */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2">B. Standard Kandungan (DSKP)</h2>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Topik / DSKP</label>
              <select 
                value={selectedTajukIdx} 
                onChange={e => setSelectedTajukIdx(e.target.value)} 
                disabled={!subjectId}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">{isLoadingTajuk ? 'Memuatkan...' : !subjectId ? 'Pilih Subjek Dahulu' : '-- Sila Pilih Tajuk --'}</option>
                {tajukList.map((t, idx) => (
                  <option key={t.doc_id} value={idx}>
                    {t.TEMA || t.KEMAHIRAN} - {t.TAJUK} ({t.SK})
                  </option>
                ))}
              </select>
            </div>

            {selectedTajukIdx !== '' && (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                <p className="text-xs"><strong className="text-slate-400">TEMA / KEMAHIRAN:</strong> {tajukList[selectedTajukIdx].TEMA || tajukList[selectedTajukIdx].KEMAHIRAN || '-'}</p>
                <p className="text-xs"><strong className="text-slate-400">TAJUK:</strong> {tajukList[selectedTajukIdx].TAJUK || '-'}</p>
                <p className="text-xs"><strong className="text-slate-400">STANDARD KANDUNGAN:</strong> {tajukList[selectedTajukIdx].SK || '-'}</p>
                <p className="text-xs"><strong className="text-slate-400">STANDARD PEMBELAJARAN:</strong> {tajukList[selectedTajukIdx].SP || '-'}</p>
              </div>
            )}
          </div>

          {/* BAHAGIAN C: OBJEKTIF & KRITERIA */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-purple-400 uppercase tracking-widest border-b border-slate-800 pb-2">C. Objektif & Kriteria Kejayaan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Objektif Pembelajaran</label>
                <textarea 
                  value={objektif} 
                  onChange={e => setObjektif(e.target.value)} 
                  placeholder="Pada akhir pembelajaran, murid dapat..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[100px] focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Kriteria Kejayaan</label>
                <textarea 
                  value={kriteria} 
                  onChange={e => setKriteria(e.target.value)} 
                  placeholder="Murid dianggap berjaya sekiranya..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[100px] focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* BAHAGIAN D: RANGKA PENGAJARAN */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-rose-400 uppercase tracking-widest border-b border-slate-800 pb-2">D. Rangka Pengajaran</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Aktiviti Permulaan</label>
                <textarea 
                  value={aktivitiPermulaan} 
                  onChange={e => setAktivitiPermulaan(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[80px] focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Aktiviti Utama</label>
                <textarea 
                  value={aktivitiUtama} 
                  onChange={e => setAktivitiUtama(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[120px] focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Alat Bantu Mengajar (ABM)</label>
                <input 
                  type="text" 
                  value={abm} 
                  onChange={e => setAbm(e.target.value)} 
                  placeholder="Contoh: Buku Teks, Papan Putih, LCD"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Aktiviti Penutup</label>
                <textarea 
                  value={aktivitiPenutup} 
                  onChange={e => setAktivitiPenutup(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[80px] focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Refleksi / Catatan</label>
                <textarea 
                  value={refleksi} 
                  onChange={e => setRefleksi(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[80px] focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-slate-800">
            <button 
              type="button"
              onClick={e => handleSubmit(e, true)}
              disabled={isSubmitting || isDrafting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition disabled:opacity-50"
            >
              {isDrafting ? 'Menyimpan...' : 'Simpan Draf'}
            </button>
            <button 
              type="button"
              onClick={e => handleSubmit(e, false)}
              disabled={isSubmitting || isDrafting || !subjectId || !kelas || !tarikh}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {isSubmitting ? 'Menghantar...' : 'Hantar RPH'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
