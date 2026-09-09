import { cookies } from 'next/headers';
import { verifyToken, signToken } from './auth-edge'; // Reuse the simplified logic

// Get Session from cookies
export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('rph_session')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

// Logout
export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete('rph_session');
}
