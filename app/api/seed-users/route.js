import { NextResponse } from 'next/server';
import { auth, db } from '../../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const usersToCreate = [
  { full_name: 'Admin Sistem', email: 'admin2@test.edu.my', role: 'admin', title: 'Admin' },
  { full_name: 'Cikgu Aminah binti Ahmad', email: 'cikgu1@test.edu.my', role: 'teacher', title: 'Guru' },
  { full_name: 'Cikgu Hafiz bin Ibrahim', email: 'cikgu2@test.edu.my', role: 'teacher', title: 'Guru' },
  { full_name: 'Cikgu Siti Rahmah binti Yusof', email: 'cikgu3@test.edu.my', role: 'teacher', title: 'Guru' },
  { full_name: 'En. Zulkifli bin Hassan', email: 'penyemak1@test.edu.my', role: 'reviewer', title: 'Guru Besar' },
  { full_name: 'Pn. Norlizan binti Ismail', email: 'penyemak2@test.edu.my', role: 'reviewer', title: 'PK Pentadbiran' },
];

export async function GET() {
  const results = [];
  
  for (const u of usersToCreate) {
    try {
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, u.email, 'password123');
        user = userCredential.user;
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          // If auth exists, login to get their UID to recreate their Firestore profile
          const cred = await signInWithEmailAndPassword(auth, u.email, 'password123');
          user = cred.user;
        } else {
          throw error;
        }
      }
      
      // Upsert Firestore Document
      await setDoc(doc(db, 'users', user.uid), {
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        title: u.title,
        created_at: new Date().toISOString()
      });
      
      results.push({ email: u.email, status: 'success' });
    } catch (error) {
      results.push({ email: u.email, status: 'error', message: error.message });
    }
  }

  return NextResponse.json({ results });
}
