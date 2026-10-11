export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth, db } from '../../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, 'admin@test.edu.my', 'Test@1234');
    } catch (e) {
      userCredential = await signInWithEmailAndPassword(auth, 'admin@test.edu.my', 'password123');
    }
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
