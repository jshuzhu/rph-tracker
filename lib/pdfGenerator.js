import { jsPDF } from 'jspdf';
import { supabase } from './supabaseClient';

// Helper to convert logo image URL to base64 safely on client side
const loadLogoBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to convert logo to base64 for PDF:', e);
    return null;
  }
};

/**
 * Generates and downloads a structured grid PDF document matching the user's template.
 * @param {Object} rph - The RPH submission object.
 * @param {string} teacherName - The name of the teacher.
 */
export const generateRphPdf = async (rph, teacherName) => {
  // 1. Fetch School Settings dynamically from database
  let schoolName = 'RPH TRACKER';
  let schoolLogo = null;

  try {
    const { data: school } = await supabase
      .from('school_settings')
      .select('school_name, logo_url')
      .eq('id', 1)
      .single();
    
    if (school) {
      schoolName = school.school_name || 'RPH TRACKER';
      schoolLogo = await loadLogoBase64(school.logo_url);
    }
  } catch (e) {
    console.error('Error loading school metadata for PDF:', e);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  let y = 15;

  // 2. Official School Letterhead Header
  if (schoolLogo) {
    try {
      doc.addImage(schoolLogo, 'PNG', 20, y, 20, 20, undefined, 'FAST');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(schoolName.toUpperCase(), 45, y + 7);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('e-RPH Rancangan Pengajaran Harian digital', 45, y + 12);
    } catch (err) {
      console.error(err);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(schoolName.toUpperCase(), 20, y + 7);
    }
  } else {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolName.toUpperCase(), 20, y + 7);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('e-RPH Rancangan Pengajaran Harian digital', 20, y + 12);
  }

  y += 24;

  // Header bottom border line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(20, y, width - 20, y);
  
  y += 5;

  // Helper row drawer function
  const drawRow = (label, value) => {
    const splitVal = doc.splitTextToSize(value || '-', 115);
    const rowHeight = Math.max(8, splitVal.length * 4.5 + 4);
    
    // Page height limit check (A4 is 297mm)
    if (y + rowHeight > 275) {
      doc.addPage();
      y = 15;
    }
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    
    // Row rect
    doc.rect(20, y, 170, rowHeight);
    // Vertical divider line at X = 70
    doc.line(70, y, 70, y + rowHeight);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(label, 22, y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(splitVal, 72, y + 5);
    
    y += rowHeight;
  };

  // Compile grid values
  const subName = rph.subject?.subject_name ? `${rph.subject?.subject_code} - ${rph.subject?.subject_name}` : '-';
  const clsName = rph.class?.class_name ? `${rph.class?.academic_year} ${rph.class?.class_name}` : '-';
  const timeStr = rph.start_time && rph.end_time ? `${rph.start_time.slice(0, 5)} - ${rph.end_time.slice(0, 5)}` : '-';
  const contentStdsStr = rph.content_standards?.join(', ') || '-';
  const learningStdsStr = rph.learning_standards?.join(', ') || '-';
  const objectivesStr = rph.objectives?.join('\n') || '-';

  const createdDate = rph.created_at 
    ? new Date(rph.created_at).toISOString().split('T')[0] 
    : (rph.lesson_date || '-');

  // 3. Render Information Grid Rows
  drawRow('Mata Pelajaran/Subjek:', subName);
  drawRow('Disediakan Oleh:', teacherName || 'Guru');
  drawRow('Tarikh Disediakan:', createdDate);
  drawRow('Tarikh / Date:', rph.lesson_date);
  drawRow('Masa / Time:', timeStr);
  drawRow('Sesi Akademik:', rph.academic_session ? `Sesi ${rph.academic_session}` : '-');
  drawRow('Minggu Persekolahan:', rph.school_week ? `Minggu ${rph.school_week}` : '-');
  drawRow('Darjah / Class:', clsName);
  drawRow('Tajuk / Topic:', contentStdsStr);
  drawRow('Kemahiran / Skill:', learningStdsStr);
  drawRow('Objektif:', objectivesStr);

  // 4. Activities section
  const acts = rph.activities ? rph.activities.split('\n').filter(a => a.trim() !== '') : [];
  if (acts.length === 0) {
    acts.push(rph.activities || '-');
  }

  // Draw Activity Headers
  if (y + 14 > 275) { doc.addPage(); y = 15; }
  doc.rect(20, y, 170, 7);
  doc.setFont('Helvetica', 'bold');
  doc.text('Aktiviti', 22, y + 5);
  y += 7;

  doc.rect(20, y, 170, 7);
  doc.line(35, y, 35, y + 7);
  doc.text('BIL', 22, y + 5);
  doc.text('AKTIVITI', 37, y + 5);
  y += 7;

  acts.forEach((act, idx) => {
    const splitAct = doc.splitTextToSize(act, 150);
    const rowH = Math.max(7, splitAct.length * 4.5 + 3);
    
    if (y + rowH > 275) {
      doc.addPage();
      y = 15;
      // Re-draw headers on new page
      doc.rect(20, y, 170, 7);
      doc.line(35, y, 35, y + 7);
      doc.setFont('Helvetica', 'bold');
      doc.text('BIL', 22, y + 5);
      doc.text('AKTIVITI', 37, y + 5);
      y += 7;
    }
    
    doc.rect(20, y, 170, rowH);
    doc.line(35, y, 35, y + rowH);
    
    doc.setFont('Helvetica', 'normal');
    doc.text(`${idx + 1}.`, 22, y + 5);
    doc.text(splitAct, 37, y + 5);
    y += rowH;
  });

  // 5. Reflection section
  const splitRef = doc.splitTextToSize(rph.reflection || '-', 165);
  const refH = Math.max(15, splitRef.length * 4.5 + 6);
  
  if (y + refH > 275) { doc.addPage(); y = 15; }
  
  doc.rect(20, y, 170, refH);
  doc.setFont('Helvetica', 'bold');
  doc.text('Refleksi / Catatan:', 22, y + 5);
  doc.setFont('Helvetica', 'normal');
  doc.text(splitRef, 22, y + 10);
  
  y += refH + 6;

  // 6. Review / Approval signature stamps
  if (rph.reviewer_name) {
    const splitRemarks = doc.splitTextToSize(rph.reviewer_remarks || 'Diluluskan oleh Penyemak.', 165);
    const remarksH = Math.max(15, splitRemarks.length * 4.5 + 8);
    
    if (y + remarksH > 275) { doc.addPage(); y = 15; }
    
    const reviewLabel = rph.status === 'Approved' ? 'Diluluskan oleh' : 'Disemak oleh';
    const fullTitle = rph.reviewer_title === 'GB' ? 'Guru Besar' :
                     rph.reviewer_title === 'PKP' ? 'PK Pentadbiran' :
                     rph.reviewer_title === 'PK HEM' ? 'PK HEM' :
                     rph.reviewer_title === 'PK KO' || rph.reviewer_title === 'PK KO HEM' ? 'PK Kokurikulum' :
                     (rph.reviewer_title || 'Penyemak');

    doc.rect(20, y, 170, remarksH);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${reviewLabel}: ${fullTitle} ${rph.reviewer_name}`, 22, y + 5);
    doc.setFont('Helvetica', 'normal');
    doc.text(splitRemarks, 22, y + 10);
  }

  // Save the document
  const fileName = `E-RPH_${rph.subject?.subject_code || 'RPH'}_${rph.lesson_date}.pdf`;
  doc.save(fileName);
};
