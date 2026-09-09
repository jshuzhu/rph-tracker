'use server';

import { cookies } from 'next/headers';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Helper to get D1 DB
function getDB() {
  try {
    const db = getRequestContext().env.DB;
    if (!db) throw new Error('D1 binding not found');
    return db;
  } catch (e) {
    throw new Error('Database context not available.');
  }
}

export async function loginSimple(email, password) {
  try {
    const db = getDB();
    
    // Simple DB Check
    const { results } = await db.prepare('SELECT id, email, full_name, role FROM profiles WHERE email = ? LIMIT 1')
      .bind(email)
      .all();
      
    if (!results || results.length === 0) {
      return { error: 'Akaun tidak ditemui. Sila semak e-mel.' };
    }
    
    const user = results[0];
    // We skip password check to make it SUPER SIMPLE for testing as requested by user
    // or we can do a very simple check if password is provided, but user wants it bypass-able if needed.
    
    // Set a very simple cookie
    cookies().set('rph_simple_session', JSON.stringify(user), { httpOnly: true, secure: true, path: '/' });
    
    return { success: true, user };
  } catch (err) {
    return { error: err.message };
  }
}

export async function registerSimple(email, password, fullName, role, title) {
  try {
    const db = getDB();
    
    const id = crypto.randomUUID();
    
    await db.prepare('INSERT INTO profiles (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)')
      .bind(id, email, password, fullName, role)
      .run();
      
    const user = { id, email, full_name: fullName, role };
    
    cookies().set('rph_simple_session', JSON.stringify(user), { httpOnly: true, secure: true, path: '/' });
    
    return { success: true, user };
  } catch (err) {
    return { error: 'Gagal mendaftar: ' + err.message };
  }
}

export async function getSessionSimple() {
  try {
    const sessionCookie = cookies().get('rph_simple_session');
    if (!sessionCookie || !sessionCookie.value) return null;
    
    return JSON.parse(sessionCookie.value);
  } catch (err) {
    return null;
  }
}

export async function logoutSimple() {
  cookies().delete('rph_simple_session');
  return { success: true };
}
