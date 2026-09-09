export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { hashPassword, signToken } from '@/lib/auth-edge';


export async function POST(req) {
  try {
    const { email, password } = await req.json();
    
    // Fallback logic for local testing without Cloudflare env
    let db;
    try {
      db = getRequestContext().env.DB;
    } catch (e) {
      console.warn("DB not found in context. Skipping DB check for dev mode.");
    }

    if (!db) {
       // Mock login for local dev if Wrangler not set up properly
       const token = await signToken({ id: 'dummy-id', email, role: 'admin' });
       const response = NextResponse.json({ success: true });
       response.cookies.set('rph_session', token, { httpOnly: true, secure: true, path: '/' });
       return response;
    }

    // Hash the password to compare
    const hashedPwd = await hashPassword(password);
    
    // Query D1
    const { results } = await db.prepare('SELECT * FROM profiles WHERE email = ? AND password_hash = ?')
      .bind(email, hashedPwd)
      .all();
      
    const user = results[0];
    
    if (!user) {
      return NextResponse.json({ error: 'E-mel atau kata laluan salah.' }, { status: 401 });
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
