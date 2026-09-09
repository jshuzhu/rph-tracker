import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { hashPassword, signToken } from '../../../lib/auth';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { email, password, fullName, role, title } = await req.json();
    
    let db;
    try {
      db = getRequestContext().env.DB;
    } catch (e) {}

    if (!db) {
       const token = await signToken({ id: 'dummy-id', email, role: role || 'teacher' });
       const response = NextResponse.json({ success: true });
       response.cookies.set('rph_session', token, { httpOnly: true, secure: true, path: '/' });
       return response;
    }

    // Hash the password
    const hashedPwd = await hashPassword(password);
    
    // Generate simple UUID-like string for D1
    const id = crypto.randomUUID();
    
    const { success, error } = await db.prepare('INSERT INTO profiles (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
      .bind(id, fullName, email, hashedPwd, role)
      .run();
      
    if (!success) {
      return NextResponse.json({ error: error || 'Ralat mendaftar.' }, { status: 400 });
    }

    const token = await signToken({ id, email, role, full_name: fullName });
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('rph_session', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });
    
    return response;

  } catch (error) {
    if (error.message?.includes('UNIQUE constraint failed')) {
       return NextResponse.json({ error: 'E-mel telah berdaftar.' }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Ralat pelayan.' }, { status: 500 });
  }
}
