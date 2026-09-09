export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';


export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('rph_session', '', { 
    httpOnly: true, 
    secure: true, 
    path: '/',
    maxAge: 0
  });
  return response;
}
