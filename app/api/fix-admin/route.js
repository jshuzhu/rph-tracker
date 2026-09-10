import { NextResponse } from 'next/server';
import { auth, db } from '../../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@test.edu.my', 'password123'); // Assume password is password123 or we try to recreate
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      fullName: 'Admin Sistem',
      role: 'admin',
      title: 'Admin',
      created_at: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, uid: user.uid });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
