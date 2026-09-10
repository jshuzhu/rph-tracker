import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export const generateRphPdf = async (rph, teacherName) => {
  let schoolLogo = null;
  try {
    const sDoc = await getDoc(doc(db, 'school_settings', '1'));
    if (sDoc.exists() && sDoc.data().logo_url) {
      schoolLogo = await loadLogoBase64(sDoc.data().logo_url);
    }
  } catch (e) {
    console.warn('Could not fetch school settings:', e);
  }

  const docPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Colors based on the uploaded image
  const lightBlue = [190, 230, 240];
  const lightPurple = [210, 200, 230];
  const peach = [250, 220, 195];

  // Data processing — preserve colons for time format (08:00 - 09:00)
  const getVal = (val) => val ? String(val).replace(/[^\x20-\x7E\n]/g, '').trim() : '';
  const skStr = getVal(rph.SK);
  const spStr = getVal(rph.SP);
  const objStr = getVal(rph.Objektif_Pembelajaran || rph.OBJEKTIF || rph.Ulasan || '');
  const kriteriaStr = getVal(rph.Kriteria_Kejayaan || rph.KRITERIA || '');
  const aktivitiUtamaStr = getVal(rph.Aktiviti_Utama || rph.Ulasan || '');
  const abmStr = getVal(rph.Alat_Bantu_mengajar || '');
  const temaStr = getVal(rph.TEMA || rph.TERAS || rph.KEMAHIRAN);
  const tajukStr = getVal(rph.TAJUK);

  // Table body
  const bodyData = [
    // 0: Header row (Logo and Title)
    // We will draw the logo manually in didDrawCell, but the cell is defined here
    [
      { content: '', styles: { fillColor: lightBlue, minCellHeight: 25, cellWidth: 35 } },
      { content: '\nRANCANGAN PEMPELAJARAN HARIAN TS25\n', colSpan: 3, styles: { fillColor: lightBlue, halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 12 } }
    ],
    // 1: MATA PELAJARAN / MINGGU
    [
      { content: 'MATA PELAJARAN:', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: getVal(rph.Subject_Name || rph.Subject_Id) },
      { content: 'MINGGU', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: getVal(rph.Minggu) }
    ],
    // 2: KELAS / MASA
    [
      { content: 'KELAS', styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: getVal(rph.Kelas_Id) },
      { content: 'MASA', styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: getVal(rph.Masa) }
    ],
    // 3: TARIKH / HARI
    [
      { content: 'TARIKH', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: getVal(rph.Tarikh) },
      { content: 'HARI', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: getVal(rph.Hari) }
    ],
    // 4: TEMA / TAJUK
    [
      { content: `TEMA :  ${temaStr}`, colSpan: 2, styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: `TAJUK:  ${tajukStr}`, colSpan: 2, styles: { fillColor: peach, fontStyle: 'bold' } }
    ],
    // 5: KOD SK / SP
    [
      { content: 'KOD STANDARD\nKANDUNGAN', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: skStr },
      { content: 'KOD STANDARD\nPEMBELAJARAN', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: spStr }
    ],
    // 6: OBJEKTIF / KRITERIA
    [
      { content: 'OBJEKTIF\nPEMBELAJARAN', styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: objStr },
      { content: 'KRITERIA\nKEJAYAAN', styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: kriteriaStr }
    ],
    // 7: RANGKA PENGAJARAN
    [
      { content: 'RANGKA PENGAJARAN:', colSpan: 4, styles: { fillColor: lightBlue, halign: 'center', fontStyle: 'bold' } }
    ],
    // 8: AKTIVITI PERMULAAN
    [
      { content: 'AKTIVITI PERMULAAN', styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: getVal(rph.Aktiviti_Permulaan || rph.AKTIVITI_PERMULAAN || ''), colSpan: 3, styles: { minCellHeight: 25 } }
    ],
    // 9: AKTIVITI UTAMA
    [
      { content: 'AKTIVITI UTAMA', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: aktivitiUtamaStr, colSpan: 3, styles: { minCellHeight: 40 } }
    ],
    // 9b: ABM
    [
      { content: 'ALAT BANTU\nMENGAJAR (ABM)', styles: { fillColor: lightPurple, fontStyle: 'bold' } },
      { content: abmStr, colSpan: 3, styles: { minCellHeight: 10 } }
    ],
    // 10: AKTIVITI PENUTUP
    [
      { content: 'AKTIVITI PENUTUP', styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: getVal(rph.Aktiviti_Penutup || rph.AKTIVITI_PENUTUP || ''), colSpan: 3, styles: { minCellHeight: 25 } }
    ],
    // 11: REFLEKSI
    [
      { content: 'REFLEKSI :', styles: { fillColor: peach, fontStyle: 'bold' } },
      { content: getVal(rph.Refleksi || rph.REFLEKSI || rph.Catatan || ''), colSpan: 3, styles: { minCellHeight: 20 } }
    ]
  ];

  autoTable(docPdf, {
    startY: 15,
    margin: { left: 15, right: 15 },
    body: bodyData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 }
    },
    didDrawCell: (data) => {
      // Draw Logo in the first cell of the first row
      if (data.row.index === 0 && data.column.index === 0 && schoolLogo) {
        // Center the logo in the cell
        const x = data.cell.x + 5;
        const y = data.cell.y + 2;
        docPdf.addImage(schoolLogo, 'PNG', x, y, 25, 21);
      }
    }
  });

  const fileName = `E-RPH_${rph.Subject_Id || 'Subjek'}.pdf`;
  docPdf.save(fileName);
};
