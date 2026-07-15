'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../lib/authProvider';
import { supabase } from '../../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function EditRph({ params }) {
  const unwrappedParams = use(params);
  const rphId = unwrappedParams.id;
  const { user, profile } = useAuth();
  const router = useRouter();

  const [subjectsList, setSubjectsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [curriculumData, setCurriculumData] = useState([]);
  const [weeksOptions, setWeeksOptions] = useState([]);
  const [academicYearList, setAcademicYearList] = useState([]);
  
  // Form selections
  const [subjectId, setSubjectId] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [classId, setClassId] = useState('');
  const [schoolWeek, setSchoolWeek] = useState('1');
  const [lessonDate, setLessonDate] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');

  // Curriculum slicers
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedTajuk, setSelectedTajuk] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [contentStandards, setContentStandards] = useState([]);
  const [learningStandards, setLearningStandards] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [newObjective, setNewObjective] = useState('');

  // Manual inputs for missing curriculum data
  const [fallbackContentStandard, setFallbackContentStandard] = useState('');
  const [fallbackLearningStandard, setFallbackLearningStandard] = useState('');

  // Activities, resources, reflections
  const [activitiesList, setActivitiesList] = useState([]);
  const [newActivity, setNewActivity] = useState('');
  const [teachingAids, setTeachingAids] = useState('');
  const [reflection, setReflection] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Fetch initial master lists and existing record
  useEffect(() => {
    if (user && rphId) {
      fetchMasterAndRecord();
    }
  }, [user, rphId]);

  const fetchMasterAndRecord = async () => {
    try {
      setIsLoadingRecord(true);
      
      // Fetch master lists
      const { data: subjects } = await supabase.from('master_subjects').select('*').eq('is_active', true).order('subject_name');
      const { data: classes } = await supabase.from('master_classes').select('*').eq('is_active', true).order('class_name');
      
      setSubjectsList(subjects || []);
      setClassesList(classes || []);

      const uniqueYears = Array.from(new Set((classes || []).map(c => c.academic_year)));
      setAcademicYearList(uniqueYears);

      // Fetch RPH record
      const { data: rph, error: rphErr } = await supabase
        .from('rph_submissions')
        .select('*, class:master_classes(*)')
        .eq('id', rphId)
        .single();

      if (rphErr) throw rphErr;

      // Populate form
      setSubjectId(rph.subject_id);
      if (rph.class) {
        setSelectedAcademicYear(rph.class.academic_year);
        setSelectedClassName(rph.class.class_name);
        setClassId(rph.class_id);
      }
      setLessonDate(rph.lesson_date);
      setStartTime(rph.start_time.slice(0, 5));
      setEndTime(rph.end_time.slice(0, 5));
      setSchoolWeek(String(rph.school_week));
      
      if (rph.content_standards && rph.content_standards.length > 0) {
        setContentStandards(rph.content_standards);
        setFallbackContentStandard(rph.content_standards[0]);
      }
      if (rph.learning_standards && rph.learning_standards.length > 0) {
        setLearningStandards(rph.learning_standards);
        setFallbackLearningStandard(rph.learning_standards[0]);
      }
      setObjectives(rph.objectives || []);
      setActivitiesList(rph.activities ? rph.activities.split('\n') : []);
      setTeachingAids(rph.teaching_aids || '');
      setReflection(rph.reflection || '');

    } catch (e) {
      console.error(e);
      showToast('Gagal memuatkan rekod RPH.', 'error');
    } finally {
      setIsLoadingRecord(false);
    }
  };

  // Load curriculum standards dynamically
  useEffect(() => {
    if (subjectId && selectedAcademicYear) {
      fetchCurriculum(subjectId, selectedAcademicYear);
    } else {
      setCurriculumData([]);
      setWeeksOptions([]);
    }
  }, [subjectId, selectedAcademicYear]);

  const fetchCurriculum = async (subId, year) => {
    const { data } = await supabase
      .from('curriculum_standards')
      .select('*')
      .eq('subject_id', subId)
      .eq('tahun', year);
    
    setCurriculumData(data || []);
    const uniqueWeeks = Array.from(new Set((data || []).map(item => item.minggu).filter(Boolean)));
    setWeeksOptions(uniqueWeeks);
  };

  // Resolve Class ID
  useEffect(() => {
    if (selectedAcademicYear && selectedClassName && classesList.length > 0) {
      const matched = classesList.find(
        c => c.academic_year === selectedAcademicYear && c.class_name === selectedClassName
      );
      if (matched) setClassId(matched.id);
    }
  }, [selectedAcademicYear, selectedClassName, classesList]);

  // Sync manual week value from standard week
  useEffect(() => {
    if (selectedWeek) {
      const match = selectedWeek.match(/\d+/);
      if (match) setSchoolWeek(match[0]);
    }
  }, [selectedWeek]);

  // Slicer lists filtered hierarchically
  const tajukOptions = Array.from(new Set(
    curriculumData.filter(item => item.minggu === selectedWeek).map(item => item.tajuk).filter(Boolean)
  ));

  const unitOptions = Array.from(new Set(
    curriculumData.filter(item => item.minggu === selectedWeek && item.tajuk === selectedTajuk).map(item => item.unit).filter(Boolean)
  ));

  const contentStandardsOptions = Array.from(new Set(
    curriculumData.filter(item => item.minggu === selectedWeek && item.tajuk === selectedTajuk && item.unit === selectedUnit).map(item => item.standard_kandungan).filter(Boolean)
  ));

  const learningStandardsOptions = curriculumData
    .filter(item => item.minggu === selectedWeek && item.tajuk === selectedTajuk && item.unit === selectedUnit && contentStandards.includes(item.standard_kandungan))
    .map(item => item.standard_pembelajaran)
    .filter(Boolean);

  const toggleContentStandard = (std) => {
    setContentStandards(prev => prev.includes(std) ? prev.filter(x => x !== std) : [...prev, std]);
  };

  const toggleLearningStandard = (std) => {
    setLearningStandards(prev => prev.includes(std) ? prev.filter(x => x !== std) : [...prev, std]);
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    setObjectives([...objectives, newObjective.trim()]);
    setNewObjective('');
  };

  const removeObjective = (index) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    if (!newActivity.trim()) return;
    setActivitiesList([...activitiesList, newActivity.trim()]);
    setNewActivity('');
  };

  const removeActivity = (index) => {
    setActivitiesList(activitiesList.filter((_, i) => i !== index));
  };

  // Time Clash Prevention check
  const checkTimeClash = async () => {
    const { data } = await supabase
      .from('rph_submissions')
      .select('id, start_time, end_time')
      .eq('teacher_id', user.id)
      .eq('lesson_date', lessonDate)
      .neq('id', rphId)
      .eq('is_deleted', false);

    if (!data) return false;

    const toMins = (t) => {
      const [h, m] = t.split(':');
      return parseInt(h) * 60 + parseInt(m);
    };

    const newStart = toMins(startTime);
    const newEnd = toMins(endTime);

    for (const record of data) {
      const existingStart = toMins(record.start_time);
      const existingEnd = toMins(record.end_time);
      if (newStart < existingEnd && newEnd > existingStart) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = async (e, targetStatus = 'Pending') => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!subjectId || !classId || !lessonDate || !startTime || !endTime) {
      showToast('Sila isi semua maklumat mandatori.', 'error');
      setIsSubmitting(false);
      return;
    }

    const finalContent = contentStandards.length > 0 ? contentStandards : [fallbackContentStandard];
    const finalLearning = learningStandards.length > 0 ? learningStandards : [fallbackLearningStandard];

    if (!finalContent[0] || !finalLearning[0]) {
      showToast('Sila pilih/isi Standard Kandungan & Pembelajaran.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (objectives.length === 0) {
      showToast('Sila isi sekurang-kurangnya satu Objektif Pembelajaran.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (activitiesList.length === 0) {
      showToast('Sila isi sekurang-kurangnya satu Aktiviti Pembelajaran.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (startTime >= endTime) {
      showToast('Waktu Mula mestilah lebih awal daripada Waktu Tamat.', 'error');
      setIsSubmitting(false);
      return;
    }

    const isClashing = await checkTimeClash();
    if (isClashing) {
      showToast('Ralat Pertindihan Waktu bagi tarikh dan masa ini.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: settingsData } = await supabase
        .from('school_settings')
        .select('active_session')
        .eq('id', 1)
        .single();
      const activeSession = settingsData?.active_session || '2026';

      const payload = {
        subject_id: subjectId,
        class_id: classId,
        lesson_date: lessonDate,
        start_time: startTime,
        end_time: endTime,
        school_week: parseInt(schoolWeek),
        academic_session: activeSession,
        content_standards: finalContent,
        learning_standards: finalLearning,
        objectives: objectives,
        activities: activitiesList.join('\n'),
        teaching_aids: teachingAids,
        reflection,
        status: targetStatus,
        updated_at: new Date().toISOString()
      };

      const { data: previous } = await supabase.from('rph_submissions').select('*').eq('id', rphId).single();

      const { error } = await supabase
        .from('rph_submissions')
        .update(payload)
        .eq('id', rphId);

      if (error) throw error;

      await supabase.from('rph_history').insert({
        rph_id: rphId,
        action_by: user.id,
        status_changed_to: targetStatus,
        remarks: 'Dikemaskini oleh Guru',
        previous_data_snapshot: previous
      });

      showToast(targetStatus === 'Draft' ? 'Draf RPH berjaya dikemaskini!' : 'RPH berjaya dihantar semula!');
      setTimeout(() => {
        router.push('/dashboard/queue');
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast('Ralat memproses RPH: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const classNameOptions = classesList
    .filter(c => c.academic_year === selectedAcademicYear)
    .map(c => c.class_name);

  const hoursList = ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const startHour = startTime ? startTime.split(':')[0] : '07';
  const startMin = startTime ? startTime.split(':')[1] : '00';
  const endHour = endTime ? endTime.split(':')[0] : '08';
  const endMin = endTime ? endTime.split(':')[1] : '00';

  const handleStartHourChange = (val) => { setStartTime(`${val}:${startMin}`); };
  const handleStartMinChange = (val) => { setStartTime(`${startHour}:${val}`); };
  const handleEndHourChange = (val) => { setEndTime(`${val}:${endMin}`); };
  const handleEndMinChange = (val) => { setEndTime(`${endHour}:${val}`); };

  if (!user || profile?.role === 'admin' || profile?.role === 'reviewer') {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 font-bold text-xs">
        Memverifikasi akses keselamatan...
      </div>
    );
  }

  return (
    <div className="flex-grow bg-transparent text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Toast */}
        {toast.message && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-xs font-bold text-white transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard/queue" 
            className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline gap-1 py-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Batal
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Kemaskini RPH</span>
        </div>

        {/* Form Container */}
        {isLoadingRecord ? (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 flex flex-col items-center justify-center">
            <div className="w-6 h-6 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
            <p className="mt-3 text-[10px] font-bold text-slate-400 animate-pulse">Memuatkan data RPH...</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-md space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-100">Edit Laporan RPH</h2>
              <p className="text-[10px] text-slate-400 font-medium">Ubahsuai dan hantar semula rekod pengajaran anda.</p>
            </div>

            <form className="space-y-4 text-xs font-semibold">
              {/* Subject Dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Mata Pelajaran *</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjectsList.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>
                  ))}
                </select>
              </div>

              {/* Grid for Class selections */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Tahun/Tingkatan *</label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => { setSelectedAcademicYear(e.target.value); setSelectedClassName(''); }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none"
                  >
                    <option value="">-- Pilih --</option>
                    {academicYearList.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Kelas *</label>
                  <select
                    value={selectedClassName}
                    onChange={(e) => setSelectedClassName(e.target.value)}
                    disabled={!selectedAcademicYear}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none disabled:opacity-40"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classNameOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lesson date & timings */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Tarikh Pengajaran *</label>
                <input
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none font-bold [color-scheme:dark]"
                />
              </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="block text-[10px] font-bold text-slate-500 uppercase">Waktu Mula *</label>
                   <div className="flex gap-1.5">
                     <select
                       value={startHour}
                       onChange={(e) => handleStartHourChange(e.target.value)}
                       className="w-1/2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-2 focus:outline-none font-bold text-center text-xs"
                     >
                       {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                     </select>
                     <span className="self-center text-slate-400 font-bold">:</span>
                     <select
                       value={startMin}
                       onChange={(e) => handleStartMinChange(e.target.value)}
                       className="w-1/2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-2 focus:outline-none font-bold text-center text-xs"
                     >
                       {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="block text-[10px] font-bold text-slate-500 uppercase">Waktu Tamat *</label>
                   <div className="flex gap-1.5">
                     <select
                       value={endHour}
                       onChange={(e) => handleEndHourChange(e.target.value)}
                       className="w-1/2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-2 focus:outline-none font-bold text-center text-xs"
                     >
                       {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                     </select>
                     <span className="self-center text-slate-400 font-bold">:</span>
                     <select
                       value={endMin}
                       onChange={(e) => handleEndMinChange(e.target.value)}
                       className="w-1/2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-2 focus:outline-none font-bold text-center text-xs"
                     >
                       {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                   </div>
                 </div>
               </div>


              {/* ================= CURRICULUM SELECTORS (DSKP) ================= */}
              {curriculumData.length > 0 ? (
                <div className="border-t border-slate-800/80 pt-4 space-y-4">
                  <span className="block text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Pemilihan DSKP Digital</span>
                  
                  {/* DSKP Minggu */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase">Minggu Rujukan DSKP</label>
                    <select
                      value={selectedWeek}
                      onChange={(e) => { setSelectedWeek(e.target.value); setSelectedTajuk(''); setSelectedUnit(''); setContentStandards([]); setLearningStandards([]); }}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2 px-3 focus:outline-none"
                    >
                      <option value="">-- Pilih Minggu --</option>
                      {weeksOptions.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>

                  {/* Tajuk */}
                  {selectedWeek && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Tajuk</label>
                      <select
                        value={selectedTajuk}
                        onChange={(e) => { setSelectedTajuk(e.target.value); setSelectedUnit(''); setContentStandards([]); setLearningStandards([]); }}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2 px-3 focus:outline-none"
                      >
                        <option value="">-- Pilih Tajuk --</option>
                        {tajukOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Unit */}
                  {selectedTajuk && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Unit</label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => { setSelectedUnit(e.target.value); setContentStandards([]); setLearningStandards([]); }}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2 px-3 focus:outline-none"
                      >
                        <option value="">-- Pilih Unit --</option>
                        {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Content Standards Multi-checkbox */}
                  {selectedUnit && contentStandardsOptions.length > 0 && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Standard Kandungan *</label>
                      <div className="space-y-2 bg-slate-800 p-3 rounded-xl border border-slate-700 max-h-[150px] overflow-y-auto">
                        {contentStandardsOptions.map(std => (
                          <label key={std} className="flex items-start space-x-2 text-[11px] text-slate-200 font-medium">
                            <input
                              type="checkbox"
                              checked={contentStandards.includes(std)}
                              onChange={() => toggleContentStandard(std)}
                              className="mt-0.5"
                            />
                            <span>{std}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Standards Multi-checkbox */}
                  {contentStandards.length > 0 && learningStandardsOptions.length > 0 && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Standard Pembelajaran *</label>
                      <div className="space-y-2 bg-slate-800 p-3 rounded-xl border border-slate-700 max-h-[150px] overflow-y-auto">
                        {learningStandardsOptions.map(std => (
                          <label key={std} className="flex items-start space-x-2 text-[11px] text-slate-200 font-medium">
                            <input
                              type="checkbox"
                              checked={learningStandards.includes(std)}
                              onChange={() => toggleLearningStandard(std)}
                              className="mt-0.5"
                            />
                            <span>{std}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                subjectId && (
                  <div className="border-t border-slate-800/80 pt-4 space-y-3">
                    <span className="block text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">Tiada DSKP digital / Maklumat Manual Sedia Ada</span>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Standard Kandungan Manual *</label>
                      <textarea
                        placeholder="Masukkan standard kandungan..."
                        value={fallbackContentStandard}
                        onChange={(e) => setFallbackContentStandard(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2 px-3 focus:outline-none min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Standard Pembelajaran Manual *</label>
                      <textarea
                        placeholder="Masukkan standard pembelajaran..."
                        value={fallbackLearningStandard}
                        onChange={(e) => setFallbackLearningStandard(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2 px-3 focus:outline-none min-h-[60px]"
                      />
                    </div>
                  </div>
                )
              )}

              {/* ================= OBJECTIVES LIST ================= */}
              <div className="border-t border-slate-800/80 pt-4 space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Objektif Pembelajaran *</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tambah objektif pembelajaran..."
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    className="flex-grow bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addObjective}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 rounded-xl text-xs shrink-0 cursor-pointer min-h-[40px]"
                  >
                    Tambah
                  </button>
                </div>

                {objectives.length > 0 && (
                  <ul className="space-y-1.5 bg-slate-800 p-3 rounded-xl border border-slate-700 text-[11px] font-medium text-slate-200">
                    {objectives.map((obj, index) => (
                      <li key={index} className="flex items-center justify-between gap-3">
                        <span>{index + 1}. {obj}</span>
                        <button
                          type="button"
                          onClick={() => removeObjective(index)}
                          className="text-rose-500 font-extrabold hover:underline"
                        >
                          Batal
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

               {/* Activities */}
               <div className="space-y-2 pt-2 border-t border-slate-800/80">
                 <label className="block text-[10px] font-bold text-slate-500 uppercase">Aktiviti Pembelajaran *</label>
                 
                 <div className="flex gap-2">
                   <input
                     type="text"
                     placeholder="Cth: Murid melakukan perbincangan berkumpulan..."
                     value={newActivity}
                     onChange={(e) => setNewActivity(e.target.value)}
                     className="flex-grow bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2 px-3 focus:outline-none text-xs"
                   />
                   <button
                     type="button"
                     onClick={addActivity}
                     className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 rounded-xl text-xs shrink-0 cursor-pointer min-h-[40px]"
                   >
                     Tambah
                   </button>
                 </div>

                 {activitiesList.length > 0 && (
                   <ul className="space-y-1.5 bg-slate-800 p-3 rounded-xl border border-slate-700 text-[11px] font-medium text-slate-200">
                     {activitiesList.map((act, index) => (
                       <li key={index} className="flex items-center justify-between gap-3">
                         <span>{index + 1}. {act}</span>
                         <button
                           type="button"
                           onClick={() => removeActivity(index)}
                           className="text-rose-500 font-extrabold hover:underline"
                         >
                           Batal
                         </button>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Bahan Bantu Mengajar (BBM)</label>
                <input
                  type="text"
                  placeholder="Projektor, Buku Teks, Slaid"
                  value={teachingAids}
                  onChange={(e) => setTeachingAids(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-3 px-3 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Refleksi Guru</label>
                <textarea
                  placeholder="Masukkan catatan refleksi selepas pengajaran..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2 px-3 focus:outline-none min-h-[60px]"
                />
              </div>

              {/* Form actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, 'Draft')}
                  className="flex-grow min-h-[48px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  Simpan Draf
                </button>
                
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, 'Pending')}
                  className="flex-grow min-h-[48px] bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kemaskini RPH'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
