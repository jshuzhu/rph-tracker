'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../../lib/firebase';
import { collection, updateDoc, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../../lib/authProvider';
import Link from 'next/link';

export default function EditRPH({ params }) {
    const toAmPm = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const parseAmPmTo24h = (timeStr) => {
    if (!timeStr) return '';
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      if (timeStr.includes('${')) return '08:00';
      return timeStr;
    }
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return timeStr;
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const formatTime = (mula, tamat) => {
    if (mula && tamat) return `${toAmPm(mula)} - ${toAmPm(tamat)}`;
    if (mula) return toAmPm(mula);
    return '';
  };

const router = useRouter();
  const { user } = useAuth();
  const { id } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  // Form Fields
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [subjectName, setSubjectName] = useState('');

  const [minggu, setMinggu] = useState('1');
  const [kelas, setKelas] = useState('');
  const [tarikh, setTarikh] = useState('');
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

  useEffect(() => {
    if (user) {
      loadSubjects();
      fetchRphData();
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

  async function loadSubjects() {
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      const subjs = snap.docs.map(d => ({ id: d.id, subject_id: d.id, label: d.data().label || d.data().name || d.id }));
      setSubjects(subjs);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRphData() {
    try {
      const d = await getDoc(doc(db, 'rph_submissions', id));
      if (!d.exists()) { router.push('/dashboard/queue'); return; }
      const rph = d.data();
      if (rph.User_Id !== user.id) { router.push('/dashboard/queue'); return; }

      setSubjectId(rph.Subject_Id || '');
      setSubjectName(rph.Subject_Name || '');
      setMinggu(rph.Minggu || '1');
      setKelas(rph.Kelas_Id || '');
      setTarikh(rph.Tarikh || '');
      setHari(rph.Hari || '');
      if (rph.Masa) {
        const parts = rph.Masa.split(' - ');
        setMasaMula(parseAmPmTo24h(parts[0]) || '');
        setMasaTamat(parseAmPmTo24h(parts[1]) || '');
      }
      setObjektif(rph.Objektif_Pembelajaran || rph.OBJEKTIF || '');
      setKriteria(rph.Kriteria_Kejayaan || rph.KRITERIA || '');
      setAktivitiPermulaan(rph.Aktiviti_Permulaan || '');
      setAktivitiUtama(rph.Aktiviti_Utama || rph.Ulasan || '');
      setAbm(rph.Alat_Bantu_mengajar || '');
      setAktivitiPenutup(rph.Aktiviti_Penutup || '');
      setRefleksi(rph.Refleksi || '');

      if (rph.Subject_Id) {
        setIsLoadingTajuk(true);
        const q = query(collection(db, 'tajuk'), where('subject_id', '==', rph.Subject_Id));
        const snap = await getDocs(q);
        const list = snap.docs.map(d2 => ({ doc_id: d2.id, ...d2.data() }));
        setTajukList(list);
        if (rph.TAJUK) {
          const idx = list.findIndex(t => t.TAJUK === rph.TAJUK);
          if (idx !== -1) setSelectedTajukIdx(String(idx));
        }
        setIsLoadingTajuk(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubjectChange = async (e) => {
    const val = e.target.value;
    setSubjectId(val);
    const selected = subjects.find(s => s.subject_id === val);
    if (selected) setSubjectName(selected.label);
    else setSubjectName('');

    setSelectedTajukIdx('');
    if (val) {
      setIsLoadingTajuk(true);
      try {
        const q = query(collection(db, 'tajuk'), where('subject_id', '==', val));
        const snap = await getDocs(q);
        setTajukList(snap.docs.map(d => ({ doc_id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      finally { setIsLoadingTajuk(false); }
    } else {
      setTajukList([]);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (isDraft) setIsDrafting(true); else setIsSubmitting(true);

    try {
      const selectedTajuk = tajukList[selectedTajukIdx] || {};
      
      const payload = {
        Status_Id: isDraft ? '82' : '80',
        Subject_Id: subjectId,
        Subject_Name: subjectName,
        Minggu: minggu,
        Kelas_Id: kelas,
        Tarikh: tarikh,
        Hari: hari,
        Masa: formatMasa(masaMula, masaTamat),
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

      await updateDoc(doc(db, 'rph_submissions', id), payload);
      alert(isDraft ? 'Draf berjaya disimpan!' : 'RPH berjaya dihantar untuk semakan!');
      router.push('/dashboard/queue');
    } catch (e) {
      alert('Ralat mengemaskini RPH');
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setIsDrafting(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400 animate-pulse">Memuatkan RPH...</div>;

  return (
    <div className="flex-grow bg-slate-950 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Kemaskini RPH</h1>
          <Link href={`/rph/${id}`} className="text-sm font-bold text-slate-400 hover:text-white transition">← Batal</Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
          
          {/* BAHAGIAN A: MAKLUMAT ASAS */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2">A. Maklumat Asas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mata Pelajaran</label>
                <select 
                  value={subjectId} 
                  onChange={handleSubjectChange} 
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Hari (Auto)</label>
                <input 
                  type="text" 
                  value={hari}
                  readOnly
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-400"
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
                disabled={!subjectId || isLoadingTajuk}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">{isLoadingTajuk ? 'Memuatkan...' : !subjectId ? 'Pilih Subjek Dahulu' : '-- Pilih Tajuk --'}</option>
                {tajukList.map((t, idx) => (
                  <option key={t.doc_id} value={idx}>
                    {t.TEMA || t.KEMAHIRAN} — {t.TAJUK} ({t.SK})
                  </option>
                ))}
              </select>
            </div>

            {selectedTajukIdx !== '' && tajukList[selectedTajukIdx] && (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
                <p><span className="text-slate-400 font-bold">TEMA:</span> {tajukList[selectedTajukIdx].TEMA || tajukList[selectedTajukIdx].KEMAHIRAN || '-'}</p>
                <p><span className="text-slate-400 font-bold">TAJUK:</span> {tajukList[selectedTajukIdx].TAJUK || '-'}</p>
                <p><span className="text-slate-400 font-bold">SK:</span> {tajukList[selectedTajukIdx].SK || '-'}</p>
                <p><span className="text-slate-400 font-bold">SP:</span> {tajukList[selectedTajukIdx].SP || '-'}</p>
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
                <textarea value={aktivitiPermulaan} onChange={e => setAktivitiPermulaan(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[80px] focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Aktiviti Utama</label>
                <textarea value={aktivitiUtama} onChange={e => setAktivitiUtama(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[120px] focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Alat Bantu Mengajar (ABM)</label>
                <input type="text" value={abm} onChange={e => setAbm(e.target.value)} placeholder="Contoh: Buku Teks, LCD, Papan Putih" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Aktiviti Penutup</label>
                <textarea value={aktivitiPenutup} onChange={e => setAktivitiPenutup(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[80px] focus:border-rose-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Refleksi / Catatan</label>
                <textarea value={refleksi} onChange={e => setRefleksi(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[80px] focus:border-rose-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-slate-800">
            <button 
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || isDrafting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition disabled:opacity-50"
            >
              {isDrafting ? 'Menyimpan...' : 'Simpan Draf'}
            </button>
            <button 
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || isDrafting || !subjectId || !kelas || !tarikh}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {isSubmitting ? 'Mengemaskini...' : 'Hantar RPH'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}