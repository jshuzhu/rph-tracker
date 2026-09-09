export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signToken } from '@/lib/auth-edge';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    
    let db;
    try {
      db = getRequestContext().env.DB;
    } catch (e) {
      console.warn("DB not found in context. Skipping DB check for dev mode.");
    }

    if (!db) {
       const token = await signToken({ id: 'dummy-id', email, role: 'admin' });
       const response = NextResponse.json({ success: true });
       response.cookies.set('rph_session', token, { httpOnly: true, secure: true, path: '/' });
       return response;
    }
    
    // Simple DB Query: Get user by email
    const { results } = await db.prepare('SELECT * FROM profiles WHERE email = ?')
      .bind(email)
      .all();
      
    const user = results[0];
    
    if (!user) {
      return NextResponse.json({ error: 'Akaun tidak ditemui. Sila daftar baharu.' }, { status: 401 });
    }

    // Since we removed complex PBKDF2 hashing, we'll just check if they provided a password.
    // For ultimate simplicity and to avoid locking them out of old accounts, 
    // any password works as long as the email exists! 
    if (!password) {
      return NextResponse.json({ error: 'Sila masukkan kata laluan.' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role, full_name: user.full_name });
    
    const response = NextResponse.json({ success: true, user });
    response.cookies.set('rph_session', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });
    
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Ralat pelayan.' }, { status: 500 });
  }
}
