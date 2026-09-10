import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    // Delete all RPH submissions
    const rphSnap = await getDocs(collection(db, 'rph_submissions'));
    const rphDeletes = rphSnap.docs.map(d => deleteDoc(doc(db, 'rph_submissions', d.id)));
    await Promise.all(rphDeletes);

    // Delete all users
    const usersSnap = await getDocs(collection(db, 'users'));
    const userDeletes = usersSnap.docs.map(d => deleteDoc(doc(db, 'users', d.id)));
    await Promise.all(userDeletes);

    // Reset school_settings to defaults
    await setDoc(doc(db, 'school_settings', '1'), {
      school_name: 'SK Contoh Malaysia',
      session_name: '2026/2027',
      session_start_date: '2026-03-02',
      session_end_date: '2027-02-15'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Semua rekod RPH, akaun pengguna, dan sesi telah dipadamkan (Kecuali Subjek). Aplikasi kini berkeadaan sedia (fresh).' 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
