'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/authProvider';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateRphPdf } from '../../../lib/pdfGenerator';
import Link from 'next/link';

export default function RphViewPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { user, profile } = useAuth();

  const [rph, setRph] = useState(null);
  const [teacher, setTeacher] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchRph = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'rph_submissions', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRph(data);

          if (data.User_Id) {
            const uDoc = await getDoc(doc(db, 'users', data.User_Id));
            if (uDoc.exists()) {
              setTeacher(uDoc.data().fullName || uDoc.data().full_name || uDoc.data().email || '');
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchRph();
  }, [id]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const teacherName = teacher || profile?.fullName || profile?.full_name || user?.email || '';
      await generateRphPdf(rph, teacherName);
    } catch (e) {
      alert('Gagal menjana PDF. Sila cuba lagi.');
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400 animate-pulse">Memuat data RPH...</div>;
  if (!rph) return <div className="p-12 text-center text-rose-400 font-bold">RPH tidak dijumpai.</div>;

  const statusConfig = {
    '80': { label: 'Menunggu Semakan', color: 'text-amber-400 bg-amber-900/20 border-amber-800/30' },
    '81': { label: 'Diluluskan', color: 'text-emerald-400 bg-emerald-900/20 border-emerald-800/30' },
    '82': { label: 'Draf', color: 'text-slate-400 bg-slate-800/50 border-slate-700/30' },
    '83': { label: 'Perlu Pembetulan', color: 'text-rose-400 bg-rose-900/20 border-rose-800/30' },
  };
  const status = statusConfig[rph.Status_Id] || statusConfig['80'];

  const isTeacher = profile?.role === 'teacher';
  const canEdit = isTeacher && (rph.Status_Id === '82' || rph.Status_Id === '83');

  const Field = ({ label, value, span = false }) => (
    <div className={`bg-slate-800/50 border border-slate-700/40 p-3 rounded-xl ${span ? 'col-span-2' : ''}`}>
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      <p className="text-sm text-slate-200 font-medium whitespace-pre-wrap">{value || '-'}</p>
    </div>
  );

  return (
    <div className="flex-grow bg-slate-950 text-slate-100 py-6 px-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-extrabold text-white">Buku Persediaan Mengajar (E-RPH)</h1>
              <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-lg border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer"
              >
                {isGeneratingPdf ? 'Menjana PDF...' : 'Muat Turun PDF'}
              </button>
              {canEdit && (
                <Link href={`/rph/${id}/edit`} className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 font-bold rounded-xl transition">
                  Kemaskini
                </Link>
              )}
              <button onClick={() => router.back()} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl transition cursor-pointer">
                Kembali
              </button>
            </div>
          </div>
        </div>

        {/* Reviewer Audit Box */}
        {rph.Reviewer_Name && (
          <div className={`border p-5 rounded-2xl shadow-xl space-y-2 ${rph.Status_Id === '81' ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-rose-950/20 border-rose-900/40'}`}>
            <h2 className={`text-xs font-extrabold uppercase tracking-widest ${rph.Status_Id === '81' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {rph.Status_Id === '81' ? ' Diluluskan oleh Pentadbir' : ' Dikembalikan untuk Pembetulan'}
            </h2>
            <div className="text-xs text-slate-300 space-y-1">
              <p><strong className="text-slate-400">Disemak Oleh:</strong> {rph.Reviewer_Title && `${rph.Reviewer_Title} `}{rph.Reviewer_Name}</p>
              {rph.TIMESTAMP_UPDATED && (
                <p><strong className="text-slate-400">Tarikh:</strong> {new Date(rph.TIMESTAMP_UPDATED).toLocaleString('ms-MY')}</p>
              )}
              {rph.Reviewer_Remarks && (
                <div className="mt-3 bg-rose-950/40 border border-rose-900/50 p-3 rounded-xl">
                  <strong className="text-rose-400 block mb-1 text-[10px] uppercase tracking-wider">Ulasan Penyemak:</strong>
                  <p className="text-rose-200 italic">"{rph.Reviewer_Remarks}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section A: Maklumat Asas */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2">A. Maklumat Asas</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Guru" value={teacher || rph.Teacher_Name} />
            <Field label="Mata Pelajaran" value={rph.Subject_Name || rph.Subject_Id} />
            <Field label="Kelas" value={rph.Kelas_Id} />
            <Field label="Minggu" value={rph.Minggu ? `Minggu ${rph.Minggu}` : null} />
            <Field label="Tarikh" value={rph.Tarikh} />
            <Field label="Hari" value={rph.Hari} />
            <Field label="Masa" value={rph.Masa} span />
          </div>
        </div>

        {/* Section B: DSKP */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2">B. Standard Kandungan (DSKP)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tema / Kemahiran" value={rph.TEMA} />
            <Field label="Tajuk" value={rph.TAJUK} />
            <Field label="Standard Kandungan (SK)" value={rph.SK} span />
            <Field label="Standard Pembelajaran (SP)" value={rph.SP} span />
          </div>
        </div>

        {/* Section C: Objektif & Kriteria */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-extrabold text-purple-400 uppercase tracking-widest border-b border-slate-800 pb-2">C. Objektif & Kriteria Kejayaan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Objektif Pembelajaran" value={rph.Objektif_Pembelajaran} />
            <Field label="Kriteria Kejayaan" value={rph.Kriteria_Kejayaan} />
          </div>
        </div>

        {/* Section D: Rangka Pengajaran */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-extrabold text-rose-400 uppercase tracking-widest border-b border-slate-800 pb-2">D. Rangka Pengajaran</h2>
          <div className="space-y-3">
            <Field label="Aktiviti Permulaan" value={rph.Aktiviti_Permulaan} span />
            <Field label="Aktiviti Utama" value={rph.Aktiviti_Utama || rph.Ulasan} span />
            <Field label="Alat Bantu Mengajar (ABM)" value={rph.Alat_Bantu_mengajar} span />
            <Field label="Aktiviti Penutup" value={rph.Aktiviti_Penutup} span />
            <Field label="Refleksi / Catatan" value={rph.Refleksi} span />
          </div>
        </div>

      </div>
    </div>
  );
}

